import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';

const SetupSchoolInfo = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        street: '',
        building_no: '',
        apartment_no: '',
        zip_code: '',
        city: '',
        website: '',
        instagram: '',
        facebook: '',
        description: '',
        rules: '',
        additional_info: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Pierwszy krok: Tworzymy rekord szkoły w bazie danych (POST)
            const response = await api.post('schools/', formData);
            if (response.status === 201) {
                // Sukces! Przechodzimy do kroku 2: Sale taneczne
                navigate('/setup-rooms');
            }
        } catch (error) {
            console.error("Błąd podczas tworzenia szkoły:", error.response?.data);
            alert("Wystąpił błąd. Sprawdź czy wypełniłeś wszystkie wymagane pola.");
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.mainTitle}>Wypełnij informacje o swojej szkole</h1>
            
            <div style={styles.card}>
                <p style={styles.requiredInfo}>* - pole obowiązkowe</p>
                
                <form onSubmit={handleSubmit}>
                    {/* --- DANE PODSTAWOWE --- */}
                    <div style={styles.section}>
                        <label style={styles.label}>Nazwa szkoły*</label>
                        <input style={styles.input} type="text" name="name" required onChange={handleChange} />

                        <div style={styles.row}>
                            <div style={styles.col}>
                                <label style={styles.label}>E-mail kontaktowy*</label>
                                <input style={styles.input} type="email" name="email" required onChange={handleChange} />
                            </div>
                            <div style={styles.col}>
                                <label style={styles.label}>Nr telefonu*</label>
                                <input style={styles.input} type="text" name="phone" required onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* --- ADRES --- */}
                    <div style={styles.section}>
                        <label style={styles.label}>Ulica*</label>
                        <input style={styles.input} type="text" name="street" required onChange={handleChange} />

                        <div style={styles.row}>
                            <div style={styles.col}>
                                <label style={styles.label}>Nr budynku*</label>
                                <input style={styles.input} type="text" name="building_no" required onChange={handleChange} />
                            </div>
                            <div style={styles.col}>
                                <label style={styles.label}>Nr lokalu</label>
                                <input style={styles.input} type="text" name="apartment_no" onChange={handleChange} />
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.col}>
                                <label style={styles.label}>Kod pocztowy*</label>
                                <input style={styles.input} type="text" name="zip_code" required onChange={handleChange} />
                            </div>
                            <div style={styles.col}>
                                <label style={styles.label}>Miejscowość*</label>
                                <input style={styles.input} type="text" name="city" required onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* --- SOCIAL MEDIA / WWW --- */}
                    <div style={styles.section}>
                        <label style={styles.label}>Strona internetowa</label>
                        <input style={styles.input} type="url" name="website" placeholder="https://" onChange={handleChange} />
                        
                        <div style={styles.row}>
                            <div style={styles.col}>
                                <label style={styles.label}>Instagram</label>
                                <input style={styles.input} type="text" name="instagram" placeholder="@nazwa" onChange={handleChange} />
                            </div>
                            <div style={styles.col}>
                                <label style={styles.label}>Facebook</label>
                                <input style={styles.input} type="text" name="facebook" placeholder="facebook.com/..." onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* --- OPIS --- */}
                    <div style={styles.section}>
                        <label style={styles.label}>Opis szkoły</label>
                        <textarea style={styles.textarea} name="description" placeholder="Opisz klimat swojej szkoły..." onChange={handleChange} />
                    </div>

                    {/* --- ZDJĘCIA (Symulacja Twojej makiety) --- */}
                    <div style={styles.section}>
                        <label style={styles.label}>Dodaj zdjęcia (max 9)</label>
                        <div style={styles.photoGrid}>
                            {[...Array(9)].map((_, i) => (
                                <div key={i} style={styles.photoPlaceholder}>
                                    <span className="material-symbols-outlined" style={{color: '#ccc', fontSize: '32px'}}>image</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" style={styles.button}>Zapisz i przejdź dalej</button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', paddingTop: '40px', paddingBottom: '80px' },
    mainTitle: { textAlign: 'center', fontWeight: '300', fontSize: '28px', color: '#212529', marginBottom: '40px' },
    card: { backgroundColor: 'white', maxWidth: '800px', margin: '0 auto', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    requiredInfo: { fontSize: '12px', color: '#888', marginBottom: '25px' },
    section: { marginBottom: '30px' },
    label: { display: 'block', fontSize: '14px', fontWeight: '400', marginBottom: '8px', color: '#434343' },
    input: { width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '6px', marginBottom: '15px', fontSize: '15px' },
    textarea: { width: '100%', height: '120px', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '15px', resize: 'vertical' },
    row: { display: 'flex', gap: '20px' },
    col: { flex: 1 },
    photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' },
    photoPlaceholder: { aspectRatio: '16/9', backgroundColor: '#F1F3F5', border: '2px dashed #DEE2E6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    button: { width: '100%', backgroundColor: '#7A33E3', color: 'white', padding: '18px', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }
};

export default SetupSchoolInfo;