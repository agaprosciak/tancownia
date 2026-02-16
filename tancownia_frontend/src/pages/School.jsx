import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';

import fbIcon from '../assets/facebook.png';
import igIcon from '../assets/instagram.png';

const TextWithLinks = ({ text }) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return (
        <span>
            {parts.map((part, i) => 
                part.match(urlRegex) ? (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#7A33E3', fontWeight: 'bold', textDecoration: 'underline', wordBreak: 'break-all' }}>
                        {part}
                    </a>
                ) : part
            )}
        </span>
    );
};

const StarRating = ({ rating, count, size = '16px' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{ display: 'flex' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="material-symbols-outlined" 
                    style={{ color: star <= Math.round(rating || 0) ? '#FFD700' : '#E0E0E0', fontVariationSettings: "'FILL' 1", fontSize: size }}>
                    star
                </span>
            ))}
        </div>
        <span style={{ fontWeight: 'bold', fontSize: size, color: '#333' }}>{rating || '0.0'}</span>
        {count !== undefined && <span style={{ color: '#777', fontSize: '12px' }}>({count})</span>}
    </div>
);

const InteractiveStars = ({ rating, setRating }) => (
    <div style={{ display: 'flex', gap: '5px', cursor: 'pointer' }}>
        {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className="material-symbols-outlined" 
                style={{ color: star <= rating ? '#FFD700' : '#E0E0E0', fontVariationSettings: "'FILL' 1", fontSize: '24px' }}
                onClick={() => setRating(star)}>
                star
            </span>
        ))}
    </div>
);

const AccordionSection = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div style={{ borderBottom: '1px solid #eee', padding: '25px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#333', margin: 0 }}>{title}</h3>
                <span className="material-symbols-outlined" style={{ color: '#7A33E3', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s', fontSize: '24px' }}>expand_more</span>
            </div>
            {isOpen && <div style={{ marginTop: '20px', color: '#444', lineHeight: '1.6' }}>{children}</div>}
        </div>
    );
};

const PriceDetailsPopup = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <div style={styles.popupOverlay} onClick={onClose}>
            <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.popupHeader}>
                    <h2 style={{margin: 0, color: '#333', fontSize: '22px'}}>{item.name}</h2>
                    <span className="material-symbols-outlined" style={styles.closeBtn} onClick={onClose}>close</span>
                </div>
                
                <div style={styles.popupGrid}>
                    <div style={styles.popupItem}>
                        <span className="material-symbols-outlined" style={styles.popupIcon}>payments</span>
                        <div>
                            <div style={{fontSize: '12px', color: '#777'}}>Cena</div>
                            <strong style={{fontSize: '16px', color: '#7A33E3'}}>{item.price} zł</strong>
                        </div>
                    </div>
                    
                    <div style={styles.popupItem}>
                        <span className="material-symbols-outlined" style={styles.popupIcon}>confirmation_number</span>
                        <div>
                            <div style={{fontSize: '12px', color: '#777'}}>Rodzaj</div>
                            <strong>{item.entry_type === 'pass' ? 'Karnet' : 'Wejście pojedyncze'}</strong>
                        </div>
                    </div>

                    <div style={styles.popupItem}>
                        <span className="material-symbols-outlined" style={styles.popupIcon}>schedule</span>
                        <div>
                            <div style={{fontSize: '12px', color: '#777'}}>Czas trwania zajęć</div>
                            <strong>{item.duration_minutes} min</strong>
                        </div>
                    </div>

                    {item.entry_type === 'pass' && (
                        <div style={styles.popupItem}>
                            <span className="material-symbols-outlined" style={styles.popupIcon}>repeat</span>
                            <div>
                                <div style={{fontSize: '12px', color: '#777'}}>Limit wejść</div>
                                <strong>{item.entries_per_week ? `${item.entries_per_week} wejść na tydzień` : 'Open (Bez limitu)'}</strong>
                            </div>
                        </div>
                    )}
                </div>

                {item.description && (
                    <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '12px', fontSize: '14px', lineHeight: '1.5'}}>
                        <strong style={{display:'block', marginBottom:'5px'}}>Szczegóły:</strong>
                        <TextWithLinks text={item.description} />
                    </div>
                )}
            </div>
        </div>
    );
};

