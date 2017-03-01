const size = 20;

function checkWin(field, user) {
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

function createField() {
  const arr = [];
  for (let i = 0; i < size; i++) {
    arr.push(new Array(size));
  }
  return arr;
}
const field = createField();

function gen() {
  const app = document.querySelector('.app');
  for (var i = 0; i < size; i++) {
    const row = document.createElement('div');
    for (var j = 0; j < size; j++) {
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      ((i, j) => {
        inp.addEventListener('click', () => {
          field[i][j] = !field[i][j];
        });
      })(i, j);
      row.appendChild(inp);
    }
    app.appendChild(row);
  }
}

gen();
document.querySelector('button').addEventListener('click', () => {
  console.log(checkWin(field, true));
});