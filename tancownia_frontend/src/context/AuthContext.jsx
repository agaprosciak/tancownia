import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    
    const [user, setUser] = useState(() => {
        const storedTokens = localStorage.getItem('authTokens');
        if (storedTokens) {
            try {
                const parsedTokens = JSON.parse(storedTokens);
                return jwtDecode(parsedTokens.access);
            } catch (error) {
                return null;
            }
        }
        return null;
    });

    const [message, setMessage] = useState(null); 
    const navigate = useNavigate();

    const registerUser = async (formData) => {
        try {
            const response = await api.post('register/', formData);
            if (response.status === 201) {
                const data = response.data;
                setAuthTokens(data);
                const decoded = jwtDecode(data.access);
                setUser(decoded);
                localStorage.setItem('authTokens', JSON.stringify(data));
                
                if (data.role === 'owner') navigate('/setup-school');
                else navigate('/');
                
                return { success: true };
            }
        } catch (error) {
            return { success: false, errors: error.response?.data };
        }
    };

    const loginUser = async (email, password) => {
        try {
            const response = await api.post('token/', { email, password });
            const data = response.data;

            if (response.status === 200) {
                const decoded = jwtDecode(data.access);
                setAuthTokens(data);
                setUser(decoded); 
                localStorage.setItem('authTokens', JSON.stringify(data));

                if (decoded.role === 'owner' && !decoded.has_school) navigate('/setup-school');
                else navigate('/');
                
                return { success: true };
            }
        } catch (error) {
            return { error: true, errors: error.response?.data };
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        
        // NOWE: Ustawienie komunikatu
        setMessage("Wylogowano pomyślnie!"); 
        setTimeout(() => setMessage(null), 3000); // Znika po 3 sek.
        
        navigate('/');
    };

    const contextData = { 
        user, 
        authTokens, 
        registerUser, 
        loginUser, 
        logoutUser,
        message,   
        setMessage 
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;