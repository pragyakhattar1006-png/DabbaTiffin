from datetime import date as date_type, datetime

from pydantic import BaseModel, EmailStr, Field

from .models import MealType, OrderStatus, PlanType


# ---------- Auth ----------
class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    mobile: str
    veg_only: bool = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ---------- Delivery point ----------
class DeliveryPointOut(BaseModel):
    id: str
    name: str
    area: str
    distance_label: str
    handover_type: str
    breakfast_available: bool
    lunch_available: bool
    breakfast_window: str
    lunch_window: str
    featured: bool

    class Config:
        from_attributes = True


# ---------- User ----------
class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    mobile: str
    veg_only: bool
    menu_reminder: bool
    wallet_balance: float
    delivery_point: DeliveryPointOut | None = None

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    veg_only: bool | None = None
    menu_reminder: bool | None = None
    delivery_point_id: str | None = None


# ---------- Menu ----------
class DishOut(BaseModel):
    id: str
    name: str
    description: str
    kcal: int
    image_url: str
    veg: bool

    class Config:
        from_attributes = True


class DailyMenuOut(BaseModel):
    id: str
    date: date_type
    meal_type: MealType
    price: float
    sold_out: bool
    booking_closes_at: str
    dish: DishOut

    class Config:
        from_attributes = True


# ---------- Bookings ----------
class BookingItemRequest(BaseModel):
    meal_type: MealType
    daily_menu_id: str


class CreateBookingRequest(BaseModel):
    date: date_type
    items: list[BookingItemRequest]
    payment_method: str = "upi"


class MealOrderOut(BaseModel):
    id: str
    date: date_type
    meal_type: MealType
    dish_name: str
    price: float
    status: OrderStatus
    slot_window: str
    note: str
    source: str

    class Config:
        from_attributes = True


class BookingOut(BaseModel):
    id: str
    date: date_type
    booking_code: str
    batch_code: str
    payment_method: str
    total_amount: float
    meals: list[MealOrderOut]

    class Config:
        from_attributes = True


class TrackingStep(BaseModel):
    label: str
    detail: str
    done: bool
    active: bool


class TrackingOut(BaseModel):
    order: MealOrderOut
    batch_code: str
    rider_name: str
    steps: list[TrackingStep]


# ---------- Subscriptions ----------
class SubscriptionPlanOut(BaseModel):
    id: str
    plan_type: PlanType
    name: str
    meals_count: int
    price_per_meal: float
    total_price: float
    savings: float
    featured: bool

    class Config:
        from_attributes = True


class StartSubscriptionRequest(BaseModel):
    plan_id: str
    payment_method: str = "upi"


class UserSubscriptionOut(BaseModel):
    id: str
    meals_left: int
    renews_on: date_type
    active: bool
    paused: bool
    plan: SubscriptionPlanOut

    class Config:
        from_attributes = True


class PauseSubscriptionRequest(BaseModel):
    paused: bool


# ---------- Wallet ----------
class WalletTransactionOut(BaseModel):
    id: str
    amount: float
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True


class WalletOut(BaseModel):
    balance: float
    transactions: list[WalletTransactionOut]


# ---------- Week / skip ----------
class WeekDayOut(BaseModel):
    date: date_type
    label: str
    breakfast_dish: str | None
    lunch_dish: str | None
    breakfast_status: OrderStatus | None
    lunch_status: OrderStatus | None
    breakfast_order_id: str | None
    lunch_order_id: str | None
    service_available: bool
    menu_open: bool


# ---------- Home ----------
class HomeMealSlot(BaseModel):
    meal_type: MealType
    order_id: str | None = None
    dish_name: str | None = None
    status: OrderStatus | None = None
    slot_window: str | None = None
    note: str = ""
    price: float | None = None
    preview_dishes: list[str] = []


class HomeOut(BaseModel):
    today_date: date_type
    tomorrow_date: date_type
    delivering_to: str | None
    today: list[HomeMealSlot]
    tomorrow: list[HomeMealSlot]
    booking_closes_at: str
    skip_closes_at: str = "24:00"
    menu_live: bool
    subscription: UserSubscriptionOut | None
    spent_this_month: float
    wallet_balance: float


class OrdersHistoryOut(BaseModel):
    spent_this_month: float
    meals_eaten_this_month: int
    wallet_balance: float
    orders: list[MealOrderOut]
