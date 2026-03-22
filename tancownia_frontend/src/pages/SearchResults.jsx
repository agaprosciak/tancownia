import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';

// NOWY KOMPONENT: Automatycznie zamienia zepsuty obrazek na podanego fallbacka
const ImageWithFallback = ({ src, fallback, ...props }) => {
    const [hasError, setHasError] = useState(false);
    if (!src || hasError) return fallback;
    return <img src={src} onError={() => setHasError(true)} {...props} />;
};

const debounce = (func, delay) => {
    let timer;
    return function (...args) {
        const context = this;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => { timer = null; func.apply(context, args); }, delay);
    };
};

const getCityData = async (query) => {
    if (!query || query.length < 2) return [];
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&countrycodes=pl&limit=5&dedupe=0`);
        const data = await res.json();
        return data.map(item => {
            const allowedTypes = ['city', 'town', 'village', 'hamlet', 'suburb', 'administrative'];
            if (!allowedTypes.includes(item.type)) return null;
            if (item.class !== 'place' && item.class !== 'boundary') return null;
            return { display_name: item.display_name.split(',')[0], sub_text: item.address?.state, full_data: item, lat: item.lat, lon: item.lon, boundingbox: item.boundingbox };
        }).filter(item => item !== null);
    } catch (err) { return []; }
};


const SearchBar = ({ searchQuery, setSearchQuery, searchSuggestions, showSearchDropdown, setShowSearchDropdown, handleMainSearch, handleResultClick, heroCityInput, handleHeroCityInput, heroCitySuggestions, showHeroCityDropdown, selectHeroCity, onSubmit, setShowHeroCityDropdown }) => {
    const searchWrapperRef = useRef(null);
    const heroCityWrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) setShowSearchDropdown(false);
            if (heroCityWrapperRef.current && !heroCityWrapperRef.current.contains(event.target)) setShowHeroCityDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setShowSearchDropdown, setShowHeroCityDropdown]);

    return (
        <div style={styles.searchBarContainer}>
            <div style={{ flex: 2, position: 'relative' }} ref={searchWrapperRef}>
                <input type="text" placeholder="Wyszukaj (styl, studio, instruktor)" style={styles.searchInput} value={searchQuery} onChange={handleMainSearch} onKeyDown={(e) => e.key === 'Enter' && onSubmit()} onFocus={() => searchQuery.length > 1 && setShowSearchDropdown(true)} />
                {showSearchDropdown && (
                    <div style={styles.searchDropdown}>
                        {searchSuggestions.instructors?.length > 0 && (
                            <>
                                <div style={styles.dropdownHeader}>Instruktorzy</div>
                                {searchSuggestions.instructors.map((i) => (
                                    <div key={i.id} style={styles.resultItem} onClick={() => handleResultClick('instructor', i)}>
                                        {/* ZMIANA: ImageWithFallback dla instruktorów w podpowiedziach */}
                                        <ImageWithFallback 
                                            src={i.photo} 
                                            style={styles.resultAvatarImg} 
                                            alt="" 
                                            fallback={<div style={styles.resultAvatar}>{i.first_name?.[0]}</div>} 
                                        />
                                        <div style={styles.resultText}><strong>{i.first_name} {i.last_name}</strong></div>
                                    </div>
                                ))}
                            </>
                        )}
                        {searchSuggestions.schools?.length > 0 && (
                            <>
                                <div style={styles.dropdownHeader}>Szkoły</div>
                                {searchSuggestions.schools.map((s) => (
                                    <div key={s.id} style={styles.resultItem} onClick={() => handleResultClick('school', s)}>
                                        {/* ZMIANA: ImageWithFallback dla szkół w podpowiedziach */}
                                        <ImageWithFallback 
                                            src={s.logo} 
                                            style={styles.resultAvatarImg} 
                                            alt="" 
                                            fallback={<div style={styles.resultAvatar}>{s.name?.[0]}</div>} 
                                        />
                                        <div style={styles.resultText}><strong>{s.name}</strong></div>
                                    </div>
                                ))}
                            </>
                        )}
                        {searchSuggestions.styles?.length > 0 && (<><div style={styles.dropdownHeader}>Style</div>{searchSuggestions.styles.map((s) => (<div key={s.id} style={styles.resultItem} onClick={() => handleResultClick('style', s)}><span className="material-symbols-outlined" style={{ marginRight: 10, color: '#7A33E3' }}>music_note</span><div style={styles.resultText}>{s.style_name}</div></div>))}</>)}
                        {searchSuggestions.instructors?.length === 0 && searchSuggestions.schools?.length === 0 && searchSuggestions.styles?.length === 0 && (<div style={{ padding: 15, color: '#999' }}>Brak wyników</div>)}
                    </div>
                )}
            </div>
            <div style={styles.locationWrapper} ref={heroCityWrapperRef}>
                <span className="material-symbols-outlined" style={styles.locationIcon}>location_on</span>
                <input type="text" value={heroCityInput} onChange={handleHeroCityInput} onKeyDown={(e) => e.key === 'Enter' && onSubmit()} placeholder="Cała Polska" style={styles.cityInput} onFocus={() => { setShowHeroCityDropdown(true); if(heroCityInput === 'Cała Polska') handleHeroCityInput({target: {value: ''}}); }} />
                {showHeroCityDropdown && heroCitySuggestions.length > 0 && (
                    <div style={styles.cityDropdown}>
                        <div style={styles.cityItem} onClick={() => selectHeroCity({ display_name: 'Cała Polska' })}><strong style={{ fontSize: 14 }}>Cała Polska</strong></div>
                        {heroCitySuggestions.map((c, idx) => (<div key={idx} style={styles.cityItem} onClick={() => selectHeroCity(c)}><span className="material-symbols-outlined" style={{ fontSize: 20, color: '#555', marginRight: 10 }}>location_on</span><div style={{ display: 'flex', flexDirection: 'column' }}><strong style={{ fontSize: 14 }}>{c.display_name}</strong>{c.sub_text && <span style={{ fontSize: 11, color: '#888' }}>{c.sub_text}</span>}</div></div>))}
                    </div>
                )}
            </div>
            <button style={styles.searchBtn} onClick={onSubmit}><span className="material-symbols-outlined">search</span></button>
        </div>
    );
};

const StarRating = ({ rating, count }) => {
    const numRating = parseFloat(rating) || 0;
    if (numRating === 0) return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}><span style={{ fontSize: '13px', color: '#777', fontWeight: '500' }}>Brak ocen</span></div>;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFFDF0', padding: '4px 8px', borderRadius: '6px', border: '1px solid #FFF9C4', width: 'fit-content' }}>
            <span className="material-symbols-outlined" style={{ color: '#FFD700', fontVariationSettings: "'FILL' 1", fontSize: '16px' }}>star</span>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>{numRating}</span>
            {count !== undefined && count !== null && <span style={{ color: '#888', fontSize: '12px' }}>({count})</span>}
        </div>
    );
};

const FilterCheckbox = ({ label, checked, onChange }) => (
    <label style={styles.checkboxLabel}>
        <div style={{ width: '18px', height: '18px', borderRadius: '3px', border: checked ? 'none' : '2px solid #ddd', backgroundColor: checked ? '#7A33E3' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', transition: '0.2s', flexShrink: 0 }}>
            {checked && <span className="material-symbols-outlined" style={{color:'white', fontSize:'14px', fontWeight:'bold'}}>check</span>}
        </div>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{display:'none'}} />
        <span style={{lineHeight: '1.4', fontSize: '14px', color: '#333'}}>{label}</span>
    </label>
);

const SearchResults = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [schools, setSchools] = useState([]);
    const [totalResults, setTotalResults] = useState(0);
    
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [locationName, setLocationName] = useState(searchParams.get('city') || 'Cała Polska');
    const [appliedQuery, setAppliedQuery] = useState(searchParams.get('q') || '');
    const [appliedLocation, setAppliedLocation] = useState(searchParams.get('city') || 'Cała Polska');
    const [geoData, setGeoData] = useState({ lat: searchParams.get('lat'), lon: searchParams.get('lon'), bbox: searchParams.get('bbox') });
    const [range50km, setRange50km] = useState(searchParams.get('radius') === '50');

    const [searchType, setSearchType] = useState(searchParams.get('type') || 'all');
    const [selectedStyles, setSelectedStyles] = useState(searchParams.getAll('style'));
    const [age, setAge] = useState(searchParams.get('age') || '');
    const [selectedLevels, setSelectedLevels] = useState(searchParams.getAll('level'));
    const [selectedForms, setSelectedForms] = useState(searchParams.getAll('group_type'));
    const [selectedDays, setSelectedDays] = useState(searchParams.getAll('day'));
    const [selectedCards, setSelectedCards] = useState(() => {
        const cards = [];
        if (searchParams.get('multisport') === 'true') cards.push('multisport');
        if (searchParams.get('medicover') === 'true') cards.push('medicover');
        if (searchParams.get('fitprofit') === 'true') cards.push('fitprofit');
        if (searchParams.get('pzu_sport') === 'true') cards.push('pzu');
        return cards;
    });
    const [timeRange, setTimeRange] = useState({ start: searchParams.get('time_start') || '', end: searchParams.get('time_end') || '' });
    const [sortBy, setSortBy] = useState(() => {
        const ordering = searchParams.get('ordering');
        if (ordering === 'name') return 'alphabet';
        if (ordering === 'date') return 'date'; 
        return 'rating';
    });

    const [allDataForSearch, setAllDataForSearch] = useState({ schools: [], instructors: [], styles: [] });
    const [searchSuggestions, setSearchSuggestions] = useState({ schools: [], instructors: [], styles: [] });
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [dynamicStyles, setDynamicStyles] = useState([]); 
    const [showAllStyles, setShowAllStyles] = useState(false);

    // Listy statyczne
    const levelsList = [{ id: 'BEGINNER', label: 'Od podstaw' }, { id: 'BASIC', label: 'Początkujący' }, { id: 'INTERMEDIATE', label: 'Średniozaaw.', labelFull: 'Średniozaawansowany' }, { id: 'ADVANCED', label: 'Zaawansowany' }, { id: 'PRO', label: 'Profesjonalny' }, { id: 'OPEN', label: 'Open' }];
    const formsList = [{ id: 'FORMATION', label: 'Formacja' }, { id: 'PROJECT', label: 'Projekt' }, { id: 'DANCE_CONTEST', label: 'Grupa turniejowa' }, { id: 'VIDEO_PROJECT', label: 'Video projekt' }];
    const cardsList = [{ id: 'multisport', label: 'MultiSport' }, { id: 'medicover', label: 'Medicover' }, { id: 'pzu', label: 'PZU Sport' }, { id: 'fitprofit', label: 'FitProfit' }];
    const daysList = [{ id: 'mon', label: 'Pon.' }, { id: 'tue', label: 'Wt.' }, { id: 'wed', label: 'Śr.' }, { id: 'thu', label: 'Czw.' }, { id: 'fri', label: 'Pt.' }, { id: 'sat', label: 'Sob.' }, { id: 'sun', label: 'Niedz.' }];

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchInitialData = async () => {
            try {
                const [schoolsRes, instRes, stylesRes] = await Promise.all([
                    api.get('schools/'), api.get('instructors/'), api.get('styles/')
                ]);
                setAllDataForSearch({
                    schools: schoolsRes.data.results || schoolsRes.data,
                    instructors: instRes.data.results || instRes.data,
                    styles: stylesRes.data.results || stylesRes.data
                });
                const sData = stylesRes.data.results || stylesRes.data;
                setDynamicStyles(sData.map(s => s.style_name));
            } catch (err) { console.error("Error data:", err); }
        };
        fetchInitialData();
    }, []);

    // LOGIKA WYSZUKIWANIA I KONWERSJI NA TAGI
    useEffect(() => {
        if (query && dynamicStyles.length > 0) {
            const lowerQuery = query.toLowerCase();
            const matchedStyle = dynamicStyles.find(s => s.toLowerCase() === lowerQuery);
            if (matchedStyle) {
                if (!selectedStyles.includes(matchedStyle)) {
                    setSelectedStyles(prev => [...prev, matchedStyle]);
                }
                setQuery(''); 
                setAppliedQuery('');
            }
        }
    }, [query, dynamicStyles]); 

    const handleSearchSubmit = async () => {
        setShowSearchDropdown(false);
        setShowCityDropdown(false);

        if ((!query || query.trim() === '') && (!locationName || locationName === 'Cała Polska' || locationName.trim() === '')) {
            setSelectedStyles([]);
            setSelectedLevels([]);
            setSelectedForms([]);
            setSelectedDays([]);
            setSelectedCards([]);
            setAge('');
            setTimeRange({ start: '', end: '' });
            setSearchType('all');
            setRange50km(false);

            setAppliedQuery('');
            setAppliedLocation('Cała Polska');
            setLocationName('Cała Polska');
            setGeoData({ lat: null, lon: null, bbox: null });
            return;
        }

        // STANDARDOWE WYSZUKIWANIE
        if (query) setAppliedQuery(query);

        if (locationName && locationName !== 'Cała Polska' && (!geoData.lat || !geoData.bbox || locationName !== appliedLocation)) {
            const suggestions = await getCityData(locationName);
            if (suggestions.length > 0) {
                const top = suggestions[0];
                setLocationName(top.display_name);
                setAppliedLocation(top.display_name);
                setGeoData({ lat: top.lat, lon: top.lon, bbox: top.boundingbox ? top.boundingbox.join(',') : null });
                return;
            }
        } 
        if (locationName === '' || locationName === 'Cała Polska') {
            setAppliedLocation('Cała Polska');
            setGeoData({ lat: null, lon: null, bbox: null });
        } else {
            setAppliedLocation(locationName);
        }
    };

    // AKTUALIZACJA URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (appliedQuery) params.set('q', appliedQuery);
        if (appliedLocation && appliedLocation !== 'Cała Polska') {
            params.set('city', appliedLocation);
            if (geoData.bbox) params.set('bbox', geoData.bbox);
            if (geoData.lat) params.set('lat', geoData.lat);
            if (geoData.lon) params.set('lon', geoData.lon);
        }
        selectedStyles.forEach(s => params.append('style', s));
        selectedLevels.forEach(l => params.append('level', l));
        selectedForms.forEach(f => params.append('group_type', f));
        selectedDays.forEach(d => params.append('day', d));
        if (age) params.set('age', age);
        if (timeRange.start) params.set('time_start', timeRange.start);
        if (timeRange.end) params.set('time_end', timeRange.end);
        if (selectedCards.includes('multisport')) params.set('multisport', 'true');
        if (selectedCards.includes('medicover')) params.set('medicover', 'true');
        if (selectedCards.includes('fitprofit')) params.set('fitprofit', 'true');
        if (selectedCards.includes('pzu')) params.set('pzu_sport', 'true');
        if (range50km) params.set('radius', '50');
        if (searchType !== 'all') params.set('type', searchType);
        if (sortBy === 'alphabet') params.set('ordering', 'name');
        else if (sortBy === 'date') params.set('ordering', 'next_class_date'); 

        setSearchParams(params, { replace: true });
        fetchResults();
    }, [sortBy, selectedStyles, selectedLevels, selectedForms, selectedDays, selectedCards, timeRange, range50km, age, geoData, appliedQuery, appliedLocation, searchType]); 

    const fetchResults = async () => {
        setLoading(true);
        try {
            const params = {
                search: appliedQuery,
                ordering: sortBy === 'rating' ? '-average_rating' : (sortBy === 'alphabet' ? 'name' : (sortBy === 'date' ? 'classes__first_class_date' : '')),
                style: selectedStyles,
                level: selectedLevels,
                group_type: selectedForms,
                day: selectedDays,
                multisport: selectedCards.includes('multisport') ? 'true' : undefined,
                medicover: selectedCards.includes('medicover') ? 'true' : undefined,
                fitprofit: selectedCards.includes('fitprofit') ? 'true' : undefined,
                pzu_sport: selectedCards.includes('pzu') ? 'true' : undefined, 
                age: age || undefined,
                time_start: timeRange.start || undefined,
                time_end: timeRange.end || undefined
            };

            if (searchType === 'periodic') params.periodic = 'true';
            if (searchType === 'event') params.periodic = 'false';

            if (range50km && geoData.lat && geoData.lon) {
                params.lat = geoData.lat;
                params.lon = geoData.lon;
                params.radius = 50; 
            } else if (geoData.bbox) {
                params.bbox = geoData.bbox;
            } else if (appliedLocation !== 'Cała Polska') {
                params.city = appliedLocation;
            }

            const queryString = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => queryString.append(key, v));
                } else if (value !== undefined && value !== '') {
                    queryString.append(key, value);
                }
            });

            const res = await api.get(`schools/?${queryString.toString()}`);
            
            const rawData = res.data.results || res.data;
            // Filtrowanie, tylko PIERWSZE wystąpienie danej szkoły (ID).
            const uniqueSchools = rawData.filter((school, index, self) => 
                index === self.findIndex((s) => s.id === school.id)
            );

            setSchools(uniqueSchools);
            setTotalResults(uniqueSchools.length);

        } catch (err) { console.error("Error search:", err); } finally { setLoading(false); }
    };

    const getFilteredClasses = (school) => {
        if (!school.classes) return [];
        const today = new Date().toISOString().split('T')[0];

        return school.classes.filter(cls => {
            // Ukryj wydarzenia przeszłe
            if (!cls.periodic && cls.first_class_date < today) return false;

            // Filtrowanie typu
            if (searchType === 'periodic' && !cls.periodic) return false;
            if (searchType === 'event' && cls.periodic) return false;

            // Filtry szczegółowe
            if (selectedStyles.length > 0) {
                const styleName = cls.style?.style_name || "";
                if (!selectedStyles.some(s => s.toLowerCase() === styleName.toLowerCase())) return false;
            }
            if (selectedLevels.length > 0 && !selectedLevels.includes(cls.level)) return false;
            if (selectedForms.length > 0 && !selectedForms.includes(cls.group_type)) return false;
            if (age) {
                const ageNum = parseInt(age);
                if (cls.min_age > ageNum || (cls.max_age && cls.max_age < ageNum)) return false;
            }
            if (selectedDays.length > 0) {
                const dayMap = { 'monday': 'mon', 'tuesday': 'tue', 'wednesday': 'wed', 'thursday': 'thu', 'friday': 'fri', 'saturday': 'sat', 'sunday': 'sun' };
                if (!selectedDays.includes(dayMap[cls.day_of_week])) return false;
            }
            if (timeRange.start && cls.starts_at < timeRange.start) return false;
            if (timeRange.end && cls.starts_at > timeRange.end) return false;
            return true;
        });
    };

    // GRUPOWANIE WYNIKÓW
    const { schoolsWithMatches, schoolsNoSchedule } = useMemo(() => {
        const matches = [];
        const noSchedule = [];

        schools.forEach(school => {
            const matchingClasses = getFilteredClasses(school);

            if (matchingClasses.length > 0) {
                // 1. Ma pasujące zajęcia -> POKAZUJEMY NA GÓRZE (Z GRAFIKIEM)
                matches.push({ ...school, matchingClasses });
            } else {
                // 2. Backend zwrócił szkołę, ale nie ma ona konkretnych zajęć pasujących do filtrów
                // (np. ma Zaawansowany, ale nie Commercial, a user zaznaczył oba).
                // WYŚWIETLANIE W "INNE" ŻEBY NIE BYŁO PUSTEGO EKRANU PRZY WYNIKU > 0.
                noSchedule.push(school);
            }
        });

        return { schoolsWithMatches: matches, schoolsNoSchedule: noSchedule };
    }, [schools, selectedStyles, selectedLevels, age, selectedDays, timeRange, selectedForms, searchType, selectedCards]);


    const formatClassLine = (cls) => {
        const styleName = cls.style?.style_name || "Taniec";
        const levelMap = { 'OPEN': 'Open', 'BEGINNER': 'Od podstaw', 'BASIC': 'Początkujący', 'INTERMEDIATE': 'Średniozaaw.', 'ADVANCED': 'Zaawansowany', 'PRO': 'Profesjonalny' };
        const level = levelMap[cls.level] || cls.level;
        const groupTypeMap = { 'FORMATION': 'Formacja', 'PROJECT': 'Projekt', 'DANCE_CONTEST': 'Grupa turniejowa', 'VIDEO_PROJECT': 'Video projekt' };
        const groupType = groupTypeMap[cls.group_type];
        const ageStr = cls.max_age ? `${cls.min_age}-${cls.max_age} lat` : `${cls.min_age}+ lat`;
        
        let dateInfo = "";
        if (cls.periodic) {
            const dayMap = { 'monday': 'Pon.', 'tuesday': 'Wt.', 'wednesday': 'Śr.', 'thursday': 'Czw.', 'friday': 'Pt.', 'saturday': 'Sob.', 'sunday': 'Niedz.' };
            dateInfo = `${dayMap[cls.day_of_week]} ${cls.starts_at.slice(0,5)}`;
        } else {
            const dateObj = new Date(cls.first_class_date);
            dateInfo = `${dateObj.toLocaleDateString()} ${cls.starts_at.slice(0,5)}`;
        }

        const parts = [styleName]; 
        if (cls.subtitle) parts.push(cls.subtitle);
        parts.push(level);
        if (groupType) parts.push(groupType);
        parts.push(ageStr);
        parts.push(dateInfo);

        return (
            <div key={cls.id} style={{fontSize: '13px', color: '#444', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                <span style={{fontWeight: '600', color: '#333'}}>{parts[0]}</span>
                {parts.length > 1 && <span style={{color: '#999'}}> | </span>}
                {parts.slice(1).join(' | ')}
            </div>
        );
    };

    const renderSchoolCard = (school, preCalculatedClasses = null) => {
        const classesToUse = preCalculatedClasses || [];
        const regularClasses = classesToUse.filter(c => c.periodic).slice(0, 3);
        const workshops = classesToUse.filter(c => !c.periodic).slice(0, 3);
        const showClasses = regularClasses.length > 0 || workshops.length > 0;

        return (
            <div key={school.id} style={styles.schoolCard} onClick={() => navigate(`/school/${school.id}`)}>
                <div style={styles.cardImageWrapper}>
                    {/* ZMIANA: ImageWithFallback na liście wyników wyszukiwania */}
                    <ImageWithFallback 
                        src={school.logo} 
                        alt={school.name} 
                        style={styles.cardImage} 
                        fallback={<div style={styles.cardPlaceholder}>{school.name[0]}</div>} 
                    />
                </div>
                <div style={styles.cardInfo}>
                    <div style={{marginBottom: '5px'}}><h3 style={styles.schoolName}>{school.name}</h3><StarRating rating={school.average_rating} count={school.reviews_count} /></div>
                    <div style={styles.addressRow}><span className="material-symbols-outlined" style={{fontSize:'14px', color:'#555'}}>location_on</span>{school.full_address || `${school.city}, ${school.street} ${school.build_no}`}</div>
                    <div style={{fontWeight: '600', color: '#7A33E3', marginBottom: '8px', fontSize:'15px'}}>{school.styles?.slice(0,3).map(s => s.style_name).join(', ')} {school.styles?.length > 3 && `[+${school.styles.length-3}]`}</div>

                    {showClasses && (
                        <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0f0f0'}}>
                            {regularClasses.length > 0 && (
                                <div style={{marginBottom: '10px'}}>
                                    <div style={{fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '3px', textTransform: 'uppercase'}}>KURSY REGULARNE:</div>
                                    {regularClasses.map(cls => formatClassLine(cls))}
                                </div>
                            )}
                            {workshops.length > 0 && (
                                <div style={{marginBottom: '10px'}}>
                                    <div style={{fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '3px', textTransform: 'uppercase'}}>WARSZTATY:</div>
                                    {workshops.map(cls => formatClassLine(cls))}
                                </div>
                            )}
                            <div style={{fontSize: '12px', color: '#7A33E3', marginTop: '5px', fontWeight: '500', textDecoration: 'underline'}}>Zobacz więcej...</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const toggleFilter = (list, setList, item) => { if (list.includes(item)) setList(list.filter(i => i !== item)); else setList([...list, item]); };
    const handleResultClick = (type, item) => { if (type === 'school') navigate(`/school/${item.id}`); else if (type === 'instructor') navigate(`/instructor/${item.id}`); else if (type === 'style') { if (!selectedStyles.includes(item.style_name)) setSelectedStyles(prev => [...prev, item.style_name]); setQuery(item.style_name); setAppliedQuery(item.style_name); setShowSearchDropdown(false); } };
    const handleMainSearch = (e) => { const val = e.target.value; setQuery(val); if (val.length < 2) { setShowSearchDropdown(false); return; } const lowerQ = val.toLowerCase(); setSearchSuggestions({ schools: allDataForSearch.schools.filter(s => s.name.toLowerCase().includes(lowerQ)).slice(0, 3), instructors: allDataForSearch.instructors.filter(i => (i.first_name + ' ' + i.last_name).toLowerCase().includes(lowerQ)).slice(0, 3), styles: allDataForSearch.styles.filter(s => s.style_name.toLowerCase().includes(lowerQ)).slice(0, 3) }); setShowSearchDropdown(true); };
    const handleHeroCityInput = (e) => { const val = e.target.value; setLocationName(val); if (val === '' || val === 'Cała Polska') { setGeoData({ lat: null, lon: null, bbox: null }); } debouncedCitySearch(val); };
    const debouncedCitySearch = useRef(debounce(async (val) => { if (!val || val.length < 2) return; try { const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&addressdetails=1&countrycodes=pl&limit=75&dedupe=0`); const data = await res.json(); const suggestions = data.map(item => { const allowedTypes = ['city', 'town', 'village', 'hamlet', 'suburb', 'administrative']; if (!allowedTypes.includes(item.type)) return null; if (item.class !== 'place' && item.class !== 'boundary') return null; return { display_name: item.display_name.split(',')[0], sub_text: item.address?.state, full_data: item, lat: item.lat, lon: item.lon, boundingbox: item.boundingbox }; }).filter(item => item !== null); const unique = []; const seen = new Set(); suggestions.forEach(s => { const key = `${s.display_name}|${s.sub_text}`; if (!seen.has(key)) { seen.add(key); unique.push(s); } }); setCitySuggestions(unique); setShowCityDropdown(true); } catch (e) {} }, 500)).current;
    const selectCity = (item) => { setShowCityDropdown(false); if (item.display_name === 'Cała Polska') { setLocationName('Cała Polska'); setAppliedLocation('Cała Polska'); setGeoData({ lat: null, lon: null, bbox: null }); } else { setLocationName(item.display_name); setAppliedLocation(item.display_name); setGeoData({ lat: item.lat, lon: item.lon, bbox: item.boundingbox ? item.boundingbox.join(',') : null }); } };

    return (
        <div style={styles.container}>
            <div style={styles.topBarWrapper}>
                <div style={styles.heroSection}>
                    <SearchBar 
                        searchQuery={query} setSearchQuery={setQuery}
                        searchSuggestions={searchSuggestions} showSearchDropdown={showSearchDropdown} setShowSearchDropdown={setShowSearchDropdown}
                        handleMainSearch={handleMainSearch} handleResultClick={handleResultClick}
                        heroCityInput={locationName} handleHeroCityInput={handleHeroCityInput}
                        heroCitySuggestions={citySuggestions} showHeroCityDropdown={showCityDropdown} setShowHeroCityDropdown={setShowCityDropdown}
                        selectHeroCity={selectCity} onSubmit={handleSearchSubmit}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', width: '100%', maxWidth: '800px', justifyContent: 'flex-end' }}>
                        <input type="checkbox" id="radius" style={{ accentColor: '#7A33E3' }} checked={range50km} onChange={(e) => setRange50km(e.target.checked)} />
                        <label htmlFor="radius" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>+50km (od centrum miejscowości)</label>
                    </div>
                </div>
            </div>

            <div style={styles.mainGrid}>
                <aside style={styles.sidebar}>
                    <div style={styles.filtersContainer}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#000' }}>Filtry</h2>
                        <div style={styles.filterSection}>
                            <h4 style={styles.filterTitle}>Styl</h4>
                            <div style={styles.filterList}>{(showAllStyles ? dynamicStyles : dynamicStyles.slice(0, 4)).map(s => (<FilterCheckbox key={s} label={s} checked={selectedStyles.includes(s)} onChange={() => toggleFilter(selectedStyles, setSelectedStyles, s)} />))}</div>
                            {dynamicStyles.length > 4 && (<div style={styles.showMore} onClick={() => setShowAllStyles(!showAllStyles)}>{showAllStyles ? 'Pokaż mniej' : 'Pokaż więcej'} <span className="material-symbols-outlined" style={{fontSize:'18px'}}>expand_more</span></div>)}
                        </div>
                        <div style={styles.filterSection}><h4 style={styles.filterTitle}>Wiek uczestnika</h4><input type="number" min="0" placeholder="np. 25" style={styles.grayInput} value={age} onChange={(e) => { const val = e.target.value; if (val === '' || parseInt(val) >= 0) setAge(val); }} /></div>
                        <div style={styles.filterSection}><h4 style={styles.filterTitle}>Poziom</h4><div style={styles.filterList}>{levelsList.map(lvl => ( <FilterCheckbox key={lvl.id} label={lvl.label} checked={selectedLevels.includes(lvl.id)} onChange={() => toggleFilter(selectedLevels, setSelectedLevels, lvl.id)} /> ))}</div></div>
                        <div style={styles.filterSection}><h4 style={styles.filterTitle}>Forma zajęć</h4><div style={styles.filterList}>{formsList.map(f => ( <FilterCheckbox key={f.id} label={f.label} checked={selectedForms.includes(f.id)} onChange={() => toggleFilter(selectedForms, setSelectedForms, f.id)} /> ))}</div></div>
                        <div style={styles.filterSection}><h4 style={styles.filterTitle}>Karty partnerskie</h4><div style={styles.filterList}>{cardsList.map(c => ( <FilterCheckbox key={c.id} label={c.label} checked={selectedCards.includes(c.id)} onChange={() => toggleFilter(selectedCards, setSelectedCards, c.id)} /> ))}</div></div>
                        <div style={styles.filterSection}><h4 style={styles.filterTitle}>Dzień tygodnia</h4><div style={styles.filterList}>{daysList.map(d => ( <FilterCheckbox key={d.id} label={d.label} checked={selectedDays.includes(d.id)} onChange={() => toggleFilter(selectedDays, setSelectedDays, d.id)} /> ))}</div></div>
                        <div style={styles.filterSection}><h4 style={styles.filterTitle}>Godziny</h4><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><input type="time" style={styles.timeInput} value={timeRange.start} onChange={(e) => setTimeRange({...timeRange, start: e.target.value})} /><span>-</span><input type="time" style={styles.timeInput} value={timeRange.end} onChange={(e) => setTimeRange({...timeRange, end: e.target.value})} /></div></div>
                        <button style={styles.applyBtn} onClick={fetchResults}>Filtruj</button>
                    </div>
                </aside>

                <main style={styles.resultsContent}>
                    <div style={styles.resultsHeader}>
                        <div style={{ fontSize: '14px', color: '#555' }}>
                            Wyniki wyszukiwania: {schoolsWithMatches.length + schoolsNoSchedule.length}
                        </div>
                        <div style={styles.sortWrapper}>
                            <span className="material-symbols-outlined" style={{color:'#7A33E3', fontSize:'18px'}}>sort</span>
                            <span style={{color: '#7A33E3', fontWeight:'600', fontSize:'14px'}}>Sortuj:</span>
                            <select style={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="rating">Najlepiej oceniane</option>
                                <option value="alphabet">Alfabetycznie</option>
                                {searchType === 'event' && <option value="date">Najbliższe zajęcia</option>}
                            </select>
                        </div>
                    </div>

                    <div style={styles.typeToggleContainer}>
                        <button style={searchType === 'all' ? styles.typeBtnActive : styles.typeBtn} onClick={() => setSearchType('all')}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>calendar_today</span>Wszystkie</button>
                        <button style={searchType === 'periodic' ? styles.typeBtnActive : styles.typeBtn} onClick={() => setSearchType('periodic')}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>update</span>Kursy regularne</button>
                        <button style={searchType === 'event' ? styles.typeBtnActive : styles.typeBtn} onClick={() => setSearchType('event')}><span className="material-symbols-outlined" style={{fontSize: '18px'}}>event_note</span>Warsztaty, wydarzenia</button>
                    </div>

                    <div style={styles.list}>
                        {loading ? <div style={{padding:'40px', textAlign:'center', color:'#888'}}>Ładowanie...</div> : 
                        (schoolsWithMatches.length === 0 && schoolsNoSchedule.length === 0) ? <div style={styles.emptyState}>Brak wyników spełniających kryteria.</div> : 
                        (
                            <>
                                {schoolsWithMatches.map(school => renderSchoolCard(school, school.matchingClasses))}

                                {schoolsNoSchedule.length > 0 && (
                                    <>
                                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '30px', marginBottom: '15px', color: '#333' }}>
                                            Szkoły w tej lokalizacji (brak zajęć pasujących do wszystkich filtrów)
                                        </h2>
                                        {schoolsNoSchedule.map(school => renderSchoolCard(school, []))}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' },
    topBarWrapper: { backgroundColor: 'transparent', padding: '30px 0', display: 'flex', justifyContent: 'center' },
    heroSection: { width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    searchBarContainer: { display: 'flex', width: '100%', maxWidth: 800, backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 4, position: 'relative' },
    searchInput: { width: '100%', padding: '18px 25px', border: 'none', fontSize: 16, outline: 'none', borderRight: '1px solid #eee' },
    locationWrapper: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 15px', position: 'relative' },
    locationIcon: { color: '#333', marginRight: 5 },
    cityInput: { width: '100%', border: 'none', fontSize: 16, outline: 'none', fontWeight: 500, color: '#333' },
    searchBtn: { backgroundColor: '#7A33E3', border: 'none', width: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },
    searchDropdown: { position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: 'white', border: '1px solid #eee', borderTop: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 400, overflowY: 'auto' },
    cityDropdown: { position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: 'white', border: '1px solid #eee', borderTop: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 300, overflowY: 'auto' },
    dropdownHeader: { padding: '10px 15px', fontSize: 12, fontWeight: 700, color: '#555', backgroundColor: '#f9f9f9', textTransform: 'uppercase' },
    resultItem: { display: 'flex', alignItems: 'center', padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' },
    cityItem: { display: 'flex', alignItems: 'center', padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' },
    resultAvatar: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', marginRight: 12, color: '#555' },
    resultAvatarImg: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 12 },
    resultText: { fontSize: 14, color: '#333' },
    mainGrid: { display: 'flex', maxWidth: '1200px', margin: '20px auto 0', gap: '40px', padding: '0 20px', alignItems: 'flex-start' },
    sidebar: { width: '260px', flexShrink: 0, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
    filtersContainer: { display: 'flex', flexDirection: 'column' },
    filterSection: { marginBottom: '25px' },
    filterTitle: { fontSize: '15px', fontWeight: '600', marginBottom: '10px', color: '#333' },
    filterList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    grayInput: { width: '100%', padding: '8px 12px', borderRadius: '4px', border: 'none', fontSize: '14px', backgroundColor: '#f0f0f0', boxSizing: 'border-box', outline: 'none', color: '#333' },
    timeInput: { width: '80px', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '13px', backgroundColor: '#f0f0f0', textAlign: 'center' },
    checkboxLabel: { display: 'flex', alignItems: 'center', fontSize: '14px', color: '#333', cursor: 'pointer' },
    showMore: { fontSize: '13px', color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', marginTop: '5px' },
    applyBtn: { width: '100%', padding: '12px', backgroundColor: '#7A33E3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' },
    resultsContent: { flex: 1 },
    resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    sortWrapper: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    sortSelect: { border: 'none', outline: 'none', fontWeight: '600', fontSize: '13px', color: '#333', cursor: 'pointer' },
    typeToggleContainer: { display: 'flex', gap: '0px', marginBottom: '20px', backgroundColor: '#7A33E3', borderRadius: '4px', padding: '0', width: 'fit-content' },
    typeBtn: { flex: 1, padding: '10px 20px', border: 'none', backgroundColor: 'transparent', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7, transition: '0.2s' },
    typeBtnActive: { flex: 1, padding: '10px 20px', border: 'none', backgroundColor: 'white', color: '#7A33E3', cursor: 'default', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '2px', margin: '2px' },
    list: { display: 'flex', flexDirection: 'column', gap: '20px' },
    emptyState: { textAlign: 'center', padding: '50px', color: '#777' },
    schoolCard: { display: 'flex', backgroundColor: 'white', borderRadius: '4px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'transform 0.2s', gap: '20px', border: '1px solid #f0f0f0' },
    cardImageWrapper: { width: '140px', height: '140px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid #eee' },
    cardImage: { width: '100%', height: '100%', objectFit: 'cover' },
    cardPlaceholder: { width: '100%', height: '100%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#888' },
    cardInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
    schoolName: { fontSize: '20px', fontWeight: '700', color: '#7A33E3', margin: 0, lineHeight: '1.2' },
    addressRow: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#555', marginBottom: '10px' },
};

export default SearchResults;