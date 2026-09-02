from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..utils import gen_batch_code, gen_booking_code

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=schemas.BookingOut)
def create_booking(
    payload: schemas.CreateBookingRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Add at least one meal to book")

    delivery_point = current_user.delivery_point
    if not delivery_point:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Set a delivery point before booking")

    meal_orders: list[models.MealOrder] = []
    total = 0.0
    for item in payload.items:
        daily_menu = db.get(models.DailyMenu, item.daily_menu_id)
        if not daily_menu or daily_menu.date != payload.date or daily_menu.meal_type != item.meal_type:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Menu item not found for that date")
        if daily_menu.sold_out:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{daily_menu.dish.name} is sold out")

        existing = (
            db.query(models.MealOrder)
            .filter(
                models.MealOrder.user_id == current_user.id,
                models.MealOrder.date == payload.date,
                models.MealOrder.meal_type == item.meal_type,
                models.MealOrder.status != models.OrderStatus.skipped,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"{item.meal_type.value.title()} for {payload.date} is already booked",
            )

        slot_window = (
            delivery_point.breakfast_window
            if item.meal_type == models.MealType.breakfast
            else delivery_point.lunch_window
        )
        meal_order = models.MealOrder(
            user_id=current_user.id,
            date=payload.date,
            meal_type=item.meal_type,
            daily_menu_id=daily_menu.id,
            dish_name=daily_menu.dish.name,
            price=float(daily_menu.price),
            status=models.OrderStatus.booked,
            slot_window=slot_window,
            source="booking",
        )
        total += float(daily_menu.price)
        meal_orders.append(meal_order)

    if payload.payment_method == "wallet":
        if float(current_user.wallet_balance) < total:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Not enough balance in Tiffin wallet")
        current_user.wallet_balance = float(current_user.wallet_balance) - total
        db.add(
            models.WalletTransaction(
                user_id=current_user.id,
                amount=-total,
                reason=f"Booking for {payload.date}",
            )
        )

    booking = models.Booking(
        user_id=current_user.id,
        date=payload.date,
        booking_code=gen_booking_code(),
        batch_code=gen_batch_code(delivery_point.name, payload.items[0].meal_type.value),
        payment_method=payload.payment_method,
        total_amount=total,
    )
    db.add(booking)
    db.flush()

    for meal_order in meal_orders:
        meal_order.booking_id = booking.id
        db.add(meal_order)

    db.commit()
    db.refresh(booking)
    booking.meals = (
        db.query(models.MealOrder).filter(models.MealOrder.booking_id == booking.id).all()
    )
    return booking


@router.get("/{booking_id}", response_model=schemas.BookingOut)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    booking = db.get(models.Booking, booking_id)
    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    booking.meals = (
        db.query(models.MealOrder).filter(models.MealOrder.booking_id == booking.id).all()
    )
    return booking
