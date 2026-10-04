import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { BACKEND_URI } from "../enviroment";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
type UserType = {
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
};
interface AuthContextIf {
  registerUser: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ msg: string }>;
  getUsers: () => Promise<ManagedUser[]>;
  updateUserRole: (userId: string, role: ManagedUser["role"]) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<{ msg: string; token: string; role: UserType["role"] }>;
  profileUser: (token: string) => Promise<void>;
  user: UserType;
  setUser: React.Dispatch<React.SetStateAction<UserType>>;
  logoutUser: () => void;
}

export type ManagedUser = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
};

const AuthContext = createContext<AuthContextIf>({
  registerUser: async () => ({ msg: "" }),
  getUsers: async () => [],
  updateUserRole: async () => {},
  loginUser: async () => ({ msg: "", token: "", role: "viewer" }),
  user: {
    email: "",
    name: "",
    role: "viewer",
  },
  profileUser: async () => {},
  setUser: function (): void {},
  logoutUser: () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType>({
    email: "",
    name: "",
    role: "viewer",
  });
  const navigate = useNavigate();

  const registerUser = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ msg: string }> => {
    const response = await fetch(BACKEND_URI + "/auth/register", {
      body: JSON.stringify({
        name,
        email,
        password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data: { msg: string; message?: string } = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to register");
    }
    return data;
  };

  const getUsers = useCallback(async (): Promise<ManagedUser[]> => {
    const response = await fetch(BACKEND_URI + "/auth/users", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to load users");
    }
    return data.users;
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: ManagedUser["role"]): Promise<void> => {
    const response = await fetch(`${BACKEND_URI}/auth/users/${userId}/role`, {
      body: JSON.stringify({ role }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      method: "PATCH",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to update user role");
    }
    toast.success(data.msg);
  }, []);

  const loginUser = async (email: string, password: string): Promise<{ msg: string; token: string; role: UserType["role"] }> => {
    const response = await fetch(BACKEND_URI + "/auth/login", {
      body: JSON.stringify({
        email,
        password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const data: { msg: string; token: string; role: UserType["role"]; message?: string } = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to login");
    }

    return data;
  };

  const profileUser = async (token: string): Promise<void> => {
    const response = await fetch(BACKEND_URI + "/auth/profile", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      method: "GET",
    });

    const data: { user: UserType; message?: string } = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load profile");
    } else {
      setUser(data.user);
    }
  };

  const logoutUser = async () => {
    try {
      localStorage.removeItem("token");
      toast.success("Logout successful");
      setUser({
        email: "",
        name: "",
        role: "viewer",
      });
      navigate("/auth/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log out");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        registerUser,
        getUsers,
        updateUserRole,
        loginUser,
        profileUser,
        user,
        setUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
