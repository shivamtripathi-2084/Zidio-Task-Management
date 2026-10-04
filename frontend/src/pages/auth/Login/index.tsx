import { ErrorMessage, Field, Form, Formik, FormikHelpers } from "formik";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useState } from "react";
import { useAuth } from "../../../context/Auth.context";
const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  type LoginType = {
    email: string;
    password: string;
  };
  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .email("EMail must be valid")
      .required("Email is required"),
    password: yup.string().required("password is Required"),
  });

  const initalValues: LoginType = {
    email: "",
    password: "",
  };

  const onSubmitHandler = async (e: LoginType, { resetForm }: FormikHelpers<LoginType>) => {
    try {
      const data = await loginUser(e.email, e.password);

      localStorage.setItem("token", data.token);
      toast.success((data && data.msg) || "Login Successful");

      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to login");
    }
    resetForm();
  };
  return (
    <>
      <div className="container">
        <Formik
          validationSchema={validationSchema}
          initialValues={initalValues}
          onSubmit={onSubmitHandler}
        >
          <Form className="col-sm-12 col-md-6 col-lg-4 mx-auto border px-4 py-4 my-5 rounded">
            <div className="mb-3 py-4">
              <h1>Login</h1>
            </div>
            <div className="mb-3">
              <label htmlFor="email">
                EMail <span className="text-danger">*</span>{" "}
              </label>
              <Field
                name="email"
                id="email"
                type="text"
                className="form-control"
                placeholder="john@gmail.com"
              />
              <ErrorMessage
                name="email"
                component={"p"}
                className="text-sm text-danger"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password">
                password <span className="text-danger">*</span>{" "}
              </label>
              <Field
                name="password"
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="******"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary mt-2"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              <ErrorMessage
                name="password"
                component={"p"}
                className="text-sm text-danger"
              />
            </div>
            <div className="mb-3">
              <button className="btn btn-dark">Login</button>
            </div>
            <div className="mb-3">
              <p className="text-secondary text-end">
                Don't Have An Account?{" "}
                <Link to={"/auth/register"}>Register</Link>{" "}
              </p>
            </div>
          </Form>
        </Formik>
      </div>
    </>
  );
};

export default Login;
