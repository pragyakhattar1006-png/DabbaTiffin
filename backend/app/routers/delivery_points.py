from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/delivery-points", tags=["delivery-points"])


@router.get("", response_model=list[schemas.DeliveryPointOut])
def list_delivery_points(db: Session = Depends(get_db)):
    return (
        db.query(models.DeliveryPoint)
        .order_by(models.DeliveryPoint.sort_order)
        .all()
    )
