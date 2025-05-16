import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from "jwt-decode";
import { login } from "../services/authService";
import "./LoginPage.css";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const data = await login({ mobile, password });
      const token = data.token;
      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);
      localStorage.setItem("userId", decoded.userId);

      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center">
      <div className="w-[90%] h-[90vh] bg-white rounded-xl shadow-lg flex overflow-hidden">
        <div className="w-1/2 bg-[#0A0A23] text-white flex items-center justify-center relative rounded-l-xl overflow-hidden">
          <img
            src="EpharmaLogin.png"
            alt="India Map"
            className="object-cover animate-zoom"
          />
        </div>

        <div className="w-1/2 flex flex-col items-center justify-center px-8">
          <h2 className="text-2xl font-semibold mb-6">Login</h2>
          <form onSubmit={handleLogin} className="w-full max-w-sm">
            <div className="floating-group">
              <input
                type="text"
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder=" "
                className="floating-input peer"
                required
              />
              <label htmlFor="mobile" className="floating-label">
                Mobile Number
              </label>
            </div>

            <div className="floating-group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="floating-input peer"
                required
              />
              <label htmlFor="password" className="floating-label">
                Password
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 mt-2"
            >
              Login
            </button>

            <p className="text-center mt-2 text-sm text-blue-500 cursor-pointer">
              Forgot Password?
            </p>
          </form>

          <div className="bg-blue-300 text-blue-800 px-4 py-2 rounded mt-6">
            Do you own Pharmacy?{' '}
            <span className="font-semibold cursor-pointer">Join as Chemist</span>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}