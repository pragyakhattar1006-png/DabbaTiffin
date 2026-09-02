import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DeliveryPoint from "./pages/DeliveryPoint";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import BookingReview from "./pages/BookingReview";
import Confirmation from "./pages/Confirmation";
import PaymentSuccess from "./pages/PaymentSuccess";
import Tracking from "./pages/Tracking";
import Plans from "./pages/Plans";
import Skip from "./pages/Skip";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/home" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/delivery-point"
              element={
                <RequireAuthOnly>
                  <DeliveryPoint />
                </RequireAuthOnly>
              }
            />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
            <Route path="/booking" element={<ProtectedRoute><BookingReview /></ProtectedRoute>} />
            <Route path="/confirmation/:bookingId" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/tracking/:orderId" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
            <Route path="/skip" element={<ProtectedRoute><Skip /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function RequireAuthOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
