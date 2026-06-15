import os
import logging
from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy import inspect, text
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("database")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/chatleads")

engine = create_engine(DATABASE_URL, echo=False)

def migrate_db(engine):
    logger.info("Running database migrations check...")
    inspector = inspect(engine)
    
    with Session(engine) as session:
        for table_name, table in SQLModel.metadata.tables.items():
            if not inspector.has_table(table_name):
                logger.info(f"Table '{table_name}' does not exist yet. It will be created by create_all.")
                continue
            
            # Get columns currently in the database
            try:
                db_cols = {col['name'] for col in inspector.get_columns(table_name)}
            except Exception as e:
                logger.error(f"Failed to inspect columns for table '{table_name}': {e}")
                continue
            
            # Check for any columns defined in the model but missing in the database
            for col_name, col in table.columns.items():
                if col_name not in db_cols:
                    logger.info(f"Column '{col_name}' is missing in table '{table_name}'. Adding it...")
                    
                    # Compile the column type for the current dialect
                    col_type = col.type.compile(dialect=engine.dialect)
                    
                    # Construct default value string if it exists
                    default_str = ""
                    if col.default is not None:
                        if hasattr(col.default, 'arg') and not callable(col.default.arg):
                            arg = col.default.arg
                            if isinstance(arg, str):
                                default_str = f" DEFAULT '{arg}'"
                            elif isinstance(arg, bool):
                                default_str = f" DEFAULT {'TRUE' if arg else 'FALSE'}"
                            elif isinstance(arg, (int, float)):
                                default_str = f" DEFAULT {arg}"
                    elif col_name == "created_at":
                        default_str = " DEFAULT CURRENT_TIMESTAMP"
                    elif col_name == "display_name":
                        default_str = " DEFAULT 'User'"
                    elif col_name == "role":
                        default_str = " DEFAULT 'user'"
                    elif col_name == "max_sessions":
                        default_str = " DEFAULT 5"
                    elif col_name == "is_active":
                        default_str = " DEFAULT TRUE"
                    elif col_name == "allow_bulk":
                        default_str = " DEFAULT FALSE"
                    elif col_name in ["allow_name", "allow_mobile", "allow_email", "allow_arn"]:
                        default_str = " DEFAULT TRUE"
                    
                    # If column is not nullable and has no default, add it as nullable to avoid errors
                    nullable_str = " NULL" if col.nullable or (col.default is None and col_name not in ["created_at", "display_name", "role", "max_sessions", "is_active", "allow_bulk", "allow_name", "allow_mobile", "allow_email", "allow_arn"]) else " NOT NULL"
                    
                    query = f'ALTER TABLE "{table_name}" ADD COLUMN "{col_name}" {col_type}{default_str}{nullable_str}'
                    logger.info(f"Executing: {query}")
                    try:
                        session.execute(text(query))
                        session.commit()
                        logger.info(f"Successfully added column '{col_name}' to table '{table_name}'")
                    except Exception as e:
                        session.rollback()
                        logger.error(f"Failed to add column '{col_name}' to table '{table_name}': {e}")
                        # Fallback: try adding as nullable without default
                        try:
                            fallback_query = f'ALTER TABLE "{table_name}" ADD COLUMN "{col_name}" {col_type} NULL'
                            logger.info(f"Executing fallback: {fallback_query}")
                            session.execute(text(fallback_query))
                            session.commit()
                            logger.info(f"Successfully added column '{col_name}' as NULL to table '{table_name}'")
                        except Exception as fe:
                            session.rollback()
                            logger.error(f"Fallback failed for column '{col_name}' in table '{table_name}': {fe}")

def create_indexes(engine):
    logger.info("Checking and creating database indexes...")
    indexes = [
        ('contact', 'idx_contact_session_id', 'session_id'),
        ('contact', 'idx_contact_arn', 'arn'),
        ('contact', 'idx_contact_mobile', 'mobile'),
        ('contact', 'idx_contact_email', 'email'),
        ('contact', 'idx_contact_lg_code', 'lg_code'),
        ('bulkcontact', 'idx_bulkcontact_session_id', 'session_id'),
        ('bulkcontact', 'idx_bulkcontact_arn', 'arn'),
        ('bulkcontact', 'idx_bulkcontact_mobile', 'mobile'),
        ('bulkcontact', 'idx_bulkcontact_email', 'email'),
    ]
    with Session(engine) as session:
        for table, index_name, column in indexes:
            try:
                # CREATE INDEX IF NOT EXISTS works on both SQLite and PostgreSQL
                query = f'CREATE INDEX IF NOT EXISTS {index_name} ON "{table}" ("{column}")'
                session.execute(text(query))
                session.commit()
                logger.info(f"Verified index {index_name} on {table}({column})")
            except Exception as e:
                session.rollback()
                logger.error(f"Failed to create index {index_name}: {e}")

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    migrate_db(engine)
    create_indexes(engine)

def get_session():
    with Session(engine) as session:
        yield session

