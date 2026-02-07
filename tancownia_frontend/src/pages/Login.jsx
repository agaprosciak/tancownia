import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // <--- 1. DODANO IMPORT API

const Login = () => {
    const navigate = useNavigate();
    const { loginUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const result = await loginUser(formData.email, formData.password);
        
        console.log("Wynik logowania:", result);

        if (result && result.error) {
            setError('Błędny e-mail lub hasło.');
        } else {
            // --- 2. ZMIENIONA LOGIKA PRZEKIEROWANIA ---
            if (result?.role === 'owner') {
                try {
                    // Sprawdzamy czy właściciel ma już szkołę i sale
                    const res = await api.get('schools/my_school/');
                    const hasSchool = res.data && res.data.id;
                    const hasRooms = res.data.floors && res.data.floors.length > 0;

                    if (hasSchool && hasRooms) {
                        console.log("Owner gotowy - leci na Główną");
                        navigate('/'); 
                    } else {
                        console.log("Owner niegotowy - leci do Profilu dokończyć setup");
                        navigate('/profile');
                    }
                } catch (err) {
                    // Jak błąd (np. 404 brak szkoły), to do profilu żeby założył
                    console.log("Błąd sprawdzania szkoły - leci do Profilu");
                    navigate('/profile');
                }
            } else {
                console.log("Tancerz zalogowany - wysyłam na stronę główną");
                navigate('/');
            }
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Zaloguj się</h1>
            <div style={styles.card}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>E-mail</label>
                    <input 
                        type="email" 
                        required
                        style={styles.input}
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />

                    <label style={styles.label}>Hasło</label>
                    <input 
                        type="password" 
                        required
                        style={styles.input}
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />

                    {error && <span style={styles.errorText}>{error}</span>}

                    <button type="submit" style={styles.button}>Zaloguj się</button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { 
        textAlign: 'center', 
        minHeight: 'calc(100vh - 75px)', 
        backgroundColor: '#F8F9FF', 
        paddingTop: '80px' 
    },
    title: { 
        fontSize: '32px', 
        marginBottom: '40px', 
        fontWeight: '300',
        color: '#212529'
    },
    card: { 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
        maxWidth: '450px', 
        margin: '0 auto' 
    },
    form: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
    label: { 
        fontSize: '14px', 
        fontWeight: '400',
        marginBottom: '10px', 
        color: '#434343' 
    },
    input: { 
        padding: '12px 15px', 
        border: '1px solid #E0E0E0', 
        borderRadius: '6px', 
        marginBottom: '25px', 
        fontSize: '16px',
        outlineColor: '#7A33E3'
    },
    button: { 
        backgroundColor: '#7A33E3', 
        color: 'white', 
        padding: '15px', 
        border: 'none', 
        borderRadius: '6px', 
        cursor: 'pointer', 
        fontWeight: '700', 
        fontSize: '16px',
        transition: 'background-color 0.2s'
    },
    errorText: { 
        color: '#ff4d4f', 
        fontSize: '14px', 
        marginBottom: '20px', 
        textAlign: 'center',
        fontWeight: '500'
    }
};

export default Login;