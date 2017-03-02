"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.count = 20;
exports.UserSteps = {
    master: 1,
    slave: 2,
};
exports.UserStatus = {
    master: 'master',
    slave: 'slave',
};
class Clients {
    constructor() {
        this.rooms = [];
        this.clients = {};
        this.steps = {};
    }
    static createField() {
        const arr = [];
        for (let i = 0; i < exports.count; i++) {
            arr.push(new Array(exports.count));
        }
        return arr;
    }
    createRoom() {
        const room = '' + this.rooms.length;
        this.rooms.push(room);
        this.steps[room] = Clients.createField();
        this.clients[room] = {
            active: exports.UserStatus.master,
            master: null,
            slave: null,
            end: false
        };
        return room;
    }
    _getRoom(id) {
        return this.clients[id];
    }
    addStep(room, position, user) {
        const field = this.steps[room];
        const [x, y] = position.split(';');
        field[+y][+x] = exports.UserSteps[user];
    }
    createRoomSetMaster(id) {
        const room = this.createRoom();
        this.clients[room].master = id;
        return room;
    }
    getMaster(room) {
        return this.clients[room].master;
    }
    setSlave(room, id) {
        if (this.clients[room] && this.clients[room].slave == null) {
            this.clients[room].slave = id;
            return true;
        }
        return false;
    }
    getSlave(room) {
        return this.clients[room].slave;
    }
    getRoom(userId) {
        const { clients } = this;
        for (let room in clients) {
            const { master, slave } = clients[room];
            if (master == userId) {
                return {
                    status: exports.UserStatus.master,
                    room,
                    master,
                    slave,
                };
            }
            if (slave == userId) {
                return {
                    status: exports.UserStatus.slave,
                    room,
                    master,
                    slave,
                };
            }
        }
        return null;
    }
    toggleUser(room) {
        const active = this.clients[room].active == exports.UserStatus.master ? exports.UserStatus.slave : exports.UserStatus.master;
        this.clients[room].active = active;
        return {
            id: this.clients[room][active],
            status: active
        };
    }
    disconnect(userId) {
        const { clients } = this;
        const roomId = this.getRoomByUser(userId);
        if (!roomId)
            return;
        const room = clients[roomId];
        if (room.master == userId) {
            room.master = null;
        }
        else if (room.slave == userId) {
            room.slave = null;
        }
        if (!(room.master && room.slave)) {
            room.end = true;
            delete this.steps[roomId];
        }
    }
    getRoomByUser(id) {
        const { clients } = this;
        for (let room in clients) {
            const { master, slave } = clients[room];
            if (master == id || slave == id) {
                return room;
            }
        }
        return false;
    }
    check(room, user) {
        const field = this.steps[room];
        const userType = exports.UserSteps[user];
        return this.checkWin(field, userType);
    }
    checkWin(field, user) {
        const height = field.length;
        const width = field[0].length;
        function check(x, y, dX, dY) {
            for (let _x = x + dX, _y = y + dY;; _x += dX, _y += dY) {
                if (field[_y][_x] != user) {
                    return false;
                }
                if (_x >= x + 4 || _y >= y + 4)
                    break;
            }
            return true;
        }
        var y, x;
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                if (field[y][x] == user) {
                    if (y + 4 < height && x + 4 < width) {
                        // right diagonal
                        if (check(x, y, 1, 1)) {
                            return true;
                        }
                        if (x - 4 >= 0) {
                            // left diagonal
                            if (check(x, y, -1, 1)) {
                                return true;
                            }
                        }
                    }
                    if (x + 4 < width) {
                        // right
                        if (check(x, y, 1, 0)) {
                            return true;
                        }
                    }
                    if (y + 4 < height) {
                        // down
                        if (check(x, y, 0, 1)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
}
exports.Clients = Clients;
//# sourceMappingURL=clients.js.map