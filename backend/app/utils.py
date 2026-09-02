import random
import string


def gen_booking_code() -> str:
    return "DT-" + "".join(random.choices(string.digits, k=4))


def gen_batch_code(delivery_point_name: str, meal_type: str) -> str:
    initials = "".join(w[0] for w in delivery_point_name.split()[:2]).upper() or "SP"
    slot = "morning" if meal_type == "breakfast" else "noon"
    return f"{initials}-C / {slot} {random.randint(1, 4)}"
