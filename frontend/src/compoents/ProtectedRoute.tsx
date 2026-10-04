import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/Auth.context";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const router = useNavigate();
  const [loading, setLoading] = useState(true);
  const { profileUser } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router("/auth/login");
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        await profileUser(token);
      } catch (error) {
        localStorage.removeItem("token");
        router("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [profileUser, router]);

  if (loading) {
    return <div>loading...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
