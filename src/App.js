import React, { useState } from 'react'
import * as io from 'socket.io-client'
import { SocketContext } from './utils/socket-context'
import './App.css'
import GameContainer from './components/GameContainer'
import Profile from './components/Profile'
import Form from './components/Form'
import Logo from './components/Logo'


const socket = io(`http://localhost:4000/`)

function App() {
    const [user, setUser] = useState('')
    const [page, setPage] = useState('')

    const changePage = (newPage) => setPage(newPage)

    const renderPage = () => {
        switch(page) {
            case 'login': return <Form
                                    login={true} 
                                    changePage={changePage} 
                                    handleForm={handleForm} 
                                    />
            case 'signup': return <Form
                                    login={false} 
                                    changePage={changePage} 
                                    handleForm={handleForm} 
                                    />
            case 'profile': return <Profile changePage={changePage} user={user} />
            case 'about': break;
            case 'logout': logOut(); break;
            default: return <GameContainer 
                                user={user}
                                changePage={changePage}
                            />
        }
    }

    const handleForm = (fields, login) => {
        let url = (login) ? 'http://localhost:4000/login' : 'http://localhost:4000/register'
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fields),
            credentials: 'same-origin'
        })
        .then(r => r.json())
        .then(data => {
            setUser(data.username)
            setPage('')
        })
        .catch(err => {
            alert('Username already registered')
        })
    }

    const logOut = () => {
        fetch('http://localhost:4000/logout')
        .then(r => r.json())
        .then(data => {
            console.log('logging out')
            setUser('')
            setPage('')
        })
    }

    return (
        <SocketContext.Provider value={socket} >
            <div className="App">
                <Logo />
                {renderPage()}
            </div>
        </SocketContext.Provider>
    );
}

export default App;