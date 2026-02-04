import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import logotyp from '../assets/logotyp.svg';
import logonazwa from '../assets/logonazwa.svg';

const Navbar = () => {
    const { user, logoutUser } = useContext(AuthContext);
    const [isRegOpen, setIsRegOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);

    // Dynamiczne dane na podstawie roli z tokena
    const isOwner = user?.role === 'owner';
    const manageLabel = isOwner ? "Zarządzaj szkołą" : "Zarządzaj profilem";
    

    const destinationPath = "/profile";

    return (
        <nav style={styles.nav}>
            <Link to="/" style={styles.logoLink}>
                <img src={logotyp} alt="Ikona" style={styles.logoIcon} />
                <img src={logonazwa} alt="Tańcownia" style={styles.logoName} />
            </Link>
            
            <div style={styles.rightMenu}>
                {!user ? (
                    <>
                        <div style={styles.dropdownContainer}>
                            <div style={styles.navItem} onClick={() => setIsRegOpen(!isRegOpen)}>
                                Zarejestruj się 
                                <span className="material-symbols-outlined" style={styles.icon}>
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
                        <Link to="/login" style={styles.navItem}>Zaloguj się</Link>
                    </>
                ) : (
                    <div style={styles.dropdownContainer}>
                        <div style={styles.navItem} onClick={() => setIsUserOpen(!isUserOpen)}>
                            {user.username || "Użytkownik"} 
                            <span className="material-symbols-outlined" style={styles.icon}>
                                {isUserOpen ? 'keyboard_control_key' : 'keyboard_arrow_down'}
                            </span>
                        </div>
                        {isUserOpen && (
                            <div style={styles.dropdownMenu}>
                                <Link to={destinationPath} style={styles.dropItem} onClick={() => setIsUserOpen(false)}>
                                    {manageLabel}
                                </Link>
                                <div style={styles.dropItem} onClick={() => { logoutUser(); setIsUserOpen(false); }}>
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

// ... style zostaw bez zmian (są poprawne) ...
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