const ClassDetailsPopup = ({ cls, onClose, rooms, allInstructors, navigate, schoolStyles }) => {
    if (!cls) return null;

    const getRoomName = (floorId) => {
        if (floorId === null) return "Bez przypisanej sali";
        const r = rooms.find(room => room.id === floorId);
        return r ? r.name : "Nieznana sala";
    };

    const getStyleName = () => {
        if (typeof cls.style === 'object' && cls.style !== null) return cls.style.style_name;
        if (schoolStyles && schoolStyles.length > 0) {
            const found = schoolStyles.find(s => s.id === cls.style);
            if (found) return found.style_name;
        }
        return "Zajęcia taneczne";
    };

    const formatLevel = (lvl) => {
        const map = { 'OPEN': 'Open', 'BEGINNER': 'Od podstaw', 'BASIC': 'Początkujący', 'INTERMEDIATE': 'Średniozaaw.', 'ADVANCED': 'Zaawansowany', 'PRO': 'Profesjonalny' };
        return map[lvl] || lvl;
    };

    const formatGroupType = (type) => {
        if (!type) return null;
        const map = { 'FORMATION': 'Formacja', 'PROJECT': 'Grupa zamknięta/Projekt', 'DANCE_CONTEST': 'Grupa turniejowa', 'VIDEO_PROJECT': 'Video projekt' };
        return map[type] || type;
    };

    const translateDay = (day) => {
        const map = { 'monday': 'Poniedziałek', 'tuesday': 'Wtorek', 'wednesday': 'Środa', 'thursday': 'Czwartek', 'friday': 'Piątek', 'saturday': 'Sobota', 'sunday': 'Niedziela' };
        return map[day] || day;
    };

    const classInstructors = allInstructors ? allInstructors.filter(inst => cls.instructors.includes(inst.id)) : [];
    const isMultiDay = !cls.periodic && cls.first_class_date !== cls.last_class_date;

    return (
        <div style={styles.popupOverlay} onClick={onClose}>
            <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                <div style={styles.popupHeader}>
                    <h2 style={{margin: 0, color: '#333', fontSize: '24px', fontWeight: '700'}}>
                        {getStyleName()}
                    </h2>
                    <span className="material-symbols-outlined" style={styles.closeBtn} onClick={onClose}>close</span>
                </div>
                
                {cls.subtitle && <div style={{fontSize: '18px', color: '#666', fontStyle: 'italic', marginBottom: '20px', marginTop: '-10px'}}>{cls.subtitle}</div>}

                <div style={{marginBottom: '25px'}}>
                    {cls.can_join ? (
                        <span style={styles.statusBadgeGreen}>Zapisy otwarte</span>
                    ) : (
                        <span style={styles.statusBadgeRed}>Zapisy zamknięte / Brak miejsc</span>
                    )}
                </div>

                <div style={styles.popupGrid}>
                    <div style={styles.popupItem}>
                        <span className="material-symbols-outlined" style={styles.popupIcon}>schedule</span>
                        <div>
                            {cls.periodic ? (
                                <>
                                    <div style={{fontWeight: '700', fontSize: '16px'}}>
                                        {translateDay(cls.day_of_week)} {cls.starts_at.slice(0,5)} - {cls.ends_at.slice(0,5)}
                                    </div>
                                    <div style={{fontSize:'13px', color:'#777'}}>Zajęcia cykliczne</div>
                                    <div style={{fontSize:'13px', color:'#555', marginTop:'2px'}}>
                                        Start grupy: {new Date(cls.first_class_date).toLocaleDateString()}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {isMultiDay ? (
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                            <div>
                                                Start: <strong>{new Date(cls.first_class_date).toLocaleDateString()}</strong>, godz. {cls.starts_at.slice(0,5)}
                                            </div>
                                            <div>
                                                Koniec: <strong>{new Date(cls.last_class_date).toLocaleDateString()}</strong>, godz. {cls.ends_at.slice(0,5)}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{fontWeight: '700', fontSize: '16px'}}>
                                                {new Date(cls.first_class_date).toLocaleDateString()}
                                            </div>
                                            <div style={{fontSize: '15px'}}>
                                                {cls.starts_at.slice(0,5)} - {cls.ends_at.slice(0,5)}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div style={styles.popupItem}>
                        <span className="material-symbols-outlined" style={styles.popupIcon}>signal_cellular_alt</span>
                        <div>
                            <div style={{fontSize: '12px', color: '#777'}}>Poziom</div>
                            <strong style={{fontSize: '15px'}}>{formatLevel(cls.level)}</strong>
                        </div>
                    </div>

                    <div style={styles.popupItem}>
                        <span className="material-symbols-outlined" style={styles.popupIcon}>person</span>
                        <div>
                            <div style={{fontSize: '12px', color: '#777'}}>Prowadzący</div>
                            {classInstructors.length > 0 ? (
                                <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'4px'}}>
                                    {classInstructors.map(inst => (
                                        <span 
                                            key={inst.id} 
                                            style={styles.clickableInstructor}
                                            onClick={() => { onClose(); navigate(`/instructor/${inst.id}`); }}
                                        >
                                            {inst.first_name} {inst.last_name}
                                        </span>
                                    ))}
                                </div>
                            ) : <span style={{marginLeft:'5px'}}>-</span>}
                        </div>
                    </div>

                    <div style={styles.popupItem}>
                        <span className="material-symbols-outlined" style={styles.popupIcon}>group</span>
                        <div>
                            <div style={{fontSize: '12px', color: '#777'}}>Wiek</div>
                            <strong style={{fontSize: '15px'}}>{cls.max_age ? `${cls.min_age}-${cls.max_age} lat` : `${cls.min_age}+ lat`}</strong>
                        </div>
                    </div>

                    {formatGroupType(cls.group_type) && (
                        <div style={styles.popupItem}>
                            <span className="material-symbols-outlined" style={styles.popupIcon}>category</span>
                            <div>
                                <div style={{fontSize: '12px', color: '#777'}}>Typ grupy</div>
                                <strong style={{fontSize: '15px'}}>{formatGroupType(cls.group_type)}</strong>
                            </div>
                        </div>
                    )}

                    <div style={styles.popupItem}>
                        <span className="material-symbols-outlined" style={styles.popupIcon}>location_on</span>
                        <div>
                            <div style={{fontSize: '12px', color: '#777'}}>Miejsce</div>
                            <strong style={{fontSize: '15px'}}>{getRoomName(cls.floor)}</strong>
                        </div>
                    </div>

                    <div style={styles.popupItem}>
                        <span className="material-symbols-outlined" style={styles.popupIcon}>payments</span>
                        <div>
                            <div style={{fontSize: '12px', color: '#777'}}>Cena</div>
                            <strong style={{fontSize: '15px'}}>{cls.price ? `${cls.price} zł` : "Wg cennika szkoły"}</strong>
                        </div>
                    </div>
                </div>

                {cls.description && (
                    <div style={{marginTop: '25px', padding: '20px', backgroundColor: '#F9F9F9', borderRadius: '12px', fontSize: '14px', lineHeight: '1.6', border: '1px solid #eee'}}>
                        <strong style={{display: 'block', marginBottom: '8px', color: '#333'}}>Opis zajęć:</strong>
                        <TextWithLinks text={cls.description} />
                    </div>
                )}

                {cls.registration_info_link && (
                    <div style={{marginTop: '20px', padding: '20px', backgroundColor: 'rgba(122, 51, 227, 0.1)', borderRadius: '12px', border: '1px solid rgba(122, 51, 227, 0.2)'}}>
                        <strong style={{display: 'block', marginBottom: '8px', color: '#7A33E3'}}>Informacje o zapisach:</strong>
                        <div style={{fontSize: '14px', lineHeight: '1.5'}}>
                            <TextWithLinks text={cls.registration_info_link} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



const School = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const { user } = useContext(AuthContext); 

    const [school, setSchool] = useState(null);
    const [schedule, setSchedule] = useState([]); 
    const [reviews, setReviews] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    const [newReviewText, setNewReviewText] = useState('');
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);
    
    const [reviewError, setReviewError] = useState(null);

    const [rooms, setRooms] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedPriceItem, setSelectedPriceItem] = useState(null);

    const galleryRef = useRef(null);

    const daysKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['PONIEDZIAŁEK', 'WTOREK', 'ŚRODA', 'CZWARTEK', 'PIĄTEK', 'SOBOTA', 'NIEDZIELA'];

    const fetchData = async () => {
        try {
            //Pobranie szkoły
            const schoolRes = await api.get(`schools/${id}/`);
            const schoolData = schoolRes.data;
            setSchool(schoolData);

            // Pobranie grafiku
            const classesRes = await api.get(`classes/?school=${id}`);
            const classesData = classesRes.data;
            setSchedule(classesData);

            // Zakładki Sal (jak jest i szkoła i zajęcia)
            let allFloors = schoolData.floors || [];
            
            // Sprawdza, czy w grafiku faktycznie są zajęcia bez przypisanej sali
            const hasClassesWithoutRoom = classesData.some(c => c.periodic && c.floor === null);

            if (allFloors.length > 0) {
                // Jeśli szkoła ma sale, dodawanie "Bez sali" TYLKO JEŚLI są takie zajęcia
                if (hasClassesWithoutRoom) {
                    allFloors = [...allFloors, { id: 'no_room', name: 'Bez sali' }];
                }
                
                // Ustawianie aktywnej sali tylko jeśli jeszcze nie jest ustawiona
                if (!activeRoomId) setActiveRoomId(allFloors[0].id); 
            } else {
                // Jeśli szkoła w ogóle nie zdefiniowała sal, pokaż wszystko (widok domyślny)
                setActiveRoomId('all'); 
            }
            setRooms(allFloors);

            // Pobieranie opinii
            const reviewsRes = await api.get(`reviews/?school=${id}`);
            setReviews(reviewsRes.data.results || reviewsRes.data);

        } catch (err) {
            console.error("Błąd danych:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, [id]);

    const userHasReviewed = reviews.some(rev => rev.user === user?.user_id);

    const scrollGallery = (direction) => {
        if (galleryRef.current) {
            const scrollAmount = 500;
            galleryRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const handleSubmitReview = async () => {
        setReviewError(null); 

        //Sprawdzenie czy to tancerz
        if (!user || user.role !== 'user') {
            setReviewError("Tylko zalogowani tancerze mogą wystawiać opinie!");
            return;
        }
        
        //Sprawdzenie czy wybrano gwiazdki
        if (newReviewRating === 0) {
            setReviewError("Proszę zaznaczyć gwiazdki!");
            return;
        }
        
        setSubmittingReview(true);
        try {
            await api.post('reviews/', {
                school: id,
                rating: newReviewRating,
                description: newReviewText
            });
            
            setNewReviewText('');
            setNewReviewRating(0);
            fetchData(); 
            
        } catch (err) {
            console.error("Błąd API:", err.response);

            if (err.response) {
                // SCENARIUSZ 1: BŁĄD 500 (Duplikat w bazie)
                if (err.response.status === 500) {
                     setReviewError("Już wystawiłeś opinię dla tej szkoły, możesz ją usunąć albo edytować w swoim profilu.");
                } 
                // SCENARIUSZ 2: BŁĄD 400 (Standardowy błąd walidacji DRF)
                else if (err.response.status === 400) {
                    const data = err.response.data;
                    if (
                        (data.non_field_errors && JSON.stringify(data.non_field_errors).includes('unique')) ||
                        (data.detail && data.detail.includes('unique'))
                    ) {
                        setReviewError("Już wystawiłeś opinię dla tej szkoły, możesz ją usunąć albo edytować w swoim profilu.");
                    } else {
                        setReviewError("Błąd danych. Spróbuj ponownie.");
                    }
                } 
                // INNE BŁĘDY
                else {
                    setReviewError(`Wystąpił błąd serwera (${err.response.status}).`);
                }
            } else {
                 setReviewError("Błąd połączenia z serwerem.");
            }
        } finally {
            setSubmittingReview(false);
        }
    };
    
    if (loading) return <div style={styles.loading}>Ładowanie...</div>;
    if (!school) return <div style={styles.loading}>Nie znaleziono szkoły.</div>;

    const getStyleName = (styleData) => {
        if (typeof styleData === 'object' && styleData !== null) return styleData.style_name;
        if (school && school.styles) {
            const found = school.styles.find(s => s.id === styleData);
            if (found) return found.style_name;
        }
        return "Zajęcia taneczne"; 
    };

    const today = new Date().toISOString().split('T')[0]; 
    const allEvents = schedule.filter(c => c.periodic === false);
    
    const upcomingEvents = allEvents
        .filter(c => c.first_class_date >= today)
        .sort((a, b) => new Date(a.first_class_date) - new Date(b.first_class_date));

    const pastEvents = allEvents
        .filter(c => c.first_class_date < today)
        .sort((a, b) => new Date(b.first_class_date) - new Date(a.first_class_date));

    const regularClasses = schedule.filter(c => c.periodic === true);
    
    const formatAge = (min, max) => max ? `${min}-${max} lat` : `${min}+ lat`;
    const formatLevel = (lvl) => {
        const map = { 'OPEN': 'Open', 'BEGINNER': 'Od podstaw', 'BASIC': 'Początkujący', 'INTERMEDIATE': 'Średniozaaw.', 'ADVANCED': 'Zaawansowany', 'PRO': 'Profesjonalny' };
        return map[lvl] || lvl;
    };

    const formatGroupType = (type) => {
        if (!type) return null;
        const map = { 'FORMATION': 'Formacja', 'PROJECT': 'Grupa zamknięta/Projekt', 'DANCE_CONTEST': 'Grupa turniejowa', 'VIDEO_PROJECT': 'Video projekt' };
        return map[type] || type;
    };

    const hasAnyPrices = school.price_list && school.price_list.length > 0;
    const hasAnyCards = school.accepts_multisport || school.accepts_medicover || school.accepts_fitprofit || school.accepts_pzu_sport;

    return (
        <div style={styles.container}>
            <div style={styles.backButtonWrapper}>
                 <span className="material-symbols-outlined" style={styles.backArrow} onClick={() => navigate(-1)}>arrow_back_ios</span>
            </div>

            <div style={styles.mainCard}>
                <div style={styles.topSection}>
                    <div style={styles.infoColumn}>
                        <div style={styles.logoRow}>
                            <div style={styles.logoWrapper}>
                                {school.logo ? (
                                    <img src={school.logo} style={styles.logo} alt="Logo" />
                                ) : (
                                    <div style={styles.placeholderLogo}>{school.name[0]}</div>
                                )}
                            </div>
                            <div style={{flex: 1}}>
                                <h2 style={styles.schoolName}>{school.name}</h2>
                                <StarRating rating={school.average_rating} count={reviews.length} size="20px" />
                                <div style={styles.addressBox}>
                                    <span className="material-symbols-outlined" style={{color: '#7A33E3'}}>location_on</span>
                                    {school.full_address || `${school.street} ${school.build_no}, ${school.city}`}
                                </div>
                            </div>
                        </div>

                        <div style={styles.contactGrid}>
                            {school.website && <a href={school.website} target="_blank" rel="noopener noreferrer" style={styles.contactItemLink}><span className="material-symbols-outlined">language</span> <span style={styles.longLink}>{school.website}</span></a>}
                            {school.facebook && <a href={school.facebook} target="_blank" rel="noopener noreferrer" style={styles.contactItemLink}><img src={fbIcon} style={{width:'20px'}} alt="fb"/> <span style={styles.longLink}>{school.facebook}</span></a>}
                            {school.instagram && <a href={school.instagram} target="_blank" rel="noopener noreferrer" style={styles.contactItemLink}><img src={igIcon} style={{width:'20px'}} alt="ig"/> <span style={styles.longLink}>{school.instagram}</span></a>}
                            {school.email && <div style={styles.contactItemText}><span className="material-symbols-outlined">mail</span> <span style={styles.longLink}>{school.email}</span></div>}
                            {school.phone && <div style={styles.contactItemText}><span className="material-symbols-outlined">call</span> {school.phone}</div>}
                        </div>

                        {school.news && (
                            <div style={styles.newsBox}>
                                <strong>📢 Aktualności:</strong> {school.news}
                            </div>
                        )}
                    </div>

                    <div style={styles.galleryColumn}>
                        {school.images && school.images.length > 0 ? (
                            <div style={styles.galleryWrapper}>
                                <button onClick={() => scrollGallery('left')} style={styles.sliderArrowBtn}>
                                    <span className="material-symbols-outlined" style={{fontSize: '40px'}}>chevron_left</span>
                                </button>

                                <div ref={galleryRef} style={styles.galleryTrack}>
                                    {school.images.map((imgObj) => (
                                        <img key={imgObj.id} src={imgObj.image} style={styles.galleryImg} alt="School Gallery" />
                                    ))}
                                </div>

                                <button onClick={() => scrollGallery('right')} style={styles.sliderArrowBtn}>
                                    <span className="material-symbols-outlined" style={{fontSize: '40px'}}>chevron_right</span>
                                </button>
                            </div>
                        ) : (
                            <div style={styles.noGallery}>Brak zdjęć w galerii</div>
                        )}
                    </div>
                </div>

                <div style={styles.separator}></div>

                {/* --- GRAFIK --- */}
                <div style={styles.sectionContainer}>
                    <h3 style={styles.sectionHeaderPurple}>Grafik zajęć</h3>
                    <p style={{fontSize:'13px', color:'#777', marginTop: '-15px', marginBottom: '20px'}}>Kliknij na kafelek, aby zobaczyć szczegóły.</p>
                    
                    {rooms.length > 0 && (
                        <div style={styles.roomTabs}>
                            {rooms.map(r => (
                                <button 
                                    key={r.id} 
                                    style={{
                                        ...styles.roomTab, 
                                        backgroundColor: activeRoomId === r.id ? '#7A33E3' : '#eee', 
                                        color: activeRoomId === r.id ? 'white' : '#333'
                                    }}
                                    onClick={() => setActiveRoomId(r.id)}
                                >
                                    {r.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={styles.scheduleGridWrapper}>
                        <div style={styles.scheduleGrid}>
                            {daysKeys.map((dayKey, idx) => (
                                <div key={dayKey} style={styles.dayColumn}>
                                    <div style={styles.dayHeader}>{dayLabels[idx]}</div>
                                    <div style={styles.dayContent}>
                                        {regularClasses
                                            .filter(c => {
                                                const isDay = c.day_of_week === dayKey;
                                                if (activeRoomId === 'all') return isDay;
                                                if (activeRoomId === 'no_room') return isDay && c.floor === null;
                                                return isDay && c.floor === activeRoomId;
                                            })
                                            .sort((a,b) => a.starts_at.localeCompare(b.starts_at))
                                            .map(cls => (
                                                <div 
                                                    key={cls.id} 
                                                    style={styles.classCard}
                                                    onClick={() => setSelectedClass(cls)}
                                                >
                                                    <div style={styles.classTime}>{cls.starts_at.slice(0,5)} - {cls.ends_at.slice(0,5)}</div>
                                                    <div style={styles.className}>{getStyleName(cls.style)}</div>
                                                    
                                                    {cls.subtitle && <div style={styles.classSubItalic}>{cls.subtitle}</div>}
                                                    
                                                    <div style={styles.classMeta}>
                                                        {formatLevel(cls.level)}, {formatAge(cls.min_age, cls.max_age)}
                                                        {formatGroupType(cls.group_type) && <><br/>{formatGroupType(cls.group_type)}</>}
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- NADCHODZĄCE WYDARZENIA --- */}
                {upcomingEvents.length > 0 && (
                    <div style={styles.sectionContainer}>
                        <h3 style={styles.sectionHeaderPurple}>Nadchodzące wydarzenia</h3>
                        <div style={styles.eventsList}>
                            {upcomingEvents.map(evt => (
                                <div 
                                    key={evt.id} 
                                    style={styles.eventCard}
                                    onClick={() => setSelectedClass(evt)}
                                >
                                    <div style={styles.eventDate}>
                                        {new Date(evt.first_class_date).toLocaleDateString()}
                                        {evt.last_class_date !== evt.first_class_date && ` - ${new Date(evt.last_class_date).toLocaleDateString()}`} 
                                        {' '}• {evt.starts_at.slice(0,5)}
                                    </div>
                                    <div style={styles.eventName}>{getStyleName(evt.style)}</div>
                                    <div style={styles.eventSub}>{evt.subtitle}</div>
                                    <div style={styles.eventInfo}>
                                        {formatLevel(evt.level)} 
                                        {evt.floor === null && <span style={{fontWeight:'bold', color: '#555', marginLeft: '5px'}}>• Bez sali</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- MINIONE WYDARZENIA --- */}
                {pastEvents.length > 0 && (
                    <div style={{...styles.sectionContainer, opacity: 0.7}}>
                        <h3 style={{...styles.sectionHeaderPurple, color: '#999'}}>Minione wydarzenia</h3>
                        <div style={styles.eventsList}>
                            {pastEvents.map(evt => (
                                <div 
                                    key={evt.id} 
                                    style={{...styles.eventCard, backgroundColor: '#f9f9f9'}}
                                    onClick={() => setSelectedClass(evt)}
                                >
                                    <div style={{...styles.eventDate, color: '#999'}}>
                                        {new Date(evt.first_class_date).toLocaleDateString()}
                                    </div>
                                    <div style={{...styles.eventName, color: '#777'}}>{getStyleName(evt.style)}</div>
                                    <div style={styles.eventSub}>{evt.subtitle}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={styles.separator}></div>

                {/* --- INSTRUKTORZY --- */}
                {school.instructors && school.instructors.length > 0 && (
                    <div style={styles.sectionContainer}>
                        <h3 style={styles.sectionHeaderPurple}>Nasi Instruktorzy</h3>
                        <div style={styles.instructorsGrid}>
                            {school.instructors.map(inst => (
                                <div key={inst.id} style={styles.instCard} onClick={() => navigate(`/instructor/${inst.id}`)}>
                                    {inst.photo ? (
                                        <img src={inst.photo} style={styles.instAvatar} alt={inst.first_name} />
                                    ) : (
                                        <div style={styles.instPlaceholder}>{inst.first_name[0]}</div>
                                    )}
                                    <p style={styles.instName}>{inst.first_name} {inst.pseudonym ? `"${inst.pseudonym}"` : ''} {inst.last_name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- CENNIK I OPINIE --- */}
                <div style={styles.bottomGrid}>
                    
                    {/* LEWA */}
                    <div style={{flex: 1}}>
                        <AccordionSection title="Cennik" defaultOpen={true}>
                            {hasAnyPrices || hasAnyCards ? (
                                <>
                                    {school.price_list && school.price_list.map(p => (
                                        <div 
                                            key={p.id} 
                                            style={{...styles.priceRow, cursor: 'pointer'}} 
                                            onClick={() => setSelectedPriceItem(p)}
                                        >
                                            <div>
                                                <span style={{fontWeight:'600'}}>{p.name}</span>
                                                <span style={{fontSize:'13px', color:'#666', marginLeft:'8px'}}>
                                                    {p.entry_type === 'pass' 
                                                    ? `Karnet ${p.entries_per_week ? `(${p.entries_per_week}x w tyg)` : '(Open)'}` 
                                                    : '(1 wejście)'}
                                                </span>
                                            </div>
                                            <span style={{fontWeight:'700', color:'#7A33E3'}}>{p.price} zł</span>
                                        </div>
                                    ))}
                                    
                                    <div style={{marginTop:'20px'}}>
                                        {hasAnyCards && (
                                            <>
                                                <strong style={{fontSize:'14px', display:'block', marginBottom:'8px'}}>Honorujemy karty:</strong>
                                                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'10px'}}>
                                                    {school.accepts_multisport && <span style={styles.cardBadge}>MultiSport</span>}
                                                    {school.accepts_medicover && <span style={styles.cardBadge}>Medicover</span>}
                                                    {school.accepts_fitprofit && <span style={styles.cardBadge}>FitProfit</span>}
                                                    {school.accepts_pzu_sport && <span style={styles.cardBadge}>PZU Sport</span>}
                                                </div>
                                            </>
                                        )}
                                        {school.benefit_cards_info && <div style={{fontSize:'13px', color:'#555', fontStyle:'italic'}}>{school.benefit_cards_info}</div>}
                                    </div>
                                </>
                            ) : (
                                <p style={{color: '#777', fontStyle: 'italic'}}>Brak dodanych informacji o cenniku.</p>
                            )}
                        </AccordionSection>

                        <AccordionSection title="O szkole" defaultOpen={true}>
                            <div style={{whiteSpace: 'pre-line', marginBottom: '15px'}}>
                                <TextWithLinks text={school.description} />
                            </div>
                            
                            {school.rules && (
                                <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px', fontSize: '13px', color: '#555'}}>
                                    <strong>Regulamin / Zasady: </strong> 
                                    <TextWithLinks text={school.rules} />
                                </div>
                            )}

                            {school.default_registration_info_link && (
                                <div style={styles.registrationBox}>
                                    <strong>Zapisy: </strong><br/>
                                    <TextWithLinks text={school.default_registration_info_link} />
                                </div>
                            )}
                        </AccordionSection>
                    </div>

                    {/* PRAWA */}
                    <div style={{flex: 1}}>
                        <h3 style={styles.sectionHeaderPurple}>Opinie</h3>
                        
                        {/* WIDOCZNOŚĆ TYLKO DLA USER */}
                        {user?.role === 'user' ? (
                            userHasReviewed ? (
                                // SCENARIUSZ: USER JUŻ OCENIŁ (BLOKADA + INFO)
                                <div style={styles.alreadyReviewedBox}>
                                    <span className="material-symbols-outlined" style={{fontSize: '20px'}}>check_circle</span>
                                    <div>
                                        <strong>Dodałeś już opinię dla tej szkoły.</strong>
                                        <div style={{marginTop:'4px', fontSize:'13px'}}>Dziękujemy! Jeśli chcesz ją zmienić, możesz to zrobić w swoim profilu.</div>
                                    </div>
                                </div>
                            ) : (
                                // --- SCENARIUSZ: FORMULARZ ---
                                <div style={styles.reviewInputBox}>
                                    <div style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <span style={{fontSize:'14px', fontWeight:'bold'}}>Twoja ocena:</span>
                                        <InteractiveStars rating={newReviewRating} setRating={setNewReviewRating} />
                                    </div>
                                    <textarea 
                                        style={styles.reviewTextarea} 
                                        placeholder="Napisz co sądzisz o szkole..."
                                        value={newReviewText}
                                        onChange={(e) => {
                                            setNewReviewText(e.target.value);
                                            if (reviewError) setReviewError(null);
                                        }}
                                    />
                                    
                                    {/* Wyświetlanie błędu nad przyciskiem */}
                                    {reviewError && <div style={styles.errorText}>{reviewError}</div>}

                                    <button 
                                        style={styles.submitBtn} 
                                        onClick={handleSubmitReview}
                                        disabled={submittingReview}
                                    >
                                        {submittingReview ? 'Wysyłanie...' : 'Opublikuj'}
                                    </button>
                                </div>
                            )
                        ) : (
                            <div style={{marginBottom:'20px', padding:'15px', backgroundColor:'#f0f0f0', borderRadius:'8px', color:'#555', fontSize:'13px', textAlign:'center'}}>
                                {user?.role === 'owner' ? "Jako szkoła nie możesz wystawiać opinii." : "Zaloguj się jako tancerz, aby wystawić opinię."}
                            </div>
                        )}

                        <div style={styles.reviewsList}>
                            {reviews.length > 0 ? reviews.map(rev => (
                                <div key={rev.id} style={styles.reviewItem}>
                                    <div style={{display:'flex', justifyContent:'space-between'}}>
                                        <strong>{rev.username}</strong>
                                        <span style={{color:'#999', fontSize:'12px'}}>{new Date(rev.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <StarRating rating={rev.rating} size="14px"/>
                                    <p style={{marginTop:'5px', fontSize:'14px'}}>{rev.description}</p>
                                </div>
                            )) : <p style={{color:'#999'}}>Brak opinii.</p>}
                        </div>
                    </div>

                </div>

            </div>

            {/* --- POPUP ZAJĘĆ --- */}
            {selectedClass && (
                <ClassDetailsPopup 
                    cls={selectedClass} 
                    schoolName={school.name}
                    schoolStyles={school.styles}
                    rooms={rooms}
                    allInstructors={school.instructors}
                    navigate={navigate}
                    onClose={() => setSelectedClass(null)} 
                />
            )}

            {/* --- POPUP CENNIKA --- */}
            {selectedPriceItem && (
                <PriceDetailsPopup 
                    item={selectedPriceItem} 
                    onClose={() => setSelectedPriceItem(null)} 
                />
            )}
        </div>
    );
};


const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '60px', fontFamily: "'Inter', sans-serif" },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#555' },
    
    backButtonWrapper: { width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'flex-start', padding: '30px 20px 10px 20px' },
    backArrow: { fontSize: '32px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },

    mainCard: { width: '100%', maxWidth: '1200px', backgroundColor: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },

    topSection: { display: 'flex', gap: '40px', marginBottom: '40px', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
    infoColumn: { flex: 1.5, minWidth: '400px' },
    galleryColumn: { flex: 2, minWidth: '400px' }, 

    logoRow: { display: 'flex', gap: '25px', alignItems: 'center', marginBottom: '25px' },
    logoWrapper: { width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #eee', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    logo: { width: '100%', height: '100%', objectFit: 'cover' }, 
    
    placeholderLogo: { 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#eee', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        fontSize: '50px', 
        color: '#888', 
        fontWeight: 'bold' 
    },
    
    schoolName: { fontSize: '32px', fontWeight: '800', color: '#333', margin: '0 0 10px 0', lineHeight: 1.1 },
    addressBox: { display: 'flex', alignItems: 'center', gap: '8px', color: '#555', marginTop: '10px', fontSize: '15px' },

    contactGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' },
    contactItemLink: { display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#333', fontSize: '13px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #eee', transition: '0.2s', fontWeight: '500', maxWidth: '48%', cursor: 'pointer' },
    contactItemText: { display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontSize: '13px', padding: '8px 12px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', fontWeight: '500', maxWidth: '48%' },
    longLink: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', display: 'inline-block', verticalAlign: 'middle' },
    
    newsBox: { marginTop: '25px', padding: '15px', backgroundColor: '#fff0f0', borderLeft: '4px solid #d32f2f', borderRadius: '6px', color: '#d32f2f', fontSize: '14px', lineHeight: '1.5' },

    galleryWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
    galleryTrack: { display: 'flex', overflowX: 'auto', gap: '15px', paddingBottom: '10px', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', width: '100%' },
    galleryImg: { width: '450px', height: '280px', borderRadius: '12px', objectFit: 'cover', scrollSnapAlign: 'center', border: '1px solid #eee', flexShrink: 0 },
    noGallery: { width: '100%', height: '250px', backgroundColor: '#f9f9f9', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' },
    sliderArrowBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#333', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },

    separator: { width: '100%', height: '1px', backgroundColor: '#e0e0e0', margin: '40px 0' },

    sectionContainer: { marginBottom: '40px' },
    sectionHeaderPurple: { fontSize: '24px', fontWeight: '800', color: '#7A33E3', marginBottom: '20px' },
    
    roomTabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
    roomTab: { padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' },

    scheduleGridWrapper: { overflowX: 'auto', paddingBottom: '10px' },
    scheduleGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', minWidth: '1000px' },
    
    dayColumn: { backgroundColor: '#EAEAEA', borderRadius: '10px', padding: '10px', minHeight: '300px' },
    dayHeader: { textAlign: 'center', fontWeight: '800', color: '#7A33E3', marginBottom: '15px', fontSize: '13px' },
    dayContent: { display: 'flex', flexDirection: 'column', gap: '10px' },
    
    classCard: { backgroundColor: 'white', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.1s' },
    classTime: { fontWeight: '700', fontSize: '13px', color: '#333' },
    className: { color: '#000', fontWeight: '700', fontSize: '14px' },
    classMeta: { fontSize: '12px', color: '#555', lineHeight: '1.2' },
    classSubItalic: { fontStyle: 'italic', fontSize: '11px', color: '#888' },

    eventsList: { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' },
    eventCard: { minWidth: '250px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eee', cursor: 'pointer' },
    eventDate: { color: '#7A33E3', fontWeight: '700', marginBottom: '5px' },
    eventName: { fontSize: '16px', fontWeight: '700', marginBottom: '5px' },
    eventSub: { fontStyle: 'italic', color: '#666', fontSize: '13px', marginBottom: '5px' },
    eventInfo: { fontSize: '13px', color: '#444' },

    instructorsGrid: { display: 'flex', gap: '30px', overflowX: 'auto', paddingBottom: '10px' },
    instCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px', cursor: 'pointer', transition: 'transform 0.2s' },
    instAvatar: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
    instPlaceholder: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', color: '#888', marginBottom: '10px' },
    instName: { fontWeight: '600', textAlign: 'center', color: '#333' },

    bottomGrid: { display: 'flex', gap: '50px', flexWrap: 'wrap', alignItems: 'flex-start' },
    priceRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px dashed #eee' },
    
    cardBadge: { backgroundColor: '#7A33E3', color: 'white', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' },
    
    registrationBox: { marginTop: '15px', padding: '15px', backgroundColor: 'rgba(122, 51, 227, 0.1)', borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(122, 51, 227, 0.2)' },

    reviewInputBox: { backgroundColor: '#F9F9F9', padding: '20px', borderRadius: '12px', marginBottom: '30px' },
    reviewTextarea: { width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', fontFamily: 'inherit', resize: 'none' },
    submitBtn: { backgroundColor: '#7A33E3', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', float: 'right' },
    
    errorText: { color: '#d32f2f', fontSize: '13px', fontWeight: '500', marginBottom: '10px', textAlign: 'right' }, // NOWE: Styl błędu
    
    alreadyReviewedBox: { marginBottom: '20px', padding: '20px', backgroundColor: '#E8F5E9', borderRadius: '12px', color: '#2E7D32', fontSize: '14px', border: '1px solid #C8E6C9', display: 'flex', alignItems: 'center', gap: '15px' },

    reviewsList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    reviewItem: { backgroundColor: '#F9F9F9', padding: '20px', borderRadius: '12px' },

    popupOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    popupContent: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
    popupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
    closeBtn: { cursor: 'pointer', fontSize: '28px', color: '#999' },
    popupGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    popupItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px' },
    popupIcon: { color: '#7A33E3', fontSize: '24px' },
    popupActionBtn: { backgroundColor: '#333', color: 'white', border: 'none', padding: '12px 40px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
    
    statusBadgeGreen: { backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #C8E6C9' },
    statusBadgeRed: { backgroundColor: '#FFEBEE', color: '#C62828', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #FFCDD2' },
    
    clickableInstructor: { cursor: 'pointer', color: '#7A33E3', fontWeight: '600', textDecoration: 'underline', padding: '2px 6px', backgroundColor: '#f0f0f0', borderRadius: '4px' }
};

export default School;