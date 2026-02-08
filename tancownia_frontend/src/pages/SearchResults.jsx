import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

// ==========================================
// 1. SEARCHBAR (BEZ ZMIAN - TAK JAK CHCIAŁEŚ)
// ==========================================
const SearchBar = ({
    searchQuery, setSearchQuery, searchSuggestions, showSearchDropdown, setShowSearchDropdown,
    handleMainSearch, handleResultClick, heroCityInput, handleHeroCityInput,
    heroCitySuggestions, showHeroCityDropdown, selectHeroCity, onSubmit, setShowHeroCityDropdown
}) => {
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
                <input
                    type="text" placeholder="Wyszukaj (styl, studio, instruktor)" style={styles.searchInput}
                    value={searchQuery} onChange={handleMainSearch}
                    onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                    onFocus={() => searchQuery.length > 1 && setShowSearchDropdown(true)}
                />
                {showSearchDropdown && (
                    <div style={styles.searchDropdown}>
                        {searchSuggestions.instructors?.length > 0 && (
                            <>
                                <div style={styles.dropdownHeader}>Instruktorzy</div>
                                {searchSuggestions.instructors.map((i) => (
                                    <div key={i.id} style={styles.resultItem} onClick={() => handleResultClick('instructor', i)}>
                                        {i.photo ? <img src={i.photo} style={styles.resultAvatarImg} alt="" /> : <div style={styles.resultAvatar}>{i.first_name?.[0]}</div>}
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
                                        {s.logo ? <img src={s.logo} style={styles.resultAvatarImg} alt="" /> : <div style={styles.resultAvatar}>{s.name?.[0]}</div>}
                                        <div style={styles.resultText}><strong>{s.name}</strong></div>
                                    </div>
                                ))}
                            </>
                        )}
                        {searchSuggestions.styles?.length > 0 && (
                            <>
                                <div style={styles.dropdownHeader}>Style</div>
                                {searchSuggestions.styles.map((s) => (
                                    <div key={s.id} style={styles.resultItem} onClick={() => handleResultClick('style', s)}>
                                        <span className="material-symbols-outlined" style={{ marginRight: 10, color: '#7A33E3' }}>music_note</span>
                                        <div style={styles.resultText}>{s.style_name}</div>
                                    </div>
                                ))}
                            </>
                        )}
                        {searchSuggestions.instructors?.length === 0 && searchSuggestions.schools?.length === 0 && searchSuggestions.styles?.length === 0 && (
                            <div style={{ padding: 15, color: '#999' }}>Brak wyników</div>
                        )}
                    </div>
                )}
            </div>
            <div style={styles.locationWrapper} ref={heroCityWrapperRef}>
                <span className="material-symbols-outlined" style={styles.locationIcon}>location_on</span>
                <input
                    type="text" value={heroCityInput} onChange={handleHeroCityInput}
                    onKeyDown={(e) => e.key === 'Enter' && onSubmit()} placeholder="Cała Polska" style={styles.cityInput}
                    onFocus={() => { setShowHeroCityDropdown(true); if(heroCityInput === 'Cała Polska') handleHeroCityInput({target: {value: ''}}); }}
                />
                {showHeroCityDropdown && heroCitySuggestions.length > 0 && (
                    <div style={styles.cityDropdown}>
                        <div style={styles.cityItem} onClick={() => selectHeroCity({ display_name: 'Cała Polska' })}><strong style={{ fontSize: 14 }}>Cała Polska</strong></div>
                        {heroCitySuggestions.map((c, idx) => (
                            <div key={idx} style={styles.cityItem} onClick={() => selectHeroCity(c)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#555', marginRight: 10 }}>location_on</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ fontSize: 14 }}>{c.display_name}</strong>
                                    {c.sub_text && <span style={{ fontSize: 11, color: '#888' }}>{c.sub_text}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <button style={styles.searchBtn} onClick={onSubmit}><span className="material-symbols-outlined">search</span></button>
        </div>
    );
};

// ==========================================
// 2. KOMPONENTY UI (CHECKBOX, RATING)
// ==========================================
const StarRating = ({ rating, count }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFFDF0', padding: '4px 8px', borderRadius: '6px', border: '1px solid #FFF9C4' }}>
        <span className="material-symbols-outlined" style={{ color: '#FFD700', fontVariationSettings: "'FILL' 1", fontSize: '16px' }}>star</span>
        <span style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>{rating || '0.0'}</span>
        <span style={{ color: '#888', fontSize: '12px' }}>({count})</span>
    </div>
);

const FilterCheckbox = ({ label, checked, onChange }) => (
    <label style={styles.checkboxLabel}>
        <div style={{
            width: '18px', height: '18px', borderRadius: '3px', 
            border: checked ? 'none' : '2px solid #ddd', // Szara ramka jak nieaktywny
            backgroundColor: checked ? '#7A33E3' : 'white', // Fioletowy jak aktywny
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            marginRight: '10px', transition: '0.2s', flexShrink: 0
        }}>
            {checked && <span className="material-symbols-outlined" style={{color:'white', fontSize:'14px', fontWeight:'bold'}}>check</span>}
        </div>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{display:'none'}} />
        <span style={{lineHeight: '1.4', fontSize: '14px', color: '#333'}}>{label}</span>
    </label>
);

// ==========================================
// 3. MAIN SEARCH RESULTS
// ==========================================
const SearchResults = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // --- STANY DANYCH ---
    const [loading, setLoading] = useState(true);
    const [schools, setSchools] = useState([]);
    
    // --- STANY WYSZUKIWANIA ---
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [location, setLocation] = useState(searchParams.get('city') || 'Cała Polska');
    const [range50km, setRange50km] = useState(false);

    // --- AUTOCOMPLETE & API DATA ---
    const [allDataForSearch, setAllDataForSearch] = useState({ schools: [], instructors: [], styles: [] });
    const [searchSuggestions, setSearchSuggestions] = useState({ schools: [], instructors: [], styles: [] });
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [showCityDropdown, setShowCityDropdown] = useState(false);

    // --- FILTRY (ZGODNE Z MAKIETĄ) ---
    const [dynamicStyles, setDynamicStyles] = useState([]); // Style z bazy
    const [showAllStyles, setShowAllStyles] = useState(false); // Do "Pokaż więcej"
    
    const [selectedStyles, setSelectedStyles] = useState([]);
    const [age, setAge] = useState('');
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedForms, setSelectedForms] = useState([]); // Nowe
    const [selectedCards, setSelectedCards] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]); // Nowe
    const [timeRange, setTimeRange] = useState({ start: '', end: '' }); // Nowe

    const [sortBy, setSortBy] = useState('rating');
    const [totalResults, setTotalResults] = useState(0);

    // --- DANE STATYCZNE DO FILTRÓW ---
    const levelsList = [
        { id: 'BEGINNER', label: 'Od podstaw' },
        { id: 'BASIC', label: 'Początkujący' },
        { id: 'INTERMEDIATE', label: 'Średniozaawansowany' },
        { id: 'ADVANCED', label: 'Zaawansowany' },
        { id: 'PRO', label: 'Profesjonalny' },
        { id: 'OPEN', label: 'Open (dla każdego)' }
    ];
    const formsList = [
        { id: 'formation', label: 'Formacja' },
        { id: 'closed_group', label: 'Grupa zamknięta' },
        { id: 'contest_group', label: 'Grupa turniejowa' },
        { id: 'video_project', label: 'Video projekt' }
    ];
    const cardsList = [
        { id: 'multisport', label: 'MultiSport' },
        { id: 'medicover', label: 'Medicover' },
        { id: 'pzu', label: 'PZU Sport' },
        { id: 'fitprofit', label: 'FitProfit' } // Dodane 4-te
    ];
    const daysList = [
        { id: 'mon', label: 'Pon.' }, { id: 'tue', label: 'Wt.' }, { id: 'wed', label: 'Śr.' },
        { id: 'thu', label: 'Czw.' }, { id: 'fri', label: 'Pt.' }, { id: 'sat', label: 'Sob.' }, { id: 'sun', label: 'Niedz.' }
    ];

    // 1. POBIERANIE DANYCH (Style z bazy!)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Pobieramy wszystko równolegle
                const [schoolsRes, instRes, stylesRes] = await Promise.all([
                    api.get('schools/'), 
                    api.get('instructors/'), 
                    api.get('styles/')
                ]);

                // Ustawiamy dane do autocomplete
                setAllDataForSearch({
                    schools: schoolsRes.data.results || schoolsRes.data,
                    instructors: instRes.data.results || instRes.data,
                    styles: stylesRes.data.results || stylesRes.data
                });

                // Ustawiamy dynamiczne style do filtrów
                const stylesData = stylesRes.data.results || stylesRes.data;
                setDynamicStyles(stylesData.map(s => s.style_name)); // Zakładam, że pole to style_name

            } catch (err) { console.error("Błąd pobierania danych:", err); }
        };
        fetchInitialData();
    }, []);

    // 2. GŁÓWNE WYSZUKIWANIE
    const fetchResults = async () => {
        setLoading(true);
        try {
            const params = {
                search: query,
                city: location === 'Cała Polska' ? '' : location,
                ordering: sortBy === 'rating' ? '-average_rating' : (sortBy === 'alphabet' ? 'name' : ''),
                // Filtry
                styles: selectedStyles.join(','),
                levels: selectedLevels.join(','),
                forms: selectedForms.join(','), // Nowe
                days: selectedDays.join(','),   // Nowe
                cards: selectedCards.join(','),
                min_age: age,
                time_start: timeRange.start, // Nowe
                time_end: timeRange.end      // Nowe
            };
            const res = await api.get('schools/', { params });
            setSchools(res.data.results || res.data);
            setTotalResults(res.data.count || (res.data.results ? res.data.results.length : res.data.length));
        } catch (err) {
            console.error("Błąd wyszukiwania:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchResults(); }, [sortBy]);

    // Helpery
    const toggleFilter = (list, setList, item) => {
        if (list.includes(item)) setList(list.filter(i => i !== item));
        else setList([...list, item]);
    };

    // Autocomplete Logic
    const handleMainSearch = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (val.length < 2) { setShowSearchDropdown(false); return; }
        const lowerQ = val.toLowerCase();
        setSearchSuggestions({
            schools: allDataForSearch.schools.filter(s => s.name.toLowerCase().includes(lowerQ)).slice(0, 3),
            instructors: allDataForSearch.instructors.filter(i => (i.first_name + ' ' + i.last_name).toLowerCase().includes(lowerQ)).slice(0, 3),
            styles: allDataForSearch.styles.filter(s => s.style_name.toLowerCase().includes(lowerQ)).slice(0, 3)
        });
        setShowSearchDropdown(true);
    };

    const handleResultClick = (type, item) => {
        if (type === 'school') navigate(`/school/${item.id}`);
        else if (type === 'instructor') navigate(`/instructor/${item.id}`);
        else if (type === 'style') {
            setQuery(item.style_name);
            setShowSearchDropdown(false);
            fetchResults();
        }
    };

    // Nominatim Logic
    const fetchCitiesNominatim = async (cityQuery) => { /* ... (bez zmian, logika z poprzedniego kodu) ... */ };
    const debouncedCitySearch = useRef(debounce(async (val) => {
        if (!val || val.length < 2) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&addressdetails=1&countrycodes=pl&limit=5&dedupe=0`);
            const data = await res.json();
            setCitySuggestions(data.map(i => ({ display_name: i.display_name.split(',')[0], sub_text: i.address?.state })));
            setShowCityDropdown(true);
        } catch (e) {}
    }, 500)).current;

    return (
        <div style={styles.container}>
            
            {/* TOP BAR */}
            <div style={styles.topBarWrapper}>
                <div style={styles.heroSection}>
                    <SearchBar 
                        searchQuery={query} setSearchQuery={setQuery}
                        searchSuggestions={searchSuggestions} showSearchDropdown={showSearchDropdown} setShowSearchDropdown={setShowSearchDropdown}
                        handleMainSearch={handleMainSearch} handleResultClick={handleResultClick}
                        heroCityInput={location} handleHeroCityInput={(e) => { setLocation(e.target.value); debouncedCitySearch(e.target.value); }}
                        heroCitySuggestions={citySuggestions} showHeroCityDropdown={showCityDropdown} setShowHeroCityDropdown={setShowCityDropdown}
                        selectHeroCity={(item) => { setLocation(item.display_name); setShowCityDropdown(false); }}
                        onSubmit={() => { setShowSearchDropdown(false); setShowCityDropdown(false); fetchResults(); }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', width: '100%', maxWidth: '800px', justifyContent: 'flex-end' }}>
                        <input type="checkbox" id="radius" style={{ accentColor: '#7A33E3' }} checked={range50km} onChange={(e) => setRange50km(e.target.checked)} />
                        <label htmlFor="radius" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>+50km (od centrum miejscowości)</label>
                    </div>
                </div>
            </div>

            <div style={styles.mainGrid}>
                
                {/* --- FILTRY (LEWA STRONA - STYL Z MAKIETY) --- */}
                <aside style={styles.sidebar}>
                    <div style={styles.filtersContainer}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#000' }}>Filtry</h2>

                        {/* 1. STYL (Z BAZY) */}
                        <div style={styles.filterSection}>
                            <h4 style={styles.filterTitle}>Styl</h4>
                            <div style={styles.filterList}>
                                {(showAllStyles ? dynamicStyles : dynamicStyles.slice(0, 4)).map(s => (
                                    <FilterCheckbox key={s} label={s} checked={selectedStyles.includes(s)} onChange={() => toggleFilter(selectedStyles, setSelectedStyles, s)} />
                                ))}
                            </div>
                            {dynamicStyles.length > 4 && (
                                <div style={styles.showMore} onClick={() => setShowAllStyles(!showAllStyles)}>
                                    {showAllStyles ? 'Pokaż mniej' : 'Pokaż więcej'} <span className="material-symbols-outlined" style={{fontSize:'18px'}}>expand_more</span>
                                </div>
                            )}
                        </div>

                        {/* 2. WIEK (MIN 0) */}
                        <div style={styles.filterSection}>
                            <h4 style={styles.filterTitle}>Wiek uczestnika</h4>
                            <input 
                                type="number" 
                                min="0"
                                placeholder="Wpisz wiek" 
                                style={styles.grayInput} 
                                value={age}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || parseInt(val) >= 0) setAge(val);
                                }}
                            />
                        </div>

                        {/* 3. POZIOM */}
                        <div style={styles.filterSection}>
                            <h4 style={styles.filterTitle}>Poziom zaawansowania</h4>
                            <div style={styles.filterList}>
                                {levelsList.map(lvl => (
                                    <FilterCheckbox key={lvl.id} label={lvl.label} checked={selectedLevels.includes(lvl.id)} onChange={() => toggleFilter(selectedLevels, setSelectedLevels, lvl.id)} />
                                ))}
                            </div>
                        </div>

                        {/* 4. FORMA ZAJĘĆ */}
                        <div style={styles.filterSection}>
                            <h4 style={styles.filterTitle}>Forma zajęć</h4>
                            <div style={styles.filterList}>
                                {formsList.map(f => (
                                    <FilterCheckbox key={f.id} label={f.label} checked={selectedForms.includes(f.id)} onChange={() => toggleFilter(selectedForms, setSelectedForms, f.id)} />
                                ))}
                            </div>
                        </div>

                        {/* 5. KARTY (TERAZ 4) */}
                        <div style={styles.filterSection}>
                            <h4 style={styles.filterTitle}>Akceptowane karty sportowe</h4>
                            <div style={styles.filterList}>
                                {cardsList.map(c => (
                                    <FilterCheckbox key={c.id} label={c.label} checked={selectedCards.includes(c.id)} onChange={() => toggleFilter(selectedCards, setSelectedCards, c.id)} />
                                ))}
                            </div>
                        </div>

                        {/* 6. DZIEŃ TYGODNIA */}
                        <div style={styles.filterSection}>
                            <h4 style={styles.filterTitle}>Dzień tygodnia</h4>
                            <div style={styles.filterList}>
                                {daysList.map(d => (
                                    <FilterCheckbox key={d.id} label={d.label} checked={selectedDays.includes(d.id)} onChange={() => toggleFilter(selectedDays, setSelectedDays, d.id)} />
                                ))}
                            </div>
                        </div>

                        {/* 7. GODZINY */}
                        <div style={styles.filterSection}>
                            <h4 style={styles.filterTitle}>Przedział godzinowy</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input 
                                    type="time" 
                                    style={styles.timeInput}
                                    value={timeRange.start}
                                    onChange={(e) => setTimeRange({...timeRange, start: e.target.value})}
                                />
                                <span>-</span>
                                <input 
                                    type="time" 
                                    style={styles.timeInput}
                                    value={timeRange.end}
                                    onChange={(e) => setTimeRange({...timeRange, end: e.target.value})}
                                />
                            </div>
                        </div>

                        <button style={styles.applyBtn} onClick={fetchResults}>Filtruj</button>
                    </div>
                </aside>

                {/* --- WYNIKI (PRAWA STRONA) --- */}
                <main style={styles.resultsContent}>
                    <div style={styles.resultsHeader}>
                        <div style={{ fontSize: '14px', color: '#555' }}>Znaleziono {totalResults} wyników wyszukiwania</div>
                        <div style={styles.sortWrapper}>
                            <span className="material-symbols-outlined" style={{color:'#7A33E3', fontSize:'18px'}}>sort</span>
                            <span style={{color: '#7A33E3', fontWeight:'600', fontSize:'14px'}}>Sortuj według:</span>
                            <select style={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="rating">Najlepiej oceniane</option>
                                <option value="alphabet">Alfabetycznie</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.list}>
                        {loading ? <div style={{padding:'40px', textAlign:'center', color:'#888'}}>Ładowanie...</div> : 
                        schools.length === 0 ? <div style={styles.emptyState}>Brak wyników.</div> : 
                        schools.map(school => (
                            <div key={school.id} style={styles.schoolCard} onClick={() => navigate(`/school/${school.id}`)}>
                                <div style={styles.cardImageWrapper}>
                                    {school.logo ? <img src={school.logo} alt={school.name} style={styles.cardImage} /> : <div style={styles.cardPlaceholder}>{school.name[0]}</div>}
                                </div>
                                <div style={styles.cardInfo}>
                                    <div style={{marginBottom: '5px'}}>
                                        <h3 style={styles.schoolName}>{school.name}</h3>
                                        <StarRating rating={school.average_rating} count={school.reviews_count} />
                                    </div>
                                    <div style={styles.addressRow}>
                                        <span className="material-symbols-outlined" style={{fontSize:'14px', color:'#555'}}>location_on</span>
                                        {school.city}, {school.street} {school.build_no}
                                    </div>
                                    <div style={{fontWeight: '600', color: '#7A33E3', marginBottom: '5px', fontSize:'14px'}}>
                                        {school.styles?.slice(0,3).map(s => s.style_name).join(', ')} {school.styles?.length > 3 && `[+${school.styles.length-3}]`}
                                    </div>
                                    <div style={{fontSize: '12px', color: '#555'}}>
                                        Dopasowane kursy:<br/>
                                        {school.styles?.[0]?.style_name} | Dorośli 18+ | Pon. 18:00
                                    </div>
                                    <div style={{fontSize: '12px', color: '#7A33E3', marginTop: '5px', fontWeight: '500'}}>
                                        +{school.styles?.length || 0} innych zajęć w tej szkole
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

// ==========================================
// STYLE (DOSTOSOWANE DO MAKIETY)
// ==========================================
const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' },
    topBarWrapper: { backgroundColor: 'transparent', padding: '30px 0', display: 'flex', justifyContent: 'center' },
    heroSection: { width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    
    // --- SEARCH BAR (COPY-PASTE FROM HOME) ---
    searchBarContainer: { display: 'flex', width: '100%', maxWidth: 800, backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 4, position: 'relative' },
    searchInput: { width: '100%', padding: '18px 25px', border: 'none', fontSize: 16, outline: 'none', borderRight: '1px solid #eee' },
    locationWrapper: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 15px', position: 'relative' },
    locationIcon: { color: '#333', marginRight: 5 },
    cityInput: { width: '100%', border: 'none', fontSize: 16, outline: 'none', fontWeight: 500, color: '#333' },
    searchBtn: { backgroundColor: '#7A33E3', border: 'none', width: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },
    
    // --- DROPDOWNS ---
    searchDropdown: { position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: 'white', border: '1px solid #eee', borderTop: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 400, overflowY: 'auto' },
    cityDropdown: { position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: 'white', border: '1px solid #eee', borderTop: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 300, overflowY: 'auto' },
    dropdownHeader: { padding: '10px 15px', fontSize: 12, fontWeight: 700, color: '#555', backgroundColor: '#f9f9f9', textTransform: 'uppercase' },
    resultItem: { display: 'flex', alignItems: 'center', padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' },
    cityItem: { display: 'flex', alignItems: 'center', padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' },
    resultAvatar: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', marginRight: 12, color: '#555' },
    resultAvatarImg: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 12 },
    resultText: { fontSize: 14, color: '#333' },

    // --- GRID ---
    mainGrid: { display: 'flex', maxWidth: '1200px', margin: '20px auto 0', gap: '40px', padding: '0 20px', alignItems: 'flex-start' },
    sidebar: { width: '260px', flexShrink: 0 },
    
    // --- FILTRY (STYL MAKIETY) ---
    filtersContainer: { display: 'flex', flexDirection: 'column' },
    filterSection: { marginBottom: '25px' },
    filterTitle: { fontSize: '15px', fontWeight: '600', marginBottom: '10px', color: '#333' },
    filterList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    
    grayInput: { 
        width: '100%', padding: '8px 12px', borderRadius: '4px', border: 'none', 
        fontSize: '14px', backgroundColor: '#E0E0E0', boxSizing: 'border-box', outline: 'none', color: '#333'
    },
    timeInput: {
        width: '80px', padding: '6px', borderRadius: '4px', border: 'none',
        fontSize: '13px', backgroundColor: '#E0E0E0', textAlign: 'center'
    },
    checkboxLabel: { display: 'flex', alignItems: 'center', fontSize: '14px', color: '#333', cursor: 'pointer' },
    showMore: { fontSize: '13px', color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', marginTop: '5px' },
    applyBtn: { width: '100%', padding: '12px', backgroundColor: '#7A33E3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' },

    // --- WYNIKI ---
    resultsContent: { flex: 1 },
    resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    sortWrapper: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    sortSelect: { border: 'none', outline: 'none', fontWeight: '600', fontSize: '13px', color: '#333', cursor: 'pointer' },
    
    list: { display: 'flex', flexDirection: 'column', gap: '20px' },
    emptyState: { textAlign: 'center', padding: '50px', color: '#777' },

    // KARTA SZKOŁY
    schoolCard: { display: 'flex', backgroundColor: 'white', borderRadius: '4px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'transform 0.2s', gap: '20px', border: '1px solid #f0f0f0' },
    cardImageWrapper: { width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid #eee' },
    cardImage: { width: '100%', height: '100%', objectFit: 'contain' },
    cardPlaceholder: { width: '100%', height: '100%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#888' },
    cardInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
    schoolName: { fontSize: '20px', fontWeight: '700', color: '#7A33E3', margin: 0, lineHeight: '1.2' },
    addressRow: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#555', marginBottom: '10px' },
};

export default SearchResults;