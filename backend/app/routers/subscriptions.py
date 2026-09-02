from datetime import date as date_type, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/plans", response_model=list[schemas.SubscriptionPlanOut])
def list_plans(db: Session = Depends(get_db)):
    return db.query(models.SubscriptionPlan).all()


@router.get("/me", response_model=schemas.UserSubscriptionOut | None)
def my_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.UserSubscription)
        .filter(models.UserSubscription.user_id == current_user.id, models.UserSubscription.active == True)  # noqa: E712
        .first()
    )


@router.post("", response_model=schemas.UserSubscriptionOut)
def start_subscription(
    payload: schemas.StartSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = db.get(models.SubscriptionPlan, payload.plan_id)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plan not found")

    existing = (
        db.query(models.UserSubscription)
        .filter(models.UserSubscription.user_id == current_user.id, models.UserSubscription.active == True)  # noqa: E712
        .first()
    )
    if existing:
        existing.active = False

    if payload.payment_method == "wallet":
        if float(current_user.wallet_balance) < float(plan.total_price):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Not enough balance in Tiffin wallet")
        current_user.wallet_balance = float(current_user.wallet_balance) - float(plan.total_price)
        db.add(
            models.WalletTransaction(
                user_id=current_user.id,
                amount=-float(plan.total_price),
                reason=f"Started {plan.name} plan",
            )
        )

    sub = models.UserSubscription(
        user_id=current_user.id,
        plan_id=plan.id,
        meals_left=plan.meals_count,
        renews_on=date_type.today() + timedelta(days=30),
        active=True,
        paused=False,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.patch("/me", response_model=schemas.UserSubscriptionOut)
def pause_subscription(
    payload: schemas.PauseSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    sub = (
        db.query(models.UserSubscription)
        .filter(models.UserSubscription.user_id == current_user.id, models.UserSubscription.active == True)  # noqa: E712
        .first()
    )
    if not sub:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active subscription")
    sub.paused = payload.paused
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/me")
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    sub = (
        db.query(models.UserSubscription)
        .filter(models.UserSubscription.user_id == current_user.id, models.UserSubscription.active == True)  # noqa: E712
        .first()
    )
    if not sub:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active subscription")
    sub.active = False
    db.commit()
    return {"ok": True}
