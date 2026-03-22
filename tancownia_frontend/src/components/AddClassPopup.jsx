import { useState, useEffect } from 'react';
import api from '../api';

const AddClassPopup = ({ type, rooms, instructors, onClose, onSave, onOpenInstructor, newlyAddedId, editingClass }) => {
    const isPeriodic = type === 'regular';
    const [stylesList, setStylesList] = useState([]);
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const normalize = (str) => str ? str.toLowerCase().replace(/\s+/g, '') : '';

    const [timeSlots, setTimeSlots] = useState([
        { day_of_week: 'monday', starts_at: '', ends_at: '', floor: rooms[0]?.id || '', first_class_date: '' }
    ]);

    const [formData, setFormData] = useState({
        style: '', subtitle: '', instructors: [], level: 'OPEN', group_type: '',
        min_age: '', max_age: '', unlimited_age: true,
        first_class_date: '', last_class_date: '',
        starts_at: '', ends_at: '', floor: rooms[0]?.id || '',
        price: '', priceFromList: isPeriodic, 
        registration_info_link: '', description: '', is_open: true
    });

    useEffect(() => {
        api.get('styles/').then(res => setStylesList(res.data));
    }, []);

    useEffect(() => {
        if (editingClass) {
            const foundStyle = stylesList.find(s => s.id === editingClass.style);
            const styleName = foundStyle ? foundStyle.style_name : '';

            setFormData({
                style: styleName,
                subtitle: editingClass.subtitle || '',
                instructors: editingClass.instructors.map(i => String(i.id || i)),
                level: editingClass.level,
                group_type: editingClass.group_type || '',
                min_age: editingClass.min_age,
                max_age: editingClass.max_age || '',
                unlimited_age: !editingClass.max_age,
                first_class_date: editingClass.first_class_date,
                last_class_date: editingClass.last_class_date || '',
                starts_at: editingClass.starts_at ? editingClass.starts_at.slice(0,5) : '',
                ends_at: editingClass.ends_at ? editingClass.ends_at.slice(0,5) : '',
                floor: editingClass.floor || '',
                price: editingClass.price || '',
                priceFromList: !editingClass.price,
                registration_info_link: editingClass.registration_info_link || '',
                description: editingClass.description || '',
                is_open: editingClass.is_open
            });

            if (isPeriodic) {
                setTimeSlots([{
                    day_of_week: editingClass.day_of_week,
                    starts_at: editingClass.starts_at ? editingClass.starts_at.slice(0,5) : '',
                    ends_at: editingClass.ends_at ? editingClass.ends_at.slice(0,5) : '',
                    floor: editingClass.floor || '',
                    first_class_date: editingClass.first_class_date
                }]);
            }
            if (editingClass.last_class_date && editingClass.last_class_date !== editingClass.first_class_date) {
                setIsMultiDay(true);
            }
        }
    }, [editingClass, isPeriodic, stylesList]);

    useEffect(() => {
        if (newlyAddedId) {
            const idStr = String(newlyAddedId);
            if (!formData.instructors.includes(idStr)) {
                setFormData(prev => ({
                    ...prev,
                    instructors: [...prev.instructors, idStr]
                }));
            }
        }
    }, [newlyAddedId]);

    const instructorsList = Array.isArray(instructors) ? instructors : (instructors?.results || []);
    const filteredInstructors = instructorsList.filter(i => {
        if (!i) return false;
        const fullString = `${i.first_name || ''} ${i.last_name || ''} ${i.pseudonym || ''}`.toLowerCase();
        const matchesSearch = fullString.includes(searchTerm.toLowerCase().trim());
        const isNotSelected = !formData.instructors.some(id => String(id) === String(i.id));
        return matchesSearch && isNotSelected;
    });

    const updateDateAndDay = (index, dateValue) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const date = new Date(dateValue);
        const dayName = days[date.getDay()];
        if (isPeriodic) {
            const newSlots = [...timeSlots];
            newSlots[index].first_class_date = dateValue;
            newSlots[index].day_of_week = dayName;
            setTimeSlots(newSlots);
        } else {
            setFormData({ ...formData, first_class_date: dateValue });
        }
    };

    const updateSlot = (index, field, value) => {
        const newSlots = [...timeSlots];
        newSlots[index][field] = value;
        setTimeSlots(newSlots);
    };

    const handleSave = async () => {
        const errors = {};
        
        if (formData.registration_info_link.length > 1000) {
            errors.registration_info_link = `Za długie o ${formData.registration_info_link.length - 1000} znaków!`;
        }
        if (formData.description.length > 1000) {
            errors.description = `Za długie o ${formData.description.length - 1000} znaków!`;
        }

        if (!formData.style.trim()) errors.style = "Musisz wpisać lub wybrać styl!";
        
        const minAgeInt = parseInt(formData.min_age);
        if (!formData.min_age) errors.min_age = "Podaj wiek minimalny!";
        else if (minAgeInt < 0) errors.min_age = "Wiek nie może być ujemny!";

        if (!formData.unlimited_age) {
            const maxAgeInt = parseInt(formData.max_age);
            if (!formData.max_age) errors.max_age = "Podaj wiek maksymalny!";
            else if (maxAgeInt < 0) errors.max_age = "Wiek nie może być ujemny!";
            else if (maxAgeInt < minAgeInt) errors.max_age = "Wiek 'do' nie może być mniejszy niż 'od'!";
        }

        if (!formData.priceFromList && formData.price && parseFloat(formData.price) < 0) {
            errors.price = "Cena nie może być ujemna!";
        }

        if (isPeriodic) {
            timeSlots.forEach((slot, i) => {
                if (!slot.first_class_date) errors[`slot_${i}_date`] = "Wybierz datę!";
                if (!slot.starts_at || !slot.ends_at) errors[`slot_${i}_time`] = "Podaj godziny!";
                if (slot.starts_at && slot.ends_at && slot.starts_at >= slot.ends_at) {
                    errors[`slot_${i}_time`] = "Koniec musi być po starcie!";
                }
            });
        } else {
            if (!formData.first_class_date) errors.first_class_date = "Podaj datę startu!";
            if (!formData.starts_at) errors.starts_at = "Podaj godzinę startu!";
            if (!formData.ends_at) errors.ends_at = "Podaj godzinę końca!";
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        try {
            const inputStyle = formData.style.trim();
            const existingStyle = stylesList.find(s => normalize(s.style_name) === normalize(inputStyle));
            const styleValue = existingStyle ? existingStyle.id : inputStyle;

            const basePayload = {
                ...formData,
                style: styleValue,
                periodic: isPeriodic,
                price: formData.priceFromList ? null : (formData.price || null),
                max_age: formData.unlimited_age ? null : (formData.max_age || null),
                floor: formData.floor ? formData.floor : null,
                last_class_date: isPeriodic ? null : (isMultiDay ? formData.last_class_date : formData.first_class_date)
            };

            const processedTimeSlots = timeSlots.map(slot => ({
                ...slot,
                floor: slot.floor ? slot.floor : null
            }));

            if (editingClass) {
                await api.delete(`classes/${editingClass.id}/`);
            }

            if (isPeriodic) {
                await api.post('classes/', { ...basePayload, time_slots: processedTimeSlots });
            } else {
                await api.post('classes/', basePayload);
            }

            onSave(); onClose();
        } catch (err) {
            console.error("Błąd zapisu:", err.response?.data);
            setFieldErrors(err.response?.data || { global: "Błąd zapisu" });
        }
    };

    return (
        <div style={s.overlay}>
            <div style={s.window}>
                <span style={s.close} onClick={onClose}>✕</span>
                <h2 style={s.title}>
                    {editingClass ? 'Edytuj zajęcia' : (isPeriodic ? 'Dodaj zajęcia cykliczne' : 'Dodaj warsztat / event')}
                </h2>
                <div style={s.scrollArea}>
                    
                    <div style={s.row}>
                        <div style={s.flex1}>
                            <label style={s.label}>Styl*</label>
                            <input list="styles-list" style={{...s.input, borderColor: fieldErrors.style ? 'red' : '#ddd'}} value={formData.style} placeholder="Wpisz styl..." onChange={e => setFormData({...formData, style: e.target.value})} />
                            {fieldErrors.style && <p style={s.errorText}>{fieldErrors.style}</p>}
                            <datalist id="styles-list">{stylesList.map(st => <option key={st.id} value={st.style_name} />)}</datalist>
                        </div>
                        <div style={s.flex1}>
                            <label style={s.label}>Temat / dopisek</label>
                            <input style={s.input} placeholder="np. Footwork" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
                        </div>
                    </div>

                    <div style={s.row}>
                        <div style={s.flex1}><label style={s.label}>Poziom*</label>
                            <select style={s.input} value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                                <option value="OPEN">Open</option><option value="BEGINNER">Od podstaw</option><option value="BASIC">Początkujący</option>
                                <option value="INTERMEDIATE">Średniozaawansowany</option><option value="ADVANCED">Zaawansowany</option><option value="PRO">Profesjonalny</option>
                            </select>
                        </div>
                        <div style={s.flex1}><label style={s.label}>Specyfika grupy</label>
                            <select style={s.input} value={formData.group_type} onChange={e => setFormData({...formData, group_type: e.target.value})}>
                                <option value="">Wybierz</option>
                                <option value="FORMATION">Formacja</option><option value="PROJECT">Grupa zamknięta</option><option value="DANCE_CONTEST">Grupa turniejowa</option><option value="VIDEO_PROJECT">Video projekt</option>
                            </select>
                        </div>
                    </div>

                    <div style={s.row}>
                        <div style={s.flex1}>
                            <label style={s.label}>Wiek*</label>
                            <div style={s.rowNoMargin}>
                                <input type="number" placeholder="Od" style={{...s.input, marginRight:'10px', borderColor: fieldErrors.min_age ? 'red' : '#ddd'}} value={formData.min_age} onChange={e => setFormData({...formData, min_age: e.target.value})} />
                                <input type="number" placeholder="Do" disabled={formData.unlimited_age} style={{...s.input, borderColor: fieldErrors.max_age ? 'red' : '#ddd'}} value={formData.unlimited_age ? '' : formData.max_age} onChange={e => setFormData({...formData, max_age: e.target.value})} />
                            </div>
                            {(fieldErrors.min_age || fieldErrors.max_age) && <p style={s.errorText}>{fieldErrors.min_age || fieldErrors.max_age}</p>}
                            <label style={s.checkLabel}><input type="checkbox" checked={formData.unlimited_age} onChange={e => setFormData({...formData, unlimited_age: e.target.checked})} /> Brak górnego limitu</label>
                        </div>
                    </div>

                    <label style={s.label}>Instruktorzy</label>
                    <div style={s.instSearchBox}>
                        <div style={s.selectedRow}>
                            {formData.instructors.map(id => (
                                <span key={id} style={s.chip}>
                                    {instructorsList.find(i => String(i.id) === String(id))?.first_name} 
                                    <b onClick={() => setFormData({...formData, instructors: formData.instructors.filter(i => i !== id)})} style={{cursor:'pointer'}}>✕</b>
                                </span>
                            ))}
                        </div>
                        <input style={{width:'100%', padding:'10px', border:'none', outline:'none'}} placeholder="🔍 Szukaj instruktora..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <div style={s.instDropdown}>
                            {filteredInstructors.map(i => (
                                <div key={i.id} style={s.instItem} onClick={() => {
                                    setFormData({...formData, instructors: [...formData.instructors, String(i.id)]});
                                    setSearchTerm('');
                                }}>👤 {i.first_name} {i.pseudonym ? `"${i.pseudonym}"` : ""} {i.last_name}</div>
                            ))}
                            <div style={s.addNewLink} onClick={onOpenInstructor}>+ Dodaj nowego instruktora</div>
                        </div>
                    </div>

                    <h3 style={s.subTitle}>Terminarz</h3>
                    
                    {isPeriodic ? (
                        <>{timeSlots.map((slot, index) => (
                            <div key={index} style={s.slotCard}>
                                <div style={s.row}>
                                    <div style={s.flex1}>
                                        <label style={s.label}>Data startu*</label>
                                        <input type="date" value={slot.first_class_date} style={{...s.input, borderColor: (fieldErrors[`slot_${index}_date`] || fieldErrors.starts_at) ? 'red' : '#ddd'}} onChange={e => updateDateAndDay(index, e.target.value)} />
                                        {fieldErrors[`slot_${index}_date`] && <p style={s.errorText}>{fieldErrors[`slot_${index}_date`]}</p>}
                                    </div>
                                    <div style={s.flex1}><label style={s.label}>Dzień tygodnia</label>
                                        <select style={s.input} value={slot.day_of_week} disabled><option value="monday">Poniedziałek</option><option value="tuesday">Wtorek</option><option value="wednesday">Środa</option><option value="thursday">Czwartek</option><option value="friday">Piątek</option><option value="saturday">Sobota</option><option value="sunday">Niedziela</option></select>
                                    </div>
                                </div>
                                <div style={s.row}>
                                    <div style={s.flex1}><label style={s.label}>Start*</label><input type="time" value={slot.starts_at} style={{...s.input, borderColor: (fieldErrors[`slot_${index}_time`] || fieldErrors.starts_at) ? 'red' : '#ddd'}} onChange={e => updateSlot(index, 'starts_at', e.target.value)} /></div>
                                    <div style={s.flex1}><label style={s.label}>Koniec*</label><input type="time" value={slot.ends_at} style={{...s.input, borderColor: (fieldErrors[`slot_${index}_time`] || fieldErrors.starts_at) ? 'red' : '#ddd'}} onChange={e => updateSlot(index, 'ends_at', e.target.value)} /></div>
                                </div>
                                {(fieldErrors[`slot_${index}_time`] || fieldErrors.starts_at) && <p style={s.errorText}>{fieldErrors[`slot_${index}_time`] || fieldErrors.starts_at}</p>}
                                
                                <div style={{marginTop:'10px'}}>
                                    <label style={s.label}>Sala</label>
                                    <select style={s.input} value={slot.floor} onChange={e => updateSlot(index, 'floor', e.target.value)}>
                                        <option value="">-- Bez sali --</option>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                
                                {!editingClass && timeSlots.length > 1 && <div style={s.removeSlot} onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== index))}>Usuń</div>}
                            </div>
                        ))}
                        {!editingClass && <button style={s.addTermBtn} onClick={() => setTimeSlots([...timeSlots, {day_of_week: 'monday', starts_at: '', ends_at: '', floor: rooms[0]?.id, first_class_date: ''}])}>Dodaj kolejny termin +</button>}
                        </>
                    ) : (
                        <div style={s.slotCard}>
                            <div style={s.row}>
                                <div style={s.flex1}><label style={s.label}>Data startu*</label><input type="date" value={formData.first_class_date} style={{...s.input, borderColor: fieldErrors.first_class_date ? 'red' : '#ddd'}} onChange={e => setFormData({...formData, first_class_date: e.target.value})} />{fieldErrors.first_class_date && <p style={s.errorText}>{fieldErrors.first_class_date}</p>}</div>
                                <div style={s.flex1}><label style={s.label}>Start*</label><input type="time" value={formData.starts_at} style={{...s.input, borderColor: fieldErrors.starts_at ? 'red' : '#ddd'}} onChange={e => setFormData({...formData, starts_at: e.target.value})} />{fieldErrors.starts_at && <p style={s.errorText}>{fieldErrors.starts_at}</p>}</div>
                            </div>
                            <label style={s.checkLabel}><input type="checkbox" checked={isMultiDay} onChange={e => setIsMultiDay(e.target.checked)} /> Wydarzenie trwa kilka dni</label>
                            
                            {isMultiDay && (
                                <div style={s.row}>
                                    <div style={s.flex1}><label style={s.label}>Data zakończenia*</label><input type="date" value={formData.last_class_date} style={{...s.input, borderColor: fieldErrors.last_class_date ? 'red' : '#ddd'}} onChange={e => setFormData({...formData, last_class_date: e.target.value})} />{fieldErrors.last_class_date && <p style={s.errorText}>{fieldErrors.last_class_date}</p>}</div>
                                    <div style={s.flex1}><label style={s.label}>Godzina zakończenia*</label><input type="time" value={formData.ends_at} style={{...s.input, borderColor: fieldErrors.ends_at ? 'red' : '#ddd'}} onChange={e => setFormData({...formData, ends_at: e.target.value})} />{fieldErrors.ends_at && <p style={s.errorText}>{fieldErrors.ends_at}</p>}</div>
                                </div>
                            )}
                            {!isMultiDay && <div style={s.row}><div style={s.flex1}><label style={s.label}>Godzina zakończenia*</label><input type="time" value={formData.ends_at} style={{...s.input, borderColor: fieldErrors.ends_at ? 'red' : '#ddd'}} onChange={e => setFormData({...formData, ends_at: e.target.value})} />{fieldErrors.ends_at && <p style={s.errorText}>{fieldErrors.ends_at}</p>}</div></div>}
                            
                            <div style={{marginTop:'10px'}}>
                                <label style={s.label}>Sala</label>
                                <select style={s.input} value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})}>
                                    <option value="">-- Bez sali --</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div style={{marginTop: '25px'}}>
                        <label style={s.label}>Koszt (zł)</label>
                        <div style={s.row}>
                            {!formData.priceFromList ? <input type="number" step="0.01" value={formData.price} style={{...s.flex1Input, borderColor: fieldErrors.price ? 'red' : '#ddd'}} placeholder="Cena" onChange={e => setFormData({...formData, price: e.target.value})} /> : <div style={s.pricePlaceholder}>Zgodnie z cennikiem</div>}
                            <label style={s.checkLabelSide}><input type="checkbox" checked={formData.priceFromList} onChange={e => setFormData({...formData, priceFromList: e.target.checked})} /> Zgodnie z cennikiem</label>
                        </div>
                        {fieldErrors.price && <p style={s.errorText}>{fieldErrors.price}</p>}
                    </div>

                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px'}}>
                        <label style={s.label}>Zapisy / Link</label>
                        <span style={{...s.charCounter, color: formData.registration_info_link.length > 1000 ? 'red' : '#888'}}>
                            {formData.registration_info_link.length}/1000
                        </span>
                    </div>
                    <textarea 
                        style={{...s.textarea, borderColor: fieldErrors.registration_info_link ? 'red' : '#ddd'}} 
                        value={formData.registration_info_link} 
                        placeholder="Informacje o zapisach..." 
                        onChange={e => setFormData({...formData, registration_info_link: e.target.value})} 
                    />
                    {fieldErrors.registration_info_link && <p style={s.errorText}>{fieldErrors.registration_info_link}</p>}

                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px'}}>
                        <label style={s.label}>Opis zajęć</label>
                        <span style={{...s.charCounter, color: formData.description.length > 1000 ? 'red' : '#888'}}>
                            {formData.description.length}/1000
                        </span>
                    </div>
                    <textarea 
                        style={{...s.textarea, borderColor: fieldErrors.description ? 'red' : '#ddd'}} 
                        value={formData.description} 
                        placeholder="Opisz zajęcia..." 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                    {fieldErrors.description && <p style={s.errorText}>{fieldErrors.description}</p>}

                    <label style={s.checkLabel}><input type="checkbox" checked={formData.is_open} onChange={e => setFormData({...formData, is_open: e.target.checked})} /> Zapisy otwarte</label>
                </div>
                
                <button style={s.submitBtn} onClick={handleSave}>
                    {editingClass ? 'Zapisz zmiany' : 'Zapisz i dodaj'}
                </button>
            </div>
        </div>
    );
};

