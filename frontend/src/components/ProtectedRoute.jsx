import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-mutedwarm">
        Loading DabbaTiffin…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!user.delivery_point) return <Navigate to="/delivery-point" replace />;
  return children;
}
