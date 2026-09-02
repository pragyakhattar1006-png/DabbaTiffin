"""Seed the database with demo data: delivery points, dishes, a rotating
daily menu for the next week, a demo user with login-ready credentials, and
sample order/wallet/subscription history matching the DabbaTiffin mockups.

Runs automatically at app startup; it's idempotent (skips if data already
exists) so it's safe on every deploy/restart.
"""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from . import models
from .database import SessionLocal
from .security import hash_password

DEMO_EMAIL = "demo@dabbatiffin.in"
DEMO_PASSWORD = "Dabba@123"

DISHES = [
    # slug, name, description, kcal, meal types it can appear in
    ("poha", "Poha with sev", "Poha base, peanuts, lemon", 320, ["breakfast"]),
    ("upma", "Upma", "Upma base, curry leaf, coconut", 290, ["breakfast"]),
    ("idli-sambhar", "Idli with sambhar", "3 idli, sambhar, chutney", 340, ["breakfast"]),
    ("sabudana-khichdi", "Sabudana khichdi", "Sago, peanuts, potato", 300, ["breakfast"]),
    ("misal-pav", "Misal pav", "Misal, pav, onion", 410, ["breakfast"]),
    ("rajma-chawal", "Rajma chawal", "Rajma, steamed rice, salad", 420, ["lunch"]),
    ("chole-chawal", "Chole chawal", "Chole, steamed rice, salad", 400, ["lunch"]),
]

DELIVERY_POINTS = [
    dict(
        name="Sunrise PG, Block C",
        area="Kothrud",
        distance_label="400 m",
        handover_type="gate handover",
        breakfast_available=True,
        lunch_available=True,
        breakfast_window="8:15–8:45",
        lunch_window="13:00–13:30",
        featured=True,
        sort_order=0,
    ),
    dict(
        name="MIT Campus, Gate 2",
        area="Kothrud",
        distance_label="1.2 km",
        handover_type="gate handover",
        breakfast_available=True,
        lunch_available=False,
        breakfast_window="8:00–8:30",
        lunch_window="13:00–13:30",
        featured=False,
        sort_order=1,
    ),
    dict(
        name="Icon Tower, IT Park",
        area="Hinjewadi Phase 1",
        distance_label="3.4 km",
        handover_type="6th floor pantry",
        breakfast_available=False,
        lunch_available=True,
        breakfast_window="8:15–8:45",
        lunch_window="12:45–13:15",
        featured=False,
        sort_order=2,
    ),
    dict(
        name="Om Sai Hostel",
        area="Karve Nagar",
        distance_label="2.1 km",
        handover_type="warden's office",
        breakfast_available=True,
        lunch_available=True,
        breakfast_window="8:30–9:00",
        lunch_window="13:15–13:45",
        featured=False,
        sort_order=3,
    ),
]

PLANS = [
    dict(
        plan_type=models.PlanType.breakfast,
        name="Breakfast",
        meals_count=22,
        price_per_meal=45,
        total_price=999,
        savings=79,
        featured=False,
    ),
    dict(
        plan_type=models.PlanType.both,
        name="Breakfast + Lunch",
        meals_count=44,
        price_per_meal=58,
        total_price=2549,
        savings=487,
        featured=True,
    ),
    dict(
        plan_type=models.PlanType.lunch,
        name="Lunch",
        meals_count=22,
        price_per_meal=79,
        total_price=1749,
        savings=209,
        featured=False,
    ),
]

BREAKFAST_PRICES = {"poha": 49, "upma": 49, "idli-sambhar": 55, "sabudana-khichdi": 59, "misal-pav": 59}
LUNCH_PRICES = {"rajma-chawal": 89, "chole-chawal": 89}


