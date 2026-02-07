import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';

const Profile = () => {
    const navigate = useNavigate();
    // 1. ZMIANA: Dodajemy 'user', żeby mieć dostęp do username z tokena natychmiast
    const { user, logoutUser } = useContext(AuthContext); 
    
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [schoolData, setSchoolData] = useState(null);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userRes = await api.get('auth/users/me/');
                setUserData(userRes.data);
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
                console.log("Brak szkoły/tancerz:", err);
                setIsOwner(false);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = () => {
        logoutUser(); 
    };

    if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Ładowanie profilu...</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>
                {isOwner ? 'Profil szkoły' : 'Profil tancerza'}
            </h1>

            <div style={styles.card}>
                
                {/* --- WIDOK WŁAŚCICIELA (SZKOŁA) --- */}
                {isOwner && schoolData ? (
                    <div style={styles.contentWrapper}>
                        <div style={styles.logoWrapper}>
                            {schoolData.logo ? (
                                <img src={schoolData.logo} alt="Logo" style={styles.logo} />
                            ) : (
                                <div style={styles.logoPlaceholder}>{schoolData.name ? schoolData.name[0] : 'S'}</div>
                            )}
                        </div>

                        <h2 style={styles.nameTitle}>{schoolData.name}</h2>

                        <div style={styles.buttonsGrid}>
                            <button style={styles.mainActionBtn} onClick={() => navigate('/setup-info', { state: { fromProfile: true } })}>
                                <span className="material-symbols-outlined">info</span>
                                Edytuj informacje o szkole
                            </button>

                            <div style={styles.rowTwo}>
                                <button style={styles.purpleBtn} onClick={() => navigate('/setup-rooms', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">door_front</span>
                                    Zarządzaj salami
                                </button>
                                <button style={styles.purpleBtn} onClick={() => navigate('/instructors', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">accessibility_new</span>
                                    Edytuj instruktorów
                                </button>
                            </div>

                            <div style={styles.rowThree}>
                                <button style={styles.purpleBtn} onClick={() => navigate('/setup-price', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">attach_money</span>
                                    Ustal cennik
                                </button>
                                <button style={styles.purpleBtn} onClick={() => navigate('/setup-classes', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">calendar_month</span>
                                    Planuj zajęcia
                                </button>
                                <button style={styles.purpleBtn} onClick={() => navigate('/news', { state: { fromProfile: true } })}>
                                    <span className="material-symbols-outlined">article</span>
                                    Dodaj aktualności
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- WIDOK TANCERZA (USER) --- */
                    <div style={styles.contentWrapper}>
                        {/* 2. ZMIANA: Priorytet API -> Token -> Fallback */}
                        <h2 style={styles.nameTitle}>
                            {userData?.username || user?.username || "Użytkownik"}
                        </h2>

                        <div style={styles.verticalStack}>
                            <button style={styles.purpleBtnWide}>
                                <span className="material-symbols-outlined">badge</span>
                                Zmień nazwę użytkownika
                            </button>
                            <button style={styles.purpleBtnWide}>
                                <span className="material-symbols-outlined">rate_review</span>
                                Zarządzaj swoimi recenzjami
                            </button>
                            <button style={styles.purpleBtnWide}>
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
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: 'calc(100vh - 80px)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
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
    logoutLink: { fontSize: '18px', fontWeight: '700', color: '#333', textDecoration: 'underline', cursor: 'pointer' }
};

export default Profile;