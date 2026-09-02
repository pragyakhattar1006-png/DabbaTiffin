import enum
import uuid
from datetime import date as date_type, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return uuid.uuid4().hex


class MealType(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"


class OrderStatus(str, enum.Enum):
    booked = "booked"
    out_for_delivery = "out_for_delivery"
    handed_over = "handed_over"
    skipped = "skipped"


class PlanType(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    both = "both"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    mobile: Mapped[str] = mapped_column(String(20))
    veg_only: Mapped[bool] = mapped_column(Boolean, default=True)
    menu_reminder: Mapped[bool] = mapped_column(Boolean, default=True)
    delivery_point_id: Mapped[str | None] = mapped_column(
        ForeignKey("delivery_points.id"), nullable=True
    )
    wallet_balance: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    delivery_point: Mapped["DeliveryPoint | None"] = relationship(lazy="joined")


class DeliveryPoint(Base):
    __tablename__ = "delivery_points"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(160))
    area: Mapped[str] = mapped_column(String(120))
    distance_label: Mapped[str] = mapped_column(String(60))
    handover_type: Mapped[str] = mapped_column(String(60))
    breakfast_available: Mapped[bool] = mapped_column(Boolean, default=True)
    lunch_available: Mapped[bool] = mapped_column(Boolean, default=True)
    breakfast_window: Mapped[str] = mapped_column(String(30), default="8:15–8:45")
    lunch_window: Mapped[str] = mapped_column(String(30), default="13:00–13:30")
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(default=0)


class Dish(Base):
    __tablename__ = "dishes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(255))
    kcal: Mapped[int] = mapped_column(default=0)
    image_url: Mapped[str] = mapped_column(String(500), default="")
    veg: Mapped[bool] = mapped_column(Boolean, default=True)


class DailyMenu(Base):
    __tablename__ = "daily_menus"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    date: Mapped[date_type] = mapped_column(Date, index=True)
    meal_type: Mapped[MealType] = mapped_column(Enum(MealType))
    dish_id: Mapped[str] = mapped_column(ForeignKey("dishes.id"))
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    sold_out: Mapped[bool] = mapped_column(Boolean, default=False)
    booking_closes_at: Mapped[str] = mapped_column(String(5), default="23:00")

    dish: Mapped["Dish"] = relationship(lazy="joined")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date_type] = mapped_column(Date)
    booking_code: Mapped[str] = mapped_column(String(20))
    batch_code: Mapped[str] = mapped_column(String(30))
    payment_method: Mapped[str] = mapped_column(String(40))
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class MealOrder(Base):
    __tablename__ = "meal_orders"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    booking_id: Mapped[str | None] = mapped_column(
        ForeignKey("bookings.id"), nullable=True
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    date: Mapped[date_type] = mapped_column(Date, index=True)
    meal_type: Mapped[MealType] = mapped_column(Enum(MealType))
    daily_menu_id: Mapped[str | None] = mapped_column(
        ForeignKey("daily_menus.id"), nullable=True
    )
    dish_name: Mapped[str] = mapped_column(String(120), default="")
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus))
    slot_window: Mapped[str] = mapped_column(String(30), default="")
    source: Mapped[str] = mapped_column(String(20), default="booking")  # booking | subscription
    note: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    booking: Mapped["Booking | None"] = relationship(lazy="joined")


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    plan_type: Mapped[PlanType] = mapped_column(Enum(PlanType))
    name: Mapped[str] = mapped_column(String(80))
    meals_count: Mapped[int] = mapped_column(default=22)
    price_per_meal: Mapped[float] = mapped_column(Numeric(10, 2))
    total_price: Mapped[float] = mapped_column(Numeric(10, 2))
    savings: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    plan_id: Mapped[str] = mapped_column(ForeignKey("subscription_plans.id"))
    meals_left: Mapped[int] = mapped_column(default=0)
    renews_on: Mapped[date_type] = mapped_column(Date)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    paused: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    plan: Mapped["SubscriptionPlan"] = relationship(lazy="joined")


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    reason: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
