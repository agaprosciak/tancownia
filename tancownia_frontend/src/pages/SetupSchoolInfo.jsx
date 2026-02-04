import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const SetupSchoolInfo = () => {
    const navigate = useNavigate();
    const logoInputRef = useRef(null);
    const fileInputRef = useRef(null);

    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '', 
        street: '',
        build_no: '',
        postal_code: '',
        city: '',
        website: '',
        instagram: '',
        facebook: '',
        description: '',
        rules: '',
        default_registration_info_link: '',
        county: '',   
        state: '',    
        latitude: '',
        longitude: ''
    });

    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [gallery, setGallery] = useState([]); 

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
            preview: URL.createObjectURL(file)
        }));
        setGallery([...gallery, ...newImages]);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
    };

    const removeImage = (index) => {
        setGallery(gallery.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // --- 1. WALIDACJA SOCIAL MEDIA (http + domena) ---
        if (formData.instagram && (!formData.instagram.toLowerCase().includes('instagram.com') || !formData.instagram.toLowerCase().includes('http'))) {
            setError("Link do Instagrama musi być pełnym adresem (zawierać http oraz instagram.com)");
            return;
        }
        if (formData.facebook && (!formData.facebook.toLowerCase().includes('facebook.com') || !formData.facebook.toLowerCase().includes('http'))) {
            setError("Link do Facebooka musi być pełnym adresem (zawierać http oraz facebook.com)");
            return;
        }

        // --- 2. WALIDACJA TELEFONU ---
        const phoneRegex = /^[0-9\s+]*$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            setError("Numer telefonu może zawierać tylko cyfry, spacje i znak +");
            return;
        }
        
        // --- 3. GEOKODOWANIE W TLE ---
        let geoData = { lat: '', lon: '', state: '', county: '' };
        const { street, build_no, city, postal_code } = formData;
        const query = `${street} ${build_no}, ${postal_code} ${city}, Poland`;
        
        try {
            const geoResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`,
                { headers: { 'User-Agent': 'Tancownia-App-v1' } }
            );
            const geoResult = await geoResponse.json();
            
            if (!geoResult || geoResult.length === 0) {
                setError(`Nie znaleźliśmy adresu: ${street} ${build_no}. Sprawdź dane adresowe.`);
                return; 
            }

            const res = geoResult[0];
            geoData = {
                lat: parseFloat(res.lat).toFixed(6),
                lon: parseFloat(res.lon).toFixed(6),
                state: res.address.state || res.address.province || '',
                county: res.address.county || res.address.city || ''
            };
        } catch (err) { console.error(err); }

        // --- 4. WYSYŁKA ---
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key].trim()));

        if (geoData.lat) data.set('latitude', geoData.lat);
        if (geoData.lon) data.set('longitude', geoData.lon);
        data.set('state', geoData.state);
        data.set('county', geoData.county);

        if (logo) data.append('logo', logo);
        gallery.forEach(img => data.append('uploaded_images', img.file));

        try {
            const response = await api.post('schools/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.status === 201) navigate('/setup-rooms');
        } catch (err) {
            const serverMsg = err.response?.data ? Object.values(err.response.data).flat()[0] : "Błąd serwera.";
            setError(serverMsg);
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.mainTitle}>Wypełnij informacje o swojej szkole</h1>
            <div style={styles.card}>
                <form onSubmit={handleSubmit}>
                    
                    <div style={styles.section}>
                        <label style={styles.label}>Nazwa szkoły*</label>
                        <input style={styles.input} name="name" required onChange={handleChange} />
                        
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
                        <div style={styles.col}><label style={styles.label}>E-mail*</label><input style={styles.input} name="email" type="email" required onChange={handleChange} /></div>
                        <div style={styles.col}><label style={styles.label}>Telefon</label><input style={styles.input} name="phone" onChange={handleChange} /></div>
                    </div>

                    <div style={styles.row}>
                        <div style={{flex: 2}}><label style={styles.label}>Ulica*</label><input style={styles.input} name="street" required onChange={handleChange} /></div>
                        <div style={{flex: 1}}><label style={styles.label}>Nr*</label><input style={styles.input} name="build_no" required onChange={handleChange} /></div>
                    </div>
                    <div style={styles.row}>
                        <div style={styles.col}><label style={styles.label}>Kod pocztowy*</label><input style={styles.input} name="postal_code" required onChange={handleChange} /></div>
                        <div style={styles.col}><label style={styles.label}>Miejscowość*</label><input style={styles.input} name="city" required onChange={handleChange} /></div>
                    </div>

                    <div style={styles.section}>
                        <label style={styles.label}>Strona internetowa</label>
                        <input style={styles.input} type="url" name="website" placeholder="Link do strony" onChange={handleChange} />
                        <div style={styles.row}>
                            <div style={styles.col}><label style={styles.label}>Instagram</label><input style={styles.input} name="instagram" placeholder="http://instagram.com/twoja_szkola" onChange={handleChange} /></div>
                            <div style={styles.col}><label style={styles.label}>Facebook</label><input style={styles.input} name="facebook" placeholder="http://facebook.com/twoja_szkola" onChange={handleChange} /></div>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <label style={styles.label}>Opis szkoły*</label>
                        <textarea style={styles.textarea} name="description" required onChange={handleChange} />
                        <label style={styles.label}>Regulamin</label>
                        <textarea style={styles.textarea} name="rules" onChange={handleChange} placeholder="Link lub tekst" />
                        <label style={styles.label}>Zapisy</label>
                        <textarea style={styles.textarea} name="default_registration_info_link" onChange={handleChange} placeholder="Informacje o zapisach" />
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

                    <button type="submit" style={styles.button}>Zapisz i przejdź dalej</button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', padding: '40px 20px' },
    card: { backgroundColor: 'white', maxWidth: '800px', margin: '0 auto', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    mainTitle: { textAlign: 'center', fontWeight: '300', marginBottom: '40px', fontSize: '28px' },
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