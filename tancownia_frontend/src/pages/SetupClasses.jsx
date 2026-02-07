import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import AddInstructorPopup from '../components/AddInstructorPopup';
import AddClassPopup from '../components/AddClassPopup';

const SetupClasses = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [rooms, setRooms] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [classes, setClasses] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [stylesList, setStylesList] = useState([]); 
    const [newInstId, setNewInstId] = useState(null); 
    
    // Sprawdzamy czy edycja z profilu
    const isEditMode = location.state?.fromProfile;

    const [classPopupType, setClassPopupType] = useState(null);
    const [editingClass, setEditingClass] = useState(null);
    const [showInstructorPopup, setShowInstructorPopup] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // 1. Pobieramy sale
            const schoolRes = await api.get('schools/my_school/');
            let allFloors = schoolRes.data.floors;

            // 2. Pobieramy zajęcia
            const classesRes = await api.get('classes/');
            const fetchedClasses = classesRes.data;
            setClasses(fetchedClasses);

            // 3. Sprawdzamy czy są "sieroty" (bez sali)
            if (fetchedClasses.some(c => c.floor === null)) {
                allFloors = [...allFloors, { id: 'no_room', name: 'Bez sali' }];
            }
            
            setRooms(allFloors);

            if (allFloors.length > 0 && !activeRoomId) {
                setActiveRoomId(allFloors[0].id);
            }
            
            const instRes = await api.get('instructors/');
            setInstructors(instRes.data);

            const stylesRes = await api.get('styles/');
            setStylesList(stylesRes.data);

        } catch (err) {
            console.error("Błąd pobierania danych", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`classes/${id}/`);
            setClasses(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error("Nie udało się usunąć", err);
        }
    };

    const handleEdit = (cls) => {
        setEditingClass(cls);
        setClassPopupType(cls.periodic ? 'regular' : 'onetime');
    };

    const handleClosePopup = () => {
        setClassPopupType(null);
        setEditingClass(null);
        setNewInstId(null);
    };

    // --- HELPERY ---
    const getStyleName = (styleData) => {
        if (!styleData) return '';
        if (typeof styleData === 'string' && isNaN(styleData)) return styleData;
        const found = stylesList.find(s => String(s.id) === String(styleData));
        return found ? found.style_name : 'Nieznany styl';
    };

    const formatInstructors = (ids) => {
        if (!ids || ids.length === 0) return '';
        return ids.map(id => {
            const instId = typeof id === 'object' ? id.id : id;
            const inst = instructors.find(i => i.id === instId);
            return inst ? inst.first_name : ''; 
        }).join(', ');
    };

    const formatAge = (min, max) => {
        if (!max) return `${min}+ lat`;
        return `${min}-${max} lat`;
    };

    const formatLevel = (lvl) => {
        const map = {
            'OPEN': 'Open', 'BEGINNER': 'Od podstaw', 'BASIC': 'Początkujący',
            'INTERMEDIATE': 'Średniozaaw.', 'ADVANCED': 'Zaawansowany', 'PRO': 'Profesjonalny'
        };
        return map[lvl] || lvl;
    };

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA', 'NIEDZIELA'];

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
                    {isEditMode ? 'Edytuj zajęcia' : 'Dodaj zajęcia'}
                </h1>

                {/* Pomiń pokazujemy TYLKO przy rejestracji */}
                {!isEditMode && (
                    <div style={styles.skipBtnLink} onClick={() => navigate('/profile')}>
                        Pomiń {'>'}
                    </div>
                )}

                {/* Pusty element dla RWD w trybie edycji */}
                {isEditMode && <div style={{width: '24px'}}></div>}
            </div>

            <div style={styles.sectionCard}>
                <h2 style={styles.sectionHeader}>Dodaj zajęcia do stałego grafiku</h2>
                <button style={styles.mainAddBtn} onClick={() => setClassPopupType('regular')}>Dodaj zajęcia +</button>

                <h3 style={styles.subHeader}>Podgląd grafiku:</h3>
                <div style={styles.tabs}>
                    {rooms.map(r => (
                        <button 
                            key={r.id} 
                            style={{
                                ...styles.tab, 
                                backgroundColor: activeRoomId === r.id ? (r.id === 'no_room' ? '#ff4d4f' : '#7A33E3') : '#eee', 
                                color: activeRoomId === r.id ? 'white' : '#333'
                            }}
                            onClick={() => setActiveRoomId(r.id)}
                        >
                            {r.name}
                        </button>
                    ))}
                </div>

                <div style={styles.gridWrapper}>
                    <div style={styles.grid}>
                        {days.map((day, idx) => (
                            <div key={day} style={styles.dayCol}>
                                <div style={styles.dayHeader}>{dayLabels[idx]}</div>
                                {classes.filter(c => {
                                    // FILTROWANIE: Dzień + Cykliczne + (Sala normalna LUB Sala "Bez sali")
                                    const isDay = c.day_of_week === day;
                                    const isPeriodic = c.periodic;
                                    
                                    // Jeśli wybrano zakładkę "Bez sali" (id='no_room'), szukamy nulli.
                                    // Jeśli wybrano normalną salę, szukamy po ID.
                                    const isRoomMatch = activeRoomId === 'no_room' 
                                        ? c.floor === null 
                                        : c.floor === activeRoomId;

                                    return isDay && isPeriodic && isRoomMatch;
                                }).length > 0 ? (
                                    classes.filter(c => {
                                        const isDay = c.day_of_week === day;
                                        const isPeriodic = c.periodic;
                                        const isRoomMatch = activeRoomId === 'no_room' 
                                            ? c.floor === null 
                                            : c.floor === activeRoomId;
                                        return isDay && isPeriodic && isRoomMatch;
                                    }).map(c => (
                                        <div key={c.id} style={styles.classCard}>
                                            
                                            <div style={styles.classTime}>
                                                {c.starts_at.slice(0,5)} - {c.ends_at.slice(0,5)}
                                            </div>
                                            
                                            <div style={styles.styleBlock}>
                                                <span style={styles.classStyle}>{getStyleName(c.style)}</span>
                                                {c.subtitle && <div style={styles.classSubtitle}>{c.subtitle}</div>}
                                            </div>
                                            
                                            <div style={styles.classMeta}>
                                                {formatLevel(c.level)}, {formatAge(c.min_age, c.max_age)}
                                            </div>

                                            <div style={styles.classMeta}>
                                                {formatInstructors(c.instructors)}
                                            </div>

                                            <div style={styles.cardFooter}>
                                                <span className="material-symbols-outlined" 
                                                    style={styles.iconBtn} 
                                                    onClick={() => handleEdit(c)}>edit</span>
                                                <span className="material-symbols-outlined" 
                                                    style={styles.iconBtn} 
                                                    onClick={() => handleDelete(c.id)}>delete</span>
                                            </div>
                                        </div>
                                    ))
                                ) : <div style={styles.empty}>Brak zajęć</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={styles.sectionCard}>
                <h2 style={styles.sectionHeader}>Wydarzenia lub warsztaty specjalne?</h2>
                <button style={styles.mainAddBtn} onClick={() => setClassPopupType('onetime')}>Dodaj warsztat/event +</button>
                
                <h3 style={styles.subHeader}>Lista dodanych warsztatów/eventów:</h3>
                {classes.filter(c => !c.periodic).length > 0 ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        {classes.filter(c => !c.periodic).map(c => (
                            <div key={c.id} style={{
                                ...styles.eventRow,
                                // Oznaczamy na czerwono, jeśli nie ma sali
                                border: c.floor === null ? '2px solid #ff4d4f' : '1px solid #eee'
                            }}>
                                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '2px'}}>
                                    
                                    <div style={{fontWeight: '700', color: '#333', fontSize: '15px'}}>
                                        {getStyleName(c.style)} <span style={{fontWeight: '400', fontStyle: 'italic', fontSize: '13px'}}>{c.subtitle}</span>
                                        {c.floor === null && <span style={{color: 'red', fontSize: '12px', marginLeft: '8px', fontWeight: 'bold'}}>(BRAK SALI)</span>}
                                    </div>
                                    
                                    <div style={{fontSize: '13px', color: '#444'}}>
                                        {formatLevel(c.level)} | {c.first_class_date} {c.starts_at.slice(0,5)}
                                        {c.last_class_date !== c.first_class_date ? ` - ${c.last_class_date}` : ''}
                                    </div>
                                    <div style={{fontSize: '13px', color: '#444'}}>
                                        {formatInstructors(c.instructors)}
                                    </div>
                                </div>

                                <div style={{display:'flex', gap:'15px', alignItems: 'center'}}>
                                    <span className="material-symbols-outlined" style={{cursor: 'pointer', color: '#666'}} onClick={() => handleEdit(c)}>edit</span>
                                    <span className="material-symbols-outlined" style={{cursor: 'pointer', color: '#666'}} onClick={() => handleDelete(c.id)}>delete</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p style={{color:'#999', fontSize:'14px'}}>Nie dodano jeszcze żadnych wydarzeń.</p>}
            </div>

            <div style={styles.saveContainer}>
                <button style={styles.saveBtnRounded} onClick={() => navigate('/profile')}>
                    <span className="material-symbols-outlined" style={{marginRight: '12px'}}>save</span>
                    Zapisz i przejdź do profilu
                </button>
            </div>

            {classPopupType && (
                <AddClassPopup 
                    type={classPopupType} 
                    rooms={rooms.filter(r => r.id !== 'no_room')} // Do selecta w popupie nie przekazujemy sztucznej sali, bo dodaliśmy tam opcję "Bez sali" ręcznie
                    instructors={instructors}
                    newlyAddedId={newInstId}
                    editingClass={editingClass}
                    onOpenInstructor={() => setShowInstructorPopup(true)}
                    onClose={handleClosePopup} 
                    onSave={fetchData} 
                />
            )}

            {showInstructorPopup && (
                <AddInstructorPopup 
                    onClose={() => setShowInstructorPopup(false)} 
                    onSave={(data) => { 
                        fetchData(); 
                        setNewInstId(data.id); 
                        setShowInstructorPopup(false); 
                    }} 
                />
            )}
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' },
    
    // ZMODYFIKOWANY NAGŁÓWEK
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1200px', marginBottom: '20px' },
    mainTitle: { fontSize: '32px', fontWeight: '500', margin: 0 },
    backArrow: { fontSize: '24px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },
    skipBtnLink: { color: '#666', fontWeight: '700', cursor: 'pointer', fontSize: '14px', marginTop: '10px' },

    sectionCard: { backgroundColor: 'white', width: '100%', maxWidth: '1200px', padding: '40px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    sectionHeader: { color: '#7A33E3', textAlign: 'center', marginBottom: '25px', fontWeight: '700' },
    mainAddBtn: { display: 'block', margin: '0 auto 40px', backgroundColor: '#7A33E3', color: 'white', padding: '12px 30px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' },
    subHeader: { color: '#7A33E3', fontWeight: '700', marginBottom: '15px' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
    tab: { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    
    gridWrapper: { width: '100%', overflowX: 'auto', paddingBottom: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', minWidth: '1000px' }, 
    
    dayCol: { backgroundColor: '#F1F1F1', borderRadius: '10px', padding: '10px', minHeight: '400px' },
    dayHeader: { textAlign: 'center', color: '#7A33E3', fontSize: '13px', fontWeight: '800', marginBottom: '15px' },
    
    classCard: { 
        backgroundColor: 'white', 
        padding: '12px', 
        borderRadius: '10px', 
        marginBottom: '10px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '3px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        minHeight: '125px'
    },
    classTime: { fontWeight: '700', fontSize: '13px', color: '#444', marginBottom: '2px' },
    
    styleBlock: { marginBottom: '4px', lineHeight: '1.2' },
    classStyle: { color: '#333', fontWeight: '700', fontSize: '14px' },
    classSubtitle: { fontStyle: 'italic', fontSize: '12px', color: '#666', marginLeft: '4px', display: 'inline-block' },
    
    classMeta: { fontSize: '12px', color: '#555', lineHeight: '1.3' },
    
    cardFooter: {
        marginTop: 'auto', 
        paddingTop: '8px',
        borderTop: '1px solid #f2f2f2',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
    },
    iconBtn: { fontSize: '18px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' },

    empty: { textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '20px' },
    
    eventRow: { backgroundColor: '#F9F9F9', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', border: '1px solid #eee' },
    
    saveContainer: { width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'center', marginTop: '20px' },
    saveBtnRounded: { 
        backgroundColor: '#7A33E3', 
        color: 'white', 
        padding: '16px 45px', 
        borderRadius: '12px', 
        border: 'none', 
        fontWeight: '800', 
        fontSize: '16px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center',
    }
};

export default SetupClasses;