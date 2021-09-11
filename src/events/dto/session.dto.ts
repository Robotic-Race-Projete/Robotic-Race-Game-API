enum SessionCommands {
    createLobby = 'create_lobby',
    joinLobby = 'join_lobby',
    readyUp = 'ready_up'

}

class Session { command: SessionCommands; data: any }

class CreateLobbySession implements Session {
    command: SessionCommands.createLobby;
    data: {};
}