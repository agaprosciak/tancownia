import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AddInstructorPopup from '../components/AddInstructorPopup';

const EditInstructors = () => {
    const navigate = useNavigate();
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        fetchInstructors();
    }, []);

    const fetchInstructors = async () => {
        try {
            const res = await api.get('instructors/?created_by_me=true');
            setInstructors(res.data);
        } catch (err) {
            console.error("Błąd pobierania instruktorów:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (instructor) => {
        setSelectedInstructor(instructor);
        setShowPopup(true);
    };

    const handleSave = () => {
        fetchInstructors(); 
        setShowPopup(false);
        setSelectedInstructor(null);
    };

    const getInitials = (firstName, lastName) => {
        const first = firstName ? firstName[0] : '';
        const last = lastName ? lastName[0] : '';
        return (first + last).toUpperCase();
    };

    if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Ładowanie instruktorów...</div>;

    return (
        <div style={styles.container}>
            
            <div style={styles.headerRow}>
                <span 
                    className="material-symbols-outlined" 
                    style={styles.backArrow} 
                    onClick={() => navigate('/profile')}
                >
                    arrow_back_ios
                </span>
                <h1 style={styles.title}>Edytuj dodanych przez ciebie instruktorów</h1>
                <div style={{width: '24px'}}></div>
            </div>

            <div style={styles.card}>
                <p style={styles.subtitle}>(Kliknij na instruktora, aby edytować)</p>

                {instructors.length > 0 ? (
                    <div style={styles.grid}>
                        {instructors.map((inst) => (
                            <div key={inst.id} style={styles.itemWrapper} onClick={() => handleEditClick(inst)}>
                                <div style={styles.circle}>
                                    {inst.photo ? (
                                        <img src={inst.photo} alt={`${inst.first_name} ${inst.last_name}`} style={styles.img} />
                                    ) : (
                                        <span style={styles.initials}>
                                            {getInitials(inst.first_name, inst.last_name)}
                                        </span>
                                    )}
                                </div>
                                <div style={styles.name}>
                                    {inst.first_name} {inst.pseudonym ? `"${inst.pseudonym}"` : ""} {inst.last_name}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                        Nie dodałeś jeszcze żadnych instruktorów.
                        <br/>
                        Pamiętaj, że możesz edytować tylko tych, których sam stworzyłeś i nadal uczą w Twojej szkole.
                    </div>
                )}
            </div>

            {showPopup && (
                <AddInstructorPopup 
                    onClose={() => setShowPopup(false)}
                    onSave={handleSave}
                    initialData={selectedInstructor} 
                />
            )}
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: 'calc(100vh - 80px)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '800px', marginBottom: '30px' },
    backArrow: { fontSize: '24px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },
    title: { fontSize: '24px', fontWeight: '400', color: '#333', textAlign: 'center', margin: 0 },

    card: { backgroundColor: 'white', width: '100%', maxWidth: '900px', padding: '50px', borderRadius: '0px', boxShadow: '0 4px 30px rgba(0,0,0,0.02)', minHeight: '400px' },
    
    subtitle: { textAlign: 'center', color: '#000', marginBottom: '50px', fontSize: '16px' },

    grid: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '60px' },
    
    itemWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', cursor: 'pointer', width: '150px' },
    
    circle: { width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#C4C4C4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    img: { width: '100%', height: '100%', objectFit: 'cover' },
    initials: { fontSize: '36px', color: '#555', textTransform: 'uppercase', letterSpacing: '2px' },
    
    name: { fontSize: '18px', color: '#000', textAlign: 'center', fontWeight: '400' }
};

export default EditInstructors;