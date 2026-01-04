import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial check for session
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check session via BFF endpoint
            const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else if (res.status === 401) {
                // Try to refresh if we get a 401 on initial check
                const refreshed = await refreshToken();
                if (refreshed) {
                    await checkAuth(); // Retry me check after refresh
                    return;
                }
                setUser(null);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshToken = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            });
            return res.ok;
        } catch (error) {
            console.error("Token refresh failed", error);
            return false;
        }
    };

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error("Logout failed", error);
        }
        setUser(null);
    };

    const fetchWithAuth = async (url, options = {}) => {
        const defaultOptions = { credentials: 'include', ...options };
        let response = await fetch(url, defaultOptions);

        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                // Retry with new tokens
                response = await fetch(url, defaultOptions);
            } else {
                setUser(null);
                // Optionally redirect to login or let the component handle it
            }
        }

        return response;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, fetchWithAuth, refreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div style={{ color: 'white' }}>Loading Security Clearance...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div style={{ color: 'white' }}>Loading Security Clearance...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has Admin role
    const isAdmin = user.roles && user.roles.includes('Admin');

    if (!isAdmin) {
        return <Navigate to="/access-denied" state={{ from: location }} replace />;
    }

    return children;
};
