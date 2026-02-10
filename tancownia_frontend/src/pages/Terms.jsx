import { useNavigate } from 'react-router-dom';

const Terms = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            <div style={styles.backButtonWrapper}>
                 <span className="material-symbols-outlined" style={styles.backArrow} onClick={() => navigate(-1)}>arrow_back_ios</span>
            </div>

            <div style={styles.card}>
                <h1 style={styles.title}>Regulamin Serwisu Tańcownia</h1>
                <p style={styles.date}>Ostatnia aktualizacja: 10.02.2026</p>

                <div style={styles.content}>
                    <h3>1. Postanowienia ogólne</h3>
                    <p>
                        1. Niniejszy regulamin określa zasady korzystania z serwisu internetowego Tańcownia, dostępnego pod adresem www.tancownia.pl.
                        <br />
                        2. Administratorem serwisu jest Tańcownia Sp. z o.o. z siedzibą w Warszawie.
                        <br />
                        3. Korzystanie z serwisu oznacza akceptację niniejszego Regulaminu.
                    </p>

                    <h3>2. Zasady korzystania</h3>
                    <p>
                        1. Użytkownik zobowiązany jest do korzystania z Serwisu w sposób zgodny z prawem i dobrymi obyczajami.
                        <br />
                        2. Zabronione jest dostarczanie treści o charakterze bezprawnym, obraźliwym lub naruszającym prawa osób trzecich.
                        <br />
                        3. Szkoły tańca ponoszą pełną odpowiedzialność za treść publikowanych ofert, grafików oraz cenników.
                    </p>

                    <h3>3. Rezerwacje i Płatności</h3>
                    <p>
                        1. Serwis pełni funkcję informacyjną i pośredniczącą. Umowa o świadczenie usług tanecznych zawierana jest bezpośrednio między Użytkownikiem a Szkołą Tańca.
                        <br />
                        2. Wszelkie reklamacje dotyczące jakości zajęć należy kierować bezpośrednio do organizatora (Szkoły Tańca).
                    </p>

                    <h3>4. Postanowienia końcowe</h3>
                    <p>
                        1. Administrator zastrzega sobie prawo do wprowadzania zmian w Regulaminie.
                        <br />
                        2. W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy Kodeksu Cywilnego.
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { backgroundColor: '#F8F9FF', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '60px', fontFamily: "'Inter', sans-serif" },
    backButtonWrapper: { width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'flex-start', padding: '30px 20px 10px 20px' },
    backArrow: { fontSize: '28px', cursor: 'pointer', color: '#333', fontWeight: 'bold' },
    card: { width: '100%', maxWidth: '1000px', backgroundColor: 'white', borderRadius: '24px', padding: '60px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginTop: '10px' },
    title: { fontSize: '32px', fontWeight: '800', color: '#333', marginBottom: '10px' },
    date: { color: '#888', fontSize: '14px', marginBottom: '40px' },
    content: { lineHeight: '1.8', color: '#555', fontSize: '16px' }
};

export default Terms;