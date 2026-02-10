import { useEffect, useState } from 'react';
import api from '../api'; // Importujemy naszą instancję Axiosa

const SchoolList = () => {
    const [schools, setSchools] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Pobieramy dane z adresu http://127.0.0.1:8000/api/schools/
        api.get('schools/')
            .then(response => {
                setSchools(response.data);
            })
            .catch(err => {
                setError("Nie udało się pobrać szkół. Sprawdź CORS lub czy serwer działa.");
                console.error(err);
            });
    }, []);

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
            <h2>Test Połączenia: Lista Szkół</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <ul>
                {schools.map(school => (
                    <li key={school.id}>
                        <strong>{school.name}</strong> - {school.city}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SchoolList;