from database import engine
from sqlmodel import Session, select
from models import Contact

def check_scores():
    with Session(engine) as session:
        contacts = session.exec(select(Contact)).all()
        print(f"Total contacts: {len(contacts)}")
        
        scores = {}
        for c in contacts:
            score = str(c.lead_score)
            scores[score] = scores.get(score, 0) + 1
            
        print("Score distribution:")
        for score, count in scores.items():
            print(f"  {score}: {count}")

if __name__ == "__main__":
    check_scores()
