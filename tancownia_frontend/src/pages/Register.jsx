import { useState, useContext } from 'react';
import { Link } from 'react-router-dom'; // <--- DODANY IMPORT
import AuthContext from '../context/AuthContext';

const Register = ({ role }) => {
    const { registerUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});

    const isDancer = role === 'user';
    const roleValue = isDancer ? 'user' : 'owner';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        if (formData.password !== formData.confirmPassword) {
            setFieldErrors({ confirmPassword: "Hasła nie są identyczne!" });
            return;
        }

        const { confirmPassword, ...dataToSend } = formData;
        const result = await registerUser({ ...dataToSend, role: roleValue });
        
        if (result && result.errors) {
            setFieldErrors(result.errors);
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>
                Zarejestruj się jako <strong style={{fontWeight: '600'}}>{isDancer ? 'tancerz' : 'szkoła'}</strong>
            </h1>
            
            <div style={styles.card}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>
                        {isDancer ? "Nazwa użytkownika" : "Nazwa szkoły (np. Moja_Szkola)"}
                    </label>
                    <input 
                        type="text" 
                        style={fieldErrors.username ? styles.inputError : styles.input}
                        onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    />
                    {fieldErrors.username && <span style={styles.errorText}>{fieldErrors.username}</span>}

                    <label style={styles.label}>E-mail</label>
                    <input 
                        type="email" 
                        style={fieldErrors.email ? styles.inputError : styles.input}
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                    {fieldErrors.email && <span style={styles.errorText}>{fieldErrors.email}</span>}

                    <label style={styles.label}>Hasło</label>
                    <input 
                        type="password" 
                        style={styles.input}
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />

                    <label style={styles.label}>Powtórz hasło</label>
                    <input 
                        type="password" 
                        style={fieldErrors.confirmPassword ? styles.inputError : styles.input}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                    />
                    {fieldErrors.confirmPassword && <span style={styles.errorText}>{fieldErrors.confirmPassword}</span>}

                    {/* --- ZGODY PRAWNE --- */}
                    <div style={styles.legalText}>
                        Rejestrując się, akceptujesz <Link to="/terms" style={styles.link}>Regulamin</Link> i <Link to="/privacy" style={styles.link}>Politykę Prywatności</Link>.
                    </div>

                    <button type="submit" style={styles.button}>Zarejestruj się</button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { textAlign: 'center', minHeight: '100vh', paddingTop: '60px', backgroundColor: '#F8F9FF' },
    title: { fontSize: '32px', fontWeight: '300', marginBottom: '35px', color: '#212529' },
    card: { backgroundColor: 'white', padding: '45px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '480px', margin: '0 auto' },
    form: { display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' },
    label: { fontSize: '14px', fontWeight: '400', marginBottom: '8px', color: '#434343' },
    input: { padding: '12px', border: '1px solid #DDD', borderRadius: '6px', marginBottom: '15px', fontSize: '15px' },
    inputError: { padding: '12px', border: '1px solid #ff4d4f', borderRadius: '6px', marginBottom: '5px', fontSize: '15px' },
    errorText: { color: '#ff4d4f', fontSize: '12px', marginBottom: '12px', fontWeight: '500' },
    
    // NOWE STYLE DLA ZGÓD
    legalText: { fontSize: '12px', color: '#777', marginTop: '5px', marginBottom: '15px', lineHeight: '1.5' },
    link: { color: '#7A33E3', textDecoration: 'underline', cursor: 'pointer' },

    button: { backgroundColor: '#7A33E3', color: 'white', padding: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', marginTop: '5px', transition: '0.3s' },
};

export default Register;