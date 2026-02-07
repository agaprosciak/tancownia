import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const SetupSchoolInfo = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const logoInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sprawdzamy czy weszliśmy z profilu
    const isEditMode = location.state?.fromProfile;

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', street: '', build_no: '', postal_code: '',
        city: '', website: '', instagram: '', facebook: '', description: '',
        rules: '', default_registration_info_link: '', county: '', state: '',
        latitude: '', longitude: ''
    });

    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [gallery, setGallery] = useState([]); 
    const [deletedImages, setDeletedImages] = useState([]); 

    useEffect(() => {
        api.get('schools/my_school/')
            .then(res => {
                if (res.data) {
                    setIsUpdating(true);
                    
                    const fields = {};
                    Object.keys(formData).forEach(key => {
                        fields[key] = res.data[key] || '';
                    });
                    setFormData(fields);
                    
                    if (res.data.logo) setLogoPreview(res.data.logo);
                    
                    if (res.data.images) {
                        const existingImages = res.data.images.map(img => ({
                            id: img.id,
                            preview: img.image,
                            isExisting: true 
                        }));
                        setGallery(existingImages);
                    }
                }
            })
            .catch(() => console.log("Brak szkoły, tworzymy nową."))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
        }
        if (logoInputRef.current) logoInputRef.current.value = ""; 
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        if (gallery.length + files.length > 9) {
            setError("Możesz dodać maksymalnie 9 zdjęć.");
            return;
        }
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            isExisting: false 
        }));
        setGallery([...gallery, ...newImages]);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
    };

    const removeImage = (index) => {
        const imageToRemove = gallery[index];
        if (imageToRemove.isExisting) {
            setDeletedImages([...deletedImages, imageToRemove.id]);
        }
        setGallery(gallery.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.instagram && (!formData.instagram.toLowerCase().includes('instagram.com') || !formData.instagram.toLowerCase().includes('http'))) {
            setError("Link do Instagrama musi być pełnym adresem (zawierać http oraz instagram.com)");
            return;
        }
        if (formData.facebook && (!formData.facebook.toLowerCase().includes('facebook.com') || !formData.facebook.toLowerCase().includes('http'))) {
            setError("Link do Facebooka musi być pełnym adresem (zawierać http oraz facebook.com)");
            return;
        }
        const phoneRegex = /^[0-9\s+]*$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            setError("Numer telefonu może zawierać tylko cyfry, spacje i znak +");
            return;
        }
        
        let geoData = { lat: formData.latitude, lon: formData.longitude, state: formData.state, county: formData.county };
        const { street, build_no, city, postal_code } = formData;
        const cleanBuildNo = build_no.split('/')[0].trim();
        const query = `${street} ${cleanBuildNo}, ${postal_code} ${city}, Poland`;
        try {
            const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`,
                { headers: { 'User-Agent': 'Tancownia-App-v1' } }
            );
            const geoResult = await geoResponse.json();
            if (geoResult && geoResult.length > 0) {
                const res = geoResult[0];
                geoData = {
                    lat: parseFloat(res.lat).toFixed(6),
                    lon: parseFloat(res.lon).toFixed(6),
                    state: res.address.state || res.address.province || '',
                    county: res.address.county || res.address.city || ''
                };
            }
        } catch (err) { console.error(err); }

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key].trim()));

        if (geoData.lat) data.set('latitude', geoData.lat);
        if (geoData.lon) data.set('longitude', geoData.lon);
        data.set('state', geoData.state);
        data.set('county', geoData.county);

        if (logo) data.append('logo', logo);
        
        gallery.forEach(img => {
            if (!img.isExisting && img.file) {
                data.append('uploaded_images', img.file);
            }
        });

        deletedImages.forEach(id => {
            data.append('deleted_images', id);
        });

        try {
            const method = isUpdating ? 'put' : 'post';
            const url = isUpdating ? 'schools/my_school/' : 'schools/';
            
            const response = await api[method](url, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.status === 201 || response.status === 200) {
                if (isEditMode) {
                    navigate('/profile');
                } else {
                    navigate('/setup-rooms');
                }
            }
        } catch (err) {
            const serverMsg = err.response?.data ? Object.values(err.response.data).flat()[0] : "Błąd serwera.";
            setError(serverMsg);
        }
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Wczytywanie informacji...</div>;

    return (
        <div style={styles.container}>
            {/* --- ZMODYFIKOWANY NAGŁÓWEK --- */}
            <div style={styles.headerRow}>
                {isEditMode && (
                    <span 
                        className="material-symbols-outlined" 
                        style={styles.backArrow} 
                        onClick={() => navigate('/profile')}
                    >
                        arrow_back_ios
                    </span>
                )}
                <h1 style={styles.mainTitle}>
                    {isUpdating ? 'Edytuj informacje o szkole' : 'Wypełnij informacje o swojej szkole'}
                </h1>
                {isEditMode && <div style={{width: '24px'}}></div>}
            </div>

            <div style={styles.card}>
                <form onSubmit={handleSubmit}>
                    {/* ... SEKCJE FORMULARZA (BEZ ZMIAN) ... */}
                    <div style={styles.section}>
                        <label style={styles.label}>Nazwa szkoły*</label>
                        <input style={styles.input} name="name" value={formData.name} required onChange={handleChange} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '15px' }}>
                            <button type="button" onClick={() => logoInputRef.current.click()} style={styles.uniformUploadBtn}>
                                <span className="material-symbols-outlined">image</span> Wybierz logo
                            </button>
                            <input type="file" hidden ref={logoInputRef} onChange={handleLogoChange} />
                            {logoPreview ? (
                                <img src={logoPreview} style={styles.logoPreview} alt="Logo" />
                            ) : (
                                <div style={styles.logoCirclePlaceholder}><span className="material-symbols-outlined" style={{color: '#ccc'}}>image</span></div>
                            )}
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={styles.col}><label style={styles.label}>E-mail*</label><input style={styles.input} name="email" value={formData.email} type="email" required onChange={handleChange} /></div>
                        <div style={styles.col}><label style={styles.label}>Telefon</label><input style={styles.input} name="phone" value={formData.phone} onChange={handleChange} /></div>
                    </div>

                    <div style={styles.row}>
                        <div style={{flex: 2}}><label style={styles.label}>Ulica*</label><input style={styles.input} name="street" value={formData.street} required onChange={handleChange} /></div>
                        <div style={{flex: 1}}><label style={styles.label}>Nr*</label><input style={styles.input} name="build_no" value={formData.build_no} placeholder="np. 12 lub 12/4" required onChange={handleChange} /></div>
                    </div>
                    <div style={styles.row}>
                        <div style={styles.col}><label style={styles.label}>Kod pocztowy*</label><input style={styles.input} name="postal_code" value={formData.postal_code} required onChange={handleChange} /></div>
                        <div style={styles.col}><label style={styles.label}>Miejscowość*</label><input style={styles.input} name="city" value={formData.city} required onChange={handleChange} /></div>
                    </div>

                    <div style={styles.section}>
                        <label style={styles.label}>Strona internetowa</label>
                        <input style={styles.input} type="url" name="website" value={formData.website} placeholder="Link do strony" onChange={handleChange} />
                        <div style={styles.row}>
                            <div style={styles.col}><label style={styles.label}>Instagram</label><input style={styles.input} name="instagram" value={formData.instagram} placeholder="http://instagram.com/twoja_szkola" onChange={handleChange} /></div>
                            <div style={styles.col}><label style={styles.label}>Facebook</label><input style={styles.input} name="facebook" value={formData.facebook} placeholder="http://facebook.com/twoja_szkola" onChange={handleChange} /></div>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <label style={styles.label}>Opis szkoły*</label>
                        <textarea style={styles.textarea} name="description" value={formData.description} required onChange={handleChange} />
                        <label style={styles.label}>Regulamin</label>
                        <textarea style={styles.textarea} name="rules" value={formData.rules} onChange={handleChange} placeholder="Link lub tekst" />
                        <label style={styles.label}>Zapisy</label>
                        <textarea style={styles.textarea} name="default_registration_info_link" value={formData.default_registration_info_link} onChange={handleChange} placeholder="Informacje o zapisach" />
                    </div>

                    <div style={styles.section}>
                        <label style={styles.label}>Galeria zdjęć (max 9)</label>
                        <input type="file" multiple hidden ref={fileInputRef} onChange={handleGalleryChange} />
                        <button type="button" onClick={() => fileInputRef.current.click()} style={{...styles.uniformUploadBtn, width: '100%', justifyContent: 'center', marginBottom: '15px'}} disabled={gallery.length >= 9}>
                            <span className="material-symbols-outlined">collections</span> Wybierz zdjęcia
                        </button>
                        <div style={styles.photoGrid}>
                            {gallery.map((img, i) => (
                                <div key={i} style={styles.photoWrapper}>
                                    <img src={img.preview} style={styles.photoImg} alt="Gallery" />
                                    <button type="button" onClick={() => removeImage(i)} style={styles.removeBtn}>X</button>
                                </div>
                            ))}
                            {[...Array(Math.max(0, 9 - gallery.length))].map((_, i) => (
                                <div key={i} style={styles.photoPlaceholder} onClick={() => gallery.length < 9 && fileInputRef.current.click()}>
                                    <span className="material-symbols-outlined">image</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <div style={styles.errorText}>{error}</div>}

                    <button type="submit" style={styles.button}>{isUpdating ? 'Zapisz zmiany' : 'Zapisz i przejdź dalej'}</button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    
    // DODANE STYLE NAGŁÓWKA
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '800px', marginBottom: '30px' },
    backArrow: { fontSize: '24px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },
    mainTitle: { fontWeight: '300', fontSize: '28px', margin: 0, textAlign: 'center' },

    card: { backgroundColor: 'white', maxWidth: '800px', width: '100%', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    section: { marginBottom: '25px' },
    label: { display: 'block', fontSize: '14px', marginBottom: '8px', color: '#434343', fontWeight: '500' },
    input: { width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '6px', marginBottom: '10px' },
    textarea: { width: '100%', height: '100px', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '6px', marginBottom: '15px', resize: 'vertical' },
    row: { display: 'flex', gap: '15px' },
    col: { flex: 1 },
    uniformUploadBtn: { padding: '10px 20px', backgroundColor: 'white', color: '#7A33E3', border: '1px solid #7A33E3', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' },
    logoPreview: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%' },
    logoCirclePlaceholder: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F1F3F5', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
    photoWrapper: { position: 'relative', aspectRatio: '16/9' },
    photoImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' },
    photoPlaceholder: { aspectRatio: '16/9', backgroundColor: '#F1F3F5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', cursor: 'pointer', border: '1px dashed #ccc' },
    removeBtn: { position: 'absolute', top: '5px', right: '5px', background: 'rgba(255, 0, 0, 0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px' },
    errorText: { color: '#ff4d4f', fontSize: '12px', marginBottom: '12px', fontWeight: '500', textAlign: 'center' },
    button: { width: '100%', backgroundColor: '#7A33E3', color: 'white', padding: '18px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};

export default SetupSchoolInfo;