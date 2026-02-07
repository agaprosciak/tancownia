import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const Instructor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [instructor, setInstructor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructor = async () => {
            try {
                const res = await api.get(`instructors/${id}/`);
                setInstructor(res.data);
            } catch (err) {
                console.error("Błąd pobierania instruktora:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInstructor();
    }, [id]);

    if (loading) return <div style={styles.loading}>Ładowanie profilu...</div>;
    if (!instructor) return <div style={styles.loading}>Nie znaleziono instruktora.</div>;

    const fullName = `${instructor.first_name} ${instructor.pseudonym ? `"${instructor.pseudonym}"` : ''} ${instructor.last_name}`;

    return (
        <div style={styles.container}>
            
            <div style={styles.headerWrapper}>
                <div style={styles.backButton} onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined" style={{fontSize: '32px'}}>arrow_back_ios</span>
                </div>
                <h1 style={styles.pageTitle}>Profil instruktora</h1>
                <div style={{width: '32px'}}></div>
            </div>

            <div style={styles.card}>
                
                <div style={styles.imageSection}>
                    {instructor.photo ? (
                        <img src={instructor.photo} alt={fullName} style={styles.avatar} />
                    ) : (
                        <div style={styles.placeholderAvatar}>{instructor.first_name[0]}</div>
                    )}
                </div>

                <div style={styles.infoSection}>
                    
                    <div style={styles.nameRow}>
                        <h2 style={styles.name}>{fullName}</h2>
                        
                        <div style={styles.socialIcons}>
                            {/* POPRAWKA: Używamy pola 'facebook' z Twojego modelu */}
                            {instructor.facebook && (
                                <a href={instructor.facebook} target="_blank" rel="noopener noreferrer" style={styles.iconLink}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#1877F2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </a>
                            )}

                            {/* POPRAWKA: Używamy pola 'instagram' z Twojego modelu */}
                            {instructor.instagram && (
                                <a href={instructor.instagram} target="_blank" rel="noopener noreferrer" style={styles.iconLink}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
                                        <defs>
                                            <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#f09433" />
                                                <stop offset="25%" stopColor="#e6683c" />
                                                <stop offset="50%" stopColor="#dc2743" />
                                                <stop offset="75%" stopColor="#cc2366" />
                                                <stop offset="100%" stopColor="#bc1888" />
                                            </linearGradient>
                                        </defs>
                                        <path fill="url(#igGradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    <div style={styles.detailRow}>
                        <span className="material-symbols-outlined" style={styles.detailIcon}>work</span>
                        <span style={styles.detailLabel}>Uczy w: </span>
                        <span style={styles.detailValue}>
                            {instructor.schools && instructor.schools.length > 0 
                                ? instructor.schools.map((s, index) => (
                                    <span key={s.id}>
                                        <span 
                                            style={styles.linkText} 
                                            onClick={() => navigate(`/school/${s.id}`)}
                                        >
                                            {s.name}
                                        </span>
                                        {index < instructor.schools.length - 1 ? ', ' : ''}
                                    </span>
                                  ))
                                : "Brak przypisanych szkół"
                            }
                        </span>
                    </div>

                    <div style={styles.detailRow}>
                        <span className="material-symbols-outlined" style={styles.detailIcon}>music_note</span>
                        <span style={styles.detailLabel}>Style: </span>
                        <span style={styles.detailValue}>
                            {instructor.styles && instructor.styles.length > 0 
                                ? instructor.styles.map(s => s.style_name || s.name).join(', ')
                                : "Brak danych"
                            }
                        </span>
                    </div>

                </div>
            </div>

        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#F8F9FF',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '40px',
        paddingBottom: '40px',
        fontFamily: "'Inter', sans-serif",
    },
    loading: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#555'
    },
    headerWrapper: {
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '0 20px',
    },
    backButton: {
        cursor: 'pointer',
        color: '#333',
        display: 'flex',
        alignItems: 'center',
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: '400',
        color: '#000',
        margin: 0,
    },
    card: {
        backgroundColor: 'white',
        width: '100%',
        maxWidth: '900px',
        padding: '50px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '50px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        borderRadius: '4px',
    },
    imageSection: {
        flexShrink: 0,
    },
    avatar: {
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid #eee',
    },
    placeholderAvatar: {
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        backgroundColor: '#eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '60px',
        color: '#888',
        fontWeight: 'bold',
    },
    infoSection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    nameRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '10px',
    },
    name: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#7A33E3',
        margin: 0,
    },
    socialIcons: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
    },
    iconLink: {
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        transition: 'opacity 0.2s',
        cursor: 'pointer',
    },
    detailRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '16px',
        color: '#333',
        lineHeight: '1.5',
    },
    detailIcon: {
        color: '#555',
        fontSize: '22px',
        marginTop: '1px',
    },
    detailLabel: {
        color: '#555',
        fontWeight: '400',
    },
    detailValue: {
        fontWeight: '600',
        color: '#333',
    },
    linkText: {
        cursor: 'pointer',
        textDecoration: 'underline',
        color: '#333',
        transition: 'color 0.2s',
    },
};

export default Instructor;