import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import AddPricePopup from '../components/AddPricePopup';

const SetupPriceList = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [prices, setPrices] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null); 
    const [cards, setCards] = useState({
        multisport: false, medicover: false, pzu_sport: false, fitprofit: false, info: ''
    });

    // Sprawdzamy czy edycja z profilu
    const isEditMode = location.state?.fromProfile;

    const cardLabels = {
        multisport: 'MultiSport',
        medicover: 'Medicover Sport',
        pzu_sport: 'PZU Sport',
        fitprofit: 'FitProfit'
    };

    useEffect(() => {
        api.get('schools/my_school/')
            .then(res => {
                const school = res.data;
                if (school.price_list && school.price_list.length > 0) {
                    setPrices(school.price_list.map(p => ({
                        name: p.name,
                        price: p.price,
                        entry_type: p.entry_type,
                        duration_minutes: p.duration_minutes,
                        entries_per_week: p.entries_per_week,
                        description: p.description
                    })));
                }
                setCards({
                    multisport: school.accepts_multisport,
                    medicover: school.accepts_medicover,
                    pzu_sport: school.accepts_pzu_sport,
                    fitprofit: school.accepts_fitprofit,
                    info: school.benefit_cards_info || ''
                });
            })
            .catch(err => console.error("Błąd podczas wczytywania danych szkoły:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleOpenEdit = (index) => {
        setEditingIndex(index);
        setShowPopup(true);
    };

    const handleSavePrice = (data) => {
        if (editingIndex !== null) {
            const updatedPrices = [...prices];
            updatedPrices[editingIndex] = data;
            setPrices(updatedPrices);
        } else {
            setPrices([...prices, data]);
        }
        setShowPopup(false);
        setEditingIndex(null);
    };

    const handleSave = async () => {
        try {
            await api.post('price-list/sync_prices/', { 
                prices: prices, 
                cards: cards 
            });

            if (isEditMode) {
                navigate('/profile');
            } else {
                navigate('/setup-classes');
            }
        } catch (err) { 
            console.error("Błąd podczas zapisywania cennika:", err);
            const errorMsg = err.response?.data?.error || "Wystąpił błąd podczas zapisywania.";
            alert(errorMsg);
        }
    };

    if (loading) return <div style={{textAlign: 'center', padding: '100px', fontSize: '18px'}}>Wczytywanie cennika...</div>;

    return (
        <div style={styles.container}>
            
            {/* --- ZMODYFIKOWANY NAGŁÓWEK --- */}
            <div style={styles.header}>
                {isEditMode && (
                    <span 
                        className="material-symbols-outlined" 
                        style={styles.backArrow} 
                        onClick={() => navigate('/profile')}
                    >
                        arrow_back_ios
                    </span>
                )}
                
                <h1 style={styles.title}>
                    {isEditMode ? 'Edytuj cennik' : 'Dodaj cennik'}
                </h1>

                {/* Pomiń pokazujemy TYLKO przy rejestracji (gdy NIE ma isEditMode) */}
                {!isEditMode && (
                    <span style={styles.skip} onClick={() => navigate('/setup-classes')}>Pomiń &gt;</span>
                )}
                
                {/* Pusty element do balansowania flexa w trybie edycji */}
                {isEditMode && <div style={{width: '24px'}}></div>}
            </div>

            <div style={styles.card}>
                <button style={styles.addBtn} onClick={() => { setEditingIndex(null); setShowPopup(true); }}>
                    Dodaj pozycję do cennika +
                </button>
                <div style={{marginTop: '30px'}}>
                    <h3 style={styles.sectionLabel}>Pozycje w cenniku</h3>
                    {prices.length > 0 ? (
                        prices.map((p, i) => (
                            <div key={i} style={styles.priceItem}>
                                <span 
                                    onClick={() => setPrices(prices.filter((_, idx) => idx !== i))} 
                                    style={styles.deleteIcon}
                                >
                                    ✕
                                </span>
                                <span style={{flex: 1, marginLeft: '15px'}}>
                                    <strong>{p.name}</strong> | {p.price} zł
                                </span>
                                <span 
                                    className="material-symbols-outlined" 
                                    style={{fontSize: '20px', color: '#666', cursor: 'pointer'}}
                                    onClick={() => handleOpenEdit(i)}
                                >
                                    edit
                                </span>
                            </div>
                        ))
                    ) : (
                        <p style={{color: '#999', fontSize: '14px', textAlign: 'center'}}>Brak pozycji w cenniku. Dodaj pierwszą!</p>
                    )}
                </div>
            </div>

            <div style={styles.card}>
                <h3 style={styles.sectionLabel}>Akceptowane karty sportowe</h3>
                <div style={styles.checkGrid}>
                    {Object.keys(cardLabels).map(c => (
                        <label key={c} style={styles.checkLabel}>
                            <input 
                                type="checkbox" 
                                checked={cards[c]} 
                                style={styles.checkbox}
                                onChange={e => setCards({...cards, [c]: e.target.checked})} 
                            />
                            {cardLabels[c]}
                        </label>
                    ))}
                </div>
                <label style={styles.label}>Informacje o kartach (np. ewentualne dopłaty, kaucje)</label>
                <textarea 
                    style={styles.textarea} 
                    value={cards.info} 
                    placeholder="Wpisz dodatkowe informacje o akceptowanych kartach..."
                    onChange={e => setCards({...cards, info: e.target.value})} 
                />
            </div>

            <button style={styles.saveBtn} onClick={handleSave}>
                <span className="material-symbols-outlined">save</span> Zapisz cennik
            </button>

            {showPopup && <AddPricePopup 
                onClose={() => { setShowPopup(false); setEditingIndex(null); }} 
                onSave={handleSavePrice}
                initialData={editingIndex !== null ? prices[editingIndex] : null} 
            />}
        </div>
    );
};


const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    
    // STYLE NAGŁÓWKA
    header: { width: '100%', maxWidth: '750px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { fontSize: '32px', fontWeight: '400', color: '#333', margin: 0 },
    skip: { cursor: 'pointer', fontWeight: '600', color: '#666', fontSize: '15px' },
    backArrow: { fontSize: '24px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },

    card: { backgroundColor: 'white', width: '100%', maxWidth: '750px', padding: '40px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 4px 25px rgba(0,0,0,0.06)' },
    addBtn: { width: '100%', backgroundColor: '#7A33E3', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '16px', cursor: 'pointer', transition: '0.2s' },
    sectionLabel: { color: '#7A33E3', marginBottom: '20px', fontSize: '18px', fontWeight: '700' },
    priceItem: { backgroundColor: '#F1F3F5', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', marginBottom: '12px', fontWeight: '500', border: '1px solid #E9ECEF' },
    deleteIcon: { cursor: 'pointer', color: '#adb5bd', fontSize: '18px', fontWeight: 'bold', transition: '0.2s' },
    checkGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' },
    checkLabel: { display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: '#444', cursor: 'pointer' },
    checkbox: { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7A33E3' },
    label: { display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '14px', color: '#555' },
    textarea: { width: '100%', height: '120px', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '15px', fontSize: '14px', outline: 'none', resize: 'none' },
    saveBtn: { backgroundColor: '#7A33E3', color: 'white', padding: '16px 60px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: 'none' }
};

export default SetupPriceList;