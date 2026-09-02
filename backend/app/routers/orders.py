from datetime import date as date_type, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import extract
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _spent_this_month(db: Session, user_id: str, today: date_type) -> float:
    rows = (
        db.query(models.MealOrder)
        .filter(
            models.MealOrder.user_id == user_id,
            models.MealOrder.status != models.OrderStatus.skipped,
            extract("month", models.MealOrder.date) == today.month,
            extract("year", models.MealOrder.date) == today.year,
        )
        .all()
    )
    return sum(float(o.price) for o in rows)


@router.get("/today", response_model=list[schemas.MealOrderOut])
def orders_today(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date_type.today()
    return (
        db.query(models.MealOrder)
        .filter(models.MealOrder.user_id == current_user.id, models.MealOrder.date == today)
        .all()
    )


@router.get("/day", response_model=list[schemas.MealOrderOut])
def orders_for_day(
    date: date_type,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.MealOrder)
        .filter(models.MealOrder.user_id == current_user.id, models.MealOrder.date == date)
        .all()
    )


@router.get("", response_model=schemas.OrdersHistoryOut)
def orders_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date_type.today()
    orders = (
        db.query(models.MealOrder)
        .filter(models.MealOrder.user_id == current_user.id)
        .order_by(models.MealOrder.date.desc(), models.MealOrder.created_at.desc())
        .limit(50)
        .all()
    )
    meals_eaten = (
        db.query(models.MealOrder)
        .filter(
            models.MealOrder.user_id == current_user.id,
            models.MealOrder.status == models.OrderStatus.handed_over,
            extract("month", models.MealOrder.date) == today.month,
            extract("year", models.MealOrder.date) == today.year,
        )
        .count()
    )
    return schemas.OrdersHistoryOut(
        spent_this_month=_spent_this_month(db, current_user.id, today),
        meals_eaten_this_month=meals_eaten,
        wallet_balance=float(current_user.wallet_balance),
        orders=orders,
    )


@router.get("/week", response_model=list[schemas.WeekDayOut])
def orders_week(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    today = date_type.today()
    days: list[schemas.WeekDayOut] = []
    for offset in range(1, 8):
        d = today + timedelta(days=offset)
        is_sunday = d.weekday() == 6
        label = f"{DAY_LABELS[d.weekday()]} {d.day} {d.strftime('%b')}"

        orders = (
            db.query(models.MealOrder)
            .filter(models.MealOrder.user_id == current_user.id, models.MealOrder.date == d)
            .all()
        )
        b_order = next((o for o in orders if o.meal_type == models.MealType.breakfast), None)
        l_order = next((o for o in orders if o.meal_type == models.MealType.lunch), None)

        menu_open = (d - today).days <= 1
        b_dish = b_order.dish_name if b_order else None
        l_dish = l_order.dish_name if l_order else None
        if not b_dish and menu_open and not is_sunday:
            dm = (
                db.query(models.DailyMenu)
                .filter(models.DailyMenu.date == d, models.DailyMenu.meal_type == models.MealType.breakfast)
                .first()
            )
            b_dish = dm.dish.name if dm else None
        if not l_dish and menu_open and not is_sunday:
            dm = (
                db.query(models.DailyMenu)
                .filter(models.DailyMenu.date == d, models.DailyMenu.meal_type == models.MealType.lunch)
                .first()
            )
            l_dish = dm.dish.name if dm else None

        days.append(
            schemas.WeekDayOut(
                date=d,
                label=label,
                breakfast_dish=b_dish,
                lunch_dish=l_dish,
                breakfast_status=b_order.status if b_order else None,
                lunch_status=l_order.status if l_order else None,
                breakfast_order_id=b_order.id if b_order else None,
                lunch_order_id=l_order.id if l_order else None,
                service_available=not is_sunday,
                menu_open=menu_open,
            )
        )
    return days


@router.post("/{order_id}/skip", response_model=schemas.MealOrderOut)
def skip_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.get(models.MealOrder, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.status in (models.OrderStatus.out_for_delivery, models.OrderStatus.handed_over):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Too late to skip, it's already on the way")
    if order.status == models.OrderStatus.skipped:
        return order

    if order.price:
        current_user.wallet_balance = float(current_user.wallet_balance) + float(order.price)
        db.add(
            models.WalletTransaction(
                user_id=current_user.id,
                amount=float(order.price),
                reason=f"{order.meal_type.value.title()} skipped on {order.date}",
            )
        )
    order.status = models.OrderStatus.skipped
    order.note = "Skipped · refunded to wallet"
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/undo-skip", response_model=schemas.MealOrderOut)
def undo_skip(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.get(models.MealOrder, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.status != models.OrderStatus.skipped:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This order was not skipped")

    if order.price:
        if float(current_user.wallet_balance) < float(order.price):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Not enough wallet balance to undo")
        current_user.wallet_balance = float(current_user.wallet_balance) - float(order.price)
        db.add(
            models.WalletTransaction(
                user_id=current_user.id,
                amount=-float(order.price),
                reason=f"{order.meal_type.value.title()} skip undone on {order.date}",
            )
        )
    order.status = models.OrderStatus.booked
    order.note = ""
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/tracking", response_model=schemas.TrackingOut)
def track_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.get(models.MealOrder, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    cooked_done = order.status in (models.OrderStatus.out_for_delivery, models.OrderStatus.handed_over)
    on_the_way_active = order.status == models.OrderStatus.out_for_delivery
    handover_done = order.status == models.OrderStatus.handed_over

    delivery_point = current_user.delivery_point
    point_name = delivery_point.name if delivery_point else "your point"

    steps = [
        schemas.TrackingStep(
            label="Cooked this morning",
            detail="Kitchen K-04 · cook time printed on lid" if cooked_done else "Cooking in progress",
            done=cooked_done,
            active=not cooked_done and order.status == models.OrderStatus.booked,
        ),
        schemas.TrackingStep(
            label="Batched for your point",
            detail=f"Batched for {point_name}" if cooked_done else "Waiting to be batched",
            done=cooked_done,
            active=False,
        ),
        schemas.TrackingStep(
            label="On the way",
            detail="Left the hub, a few stops before yours" if on_the_way_active or handover_done else "Not dispatched yet",
            done=handover_done,
            active=on_the_way_active,
        ),
        schemas.TrackingStep(
            label=f"Handover at {point_name}",
            detail=f"Show your booking code or name" if not handover_done else "Handed over, enjoy your meal",
            done=handover_done,
            active=False,
        ),
    ]

    return schemas.TrackingOut(
        order=order,
        batch_code=order.booking.batch_code if order.booking else "SP-C / batch 1",
        rider_name="Sameer · batch rider",
        steps=steps,
    )


@router.post("/{order_id}/report-issue")
def report_issue(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.get(models.MealOrder, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    order.note = "Issue reported · support will reach out"
    db.commit()
    return {"ok": True}
