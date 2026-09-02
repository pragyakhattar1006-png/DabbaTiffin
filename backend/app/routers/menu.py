from datetime import date as date_type

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("", response_model=list[schemas.DailyMenuOut])
def get_menu(
    date: date_type = Query(...),
    meal_type: models.MealType | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.DailyMenu).filter(models.DailyMenu.date == date)
    if meal_type:
        q = q.filter(models.DailyMenu.meal_type == meal_type)
    return q.all()
