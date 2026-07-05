// src/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import logo from "../../../public/assets/logocar.png";
import { loginStyles } from "../../../public/assets/dummyStyles";

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsActive(true);
  }, []);

  const handleChange = (e) =>
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = credentials.email.trim();
    const password = credentials.password.trim();

    if (!email || !password) {
      toast.error("Please enter your email and password.", { theme: "colored" });
      return;
    }

    setLoading(true);
    try {
      const userName = email.split("@")[0] || "Demo User";
      localStorage.setItem("token", "demo-token");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "demo-user",
          name: userName,
          email,
        })
      );

      toast.success("Login Successful! Welcome back", {
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        onClose: () => {
          navigate("/", { replace: true });
        },
        autoClose: 1000,
      });
    } catch (err) {
      console.error("Login error (frontend):", err);
      toast.error(err.message || "Login failed", { theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  return (
    <div className={loginStyles.pageContainer}>
      {/* Animated Dark Background */}
      <div className={loginStyles.animatedBackground.base}>
        <div
          className={`${loginStyles.animatedBackground.orb1} ${
            isActive ? "translate-x-20 translate-y-10" : ""
          }`}
        />
        <div
          className={`${loginStyles.animatedBackground.orb2} ${
            isActive ? "-translate-x-20 -translate-y-10" : ""
          }`}
        />
        <div
          className={`${loginStyles.animatedBackground.orb3} ${
            isActive ? "-translate-x-10 translate-y-20" : ""
          }`}
        />
      </div>

      {/* Back Button */}
      <a href="/" className={loginStyles.backButton}>
        <FaArrowLeft className="text-sm sm:text-base" />
        <span className="font-medium text-xs sm:text-sm">Back to Home</span>
      </a>

      {/* Login Card */}
      <div
        className={`${loginStyles.loginCard.container} ${
          isActive ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <div className={loginStyles.loginCard.card}>
          <div className={loginStyles.loginCard.decor1} />
          <div className={loginStyles.loginCard.decor2} />

          <div className={loginStyles.loginCard.headerContainer}>
            <div className={loginStyles.loginCard.logoContainer}>
              <div className={loginStyles.loginCard.logoText}>
                <img
                  src={logo}
                  alt="Karzone logo"
                  className="h-[1em] w-auto block"
                  style={{ display: "block", objectFit: "contain" }}
                />
                <span className="font-bold tracking-wider">CARZONE</span>
              </div>
            </div>

            <h1 className={loginStyles.loginCard.title}>PremiumDrive</h1>
            <p className={loginStyles.loginCard.subtitle}>
              LUXURY MOBILITY EXPERIENCE
            </p>
          </div>

          <form onSubmit={handleSubmit} className={loginStyles.form.container}>
            <div className={loginStyles.form.inputContainer}>
              <div className={loginStyles.form.inputWrapper}>
                <div className={loginStyles.form.inputIcon}>
                  <FaUser />
                </div>
                <input
                  name="email"
                  type="email"
                  value={credentials.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className={loginStyles.form.input}
                />
              </div>
            </div>

            <div className={loginStyles.form.inputContainer}>
              <div className={loginStyles.form.inputWrapper}>
                <div className={loginStyles.form.inputIcon}>
                  <FaLock />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className={loginStyles.form.input}
                />
                <div
                  onClick={togglePasswordVisibility}
                  className={loginStyles.form.passwordToggle}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={loginStyles.form.submitButton}
              disabled={loading}
            >
              <span className={loginStyles.form.buttonText}>
                {loading ? "Signing in..." : "ACCESS PREMIUM GARAGE"}
              </span>
              <div className={loginStyles.form.buttonHover} />
            </button>
          </form>

          <div className={loginStyles.signupSection}>
            <p className={loginStyles.signupText}>Don’t have an account?</p>
            <a href="/signup" className={loginStyles.signupButton}>
              CREATE ACCOUNT
            </a>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastStyle={{
          backgroundColor: "#fb923c",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(249, 115, 22, 0.25)",
        }}
      />
    </div>
  );
};

export default LoginPage;
