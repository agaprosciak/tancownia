import { useState, useEffect } from 'react';

const AddPricePopup = ({ onClose, onSave, initialData }) => {
    const [type, setType] = useState('pass');
    const [fieldErrors, setFieldErrors] = useState({});
    
    const [formData, setFormData] = useState({
        name: '',
        duration_minutes: '',
        entries_per_week: '',
        unlimited: false,
        price: '',
        description: ''
    });


    useEffect(() => {
        if (initialData) {
            setType(initialData.entry_type || initialData.type || 'pass');
            setFormData({
                name: initialData.name || '',
                duration_minutes: initialData.duration_minutes || '',
                entries_per_week: initialData.entries_per_week || '',
                unlimited: initialData.entries_per_week === null && (initialData.entry_type === 'pass' || initialData.type === 'pass'),
                price: initialData.price || '',
                description: initialData.description || ''
            });
        }
    }, [initialData]);

    const validate = () => {
        let errors = {};
        
        // Nazwa
        if (!formData.name.trim()) errors.name = "Podaj nazwę.";
        
        // Czas trwania
        const durNum = parseInt(formData.duration_minutes);
        if (!formData.duration_minutes) {
            errors.duration_minutes = "Podaj czas trwania.";
        } else if (isNaN(durNum) || durNum <= 0) {
            errors.duration_minutes = "Czas musi być dodatni.";
        }
        
        // Cena
        const priceNum = parseFloat(formData.price);
        if (!formData.price) {
            errors.price = "Cena jest wymagana.";
        } else if (isNaN(priceNum) || priceNum <= 0) {
            errors.price = "Cena musi być dodatnia.";
        } else if (priceNum >= 1000000) { 
            errors.price = "Kwota zbyt wysoka.";
        }

        // Wejścia (Tylko dla karnetu i nie-unlimited)
        if (type === 'pass' && !formData.unlimited) {
            const entNum = parseInt(formData.entries_per_week);
            if (!formData.entries_per_week) {
                errors.entries_per_week = "Podaj ilość wejść.";
            } else if (isNaN(entNum) || entNum <= 0) {
                errors.entries_per_week = "Musi być min. 1.";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAdd = () => {
        if (validate()) {
            const finalData = {
                ...formData,
                entry_type: type,
                entries_per_week: (type === 'single' || formData.unlimited) ? null : formData.entries_per_week
            };
            onSave(finalData);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.window}>
                <span style={styles.close} onClick={onClose}>✕</span>
                <h2 style={styles.title}>{initialData ? 'Edytuj pozycję' : 'Dodaj pozycję do cennika'}</h2>
                
                <div style={styles.toggleGroup}>
                    <button 
                        style={{...styles.toggle, backgroundColor: type === 'pass' ? 'white' : 'transparent', color: type === 'pass' ? '#7A33E3' : 'white'}}
                        onClick={() => { setType('pass'); setFieldErrors({}); }}
                    >
                        Karnet
                    </button>
                    <button 
                        style={{...styles.toggle, backgroundColor: type === 'single' ? 'white' : 'transparent', color: type === 'single' ? '#7A33E3' : 'white'}}
                        onClick={() => { setType('single'); setFieldErrors({}); }}
                    >
                        1 wejście
                    </button>
                </div>

                <label style={styles.label}>
                    {type === 'pass' 
                        ? 'Nazwa karnetu (np. Karnet miesięczny na zajęcia projektowe)*' 
                        : 'Nazwa wejściówki (np. Pojedyncze wejście na zajęcia open)*'}
                </label>
                <input 
                    style={{...styles.input, borderColor: fieldErrors.name ? '#ff4d4f' : '#E0E0E0'}} 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Wpisz nazwę..."
                />
                {fieldErrors.name && <span style={styles.errorText}>{fieldErrors.name}</span>}

                <div style={{display: 'flex', gap: '20px', marginTop: '15px'}}>
                    <div style={{flex: 1}}>
                        <label style={styles.label}>Długość zajęć (min)*</label>
                        <input 
                            type="number"
                            min="1"
                            style={{...styles.input, borderColor: fieldErrors.duration_minutes ? '#ff4d4f' : '#E0E0E0'}} 
                            value={formData.duration_minutes}
                            onChange={e => setFormData({...formData, duration_minutes: e.target.value})} 
                        />
                        {fieldErrors.duration_minutes && <span style={styles.errorText}>{fieldErrors.duration_minutes}</span>}
                    </div>

                    {type === 'pass' && (
                        <div style={{flex: 1}}>
                            <label style={styles.label}>Ilość wejść/tydz.*</label>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <input 
                                    type="number"
                                    min="1"
                                    disabled={formData.unlimited}
                                    style={{...styles.input, flex: 1, borderColor: fieldErrors.entries_per_week ? '#ff4d4f' : '#E0E0E0'}} 
                                    value={formData.entries_per_week}
                                    onChange={e => setFormData({...formData, entries_per_week: e.target.value})} 
                                />
                                <label style={styles.checkLabel}>
                                    <input type="checkbox" checked={formData.unlimited} onChange={e => setFormData({...formData, unlimited: e.target.checked})} /> Bez limitu
                                </label>
                            </div>
                            {fieldErrors.entries_per_week && <span style={styles.errorText}>{fieldErrors.entries_per_week}</span>}
                        </div>
                    )}
                </div>

                <div style={{marginTop: '15px'}}>
                    <label style={styles.label}>Cena (w zł)*</label>
                    <input 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={{...styles.input, width: '35%', borderColor: fieldErrors.price ? '#ff4d4f' : '#E0E0E0'}} 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})} 
                    />
                    {fieldErrors.price && <div style={styles.errorText}>{fieldErrors.price}</div>}
                </div>

                <div style={{marginTop: '15px'}}>
                    <label style={styles.label}>Szczegóły</label>
                    <textarea 
                        placeholder="Dodatkowe informacje..."
                        style={{...styles.input, height: '80px', resize: 'none'}} 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                </div>

                <button style={styles.submitBtn} onClick={handleAdd}>
                    {initialData ? 'Zapisz zmiany' : 'Dodaj pozycję do cennika'}
                </button>
            </div>
        </div>
    );
};


const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
    window: { backgroundColor: 'white', width: '90%', maxWidth: '550px', padding: '40px', borderRadius: '25px', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
    close: { position: 'absolute', top: '20px', right: '20px', fontSize: '24px', cursor: 'pointer', color: '#666' },
    title: { textAlign: 'center', marginBottom: '25px', fontSize: '22px', fontWeight: '600', color: '#333' },
    toggleGroup: { backgroundColor: '#7A33E3', padding: '5px', borderRadius: '12px', display: 'flex', marginBottom: '25px' },
    toggle: { flex: 1, border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', transition: '0.3s' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#444' },
    input: { width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '10px', fontSize: '14px', outline: 'none' },
    checkLabel: { fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', cursor: 'pointer' },
    errorText: { color: '#ff4d4f', fontSize: '11px', fontWeight: '500', marginTop: '4px', display: 'block' },
    submitBtn: { width: '100%', marginTop: '30px', backgroundColor: '#7A33E3', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '16px', cursor: 'pointer', transition: '0.2s' }
};

export default AddPricePopup;