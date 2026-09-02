from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("", response_model=schemas.WalletOut)
def get_wallet(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    transactions = (
        db.query(models.WalletTransaction)
        .filter(models.WalletTransaction.user_id == current_user.id)
        .order_by(models.WalletTransaction.created_at.desc())
        .limit(50)
        .all()
    )
    return schemas.WalletOut(balance=float(current_user.wallet_balance), transactions=transactions)
