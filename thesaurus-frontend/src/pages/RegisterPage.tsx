import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import RegisterForm from "../components/auth/RegisterForm";
import AppLayout from "../components/layout/AppLayout";
import { AuthContext } from "../contexts/AuthContext";

const RegisterPage = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <AppLayout
      title="Create Your Account"
      description="Join FreeSaurus to track your progress and save your favorite words"
    >
      <RegisterForm />
    </AppLayout>
  );
};

export default RegisterPage;
