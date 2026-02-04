import { useState, useEffect, useContext } from 'react';
import api from '../api';
import AuthContext from '../context/AuthContext';
import SetupSchoolInfo from '../pages/SetupSchoolInfo';
import Profile from '../pages/Profile'; 

const ManageSchool = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [hasSchool, setHasSchool] = useState(false);

    useEffect(() => {
        // 1. Jeśli to nie jest OWNER, to nie ma co sprawdzać bazy pod kątem szkoły
        if (user?.role !== 'owner') {
            setLoading(false);
            return;
        }

        // 2. Jeśli to OWNER, sprawdzamy czy ma już rekord szkoły
        api.get('schools/my_school/')
            .then(res => {
                if (res.data) setHasSchool(true);
            })
            .catch(err => {
                if (err.response && err.response.status === 404) {
                    setHasSchool(false);
                }
            })
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <div style={{padding: '100px', textAlign: 'center'}}>Ładowanie profilu...</div>;

    // --- LOGIKA ROZDZIELNI ---
    
    // A. Jeśli to zwykły USER (tancerz) lub ADMIN -> leci prosto do Profile.jsx
    if (user?.role !== 'owner') {
        return <Profile />;
    }

    // B. Jeśli to OWNER:
    // - Ma szkołę w bazie? -> Profile.jsx (Zarządzaj szkołą)
    // - Nie ma szkoły? -> SetupSchoolInfo.jsx (Wypełnij informacje)
    return hasSchool ? <Profile /> : <SetupSchoolInfo />;
};

export default ManageSchool;