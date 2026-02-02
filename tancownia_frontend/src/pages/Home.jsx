import React from 'react';

const Home = () => {
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Witaj w Tańcowni! 💃</h1>
            <p style={styles.subtitle}>Znajdź swoją ulubioną szkołę tańca w jednym miejscu.</p>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 75px)',
        backgroundColor: '#F8F9FF',
        textAlign: 'center'
    },
    title: { fontSize: '48px', fontWeight: '300', color: '#212529' },
    subtitle: { fontSize: '20px', color: '#666', marginTop: '10px' }
};

export default Home;