function Grid(w, h) {
	var grid = this;
	grid.width = w;
	grid.height = h;
	grid.rows = [];

	grid.reset = function() {
		var x, 
			y, 
			row;
		grid.rows = [];
		for (x=0; x<grid.width; x++) {
			row = [];
			for (y=0; y<grid.height; y++) {
				row.push(new Cell(x, y));
			}
			grid.rows.push(row);
		}
	}

	grid.reset();

	grid.traverse = function(fn) {
		var x, y;
		for (x=0; x<grid.width; x++) {
			for (y=0; y<grid.height; y++) {
				fn(grid.rows[x][y]);
			}
		}
	}

	grid.step = function() {
		// Determine who will live and die next run
		grid.traverse(function(cell) {
			cell.compute_live_neighbors();
		});
		grid.traverse(function(cell) {
			cell.update();
		});
	}
	
	grid.randomize_config = function() {
		// Randomizes the configuration of the grid
		grid.traverse(function(cell) {
			cell.live = Math.random() > .5;
		});
	}

	function Cell(x, y) {
		var cell = this;
		cell.x = x;
		cell.y = y;
		cell.live = false;
		cell.live_neighbors = 0;
		cell.element = null;
	}

	Cell.prototype.compute_live_neighbors = function() {
		var x, 
			y, 
			live_neighbors = 0
			cell = this;
		for (x=Math.max(cell.x-1, 0); x<=Math.min(cell.x+1, grid.width-1); x++) {
			for (y=Math.max(cell.y-1, 0); y<=Math.min(cell.y+1, grid.height-1); y++) {
				var curr_cell = grid.rows[x][y];
				if (curr_cell && curr_cell !== cell && curr_cell.live) {
					live_neighbors += 1;
				}
			}
		}
		cell.live_neighbors = live_neighbors;
	}

	Cell.prototype.update = function() {
		var cell = this;
		if (cell.live) {
			if (cell.live_neighbors !== 2 && cell.live_neighbors !== 3) {
				cell.live = false;
			}
		} else if (cell.live_neighbors === 3) {
			cell.live = true;
		}
	}

	Cell.prototype.toggle = function() {
		var cell = this;
		cell.live = !cell.live;
	}
}

function View(grid) {
	var view = this;
	view.table = document.getElementById('game_table');
	view.grid = grid;

	view.init = function() {
		var x, y, tr, td;
		for (x=0; x<view.grid.width; x++) {
			tr = document.createElement('tr');
			for (y=0; y<view.grid.height; y++) {
				td = document.createElement('td');
				addClass(td, 'cell');
				cell = view.grid.rows[x][y];
				cell.element = td;
				td.addEventListener('click', (function(cell) {
					return function(e) {
						cell.toggle();
						view.update();
					}
				})(cell));

				tr.appendChild(td);
			}
			view.table.appendChild(tr);
		}
	}

	view.update = function() {
		grid.traverse(function(cell) {
			if (cell.live) {
				addClass(cell.element, 'live');
			} else {
				removeClass(cell.element, 'live');
			}
		});
	}

	view.animate = function() {
		view.grid.step();
		view.update();
	}
	

	view.start = function() {
		if (!view.animator) {
			view.animator = setInterval((function(view) {
				return function() {
					view.animate();
				}
			})(view), 400);
		}
	}

	view.stop = function() {
		if (view.animator) {
			clearInterval(view.animator);
			view.animator = null;
		}
	}

	view.init();
}

function GameOfLife() {
	var gol = this;
	gol.grid = new Grid(100, 100);
	gol.view = new View(this.grid);

	gol.randomize_config = function() {
		gol.grid.randomize_config();
		gol.view.update();
	}
}

function addClass(el, className) {
    var classRegexp = new RegExp('\\b' + className + '\\b', 'g');
    if (!classRegexp.test(el.className)) {
        el.className += ' ' + className;
    }
}

function removeClass(el, className) {
    var classRegexp = new RegExp('\\b' + className + '\\b', 'g');
    el.className = el.className.replace(classRegexp, '');
}

var game_of_life = new GameOfLife();