const s = {
    errorText: { color: '#ff4d4f', fontSize: '11px', fontWeight: '700', marginTop: '5px' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000 },
    window: { backgroundColor: 'white', width: '95%', maxWidth: '750px', maxHeight: '95vh', padding: '25px', borderRadius: '25px', position: 'relative', display: 'flex', flexDirection: 'column' },
    scrollArea: { overflowY: 'auto', paddingRight: '10px' },
    close: { position: 'absolute', top: '15px', right: '20px', fontSize: '24px', cursor: 'pointer', color: '#666', zIndex: 10 },
    title: { textAlign: 'center', fontWeight: '800', marginBottom: '15px', fontSize: '20px' },
    label: { display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', marginTop: '10px', color: '#444' },
    input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px' },
    flex1: { flex: '1 1 200px', minWidth: '140px' },
    flex1Input: { flex: '1 1 150px', padding: '10px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '14px' },
    row: { display: 'flex', gap: '15px', marginTop: '5px', flexWrap: 'wrap' },
    rowNoMargin: { display: 'flex', marginTop: '5px' },
    checkLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', marginTop: '10px' },
    checkLabelSide: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', marginLeft: '10px' },
    instSearchBox: { border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', marginTop: '5px' },
    selectedRow: { padding: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', borderBottom: '1px solid #eee', minHeight: '45px' },
    chip: { backgroundColor: '#7A33E3', color: 'white', padding: '8px 16px', borderRadius: '25px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px', marginRight: '8px', marginBottom: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    instDropdown: { maxHeight: '150px', overflowY: 'auto' },
    instItem: { padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', fontSize: '13px' },
    addNewLink: { padding: '12px 15px', color: '#7A33E3', fontWeight: '800', cursor: 'pointer', fontSize: '13px', borderTop: '1px solid #eee', textAlign: 'center' },
    slotCard: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '15px', marginTop: '10px', position: 'relative', border: '1px solid #eee' },
    removeSlot: { position: 'absolute', top: '10px', right: '15px', color: '#ff4d4f', fontSize: '11px', cursor: 'pointer', fontWeight: '700' },
    addTermBtn: { width: '100%', backgroundColor: '#7A33E3', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: '700', marginTop: '12px', cursor: 'pointer' },
    pricePlaceholder: { flex: '1 1 150px', padding: '10px', backgroundColor: '#eee', borderRadius: '10px', fontSize: '13px', color: '#666', textAlign: 'center' },
    textarea: { width: '100%', height: '70px', borderRadius: '10px', padding: '10px', border: '1px solid #ddd', resize: 'none' },
    submitBtn: { backgroundColor: '#7A33E3', color: 'white', padding: '15px', borderRadius: '15px', border: 'none', fontWeight: '800', fontSize: '16px', marginTop: '20px', cursor: 'pointer' },
    subTitle: { fontSize: '17px', fontWeight: '800', marginTop: '25px', color: '#7A33E3' },
    charCounter: { fontSize: '11px', fontWeight: '600' }
};

export default AddClassPopup;