def _seed_dishes(db: Session) -> dict[str, models.Dish]:
    by_slug: dict[str, models.Dish] = {}
    for slug, name, desc, kcal, _meals in DISHES:
        dish = db.query(models.Dish).filter(models.Dish.name == name).first()
        if not dish:
            dish = models.Dish(
                name=name,
                description=desc,
                kcal=kcal,
                image_url=f"/dishes/{slug}.jpg",
                veg=True,
            )
            db.add(dish)
            db.flush()
        by_slug[slug] = dish
    return by_slug


def _seed_delivery_points(db: Session) -> list[models.DeliveryPoint]:
    points = db.query(models.DeliveryPoint).all()
    if points:
        return points
    points = []
    for data in DELIVERY_POINTS:
        point = models.DeliveryPoint(**data)
        db.add(point)
        points.append(point)
    db.flush()
    return points


def _seed_plans(db: Session) -> dict[str, models.SubscriptionPlan]:
    plans = {p.plan_type.value: p for p in db.query(models.SubscriptionPlan).all()}
    if plans:
        return plans
    for data in PLANS:
        plan = models.SubscriptionPlan(**data)
        db.add(plan)
        db.flush()
        plans[plan.plan_type.value] = plan
    return plans


def _rotating_dishes_for(day_index: int, meal: str, dishes: dict[str, models.Dish]):
    if meal == "breakfast":
        rotation = ["poha", "upma", "idli-sambhar", "misal-pav", "sabudana-khichdi"]
        offer = [rotation[(day_index + i) % len(rotation)] for i in range(3)]
        # sabudana khichdi is always shown but marked sold out, matching the mockup
        if "sabudana-khichdi" not in offer:
            offer.append("sabudana-khichdi")
        return offer
    return ["rajma-chawal", "chole-chawal"]


def _seed_menus(db: Session, dishes: dict[str, models.Dish]) -> None:
    existing = db.query(models.DailyMenu).first()
    if existing:
        return
    today = date.today()
    for day_index in range(-2, 8):  # a couple of past days + today + next week
        d = today + timedelta(days=day_index)
        if d.weekday() == 6:  # no service on Sunday
            continue
        for meal in ["breakfast", "lunch"]:
            slugs = _rotating_dishes_for(day_index, meal, dishes)
            for i, slug in enumerate(slugs):
                price = (BREAKFAST_PRICES if meal == "breakfast" else LUNCH_PRICES).get(slug, 55)
                sold_out = slug == "sabudana-khichdi"
                db.add(
                    models.DailyMenu(
                        date=d,
                        meal_type=models.MealType(meal),
                        dish_id=dishes[slug].id,
                        price=price,
                        sold_out=sold_out,
                        booking_closes_at="23:00",
                    )
                )
    db.flush()


