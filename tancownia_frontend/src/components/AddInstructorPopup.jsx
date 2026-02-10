import { useState, useRef } from 'react';
import api from '../api';

//Odbieranie initialData (null przy dodawaniu, obiekt przy edycji)
const AddInstructorPopup = ({ onClose, onSave, initialData = null }) => {
    
    //Wypełnianie stanu danymi początkowymi (jeśli są)
    const [formData, setFormData] = useState({
        first_name: initialData?.first_name || '',
        pseudonym: initialData?.pseudonym || '',
        last_name: initialData?.last_name || '',
        instagram: initialData?.instagram || '',
        facebook: initialData?.facebook || '',
        photo: null
    });
    
    const [errors, setErrors] = useState({});
    
    // Ustawianie podglądu zdjęcia z backendu (jeśli istnieje)
    const [preview, setPreview] = useState(initialData?.photo || null);
    
    const fileInputRef = useRef(null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, photo: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const removePhoto = (e) => {
        e.stopPropagation();
        setFormData({ ...formData, photo: null });
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.first_name.trim()) newErrors.first_name = "Imię jest wymagane.";
        if (!formData.last_name.trim()) newErrors.last_name = "Nazwisko jest wymagane.";

        if (formData.instagram && !formData.instagram.includes('instagram.com')) {
            newErrors.instagram = "Link musi prowadzić do profilu na instagram.com";
        }
        if (formData.facebook && !formData.facebook.includes('facebook.com')) {
            newErrors.facebook = "Link musi prowadzić do profilu na facebook.com";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            // Dodawanie pola tylko jeśli ma wartość
            if (formData[key]) {
                data.append(key, formData[key]);
            }
        });

        try {
            let res;
            // Rozróżnianie Edycji (PATCH) od Dodawania (POST)
            if (initialData && initialData.id) {
                // EDYCJA
                res = await api.patch(`instructors/${initialData.id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Dodawanie nowego instruktora
                res = await api.post('instructors/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            onSave(res.data);
            onClose();
        } catch (err) {
            console.error("Błąd zapisu instruktora:", err.response?.data);
            if (err.response?.data) setErrors(err.response.data);
        }
    };

    return (
        <div style={s.overlay}>
            <div style={s.window}>
                <span style={s.close} onClick={onClose}>✕</span>
                {/* Zmiana tytułu w zależności od trybu */}
                <h2 style={s.title}>
                    {initialData ? 'Edytuj instruktora' : 'Dodaj nowego instruktora'}
                </h2>
                
                <div style={s.scrollArea}>
                    <div style={s.photoContainer} onClick={() => fileInputRef.current.click()}>
                        <input type="file" ref={fileInputRef} hidden onChange={handlePhotoChange} accept="image/*" />
                        
                        {preview ? (
                            <div style={s.imageWrapper}>
                                <img src={preview} style={s.photoCircle} alt="Preview" />
                                <div style={s.deleteBtn} onClick={removePhoto}>✕</div>
                            </div>
                        ) : (
                            <div style={s.placeholder}>
                                <span className="material-symbols-outlined" style={s.placeholderIcon}>person</span>
                                <span style={s.placeholderText}>Dodaj zdjęcie</span>
                            </div>
                        )}
                    </div>

                    <label style={s.label}>Imię*</label>
                    <input style={s.input} placeholder="Imię" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                    {errors.first_name && <span style={s.errorText}>{errors.first_name}</span>}

                    <label style={s.label}>Pseudonim</label>
                    <input style={s.input} placeholder="Pseudonim" value={formData.pseudonym} onChange={e => setFormData({...formData, pseudonym: e.target.value})} />

                    <label style={s.label}>Nazwisko*</label>
                    <input style={s.input} placeholder="Nazwisko" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                    {errors.last_name && <span style={s.errorText}>{errors.last_name}</span>}

                    <label style={s.label}>Link do profilu na Instagramie</label>
                    <input style={s.input} placeholder="instagram.com/użytkownik" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} />
                    {errors.instagram && <span style={s.errorText}>{errors.instagram}</span>}

                    <label style={s.label}>Link do profilu na Facebooku</label>
                    <input style={s.input} placeholder="facebook.com/użytkownik" value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} />
                    {errors.facebook && <span style={s.errorText}>{errors.facebook}</span>}
                </div>

                <button style={s.submitBtn} onClick={handleSave}>
                    {initialData ? 'Zapisz zmiany' : 'Dodaj instruktora'}
                </button>
            </div>
        </div>
    );
};

const s = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000 },
    window: { backgroundColor: 'white', width: '95%', maxWidth: '450px', padding: '30px', borderRadius: '30px', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
    scrollArea: { overflowY: 'auto', paddingRight: '10px' },
    close: { position: 'absolute', top: '20px', right: '20px', fontSize: '24px', cursor: 'pointer', color: '#666' },
    title: { textAlign: 'center', fontWeight: '800', marginBottom: '20px', fontSize: '22px' },
    photoContainer: { width: '120px', height: '120px', margin: '0 auto 20px', cursor: 'pointer', position: 'relative' },
    placeholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd' },
    placeholderIcon: { fontSize: '40px', color: '#aaa' },
    placeholderText: { fontSize: '10px', color: '#aaa', fontWeight: '600' },
    imageWrapper: { width: '100%', height: '100%', position: 'relative' },
    photoCircle: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
    deleteBtn: { position: 'absolute', top: '0', right: '0', backgroundColor: '#333', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', border: '2px solid white' },
    label: { display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '5px', marginTop: '15px', color: '#444' },
    input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '12px', fontSize: '14px', outlineColor: '#7A33E3' },
    errorText: { color: '#ff4d4f', fontSize: '11px', fontWeight: '600', marginTop: '4px', display: 'block' },
    submitBtn: { backgroundColor: '#7A33E3', color: 'white', padding: '16px', borderRadius: '15px', border: 'none', fontWeight: '800', fontSize: '16px', marginTop: '30px', cursor: 'pointer' }
};

export default AddInstructorPopup;