import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './context/AuthContext';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import SetupSchoolInfo from './pages/SetupSchoolInfo';
import Home from './pages/Home'; 
import Profile from './pages/Profile'; 

function App() {
    const { user, message, setMessage } = useContext(AuthContext); // Wyciągamy message

    return (
        <>
            {/* ALERT BOX - Pojawia się na górze strony */}
            {message && (
                <div style={styles.alert}>
                    <span>{message}</span>
                    <button onClick={() => setMessage(null)} style={styles.closeBtn}>
                        <span className="material-symbols-outlined" style={{fontSize: '18px'}}>close</span>
                    </button>
                </div>
            )}

            <Navbar />
            <Routes>
                <Route path="/signup-dancer" element={<Register role="user" />} />
                <Route path="/signup-school" element={<Register role="owner" />} />

                <Route 
                    path="/profile" 
                    element={
                        user?.role === 'owner' && !user?.has_school 
                        ? <Navigate to="/setup-school" /> 
                        : <Profile />
                    } 
                />

                <Route path="/setup-school" element={<SetupSchoolInfo />} />
                <Route path="/setup-rooms" element={<div>Tu będzie formularz dodawania sal - KROK 2</div>} />

                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </>
    );
}

const styles = {
    alert: {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#323232',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '50px',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '14px',
        fontWeight: '500'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: 0,
        opacity: 0.7
    }
};

export default App;