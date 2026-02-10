import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';

const MyReviews = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [editRating, setEditRating] = useState(0);
    const [editText, setEditText] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const schoolsRes = await api.get('schools/');
                const schoolsMap = {};
                const schoolsList = schoolsRes.data.results || schoolsRes.data;
                schoolsList.forEach(school => {
                    schoolsMap[school.id] = school.name;
                });

                const reviewsRes = await api.get('reviews/');
                const allReviews = reviewsRes.data.results || reviewsRes.data;

                const myReviewsData = allReviews.filter(r => String(r.user) === String(user.user_id));

                const reviewsWithNames = myReviewsData.map(rev => ({
                    ...rev,
                    schoolName: schoolsMap[rev.school] || 'Szkoła'
                }));

                setReviews(reviewsWithNames);

            } catch (err) {
                console.error("Błąd:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleDelete = async (reviewId) => {
        try {
            await api.delete(`reviews/${reviewId}/`);
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (err) {
            console.error("Błąd usuwania:", err);
            alert("Błąd serwera przy usuwaniu.");
        }
    };

    const startEditing = (review) => {
        setEditingId(review.id);
        setEditRating(review.rating);
        setEditText(review.description);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditRating(0);
        setEditText('');
    };

    const saveEdit = async () => {
        setSaving(true);
        try {
            await api.patch(`reviews/${editingId}/`, {
                rating: editRating,
                description: editText
            });

            setReviews(prev => prev.map(r => {
                if (r.id === editingId) {
                    return { ...r, rating: editRating, description: editText };
                }
                return r;
            }));

            cancelEditing();
        } catch (err) {
            console.error("Błąd edycji:", err);
            alert("Nie udało się zapisać zmian.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={styles.loading}>Ładowanie...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate('/profile')}>
                    <span className="material-symbols-outlined">arrow_back</span> Wróć
                </button>
                <h1 style={styles.title}>Twoje opinie ({reviews.length})</h1>
            </div>

            <div style={styles.list}>
                {reviews.length === 0 ? (
                    <div style={styles.emptyState}>Brak dodanych opinii.</div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} style={styles.reviewCard}>
                            
                            {editingId === review.id ? (
                                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                    <div style={{fontWeight:'bold', color:'#7A33E3'}}>{review.schoolName}</div>
                                    
                                    <div style={{display:'flex', cursor:'pointer'}}>
                                        {[1,2,3,4,5].map(star => (
                                            <span key={star} className="material-symbols-outlined" 
                                                style={{color: star <= editRating ? '#FFD700' : '#E0E0E0', fontSize:'24px', fontVariationSettings:"'FILL' 1"}}
                                                onClick={() => setEditRating(star)}
                                            >star</span>
                                        ))}
                                    </div>

                                    <textarea 
                                        style={styles.editTextarea} 
                                        value={editText} 
                                        onChange={(e) => setEditText(e.target.value)}
                                    />

                                    <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
                                        <button style={styles.saveBtn} onClick={saveEdit} disabled={saving}>
                                            {saving ? 'Zapisywanie...' : 'Zapisz'}
                                        </button>
                                        <button style={styles.cancelBtn} onClick={cancelEditing}>Anuluj</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={styles.cardHeader}>
                                        <div style={styles.schoolName} onClick={() => navigate(`/school/${review.school}`)}>
                                            {review.schoolName}
                                        </div>
                                        
                                        <div style={styles.actions}>
                                            <button style={styles.editBtn} onClick={() => startEditing(review)} title="Edytuj">
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button style={styles.deleteBtn} onClick={() => handleDelete(review.id)} title="Usuń">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style={styles.ratingRow}>
                                        <div style={{ display: 'flex' }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span key={star} className="material-symbols-outlined" 
                                                    style={{ 
                                                        color: star <= review.rating ? '#FFD700' : '#E0E0E0', 
                                                        fontVariationSettings: "'FILL' 1", 
                                                        fontSize: '20px' 
                                                    }}>
                                                    star
                                                </span>
                                            ))}
                                        </div>
                                        <span style={styles.date}>{new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                    
                                    {review.description && (
                                        <p style={styles.desc}>"{review.description}"</p>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { 
        backgroundColor: '#F8F9FF', 
        minHeight: '100vh', 
        padding: '40px 20px', 
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    loading: { textAlign: 'center', marginTop: '50px', color: '#555' },
    header: { width: '100%', maxWidth: '800px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' },
    backBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '16px', color: '#555', fontWeight: '600' },
    title: { fontSize: '24px', fontWeight: '700', color: '#333', margin: 0 },

    list: { display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '800px' },
    
    reviewCard: { 
        backgroundColor: 'white', 
        padding: '25px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)', 
        border: '1px solid #eee'
    },
    
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    
    schoolName: { 
        fontSize: '18px', 
        fontWeight: '700', 
        color: '#7A33E3',
        cursor: 'pointer',
        textDecoration: 'none'
    },
    
    actions: { display: 'flex', gap: '10px' },
    
    editBtn: { 
        background: '#F0F0F0', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    deleteBtn: { 
        background: '#FFF0F0', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#D32F2F', display: 'flex', alignItems: 'center', justifyContent: 'center'
    },

    ratingRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' },
    date: { fontSize: '13px', color: '#999' },
    desc: { fontSize: '15px', color: '#444', lineHeight: '1.5' },
    
    emptyState: { textAlign: 'center', padding: '40px', color: '#777' },

    editTextarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px', fontFamily: 'inherit' },
    saveBtn: { backgroundColor: '#7A33E3', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { backgroundColor: 'transparent', color: '#555', border: '1px solid #ccc', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }
};

export default MyReviews;