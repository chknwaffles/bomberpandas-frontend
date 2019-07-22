import React, { useState } from 'react';
import './stylesheets/App.css';
import GameContainer from './containers/GameContainer'
import FormContainer from './containers/FormContainer'
import Chat from './containers/Chat'
import Logo from './components/Logo'

function App() {
    const [user, setUser] = useState('')
    const [page, setPage] = useState('')

    const changePage = (newPage) => setPage(newPage)
    
    const renderPage = () => {
        switch(page) {
            case '': return <GameContainer changePage={changePage} />
            case 'login': return <FormContainer login={true} changePage={changePage} handleLogin={handleLogin} />
            case 'signup': return <FormContainer login={false} changePage={changePage} handleLogin={handleLogin} />
            default: break;
        }
    }

    const handleLogin = () => {

    }

    return (
        <div className="App">
            <Logo />
            {renderPage()}
            <Chat user={user} />
        </div>
    );
}

export default App;
