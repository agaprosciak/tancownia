import axios from 'axios';

const baseURL = 'http://127.0.0.1:8000/api/';

const api = axios.create({
    baseURL: baseURL
});

// 1. REQUEST INTERCEPTOR (To już miałaś - dodaje token do nagłówka)
api.interceptors.request.use((config) => {
    // Sprawdzamy czy mamy tokeny w localStorage
    const authTokens = localStorage.getItem('authTokens');
    if (authTokens) {
        // Parsujemy JSONa, żeby wyciągnąć 'access'
        const access = JSON.parse(authTokens).access;
        config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
});

// 2. RESPONSE INTERCEPTOR (Tego brakowało - obsługuje wygasłe tokeny)
api.interceptors.response.use(
    (response) => {
        return response; // Jak jest OK, to przepuszczamy dalej
    },
    async (error) => {
        const originalRequest = error.config;

        // Jeśli błąd to 401 (Unauthorized) I nie jest to już ponowiona próba (_retry)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Zaznaczamy, żeby nie wpaść w pętlę nieskończoną

            try {
                // Pobieramy stary refresh token
                const authTokensString = localStorage.getItem('authTokens');
                const authTokens = authTokensString ? JSON.parse(authTokensString) : null;
                const refreshToken = authTokens?.refresh;

                if (!refreshToken) {
                    // Jak nie ma refresh tokena, to wyloguj i elo
                    throw new Error("Brak refresh tokena");
                }

                // Próbujemy odświeżyć token (wysyłamy zapytanie do endpointu refresh)
                // Używamy czystego axios, żeby nie zapętlić interceptorów
                const response = await axios.post(`${baseURL}token/refresh/`, {
                    refresh: refreshToken
                });

                if (response.status === 200) {
                    // Backend zwrócił nowy access token
                    // Aktualizujemy localStorage (zachowując stary refresh token, chyba że backend go też zmienił)
                    const newTokens = {
                        ...authTokens,
                        access: response.data.access,
                        refresh: response.data.refresh || authTokens.refresh // Czasem backend odświeża też refresh
                    };
                    
                    localStorage.setItem('authTokens', JSON.stringify(newTokens));

                    // Aktualizujemy nagłówek w starym zapytaniu, które się wywaliło
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    
                    // Ponawiamy to zapytanie z nowym tokenem
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Jeśli refresh token też wygasł albo coś poszło nie tak -> Wyloguj brutalnie
                console.error("Sesja wygasła, wylogowywanie...");
                localStorage.removeItem('authTokens');
                window.location.href = '/login'; // Przekieruj do logowania
            }
        }

        // Jeśli to inny błąd niż 401, albo odświeżanie się nie udało -> zwróć błąd dalej
        return Promise.reject(error);
    }
);

export default api;