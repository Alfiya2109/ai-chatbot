import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const query = useQuery();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const uid = query.get("uid");
  const token = query.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Password reset successful! You can now log in.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.error || "Reset failed. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    }
  };

  if (!uid || !token) {
    return <div>Invalid password reset link.</div>;
  }

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      {message && <div style={{color: "green"}}>{message}</div>}
      {error && <div style={{color: "red"}}>{error}</div>}
    </div>
  );
}
