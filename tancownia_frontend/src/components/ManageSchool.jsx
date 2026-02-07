import { useState, useEffect, useContext } from 'react';
import api from '../api';
import AuthContext from '../context/AuthContext';
import SetupSchoolInfo from '../pages/SetupSchoolInfo';
import SetupRooms from '../pages/SetupRooms'; // KROK 2
import Profile from '../pages/Profile'; 

const ManageSchool = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ hasSchool: false, hasRooms: false });

    useEffect(() => {
        // Jeśli user jeszcze się nie wczytał w AuthContext, czekamy
        if (user === undefined) return; 

        if (user?.role !== 'owner') {
            setLoading(false);
            return;
        }

        api.get('schools/my_school/')
            .then(res => {
                const school = res.data;
                setStatus({ 
                    hasSchool: true, 
                    hasRooms: school.floors && school.floors.length > 0 
                });
            })
            .catch(err => {
                if (err.response && err.response.status === 404) {
                    setStatus({ hasSchool: false, hasRooms: false });
                }
            })
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <div style={{padding: '100px', textAlign: 'center'}}>Ładowanie stanu szkoły...</div>;

    // Jeśli to nie owner (np. tancerz wpisał /profile z palca), pokaż mu zwykły profil
    if (user?.role !== 'owner') return <Profile />;

    // --- KLUCZOWY MOMENT ---
    if (!status.hasSchool) return <SetupSchoolInfo />;
    if (!status.hasRooms) return <SetupRooms />;

    return <Profile />;
};

export default ManageSchool;