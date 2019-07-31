import React, { useState, useEffect, useRef } from 'react'
import { gridSize, printGrid, fillGrid, setPlayersPosition } from '../utils/Grid'
import StatusBar from '../components/StatusBar'
import '../stylesheets/GameContainer.css'
import icon from '../images/kys.png'
import bomb from '../images/bomb.png'
import skull from '../images/skull.png'
import breakablewall from '../images/breakablewall.png'
import wall from '../images/wall.png'
import fire from '../images/fire.png'
import bombPower from '../images/bombpowerup.png'
import firePower from '../images/firepowerup.png'

const SPRITE_SIZE = 50
const keys = []

export default function Game(props) {
    const { socket, user, changeStatus, online } = props
    const canvasRef = useRef(null)
    const [player, setPlayer] = useState(() => {
        return { type: 'P', x: 0, y: 0, bombs: 1, onBomb: false, username: user }
    })
    const [players, setPlayers] = useState(() => {
        let players = []
        if (online) {
            // get props from game and add players
            players = [ {}, {}, {}, {} ]
        } else {
            players = [
                { type: 'P', x: 0, y: 0, bombs: 1, onBomb: false, powerups: { bombs: 1, fire: 1 } },
                { type: 'P', x: 0, y: 0, bombs: 1, onBomb: false, powerups: { bombs: 1, fire: 1 } }
            ]
        }
        return setPlayersPosition(players, online)
    })
    const [grid, setGrid] = useState(() => {
        let initialGrid = [...Array(gridSize)].map(e => Array(gridSize).fill(''))

        initialGrid = fillGrid(initialGrid, players)
        return initialGrid
    })

    //componentdidmount
    useEffect(() => {
        const ws = socket
        console.log(players)
        //listen to backend for player movement/bomb explosion
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.shift() === 'BOMB TARGETS') {
                // explode in a radius around the target grid element
                setGrid(grid => grid.map(row => row.map(colE => {
                    let res = data.find(e => e.x === colE.x && e.y === colE.y)
                    if (res !== undefined && (colE.type === 'O' || colE.type === 'BW' || colE.type === 'F' || colE.type === 'B')) {
                        return {...colE, type: 'F'}
                    } else {
                        return colE
                    }
                })))

                removeFireTimer(data);
            }
        }

        //set timer for removing the fire after explosion
        const removeFireTimer = (data) => setTimeout(() => {
            setGrid(grid => grid.map(row => row.map(colE => {
                let res = data.find(e => e.x === colE.x && e.y === colE.y)
                if (res !== undefined) {
                    if (colE.type === 'P') {
                        // check death
                        return {...colE, type: 'D'}
                    } else if (colE.type !== 'W') {
                        return {...colE, type: 'O'}
                    }
                }
                
                return colE
            })))
            setPlayer(p => {
                p.bombs++
                return p
            })
            clearTimeout(removeFireTimer)
        }, 500)
    }, [])

    //componentdidupdate on grid state
    useEffect(() => {
        canvasRef.current.focus()
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        let updatedGrid = grid.map(e => e.slice());
        printGrid(updatedGrid);
        //render canvas board
        updatedGrid.forEach(row => {
            row.forEach(colE => {
                switch(colE.type) {
                    case 'W': renderImage(context, wall, colE.x, colE.y); break;
                    case 'BW': renderImage(context, breakablewall, colE.x, colE.y); break;
                    case 'F': renderImage(context, fire, colE.x, colE.y); break;
                    case 'B': renderImage(context, bomb, colE.x, colE.y); break;
                    case 'O': {
                        context.fillStyle = 'lightskyblue';
                        context.fillRect(colE.x * SPRITE_SIZE, colE.y * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE);
                        break;
                    }
                    case 'D': {
                        renderImage(context, skull, colE.x, colE.y);
                        changeStatus((online) ? 'defeat' : 'endgame')
                        break;
                    }
                    case 'P': renderImage(context, icon, colE.x, colE.y, true); break;
                    case 'BP': renderImage(context, bombPower, colE.x, colE.y); break;
                    case 'FP': renderImage(context, firePower, colE.x, colE.y); break;
                    default: break;
                }
            })
        })
    }, [grid])

    const movePlayer = () => {
        //set state of player based on key
        //check valid move
        let player1 = players[0]
        let player2 = players[1]
        let prevP1Move, prevP2Move, nextP1Move, nextP2Move

        prevP1Move = {...player1}
        nextP1Move = {...player1, onBomb: false}

        if (!online) {
            prevP2Move = {...player2}
            nextP2Move = {...player2, onBomb: false}
        }
        // check if next move includes a powerup then add it to player
        if (keys['w']) {
            nextP1Move = {...nextP1Move, y: nextP1Move.y - 1}
            let valid = validMove(nextP1Move)
            if (!valid.status) return
            
            if (valid.type === 'bombs')
                nextP1Move = { ...nextP1Move, powerups: {...nextP1Move.powerups, bombs: nextP1Move.bombs + 1 }}
            else if (valid.type === 'fire')
                nextP1Move = { ...nextP1Move, powerups: {...nextP1Move.powerups, fire: nextP1Move.fire + 1 }}
        }
        if (keys['s']) {
            nextP1Move = {...nextP1Move, y: nextP1Move.y + 1}
            let valid = validMove(nextP1Move)
            if (!valid.status) return
            
            if (valid.type === 'bombs')
                nextP1Move = { ...nextP1Move, powerups: {...nextP1Move.powerups, bombs: nextP1Move.bombs + 1 }}
            else if (valid.type === 'fire')
                nextP1Move = { ...nextP1Move, powerups: {...nextP1Move.powerups, fire: nextP1Move.fire + 1 }}

        }
        if (keys['a']) {
            nextP1Move = {...nextP1Move, x: nextP1Move.x - 1}
            let valid = validMove(nextP1Move)
            if (!valid.status) return
            
            if (valid.type === 'bombs')
                nextP1Move = { ...nextP1Move, powerups: {...nextP1Move.powerups, bombs: nextP1Move.bombs + 1 }}
            else if (valid.type === 'fire')
                nextP1Move = { ...nextP1Move, powerups: {...nextP1Move.powerups, fire: nextP1Move.fire + 1 }}

        }
        if (keys['d']) {
            nextP1Move = {...nextP1Move, x: nextP1Move.x + 1}
            let valid = validMove(nextP1Move)
            if (!valid.status) return
            
            if (valid.type === 'bombs')
                nextP1Move = { ...nextP1Move, powerups: {...nextP1Move.powerups, bombs: nextP1Move.bombs + 1 }}
            else if (valid.type === 'fire')
                nextP1Move = { ...nextP1Move, powerups: {...nextP1Move.powerups, fire: nextP1Move.fire + 1 }}

        } 
        if (keys[' ']) {
            if (nextP1Move.bombs !== 0) {
                nextP1Move = { ...nextP1Move, type: 'P', bombs: nextP1Move.bombs - 1, onBomb: true }
                //send to backend
                let bomb = { type: 'B', x: nextP1Move.x, y: nextP1Move.y }
                socket.send(JSON.stringify(bomb))
            }
        }
        if (keys['ArrowUp']) {
            nextP2Move = { ...nextP2Move, y: nextP2Move.y - 1}
            let valid = validMove(nextP2Move)
            if (!valid.status) return
            
            if (valid.type === 'bombs')
                nextP2Move = { ...nextP2Move, powerups: {...nextP2Move.powerups, bombs: nextP2Move.bombs + 1 }}
            else if (valid.type === 'fire')
                nextP2Move = { ...nextP2Move, powerups: {...nextP2Move.powerups, fire: nextP2Move.fire + 1 }}

        }
        if (keys['ArrowDown']) {
            nextP2Move = { ...nextP2Move, y: nextP2Move.y + 1}
            let valid = validMove(nextP2Move)
            if (!valid.status) return
            
            if (valid.type === 'bombs')
                nextP2Move = { ...nextP2Move, powerups: {...nextP2Move.powerups, bombs: nextP2Move.bombs + 1 }}
            else if (valid.type === 'fire')
                nextP2Move = { ...nextP2Move, powerups: {...nextP2Move.powerups, fire: nextP2Move.fire + 1 }}

        }
        if (keys['ArrowLeft']) {
            nextP2Move = { ...nextP2Move, x: nextP2Move.x - 1}
            let valid = validMove(nextP2Move)
            if (!valid.status) return
            
            if (valid.type === 'bombs')
                nextP2Move = { ...nextP2Move, powerups: {...nextP2Move.powerups, bombs: nextP2Move.bombs + 1 }}
            else if (valid.type === 'fire')
                nextP2Move = { ...nextP2Move, powerups: {...nextP2Move.powerups, fire: nextP2Move.fire + 1 }}

        }
        if (keys['ArrowRight']) {
            nextP2Move = { ...nextP2Move, x: nextP2Move.x + 1}
            let valid = validMove(nextP2Move)
            if (!valid.status) return
            
            if (valid.type === 'bombs')
                nextP2Move = { ...nextP2Move, powerups: {...nextP2Move.powerups, bombs: nextP2Move.bombs + 1 }}
            else if (valid.type === 'fire')
                nextP2Move = { ...nextP2Move, powerups: {...nextP2Move.powerups, fire: nextP2Move.fire + 1 }}

        }
        if (keys['Control']) {
            console.log('player 2 planting bomb!')
        }

        let updatedGrid = grid.map(e => e.slice())
        if (online) {
            // if player was on the bomb before then let's persist that bomb else it's an open space
            // if next move was planting bomb, we gotta render that bomb
            updatedGrid[prevP1Move.x][prevP1Move.y].type = (prevP1Move.onBomb) ? 'B' : 'O'
            updatedGrid[nextP1Move.x][nextP1Move.y] = (nextP1Move.onBomb) ? {...nextP1Move, type: 'B'} : nextP1Move

            setPlayer(nextP1Move)
        } else {
            updatedGrid[prevP1Move.x][prevP1Move.y].type = (prevP1Move.onBomb) ? 'B' : 'O'
            updatedGrid[nextP1Move.x][nextP1Move.y] = (nextP1Move.onBomb) ? {...nextP1Move, type: 'B'} : nextP1Move

            updatedGrid[prevP2Move.x][prevP2Move.y].type = (prevP2Move.onBomb) ? 'B' : 'O'
            updatedGrid[nextP2Move.x][nextP2Move.y] = (nextP2Move.onBomb) ? {...nextP2Move, type: 'B'} : nextP2Move

            setPlayers([nextP1Move, nextP2Move])
        }
        setGrid(updatedGrid)
        if (online) {
            //send to backend for multiplayer
            socket.send(JSON.stringify(updatedGrid))
        }
    }

    // just for debugging
    useEffect(() => {
        console.log('player status changed', player)
    }, [player])

    const renderImage = (context, source, row, col, player=false) => {
        const image = new Image()
        image.onload = () => {
            context.drawImage(image, row * 50, col * 50)
            if (player) {
                context.font = '20px Calibri'
                context.fillStyle = 'black'
                context.fillText('P1', row * 50 + 20, col * 50 + 20)
            }
        }
        image.src = source
    }

    const validMove = (nextMove) => {
        const row = nextMove.x
        const col = nextMove.y

        // if x or y is negative, we can just return false
        // if wall then false, check for bombs too
        if (row < 0 || col < 0 || row > grid.length - 1|| col > grid[0].length - 1) return { status: false }
        if (grid[row][col].type === 'W' || grid[row][col].type === 'BW' || grid[row][col].type === 'B' || grid[row][col].type === 'P') return { status: false }
        if (grid[row][col].type === 'BP') return { status: true, type: 'bombs' }
        if (grid[row][col].type === 'FP') return { status: true, type: 'fire' }

        return {status: true }
    }

    const handleKeyDown = (e) => {
        e.preventDefault()
        keys[e.key] = true
        movePlayer()
    }

    const handleKeyUp = (e) => {
        e.preventDefault()
        keys[e.key] = false
        console.log(keys)
        movePlayer()
    }

    return (
        <React.Fragment>
            <div className='game-container'>
                <canvas ref={canvasRef} className='game' width={650} height={650} tabIndex={0} onKeyDown={(e) => handleKeyDown(e)} onKeyUp={(e) => handleKeyUp(e)} />
            </div>
            <StatusBar players={players} />
            {/* <Chat socket={socket} user={user} /> */}
        </React.Fragment>
    )
}