import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('personal_blog_admin');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.status === 'SUCCESS') {
        const userPayload = {
          username: data.username,
          displayName: data.displayName,
          role: data.role,
          token: data.token
        };
        setAdminUser(userPayload);
        localStorage.setItem('personal_blog_admin', JSON.stringify(userPayload));
        return { success: true };
      }
      return { success: false, message: data.message || 'Login gagal' };
    } catch {
      return { success: false, message: 'Gagal terhubung ke server autentikasi' };
    }
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('personal_blog_admin');
  };

  return (
    <AuthContext.Provider value={{ adminUser, isAuthenticated: !!adminUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
