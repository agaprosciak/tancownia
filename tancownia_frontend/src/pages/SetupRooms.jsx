import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const SetupRooms = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [onlyOneRoom, setOnlyOneRoom] = useState(false);
    const [rooms, setRooms] = useState([{ name: '' }]);
    
    const isEditMode = location.state?.fromProfile;

    useEffect(() => {
        api.get('schools/my_school/')
            .then(res => {
                const existingFloors = res.data.floors;
                if (existingFloors && existingFloors.length > 0) {
                    if (existingFloors.length === 1 && existingFloors[0].name === 'Główna sala') {
                        setOnlyOneRoom(true);
                    } else {
                        setRooms(existingFloors.map(f => ({ name: f.name })));
                    }
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleRoomChange = (index, value) => {
        const newRooms = [...rooms];
        newRooms[index].name = value;
        setRooms(newRooms);
        if (error) setError('');
    };

    const addRoomField = () => {
        if (rooms.length < 10) setRooms([...rooms, { name: '' }]);
    };

    const removeRoomField = (index) => {
        if (rooms.length > 1) setRooms(rooms.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');

        let roomsToSave = [];
        if (onlyOneRoom) {
            roomsToSave = [{ name: 'Główna sala' }];
        } else {
            roomsToSave = rooms.filter(r => r.name.trim() !== '');
        }

        if (roomsToSave.length === 0) {
            setError("Podaj nazwę sali lub zaznacz opcję 'Posiadam tylko jedną salę'.");
            return;
        }

        // --- WALIDACJA LIMITU 100 ZNAKÓW ---
        const tooLongRoom = roomsToSave.find(r => r.name.length > 100);
        if (tooLongRoom) {
            setError(`Nazwa sali "${tooLongRoom.name.substring(0, 15)}..." jest za długa o ${tooLongRoom.name.length - 100} znaków! (Max: 100)`);
            return;
        }

        try {
            const response = await api.post('dancefloors/create_multiple/', { rooms: roomsToSave });
            if (response.status === 201) {
                if (isEditMode) {
                    navigate('/profile');
                } else {
                    navigate('/setup-price');
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || "Błąd podczas synchronizacji sal.");
        }
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Wczytywanie Twoich sal...</div>;

    return (
        <div style={styles.container}>
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
                    {isEditMode ? 'Edytuj sale' : 'Podaj sale w swojej szkole'}
                </h1>
                {isEditMode && <div style={{width: '24px'}}></div>}
            </div>

            <div style={styles.card}>
                <form onSubmit={handleSubmit}>
                    <div style={styles.checkboxContainer} onClick={() => {
                        setOnlyOneRoom(!onlyOneRoom);
                        setError(''); // Reset błędu przy zmianie trybu
                    }}>
                        <div style={{...styles.checkbox, backgroundColor: onlyOneRoom ? '#7A33E3' : '#E0E0E0'}}>
                            {onlyOneRoom && <span className="material-symbols-outlined" style={{color: 'white', fontSize: '18px'}}>check</span>}
                        </div>
                        <span style={styles.checkboxLabel}>Posiadam tylko jedną salę taneczną</span>
                    </div>

                    {!onlyOneRoom && (
                        <div style={{marginTop: '20px'}}>
                            <p style={styles.infoText}>Jeżeli nie posiadasz tylko jednej sali, dodaj sale poniżej:</p>
                            {rooms.map((room, index) => (
                                <div key={index} style={styles.inputGroup}>
                                    <div style={{flex: 1}}>
                                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                                            <label style={styles.label}>Nazwa sali*</label>
                                            {/* LICZNIK ZNAKÓW DLA KAŻDEJ SALI */}
                                            <span style={{ 
                                                fontSize: '11px', 
                                                color: room.name.length > 100 ? '#ff4d4f' : '#888',
                                                fontWeight: room.name.length > 100 ? '700' : '400'
                                            }}>
                                                {room.name.length}/100
                                            </span>
                                        </div>
                                        <input 
                                            style={{
                                                ...styles.input, 
                                                borderColor: room.name.length > 100 ? '#ff4d4f' : '#E0E0E0'
                                            }} 
                                            value={room.name}
                                            onChange={(e) => handleRoomChange(index, e.target.value)}
                                            placeholder="np. Sala Lustrzana"
                                            required={!onlyOneRoom}
                                        />
                                    </div>
                                    {rooms.length > 1 && (
                                        <button type="button" onClick={() => removeRoomField(index)} style={styles.deleteBtn}>
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={addRoomField} style={styles.addBtn}>
                                Dodaj kolejną salę <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>
                    )}
                    {error && (
                        <div style={{
                            ...styles.errorText, 
                            backgroundColor: '#fff2f0', 
                            padding: '10px', 
                            borderRadius: '6px', 
                            border: '1px solid #ffccc7'
                        }}>
                            {error}
                        </div>
                    )}
                </form>
            </div>
            <div style={styles.saveContainer}>
                <button onClick={handleSubmit} style={styles.saveBtn}>
                    <span className="material-symbols-outlined">save</span> Zapisz sale
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '600px', marginBottom: '30px' },
    backArrow: { fontSize: '24px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },
    mainTitle: { fontWeight: '300', fontSize: '28px', margin: 0, textAlign: 'center' },
    card: { backgroundColor: 'white', width: '100%', maxWidth: '600px', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    checkboxContainer: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '10px' },
    checkbox: { width: '22px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    checkboxLabel: { fontSize: '16px', color: '#333', fontWeight: '500' },
    infoText: { fontSize: '15px', fontWeight: '700', marginBottom: '20px', color: '#000' },
    inputGroup: { display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '20px' },
    label: { display: 'block', fontSize: '14px', margin: 0, color: '#434343', fontWeight: '600' },
    input: { width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '6px', boxSizing: 'border-box' },
    deleteBtn: { background: 'none', border: 'none', color: '#434343', cursor: 'pointer', paddingBottom: '10px' },
    addBtn: { width: '100%', marginTop: '10px', padding: '12px', backgroundColor: '#7A33E3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: '600' },
    errorText: { color: '#ff4d4f', fontSize: '13px', marginTop: '15px', textAlign: 'center', fontWeight: '600' },
    saveContainer: { marginTop: '30px', width: '100%', maxWidth: '250px' },
    saveBtn: { width: '100%', backgroundColor: '#7A33E3', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '18px' }
};

export default SetupRooms;