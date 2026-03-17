import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({
    baseURL: baseURL
});

// Dodaje token do nagłówka)
api.interceptors.request.use((config) => {
    // Sprawdzanie czy są tokeny w localStorage
    const authTokens = localStorage.getItem('authTokens');
    if (authTokens) {
        // Parsowanie JSONa, żeby wyciągnąć 'access'
        const access = JSON.parse(authTokens).access;
        config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
});

// Obsługa wygasłych tokenów
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Pobieranie starego refresh token
                const authTokensString = localStorage.getItem('authTokens');
                const authTokens = authTokensString ? JSON.parse(authTokensString) : null;
                const refreshToken = authTokens?.refresh;

                if (!refreshToken) {
                    // Jak nie ma refresh tokenu następuje wylogowanie
                    throw new Error("Brak refresh tokena");
                }

                // Próba odświeżenia tokenu (wysyłamy zapytanie do endpointu refresh)
                const response = await axios.post(`${baseURL}token/refresh/`, {
                    refresh: refreshToken
                });

                if (response.status === 200) {
                    // Backend zwrócił nowy access token
                    // Aktualizacja localStorage (zachowując stary refresh token, chyba że backend go też zmienił)
                    const newTokens = {
                        ...authTokens,
                        access: response.data.access,
                        refresh: response.data.refresh || authTokens.refresh
                    };
                    
                    localStorage.setItem('authTokens', JSON.stringify(newTokens));

                    // Aktualizujemy nagłówka
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    
                    // Ponowienie zapytania z nowym tokenem
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Jeśli refresh token też wygasł albo coś poszło nie tak -> Wyloguj
                console.error("Sesja wygasła, wylogowywanie...");
                localStorage.removeItem('authTokens');
                window.location.href = '/login'; // Przekieruj do logowania
            }
        }

        // Jeśli to inny błąd niż 401, albo odświeżanie się nie udało -> zwróć błąd
        return Promise.reject(error);
    }
);

export default api;