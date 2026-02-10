import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './context/AuthContext';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import SetupSchoolInfo from './pages/SetupSchoolInfo';
import Home from './pages/Home'; 
import ManageSchool from './components/ManageSchool';
import SetupRooms from './pages/SetupRooms';
import SetupPriceList from './pages/SetupPriceList';
import SetupClasses from './pages/SetupClasses';
import EditInstructors from './pages/EditInstructors';
import EditNews from './pages/EditNews';
import Instructor from './pages/Instructor';
import School from './pages/School';
import MyReviews from './pages/MyReviews';
import SearchResults from './pages/SearchResults';
import Footer from './components/Footer';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function App() {
    const { user, message, setMessage } = useContext(AuthContext);

    return (
        // 2. GŁÓWNY WRAPPER (zamiast <>) - ustawia flexbox dla "Sticky Footer"
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            
            {/* ALERT BOX */}
            {message && (
                <div style={styles.alert}>
                    <span>{message}</span>
                    <button onClick={() => setMessage(null)} style={styles.closeBtn}>
                        <span className="material-symbols-outlined" style={{fontSize: '18px'}}>close</span>
                    </button>
                </div>
            )}

            <Navbar />

            {/* 3. WRAPPER TREŚCI - wypycha stopkę na dół */}
            <div style={{ flex: 1 }}>
                <Routes>
                    <Route path="/signup-dancer" element={<Register role="user" />} />
                    <Route path="/signup-school" element={<Register role="owner" />} />

                    <Route path="/profile" element={<ManageSchool />} />

                    <Route path="/setup-info" element={<SetupSchoolInfo />} />
                    <Route path="/setup-rooms" element={<SetupRooms />} />
                    <Route path="/setup-price" element={<SetupPriceList />} />
                    <Route path="/setup-classes" element={<SetupClasses />} />

                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />

                    <Route path="/instructors" element={<EditInstructors />} />
                    <Route path="/news" element={<EditNews />} />
                    <Route path="/instructor/:id" element={<Instructor />} />
                    <Route path="/school/:id" element={<School />} />
                    <Route path="/my-reviews" element={<MyReviews />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                </Routes>
            </div>

            {/* 4. STOPKA NA SAMYM DOLE */}
            <Footer />
            
        </div>
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