import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// --- HELPER DEBOUNCE ---
const debounce = (func, delay) => {
    let timer;
    return function (...args) {
        const context = this;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            func.apply(context, args);
        }, delay);
    };
};

// --- HELPER: NORMALIZACJA TEKSTU ---
const normalizeRegion = (text) => {
    if (!text) return '';
    return text.toLowerCase()
        .replace('województwo', '')
        .replace('powiat', '')
        .replace('gmina', '')
        .replace(/\s+/g, ' ')
        .trim();
};

// --- HELPER: POBIERANIE DANYCH MIASTA (Do Entera) ---
const getCityData = async (query) => {
    if (!query || query.length < 2) return [];
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&countrycodes=pl&limit=1&dedupe=0`);
        const data = await res.json();
        return data.map(item => ({
            display_name: item.display_name.split(',')[0],
            sub_text: item.address?.state,
            full_item: item,
            lat: item.lat,
            lon: item.lon,
            boundingbox: item.boundingbox
        }));
    } catch (err) {
        return [];
    }
};

// --- HELPER: OBLICZANIE ODLEGŁOŚCI ---
const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const Home = () => {
    const navigate = useNavigate();
    
    // --- DANE ---
    const [schools, setSchools] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [allStyles, setAllStyles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentSlide, setCurrentSlide] = useState(0);

    // --- HERO SEARCH ---
    const [heroCityInput, setHeroCityInput] = useState('Cała Polska');
    const [heroCitySuggestions, setHeroCitySuggestions] = useState([]);
    const [showHeroCityDropdown, setShowHeroCityDropdown] = useState(false);
    const [heroSelectedLocation, setHeroSelectedLocation] = useState(null);
    
    // --- CHECKBOX ---
    const [isExtendedRadius, setIsExtendedRadius] = useState(false);

    // --- CONTENT FILTER ---
    const [contentCityInput, setContentCityInput] = useState('Cała Polska');
    const [confirmedContentCity, setConfirmedContentCity] = useState('Cała Polska');
    const [selectedContentLocation, setSelectedContentLocation] = useState(null); 
    const [contentCitySuggestions, setContentCitySuggestions] = useState([]);
    const [showContentCityDropdown, setShowContentCityDropdown] = useState(false);

    // --- MAIN SEARCH ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState({ schools: [], instructors: [], styles: [] });
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // --- WYNIKI ---
    const [topStyles, setTopStyles] = useState([]);
    const [filteredSchools, setFilteredSchools] = useState([]);

    const searchWrapperRef = useRef(null);
    const heroCityWrapperRef = useRef(null);
    const contentCityWrapperRef = useRef(null);

    // 1. POBIERANIE DANYCH
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [schoolsRes, instRes, stylesRes] = await Promise.all([
                    api.get('schools/'),
                    api.get('instructors/'),
                    api.get('styles/')
                ]);
                setSchools(schoolsRes.data.results || schoolsRes.data);
                setInstructors(instRes.data.results || instRes.data);
                setAllStyles(stylesRes.data.results || stylesRes.data);
            } catch (err) {
                console.error("Błąd danych:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        const handleClickOutside = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) setShowSearchDropdown(false);
            if (heroCityWrapperRef.current && !heroCityWrapperRef.current.contains(event.target)) setShowHeroCityDropdown(false);
            if (contentCityWrapperRef.current && !contentCityWrapperRef.current.contains(event.target)) setShowContentCityDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 2. LOGIKA FILTROWANIA
    useEffect(() => {
        if (loading || !schools.length) return;

        setCurrentSlide(0);
        let result = [];

        if (!selectedContentLocation || confirmedContentCity === 'Cała Polska') {
            result = schools;
        } 
        else {
            const item = selectedContentLocation.full_item;
            const addr = item.address || {};
            
            const isStateSearch = addr.state && normalizeRegion(item.name) === normalizeRegion(addr.state);
            const isCountySearch = addr.county && normalizeRegion(item.name) === normalizeRegion(addr.county);
            
            if (isStateSearch) {
                const targetState = normalizeRegion(addr.state);
                result = schools.filter(s => s.state && normalizeRegion(s.state) === targetState);
            }
            else if (isCountySearch) {
                const targetCounty = normalizeRegion(addr.county);
                result = schools.filter(s => s.county && normalizeRegion(s.county) === targetCounty);
            }
            else {
                const userLat = parseFloat(selectedContentLocation.lat);
                const userLon = parseFloat(selectedContentLocation.lon);
                
                let dynamicRadius = 5; 

                if (selectedContentLocation.boundingbox) {
                    const latEdge = parseFloat(selectedContentLocation.boundingbox[1]); 
                    const distToEdge = getDistanceFromLatLonInKm(userLat, userLon, latEdge, userLon);
                    dynamicRadius = Math.max(distToEdge + 2, 5); 
                }

                if (isExtendedRadius) {
                    dynamicRadius += 50; 
                }

                result = schools.filter(s => {
                    if (!s.latitude || !s.longitude) {
                        const targetCity = normalizeRegion(addr.city || addr.town || addr.village || item.name);
                        return s.city && normalizeRegion(s.city) === targetCity;
                    }
                    const dist = getDistanceFromLatLonInKm(userLat, userLon, parseFloat(s.latitude), parseFloat(s.longitude));
                    return dist <= dynamicRadius;
                });
            }
        }

        result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        setFilteredSchools(result);

    }, [selectedContentLocation, confirmedContentCity, schools, loading, isExtendedRadius]);


    // 3. OBLICZANIE TOP STYLÓW
    useEffect(() => {
        const styleCounts = {};
        filteredSchools.forEach(school => {
            if (school.styles && Array.isArray(school.styles)) {
                school.styles.forEach(style => {
                    const name = style.style_name || style.name;
                    if (name) styleCounts[name] = (styleCounts[name] || 0) + 1;
                });
            }
        });

        const sortedStyles = Object.entries(styleCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 9)
            .map(([name]) => name);

        setTopStyles(sortedStyles);
    }, [filteredSchools]);


    // --- NOMINATIM (Z DEDUPLIKACJĄ) ---
    const fetchCities = async (query, target) => {
        if (!query || query.length < 2) return;
        
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&countrycodes=pl&limit=75&dedupe=0`);
            const data = await res.json();

            const suggestions = data.map(item => {
                const allowedTypes = ['city', 'town', 'village', 'hamlet', 'suburb', 'administrative'];
                if (!allowedTypes.includes(item.type)) return null;
                if (item.class !== 'place' && item.class !== 'boundary') return null;

                const addr = item.address;
                const mainName = item.name || addr.city || addr.town || addr.village;
                if (!mainName) return null;

                const municipality = addr.municipality || ''; 
                const county = addr.county || ''; 
                const state = addr.state || '';

                const extraInfo = [];
                if (item.name === state) { } 
                else if (item.name === county) { extraInfo.push(state); } 
                else {
                    if (municipality && municipality !== mainName && !municipality.includes(mainName)) {
                        extraInfo.push(`gm. ${municipality.replace('Gmina ', '')}`);
                    }
                    if (county && county !== mainName) extraInfo.push(county);
                    if (state) extraInfo.push(state);
                }

                return {
                    display_name: mainName,
                    sub_text: extraInfo.join(', '), 
                    full_item: item, 
                    lat: item.lat,
                    lon: item.lon,
                    boundingbox: item.boundingbox 
                };
            }).filter(item => item !== null);

            const unique = [];
            const seen = new Set();
            suggestions.forEach(s => {
                const key = `${s.display_name}|${s.sub_text}`;
                if (!seen.has(key)) { seen.add(key); unique.push(s); }
            });

            if (target === 'hero') {
                setHeroCitySuggestions(unique);
                setShowHeroCityDropdown(true);
            } else {
                setContentCitySuggestions(unique);
                setShowContentCityDropdown(true);
            }
        } catch (err) {
            console.error("Błąd Nominatim:", err);
        }
    };

    const debouncedCitySearch = useRef(debounce(fetchCities, 500)).current;

    // --- HANDLERY ---
    const handleHeroCityInput = (e) => {
        setHeroCityInput(e.target.value);
        debouncedCitySearch(e.target.value, 'hero');
    };
    const selectHeroCity = (item) => {
        if (item === 'Cała Polska') {
            setHeroCityInput('Cała Polska');
            setHeroSelectedLocation(null);
        } else {
            setHeroCityInput(item.display_name);
            setHeroSelectedLocation(item);
        }
        setShowHeroCityDropdown(false);
    };

    const handleContentCityInput = (e) => {
        setContentCityInput(e.target.value);
        debouncedCitySearch(e.target.value, 'content');
    };
    
    const selectContentCity = (item) => {
        if (item === 'Cała Polska') {
            setContentCityInput('Cała Polska');
            setConfirmedContentCity('Cała Polska'); 
            setSelectedContentLocation(null);
        } else {
            setContentCityInput(item.display_name);
            setConfirmedContentCity(item.display_name); 
            setSelectedContentLocation(item);
        }
        setShowContentCityDropdown(false);
    };

    // --- NAWIGACJA DO WYNIKÓW ---
    const goToSearch = (query, locationObj, cityString) => {
        let url = `/search?q=${encodeURIComponent(query)}&city=${encodeURIComponent(cityString)}`;
        
        // Dodajemy parametry geo TYLKO jeśli mamy obiekt locationObj i nie jest to Cała Polska
        if (locationObj && cityString !== 'Cała Polska') {
            url += `&lat=${locationObj.lat}&lon=${locationObj.lon}`;
            if (locationObj.boundingbox) {
                url += `&bbox=${locationObj.boundingbox.join(',')}`;
            }
            if (locationObj.full_item?.address?.state === locationObj.display_name || locationObj.full_item?.address?.county === locationObj.display_name) {
                url += `&type=region`;
            }
            if (isExtendedRadius) {
                url += `&radius=50`;
            }
        }
        navigate(url);
    };

    const handleMainSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length < 2) { setShowSearchDropdown(false); return; }
        
        const lowerQ = query.toLowerCase();
        const foundSchools = schools.filter(s => s.name.toLowerCase().includes(lowerQ)).slice(0, 3);
        const foundInstructors = instructors.filter(i => (i.first_name + ' ' + i.last_name + ' ' + (i.pseudonym || '')).toLowerCase().includes(lowerQ)).slice(0, 3);
        const foundStyles = allStyles.filter(s => s.style_name.toLowerCase().includes(lowerQ)).slice(0, 3);

        setSearchSuggestions({ schools: foundSchools, instructors: foundInstructors, styles: foundStyles });
        setShowSearchDropdown(true);
    };

    // --- KLIKNIĘCIE W WYNIK Z LISTY ---
    const handleResultClick = (type, item) => {
        if (type === 'school') {
            navigate(`/school/${item.id}`); 
        } 
        else if (type === 'instructor') {
            navigate(`/instructor/${item.id}`);
        } 
        else if (type === 'style') {
            // Wpisujemy styl i chowamy dropdown
            setSearchQuery(item.style_name);
            setShowSearchDropdown(false);
        }
    };

    // --- !!! KLUCZOWA POPRAWKA ENTERA !!! ---
    const handleEnterSearch = async () => {
        let loc = heroSelectedLocation;
        let cityStr = heroCityInput;

        // Jeśli user wpisał tekst (np. "Wroc"), ale nie wybrał z listy -> pobieramy pierwszy wynik
        if (!loc && cityStr !== 'Cała Polska' && cityStr.length > 1) {
            const suggestions = await getCityData(cityStr);
            if (suggestions.length > 0) {
                loc = suggestions[0]; // Bierzemy pierwszy lepszy wynik (Wrocław, dolnośląskie)
                cityStr = loc.display_name;
            }
        }

        // Teraz 'loc' na pewno ma dane (lat, lon, bbox), jeśli miasto istnieje
        goToSearch(searchQuery, loc, cityStr);
    };

    const nextSlide = () => { if (currentSlide < filteredSchools.length - 3) setCurrentSlide(currentSlide + 1); };
    const prevSlide = () => { if (currentSlide > 0) setCurrentSlide(currentSlide - 1); };

    return (
        <div style={styles.container}>
            
            <div style={styles.heroSection}>
                <h1 style={styles.heroTitle}>Znajdź zajęcia taneczne idealne dla siebie!</h1>
                
                <div style={styles.searchBarContainer}>
                    <div style={{flex: 2, position: 'relative'}} ref={searchWrapperRef}>
                        <input 
                            type="text" 
                            placeholder="Wyszukaj (styl, studio, instruktor)" 
                            style={styles.searchInput}
                            value={searchQuery}
                            onChange={handleMainSearch}
                            onKeyDown={(e) => e.key === 'Enter' && handleEnterSearch()}
                            onFocus={() => searchQuery.length > 1 && setShowSearchDropdown(true)}
                        />
                        {showSearchDropdown && (
                            <div style={styles.searchDropdown}>
                                {searchSuggestions.instructors.length > 0 && (
                                    <>
                                        <div style={styles.dropdownHeader}>Instruktorzy</div>
                                        {searchSuggestions.instructors.map(i => (
                                            <div key={i.id} style={styles.resultItem} onClick={() => handleResultClick('instructor', i)}>
                                                {i.photo ? (
                                                    <img src={i.photo} style={styles.resultAvatarImg} alt={`${i.first_name}`} />
                                                ) : (
                                                    <div style={styles.resultAvatar}>{i.first_name[0]}</div>
                                                )}
                                                <div style={styles.resultText}>
                                                    <span style={{fontWeight:'600'}}>{i.first_name} {i.last_name}</span>
                                                    {i.pseudonym && <span style={{fontSize:'12px', color:'#777'}}> "{i.pseudonym}"</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {searchSuggestions.schools.length > 0 && (
                                    <>
                                        <div style={styles.dropdownHeader}>Szkoły</div>
                                        {searchSuggestions.schools.map(s => (
                                            <div key={s.id} style={styles.resultItem} onClick={() => handleResultClick('school', s)}>
                                                {s.logo ? <img src={s.logo} style={styles.resultAvatarImg} alt="" /> : <div style={styles.resultAvatar}>{s.name[0]}</div>}
                                                <div style={styles.resultText}><span style={{fontWeight:'600'}}>{s.name}</span></div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {searchSuggestions.styles.length > 0 && (
                                    <>
                                        <div style={styles.dropdownHeader}>Style</div>
                                        {searchSuggestions.styles.map(s => (
                                            <div key={s.id} style={styles.resultItem} onClick={() => handleResultClick('style', s)}>
                                                <span className="material-symbols-outlined" style={{marginRight:'10px', color:'#7A33E3'}}>music_note</span>
                                                <div style={styles.resultText}>{s.style_name}</div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {searchSuggestions.instructors.length === 0 && searchSuggestions.schools.length === 0 && searchSuggestions.styles.length === 0 && (
                                    <div style={{padding:'15px', color:'#999'}}>Brak wyników</div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div style={styles.locationWrapper} ref={heroCityWrapperRef}>
                        <span className="material-symbols-outlined" style={styles.locationIcon}>location_on</span>
                        <input 
                            type="text"
                            value={heroCityInput}
                            onChange={handleHeroCityInput}
                            onKeyDown={(e) => e.key === 'Enter' && handleEnterSearch()}
                            onFocus={() => { setShowHeroCityDropdown(true); if(heroCityInput === 'Cała Polska') setHeroCityInput(''); }}
                            onBlur={() => { setTimeout(() => { if(heroCityInput === '') setHeroCityInput('Cała Polska'); }, 200); }}
                            placeholder="Cała Polska"
                            style={styles.cityInput}
                        />

                        {showHeroCityDropdown && heroCitySuggestions.length > 0 && (
                            <div style={styles.cityDropdown}>
                                <div style={styles.cityItem} onClick={() => selectHeroCity('Cała Polska')}><strong>Cała Polska</strong></div>
                                {heroCitySuggestions.map((c, idx) => (
                                    <div key={idx} style={styles.cityItem} onClick={() => selectHeroCity(c)}>
                                        <span className="material-symbols-outlined" style={{fontSize: '20px', color: '#555', marginRight: '10px'}}>location_on</span>
                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <strong style={{fontSize:'14px', color: '#333'}}>{c.display_name}</strong>
                                            {c.sub_text && <span style={{fontSize:'11px', color:'#888', marginTop: '2px'}}>{c.sub_text}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button style={styles.searchBtn} onClick={handleEnterSearch}>
                        <span className="material-symbols-outlined">search</span>
                    </button>
                </div>

                <div style={styles.checkboxContainer}>
                    <input 
                        type="checkbox" 
                        id="radius" 
                        style={styles.checkbox} 
                        checked={isExtendedRadius}
                        onChange={(e) => setIsExtendedRadius(e.target.checked)}
                    />
                    <label htmlFor="radius" style={styles.checkboxLabel}>+50km (od centrum miejscowości)</label>
                </div>

                <div style={styles.separator}></div>

                <div style={{position: 'relative', marginTop: '20px'}} ref={contentCityWrapperRef}>
                    <div style={styles.currentLocationPill} onClick={() => setShowContentCityDropdown(!showContentCityDropdown)}>
                        <span className="material-symbols-outlined">location_on</span>
                        <input 
                            style={styles.pillInput}
                            value={contentCityInput}
                            onChange={handleContentCityInput}
                            placeholder="Wpisz miasto..."
                            onFocus={() => { setShowContentCityDropdown(true); if(contentCityInput === 'Cała Polska') setContentCityInput(''); }}
                        />
                    </div>

                    {showContentCityDropdown && contentCitySuggestions.length > 0 && (
                        <div style={styles.pillDropdown}>
                            <div style={styles.cityItem} onClick={() => selectContentCity('Cała Polska')}><strong>Cała Polska</strong></div>
                            {contentCitySuggestions.map((c, idx) => (
                                <div key={idx} style={styles.cityItem} onClick={() => selectContentCity(c)}>
                                    <span className="material-symbols-outlined" style={{fontSize: '20px', color: '#555', marginRight: '10px'}}>location_on</span>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <strong style={{fontSize:'14px', color: '#333'}}>{c.display_name}</strong>
                                        {c.sub_text && <span style={{fontSize:'11px', color:'#888', marginTop: '2px'}}>{c.sub_text}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    Najpopularniejsze style w {confirmedContentCity === 'Cała Polska' ? 'Polsce' : <span style={{fontWeight: '700'}}>{confirmedContentCity}</span>}:
                </h2>
                {topStyles.length > 0 ? (
                    <div style={styles.stylesGrid}>
                        {topStyles.map((styleName, index) => (
                            <div key={index} style={styles.styleItem} onClick={() => {
                                goToSearch(styleName, selectedContentLocation, confirmedContentCity);
                            }}>
                                <span className="material-symbols-outlined" style={styles.trendIcon}>trending_up</span>
                                <span style={styles.styleLabel}>{styleName}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={styles.emptyState}>Brak danych o stylach w tym miejscu. Spróbuj zmienić lokalizację na dole.</p>
                )}
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    Najlepiej oceniane szkoły w {confirmedContentCity === 'Cała Polska' ? 'Polsce' : <span style={{fontWeight: '700'}}>{confirmedContentCity}</span>}:
                </h2>
                <div style={styles.sliderContainer}>
                    <button onClick={prevSlide} style={{...styles.arrowBtn, opacity: currentSlide === 0 ? 0.3 : 1}}>
                        <span className="material-symbols-outlined" style={{fontSize: '40px'}}>arrow_back_ios</span>
                    </button>
                    <div style={styles.sliderWindow}>
                        {loading ? <p>Ładowanie...</p> : (
                            filteredSchools.length > 0 ? (
                                <div style={{...styles.cardsRow, transform: `translateX(-${currentSlide * (220 + 20)}px)`}}>
                                    {filteredSchools.map(school => (
                                        <div key={school.id} style={styles.schoolCard} onClick={() => navigate(`/school/${school.id}`)}>
                                            <div style={styles.cardLogoWrapper}>
                                                {school.logo ? <img src={school.logo} alt={school.name} style={styles.cardLogo} /> : <div style={styles.cardLogoPlaceholder}>{school.name[0]}</div>}
                                            </div>
                                            <h3 style={styles.cardTitle}>{school.name}</h3>
                                            <div style={styles.ratingRow}>
                                                {parseFloat(school.average_rating) > 0 ? (
                                                    <>
                                                        <span className="material-symbols-outlined" style={{...styles.starIcon, fontVariationSettings: "'FILL' 1"}}>star</span>
                                                        <span style={styles.ratingVal}>{school.average_rating}</span>
                                                    </>
                                                ) : (
                                                    <span style={{fontSize: '13px', color: '#888'}}>Brak ocen</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p style={styles.emptyState}>Brak szkół w wybranym miejscu.</p>
                        )}
                    </div>
                    <button onClick={nextSlide} style={{...styles.arrowBtn, opacity: currentSlide >= filteredSchools.length - 3 ? 0.3 : 1}}>
                        <span className="material-symbols-outlined" style={{fontSize: '40px'}}>arrow_forward_ios</span>
                    </button>
                </div>
            </div>

            <div style={styles.ctaContainer}>
                <button style={styles.bigCtaBtn} onClick={() => goToSearch('', selectedContentLocation, confirmedContentCity)}>
                    Zobacz wszystkie szkoły tańca w {confirmedContentCity === 'Cała Polska' ? 'Polsce' : confirmedContentCity}
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '60px' },
    heroSection: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px', paddingBottom: '40px' },
    heroTitle: { fontSize: '32px', fontWeight: '400', marginBottom: '40px', color: '#000', textAlign: 'center' },
    
    searchBarContainer: { display: 'flex', width: '100%', maxWidth: '800px', backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: '4px', position: 'relative' },
    searchInput: { width: '100%', padding: '18px 25px', border: 'none', fontSize: '16px', outline: 'none', borderRight: '1px solid #eee' },
    
    locationWrapper: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 15px', position: 'relative', backgroundColor: 'white' },
    locationIcon: { color: '#333', marginRight: '5px' },
    cityInput: { width: '100%', border: 'none', fontSize: '16px', outline: 'none', fontWeight: '500', color: '#333' },
    searchBtn: { backgroundColor: '#7A33E3', border: 'none', width: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },

    searchDropdown: { position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: 'white', border: '1px solid #eee', borderTop: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '400px', overflowY: 'auto' },
    cityDropdown: { position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: 'white', border: '1px solid #eee', borderTop: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '300px', overflowY: 'auto' },
    
    dropdownHeader: { padding: '10px 15px', fontSize: '12px', fontWeight: '700', color: '#555', backgroundColor: '#f9f9f9', textTransform: 'uppercase' },
    resultItem: { display: 'flex', alignItems: 'center', padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' },
    cityItem: { display: 'flex', alignItems: 'center', padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' },
    
    resultAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', marginRight: '12px', color: '#555' },
    resultAvatarImg: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginRight: '12px' },
    resultText: { fontSize: '14px', color: '#333' },

    checkboxContainer: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', width: '100%', maxWidth: '800px', justifyContent: 'flex-end' },
    checkbox: { accentColor: '#7A33E3' },
    checkboxLabel: { fontSize: '13px', color: '#555' },

    separator: { width: '100%', maxWidth: '800px', height: '1px', backgroundColor: '#e0e0e0', marginTop: '30px' },

    currentLocationPill: { backgroundColor: 'white', padding: '10px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', cursor: 'pointer', minWidth: '200px', justifyContent: 'center' },
    pillInput: { border: 'none', outline: 'none', fontWeight: '600', fontSize: '16px', color: '#333', textAlign: 'center', width: '120px', backgroundColor: 'transparent' },
    pillDropdown: { position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', width: '300px', backgroundColor: 'white', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 99, maxHeight: '300px', overflowY: 'auto' },

    section: { width: '100%', maxWidth: '1000px', marginTop: '60px', backgroundColor: 'white', padding: '40px', borderRadius: '0px' },
    sectionTitle: { fontSize: '24px', fontWeight: '400', marginBottom: '40px', color: '#000' },
    emptyState: { color: '#888', fontStyle: 'italic' },

    stylesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' },
    styleItem: { display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', transition: 'transform 0.2s' },
    trendIcon: { color: '#7A33E3', fontSize: '32px' },
    styleLabel: { fontSize: '18px', fontWeight: '400', color: '#333' },

    sliderContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    arrowBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: '10px' },
    sliderWindow: { flex: 1, overflow: 'hidden', padding: '20px 0' },
    cardsRow: { display: 'flex', gap: '20px', transition: 'transform 0.3s ease-in-out' },
    schoolCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px', minWidth: '220px', cursor: 'pointer', transition: 'transform 0.2s' },
    cardLogoWrapper: { width: '140px', height: '140px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' },
    cardLogo: { width: '100%', height: '100%', objectFit: 'cover' },
    cardLogoPlaceholder: { fontSize: '40px', color: '#888' },
    cardTitle: { fontSize: '20px', fontWeight: '500', marginBottom: '8px', textAlign: 'center' },
    ratingRow: { display: 'flex', alignItems: 'center', gap: '5px' },
    starIcon: { color: '#FFD700', fontSize: '20px' },
    ratingVal: { fontWeight: '700', fontSize: '16px' },

    ctaContainer: { marginTop: '60px', width: '100%', display: 'flex', justifyContent: 'center' },
    bigCtaBtn: { backgroundColor: '#7A33E3', color: 'white', padding: '18px 60px', borderRadius: '0px', border: 'none', fontSize: '18px', fontWeight: '600', cursor: 'pointer', width: '100%', maxWidth: '600px' }
};

export default Home;