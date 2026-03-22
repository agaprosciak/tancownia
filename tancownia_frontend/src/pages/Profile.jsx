import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';

// NOWY KOMPONENT: Automatycznie zamienia zepsuty obrazek na podanego fallbacka
const ImageWithFallback = ({ src, fallback, ...props }) => {
    const [hasError, setHasError] = useState(false);
    if (!src || hasError) return fallback;
    return <img src={src} onError={() => setHasError(true)} {...props} />;
};

const Profile = () => {
    const navigate = useNavigate();
    const { user, logoutUser } = useContext(AuthContext); 
    
    // Stany danych
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [schoolData, setSchoolData] = useState(null);
    const [isOwner, setIsOwner] = useState(false);

    // Stany Popupów
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // FORMULARZE
    const [newUsername, setNewUsername] = useState('');
    const [currentPasswordForUsername, setCurrentPasswordForUsername] = useState('');
    const [passData, setPassData] = useState({ current_password: '', new_password: '', re_new_password: '' });
    
    // Obsługa ładowania i komunikatów
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState(null); 

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userRes = await api.get('auth/users/me/');
                setUserData(userRes.data);
                setNewUsername(userRes.data.username); 
            } catch (err) {
                console.warn("Błąd usera:", err);
            }

            try {
                const schoolRes = await api.get('schools/my_school/');
                if (schoolRes.data && (schoolRes.data.id || schoolRes.data.name)) {
                    setSchoolData(schoolRes.data);
                    setIsOwner(true); 
                }
            } catch (err) {
                setIsOwner(false);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => logoutUser();

    // LOGIKA ZMIANY NAZWY
    const submitUsername = async () => {
        setActionLoading(true);
        setActionMessage(null);
        try {
            await api.post('change-username/', { 
                new_username: newUsername,
                current_password: currentPasswordForUsername
            });
            setActionMessage({ type: 'success', text: 'Nazwa zmieniona! Wylogowywanie...' });
            setTimeout(() => logoutUser(), 2000);
        } catch (err) {
            console.error(err);
            const errorText = err.response?.data?.error || 'Wystąpił nieznany błąd.';
            setActionMessage({ type: 'error', text: errorText });
            setActionLoading(false);
        }
    };

    // LOGIKA ZMIANY HASŁA
    const submitPassword = async () => {
        if (passData.new_password !== passData.re_new_password) {
            setActionMessage({ type: 'error', text: 'Nowe hasła muszą być identyczne.' });
            return;
        }
        setActionLoading(true);
        setActionMessage(null);
        try {
            await api.post('change-password/', {
                current_password: passData.current_password,
                new_password: passData.new_password
            });
            setActionMessage({ type: 'success', text: 'Hasło zmienione! Wylogowywanie...' });
            setTimeout(() => {
                logoutUser();
            }, 2000);
        } catch (err) {
            console.error(err);
            const errorText = err.response?.data?.error || 'Wystąpił błąd połączenia.';
            setActionMessage({ type: 'error', text: errorText });
            setActionLoading(false);
        }
    };

    if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Ładowanie profilu...</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>
                {isOwner ? 'Profil szkoły' : 'Profil tancerza'}
            </h1>

            <div style={styles.card}>
                
                {/* --- WIDOK SZKOŁY --- */}
                {isOwner && schoolData ? (
                    <div style={styles.contentWrapper}>
                        <div style={styles.logoWrapper}>
                            {/* ZMIANA: Użycie ImageWithFallback dla loga szkoły w profilu */}
                            <ImageWithFallback 
                                src={schoolData.logo} 
                                alt="Logo" 
                                style={styles.logo} 
                                fallback={<div style={styles.logoPlaceholder}>{schoolData.name ? schoolData.name[0] : 'S'}</div>} 
                            />
                        </div>
                        <h2 style={styles.nameTitle}>{schoolData.name}</h2>

                        <div style={styles.buttonsGrid}>
                            <button style={styles.mainActionBtn} onClick={() => navigate('/setup-info', { state: { fromProfile: true } })}>
                                <span className="material-symbols-outlined">info</span> Edytuj informacje o szkole
                            </button>
                            
                            <div style={styles.rowTwo}>
                                <button style={styles.purpleBtn} onClick={() => navigate('/setup-rooms', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">door_front</span> Zarządzaj salami
                                </button>
                                <button style={styles.purpleBtn} onClick={() => navigate('/instructors', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">accessibility_new</span> Edytuj instruktorów
                                </button>
                            </div>
                            
                            <div style={styles.rowThree}>
                                <button style={styles.purpleBtn} onClick={() => navigate('/setup-price', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">attach_money</span> Ustal cennik
                                </button>
                                <button style={styles.purpleBtn} onClick={() => navigate('/setup-classes', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">calendar_month</span> Planuj zajęcia
                                </button>
                                <button style={styles.purpleBtn} onClick={() => navigate('/news', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">article</span> Dodaj aktualności
                                </button>
                            </div>

                            <div style={{width: '100%', borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '10px'}}>
                                <p style={{textAlign:'center', color:'#888', fontSize:'14px', marginBottom:'15px', fontWeight:'500'}}>Ustawienia konta</p>
                                <div style={styles.rowTwo}>
                                    <button style={styles.purpleBtn} onClick={() => { setShowUsernameModal(true); setActionMessage(null); }}>
                                        <span className="material-symbols-outlined">badge</span> Zmień nazwę
                                    </button>
                                    <button style={styles.purpleBtn} onClick={() => { setShowPasswordModal(true); setActionMessage(null); }}>
                                        <span className="material-symbols-outlined">password</span> Zmień hasło
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    /* --- WIDOK TANCERZA --- */
                    <div style={styles.contentWrapper}>
                        <h2 style={styles.nameTitle}>
                            {userData?.username || user?.username || "Użytkownik"}
                        </h2>

                        <div style={styles.verticalStack}>
                            <button style={styles.purpleBtnWide} onClick={() => { setShowUsernameModal(true); setActionMessage(null); }}>
                                <span className="material-symbols-outlined">badge</span>
                                Zmień nazwę użytkownika
                            </button>

                            <button style={styles.purpleBtnWide} onClick={() => navigate('/my-reviews')}>
                                <span className="material-symbols-outlined">rate_review</span>
                                Zarządzaj swoimi recenzjami
                            </button>

                            <button style={styles.purpleBtnWide} onClick={() => { setShowPasswordModal(true); setActionMessage(null); }}>
                                <span className="material-symbols-outlined">password</span>
                                Zmień hasło
                            </button>
                        </div>
                    </div>
                )}

                <div style={styles.logoutContainer}>
                    <span style={styles.logoutLink} onClick={handleLogout}>Wyloguj</span>
                </div>
            </div>

            {/* --- POPUP ZMIANY NAZWY --- */}
            {showUsernameModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3>Zmień nazwę</h3>
                            <span className="material-symbols-outlined" style={{cursor:'pointer'}} onClick={() => setShowUsernameModal(false)}>close</span>
                        </div>
                        
                        <div style={{marginBottom: '15px'}}>
                            <label style={styles.label}>Nowa nazwa</label>
                            <input 
                                style={styles.input} 
                                value={newUsername} 
                                onChange={(e) => setNewUsername(e.target.value)} 
                                placeholder="Wpisz nową nazwę"
                            />
                        </div>

                        <div style={{marginBottom: '15px'}}>
                            <label style={styles.label}>Twoje hasło (potwierdzenie)</label>
                            <input 
                                type="password"
                                style={styles.input} 
                                value={currentPasswordForUsername} 
                                onChange={(e) => setCurrentPasswordForUsername(e.target.value)} 
                                placeholder="Wpisz hasło"
                            />
                        </div>

                        {actionMessage && <div style={{...styles.msg, color: actionMessage.type === 'error' ? 'red' : 'green'}}>{actionMessage.text}</div>}
                        
                        <button style={styles.modalBtn} onClick={submitUsername} disabled={actionLoading}>
                            {actionLoading ? 'Zapisywanie...' : 'Zapisz'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- POPUP ZMIANY HASŁA --- */}
            {showPasswordModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3>Zmień hasło</h3>
                            <span className="material-symbols-outlined" style={{cursor:'pointer'}} onClick={() => setShowPasswordModal(false)}>close</span>
                        </div>
                        <input 
                            type="password" style={styles.input} placeholder="Obecne hasło"
                            value={passData.current_password}
                            onChange={(e) => setPassData({...passData, current_password: e.target.value})}
                        />
                        <input 
                            type="password" style={styles.input} placeholder="Nowe hasło"
                            value={passData.new_password}
                            onChange={(e) => setPassData({...passData, new_password: e.target.value})}
                        />
                        <input 
                            type="password" style={styles.input} placeholder="Powtórz nowe hasło"
                            value={passData.re_new_password}
                            onChange={(e) => setPassData({...passData, re_new_password: e.target.value})}
                        />
                        {actionMessage && <div style={{...styles.msg, color: actionMessage.type === 'error' ? 'red' : 'green'}}>{actionMessage.text}</div>}
                        <button style={styles.modalBtn} onClick={submitPassword} disabled={actionLoading}>
                            {actionLoading ? 'Zmienianie...' : 'Zatwierdź'}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

const styles = {
    container: { 
        backgroundColor: '#F8F9FF', 
        minHeight: 'calc(100vh - 80px)', 
        padding: '40px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        fontFamily: "'Inter', sans-serif" 
    },
    pageTitle: { fontSize: '24px', fontWeight: '400', color: '#333', marginBottom: '30px', textAlign: 'center' },
    card: { backgroundColor: 'white', width: '100%', maxWidth: '900px', padding: '50px 20px', borderRadius: '0px', boxShadow: '0 4px 30px rgba(0,0,0,0.02)' },
    contentWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' },
    
    logoWrapper: { marginBottom: '20px' },
    logo: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'contain', border: '1px solid #eee' },
    logoPlaceholder: { width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#888' },
    nameTitle: { fontSize: '28px', fontWeight: '500', color: '#000', marginBottom: '40px', textAlign: 'center' },
    
    buttonsGrid: { display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '750px' },
    mainActionBtn: { backgroundColor: '#7A33E3', color: 'white', border: 'none', padding: '15px', borderRadius: '4px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', maxWidth: '400px', margin: '0 auto' },
    rowTwo: { display: 'flex', gap: '15px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' },
    rowThree: { display: 'flex', gap: '15px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' },
    purpleBtn: { backgroundColor: '#7A33E3', color: 'white', border: 'none', padding: '15px 25px', borderRadius: '4px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '180px', justifyContent: 'center' },
    
    verticalStack: { display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px' },
    purpleBtnWide: { backgroundColor: '#7A33E3', color: 'white', border: 'none', padding: '15px 20px', borderRadius: '4px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' },
    
    logoutContainer: { marginTop: '50px', textAlign: 'center', borderTop: 'none' },
    logoutLink: { fontSize: '18px', fontWeight: '700', color: '#333', textDecoration: 'underline', cursor: 'pointer' },

    overlay: { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        zIndex: 1000, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    modal: { 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '12px', 
        width: '90%', 
        maxWidth: '450px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px' 
    },
    modalHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '25px', 
        borderBottom: '1px solid #eee',
        paddingBottom: '15px'
    },
    label: { 
        display: 'block', 
        fontSize: '14px', 
        color: '#555', 
        marginBottom: '8px', 
        fontWeight: '500',
        textAlign: 'left' 
    },
    input: { 
        width: '100%', 
        padding: '12px 15px', 
        marginBottom: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ddd', 
        fontSize: '16px',
        boxSizing: 'border-box' 
    },
    modalBtn: { 
        width: '100%', 
        padding: '14px', 
        backgroundColor: '#7A33E3', 
        color: 'white', 
        border: 'none', 
        borderRadius: '8px', 
        fontWeight: 'bold', 
        fontSize: '16px', 
        cursor: 'pointer', 
        marginTop: '10px',
        transition: '0.2s'
    },
    msg: { 
        fontSize: '14px', 
        textAlign: 'center', 
        marginBottom: '15px', 
        fontWeight: '500',
        padding: '10px',
        borderRadius: '6px',
        backgroundColor: '#f9f9f9' 
    }
};

export default Profile;