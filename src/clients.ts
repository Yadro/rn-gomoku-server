export const count = 20;

export const UserSteps = {
  master: 1,
  slave: 2,
};

export const UserStatus = {
  master: 'master',
  slave: 'slave',
};

interface Client {
  master;
  slave;
  active;
  end;
}

type Field = any[][];
type RoomId = string;

export class Clients {
  rooms: string[];
  clients: {[key: string]: Client};
  steps: {[key: string]: Field};

  constructor() {
    this.rooms = [];
    this.clients = {};
    this.steps = {};
  }

  static createField() {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(new Array(count));
    }
    return arr;
  }

  createRoom() {
    const room = '' + this.rooms.length;
    this.rooms.push(room);
    this.steps[room] = Clients.createField();
    this.clients[room] = {
      active: UserStatus.master,
      master: null,
      slave: null,
      end: false
    };
    return room;
  }

  addStep(room: RoomId, position: string, user) {
    const field = this.steps[room];
    const [x, y] = position.split(';');
    field[+y][+x] = UserSteps[user];
  }

  createRoomSetMaster(id) {
    const room = this.createRoom();
    this.clients[room].master = id;
    return room;
  }

  getMaster(room: RoomId) {
    return this.clients[room].master;
  }

  setSlave(room: RoomId, id) {
    if (this.clients[room] && this.clients[room].slave == null) {
      this.clients[room].slave = id;
      return true;
    }
    return false
  }

  getSlave(room: RoomId) {
    return this.clients[room].slave;
  }

  getRoom(userId) {
    const {clients} = this;
    for (let room in clients) {
      const {master, slave} = clients[room];
      if (master == userId) {
        return {
          status: UserStatus.master,
          room,
          master,
          slave,
        }
      }
      if (slave == userId) {
        return {
          status: UserStatus.slave,
          room,
          master,
          slave,
        }
      }
    }
    return null;
  }

  toggleUser(room) {
    const active = this.clients[room].active == UserStatus.master ? UserStatus.slave : UserStatus.master;
    this.clients[room].active = active;
    return {
      id: this.clients[room][active],
      status: active
    };
  }

  check(room, user) {
    const field = this.steps[room];
    const userType = UserSteps[user];
    return this.checkWin(field, userType);
  }

  private checkWin(field, user) {
    const height = field.length;
    const width = field[0].length;

    function check(x, y, dX, dY) {
      for (let _x = x + dX, _y = y + dY; ; _x += dX, _y +=dY) {
        if (field[_y][_x] != user) {
          return false;
        }
        if (_x >= x + 4 || _y >= y + 4) break;
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