def _seed_demo_user(
    db: Session,
    dishes: dict[str, models.Dish],
    points: list[models.DeliveryPoint],
    plans: dict[str, models.SubscriptionPlan],
) -> None:
    user = db.query(models.User).filter(models.User.email == DEMO_EMAIL).first()
    if user:
        return

    sunrise = next(p for p in points if p.name == "Sunrise PG, Block C")
    user = models.User(
        full_name="Aarav Kulkarni",
        email=DEMO_EMAIL,
        password_hash=hash_password(DEMO_PASSWORD),
        mobile="+91 98765 43210",
        veg_only=True,
        menu_reminder=True,
        delivery_point_id=sunrise.id,
        wallet_balance=210,
    )
    db.add(user)
    db.flush()

    today = date.today()

    # Yesterday: both meals eaten (handed over) — order history.
    yesterday = today - timedelta(days=1)
    if yesterday.weekday() != 6:
        db.add_all(
            [
                models.MealOrder(
                    user_id=user.id,
                    date=yesterday,
                    meal_type=models.MealType.breakfast,
                    dish_name="Idli with sambhar",
                    price=45,
                    status=models.OrderStatus.handed_over,
                    slot_window=sunrise.breakfast_window,
                    source="booking",
                ),
            ]
        )

    two_days_ago = today - timedelta(days=2)
    if two_days_ago.weekday() != 6:
        db.add(
            models.MealOrder(
                user_id=user.id,
                date=two_days_ago,
                meal_type=models.MealType.breakfast,
                dish_name="Breakfast skipped",
                price=45,
                status=models.OrderStatus.skipped,
                slot_window=sunrise.breakfast_window,
                source="booking",
                note="Skipped · refunded to wallet",
            )
        )
        db.add(
            models.WalletTransaction(
                user_id=user.id,
                amount=45,
                reason=f"Breakfast skipped on {two_days_ago}",
            )
        )

    three_days_ago = today - timedelta(days=3)
    if three_days_ago.weekday() != 6:
        db.add(
            models.MealOrder(
                user_id=user.id,
                date=three_days_ago,
                meal_type=models.MealType.breakfast,
                dish_name="Poha with sev",
                price=45,
                status=models.OrderStatus.handed_over,
                slot_window=sunrise.breakfast_window,
                source="booking",
            )
        )
        db.add(
            models.MealOrder(
                user_id=user.id,
                date=three_days_ago,
                meal_type=models.MealType.lunch,
                dish_name="Rajma chawal",
                price=58,
                status=models.OrderStatus.handed_over,
                slot_window=sunrise.lunch_window,
                source="booking",
            )
        )

    # Today: breakfast already handed over, lunch out for delivery — matches mockup Home/Tracking screens.
    today_booking = models.Booking(
        user_id=user.id,
        date=today,
        booking_code="DT-7715",
        batch_code="SP-C / morning 3",
        payment_method="upi",
        total_amount=45 + 58,
    )
    db.add(today_booking)
    db.flush()
    db.add(
        models.MealOrder(
            user_id=user.id,
            booking_id=today_booking.id,
            date=today,
            meal_type=models.MealType.breakfast,
            dish_name="Poha with sev",
            price=45,
            status=models.OrderStatus.handed_over,
            slot_window=sunrise.breakfast_window,
            source="booking",
        )
    )
    db.add(
        models.MealOrder(
            user_id=user.id,
            booking_id=today_booking.id,
            date=today,
            meal_type=models.MealType.lunch,
            dish_name="Rajma chawal",
            price=58,
            status=models.OrderStatus.out_for_delivery,
            slot_window=sunrise.lunch_window,
            source="booking",
        )
    )

    # Active subscription: breakfast plan, partially used, auto-books tomorrow's breakfast.
    sub = models.UserSubscription(
        user_id=user.id,
        plan_id=plans["breakfast"].id,
        meals_left=14,
        renews_on=today + timedelta(days=18),
        active=True,
        paused=False,
    )
    db.add(sub)

    tomorrow = today + timedelta(days=1)
    if tomorrow.weekday() != 6:
        tomorrow_breakfast_menu = (
            db.query(models.DailyMenu)
            .filter(
                models.DailyMenu.date == tomorrow,
                models.DailyMenu.meal_type == models.MealType.breakfast,
                models.DailyMenu.sold_out == False,  # noqa: E712
            )
            .first()
        )
        if tomorrow_breakfast_menu:
            db.add(
                models.MealOrder(
                    user_id=user.id,
                    date=tomorrow,
                    meal_type=models.MealType.breakfast,
                    daily_menu_id=tomorrow_breakfast_menu.id,
                    dish_name=tomorrow_breakfast_menu.dish.name,
                    price=float(tomorrow_breakfast_menu.price),
                    status=models.OrderStatus.booked,
                    slot_window=sunrise.breakfast_window,
                    source="subscription",
                    note="Confirmed by subscription",
                )
            )


def run_seed() -> None:
    db = SessionLocal()
    try:
        dishes = _seed_dishes(db)
        points = _seed_delivery_points(db)
        plans = _seed_plans(db)
        _seed_menus(db, dishes)
        _seed_demo_user(db, dishes, points, plans)
        db.commit()
    finally:
        db.close()
