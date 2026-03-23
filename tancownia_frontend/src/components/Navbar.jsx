import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import logotyp from '../assets/logotyp.svg';
import logonazwa from '../assets/logonazwa.svg';

const Navbar = () => {
    const { user, logoutUser } = useContext(AuthContext);
    const [isRegOpen, setIsRegOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);

    // NOWE: Stan do wykrywania urządzeń mobilnych
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isOwner = user?.role === 'owner';
    const manageLabel = isOwner ? "Zarządzaj szkołą" : "Zarządzaj profilem";
    const destinationPath = "/profile";

    const handleLogout = () => {
        setIsUserOpen(false);
        logoutUser();
    };

    return (
        <nav style={{ ...styles.nav, padding: isMobile ? '0 15px' : '0 60px' }}>
            <Link to="/" style={{ ...styles.logoLink, flexShrink: 0 }}>
                <img src={logotyp} alt="Ikona" style={{ ...styles.logoIcon, height: isMobile ? '40px' : '55px' }} />
                <img src={logonazwa} alt="Tańcownia" style={{ ...styles.logoName, height: isMobile ? '16px' : '22px' }} />
            </Link>
            
            <div style={{ ...styles.rightMenu, gap: isMobile ? '15px' : '35px' }}>
                {!user ? (
                    <>
                        <div style={styles.dropdownContainer}>
                            <div style={{ ...styles.navItem, fontSize: isMobile ? '13px' : '17px', whiteSpace: 'nowrap' }} onClick={() => setIsRegOpen(!isRegOpen)}>
                                Zarejestruj się 
                                <span className="material-symbols-outlined" style={{ ...styles.icon, fontSize: isMobile ? '18px' : '22px' }}>
                                    {isRegOpen ? 'keyboard_control_key' : 'keyboard_arrow_down'}
                                </span>
                            </div>
                            {isRegOpen && (
                                <div style={styles.dropdownMenu}>
                                    <Link to="/signup-dancer" style={styles.dropItem} onClick={() => setIsRegOpen(false)}>Tancerz</Link>
                                    <Link to="/signup-school" style={styles.dropItem} onClick={() => setIsRegOpen(false)}>Szkoła</Link>
                                </div>
                            )}
                        </div>
                        <Link to="/login" style={{ ...styles.navItem, fontSize: isMobile ? '13px' : '17px', whiteSpace: 'nowrap' }}>Zaloguj się</Link>
                    </>
                ) : (
                    <div style={styles.dropdownContainer}>
                        <div style={{ ...styles.navItem, fontSize: isMobile ? '13px' : '17px', whiteSpace: 'nowrap' }} onClick={() => setIsUserOpen(!isUserOpen)}>
                            {user.username || "Użytkownik"} 
                            <span className="material-symbols-outlined" style={{ ...styles.icon, fontSize: isMobile ? '18px' : '22px' }}>
                                {isUserOpen ? 'keyboard_control_key' : 'keyboard_arrow_down'}
                            </span>
                        </div>
                        {isUserOpen && (
                            <div style={styles.dropdownMenu}>
                                <Link to={destinationPath} style={styles.dropItem} onClick={() => setIsUserOpen(false)}>
                                    {manageLabel}
                                </Link>
                                <div style={styles.dropItem} onClick={handleLogout}>
                                    Wyloguj się
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

const styles = {
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', height: '75px', backgroundColor: 'white', borderBottom: '1px solid #f0f0f0', position: 'relative', zIndex: 1000 },
    logoLink: { display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' },
    logoIcon: { height: '55px', width: 'auto' },
    logoName: { height: '22px', width: 'auto' },
    rightMenu: { display: 'flex', gap: '35px', alignItems: 'center' },
    navItem: { fontSize: '17px', color: '#212529', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' },
    icon: { fontSize: '22px', color: '#434343' },
    dropdownContainer: { position: 'relative' },
    dropdownMenu: { position: 'absolute', top: '40px', right: 0, backgroundColor: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: '8px', minWidth: '210px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #eee' },
    dropItem: { padding: '14px 20px', textDecoration: 'none', color: '#333', fontSize: '15px', fontWeight: '500', cursor: 'pointer', borderBottom: '1px solid #f8f8f8' }
};

export default Navbar;