import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const EditNews = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [newsText, setNewsText] = useState('');
    const [localError, setLocalError] = useState(''); // Stan na błąd walidacji

    useEffect(() => {
        api.get('schools/my_school/')
            .then(res => {
                if (res.data && res.data.news) {
                    setNewsText(res.data.news);
                }
            })
            .catch(err => console.error("Błąd pobierania aktualności:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setLocalError(''); // Reset błędu przed zapisem

        // --- WALIDACJA: WYWAL BŁĄD ZAMIAST OBCINAĆ ---
        if (newsText.length > 1000) {
            setLocalError(`Treść aktualności jest za długa o ${newsText.length - 1000} znaków! Maksymalny limit to 1000.`);
            return;
        }

        try {
            await api.patch('schools/my_school/', { news: newsText });
            navigate('/profile');
        } catch (err) {
            console.error("Błąd zapisu:", err);
            setLocalError("Nie udało się zapisać aktualności na serwerze.");
        }
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Ładowanie...</div>;

    return (
        <div style={styles.container}>
            
            {/* --- NAGŁÓWEK --- */}
            <div style={styles.headerRow}>
                <span 
                    className="material-symbols-outlined" 
                    style={styles.backArrow} 
                    onClick={() => navigate('/profile')}
                >
                    arrow_back_ios
                </span>
                <h1 style={styles.title}>Edytuj aktualności</h1>
                <div style={{width: '24px'}}></div>
            </div>

            <div style={styles.card}>
                <p style={styles.purpleText}>
                    Wpisz tutaj ważne komunikaty dla kursantów<br/>
                    (np. “W Wigilię nieczynne”, “Zajęcia Salsy odwołane”).<br/>
                    Ten tekst wyświetli się na Twoim profilu.
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                    <label style={styles.label}>Aktualności</label>
                    {/* LICZNIK ZNAKÓW: Robi się czerwony po przekroczeniu 1000 */}
                    <span style={{ 
                        fontSize: '12px', 
                        color: newsText.length > 1000 ? '#d32f2f' : '#888',
                        fontWeight: newsText.length > 1000 ? 'bold' : 'normal'
                    }}>
                        {newsText.length}/1000
                    </span>
                </div>

                <textarea 
                    style={{
                        ...styles.textarea, 
                        borderColor: newsText.length > 1000 ? '#d32f2f' : '#ccc' // Zmiana koloru ramki przy błędzie
                    }} 
                    value={newsText}
                    onChange={(e) => {
                        setNewsText(e.target.value);
                        if (localError) setLocalError(''); // Znikaj błąd jak user zacznie poprawiać
                    }}
                    placeholder="Wpisz treść ogłoszenia..."
                />

                {/* KOMUNIKAT O BŁĘDZIE DŁUGOŚCI */}
                {localError && (
                    <div style={styles.errorBox}>
                        {localError}
                    </div>
                )}
            </div>

            <button style={styles.saveBtn} onClick={handleSave}>
                <span className="material-symbols-outlined">save</span> Zapisz i opublikuj
            </button>

        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: 'calc(100vh - 80px)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '800px', marginBottom: '30px' },
    backArrow: { fontSize: '24px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },
    title: { fontSize: '28px', fontWeight: '400', color: '#333', margin: 0, textAlign: 'center' },

    card: { backgroundColor: 'white', width: '100%', maxWidth: '800px', padding: '50px', borderRadius: '0px', boxShadow: '0 4px 30px rgba(0,0,0,0.02)', minHeight: '300px' },
    
    purpleText: { color: '#7A33E3', textAlign: 'center', fontWeight: '600', marginBottom: '40px', lineHeight: '1.5' },
    
    label: { display: 'block', fontSize: '16px', margin: 0, color: '#333', fontWeight: '500' },
    textarea: { width: '100%', height: '250px', padding: '15px', border: '1px solid #ccc', fontSize: '16px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },

    errorBox: { 
        marginTop: '15px', 
        color: '#d32f2f', 
        backgroundColor: '#ffebee', 
        padding: '10px', 
        borderRadius: '4px', 
        fontSize: '14px', 
        fontWeight: '500',
        textAlign: 'center',
        border: '1px solid #ffcdd2'
    },

    saveBtn: { 
        marginTop: '30px',
        backgroundColor: '#7A33E3', 
        color: 'white', 
        padding: '15px 40px', 
        borderRadius: '8px', 
        border: 'none', 
        fontWeight: 'bold', 
        fontSize: '16px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px' 
    }
};

export default EditNews;