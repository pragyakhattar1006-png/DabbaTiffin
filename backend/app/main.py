from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import (
    auth,
    bookings,
    delivery_points,
    home,
    menu,
    orders,
    subscriptions,
    users,
    wallet,
)

app = FastAPI(title="DabbaTiffin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(delivery_points.router)
app.include_router(menu.router)
app.include_router(bookings.router)
app.include_router(orders.router)
app.include_router(subscriptions.router)
app.include_router(wallet.router)
app.include_router(users.router)
app.include_router(home.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    from .seed import run_seed

    run_seed()


@app.get("/health")
def health():
    return {"status": "ok"}
