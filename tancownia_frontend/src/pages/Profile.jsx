import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Profile = () => {
    const { user } = useContext(AuthContext);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Mój Profil</h1>
                <p style={styles.info}>Zalogowany jako: <strong>{user?.username}</strong></p>
                <p style={styles.info}>Rola: <strong>{user?.role}</strong></p>
                
                <div style={styles.placeholder}>
                    <p>Tutaj niedługo pojawią się Twoje statystyki i ustawienia.</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: 'calc(100vh - 75px)',
        backgroundColor: '#F8F9FF',
        paddingTop: '60px'
    },
    card: {
        backgroundColor: 'white',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    },
    title: { fontWeight: '300', marginBottom: '20px' },
    info: { fontSize: '16px', marginBottom: '10px' },
    placeholder: {
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f1f1f1',
        borderRadius: '8px',
        color: '#888',
        textAlign: 'center'
    }
};

export default Profile;