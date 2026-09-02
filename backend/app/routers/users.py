from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.delivery_point_id is not None:
        point = db.get(models.DeliveryPoint, payload.delivery_point_id)
        if not point:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Delivery point not found")
        current_user.delivery_point_id = point.id
    if payload.veg_only is not None:
        current_user.veg_only = payload.veg_only
    if payload.menu_reminder is not None:
        current_user.menu_reminder = payload.menu_reminder

    db.commit()
    db.refresh(current_user)
    return current_user
