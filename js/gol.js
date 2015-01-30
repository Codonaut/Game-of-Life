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

	grid.coord_to_color = function(x, y) {
		/*
			Try and map x position to red, and y position to blue.
		*/
		var x_mult = x / grid.width,
			y_mult = y / grid.height,
			green = '99',
			red =  Math.floor(256 * x_mult).toString(16),
			blue = Math.floor(256 * y_mult).toString(16);
		while (red.length < 2) {
			red = "0" + red;
		}
		while (blue.length < 2) {
			blue = "0" + blue;
		}
		return '#' + red + green + blue;
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
		// Todo: have this use set_config
		grid.traverse(function(cell) {
			cell.update_liveliness(Math.random() > .5);
		});
	}

	grid.set_config = function(config, start_x, start_y) {
		var map, x, y, cell;
		if (!start_x) {
			start_x = 0;
		}
		if (!start_y) {
			start_y = 0;
		}
		map = config.map;
		for (x=0; x<grid.width; x++) {
			for (y=0; y<grid.height; y++) {
				cell = grid.rows[x][y];
				if (map[x-start_x] && map[x-start_x][y-start_y]) {
					cell.update_liveliness(true);
				} else {
					cell.update_liveliness(false);
				}
			}
		}
	}

	function Cell(x, y) {
		var cell = this;
		cell.x = x;
		cell.y = y;
		cell.live = false;
		cell.live_neighbors = 0;
		cell.element = null;
		cell.live_color = "#ffffff";
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
				cell.update_liveliness(false);
			}
		} else if (cell.live_neighbors === 3) {
			cell.update_liveliness(true);
		}
	}

	Cell.prototype.update_liveliness = function(live) {
		var cell = this;
		cell.live = live;
		if (live) {
			cell.element.style.backgroundColor = cell.live_color;
		} else {
			cell.element.style.backgroundColor = "#ffffff";
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
	view.speed = document.getElementById('speed');
	view.running = false;
	view.grid = grid;

	view.init = function() {
		var x, y, tr, td, cell_width, cell_height;
		for (x=0; x<view.grid.width; x++) {
			tr = document.createElement('tr');
			for (y=0; y<view.grid.height; y++) {
				td = document.createElement('td');
				addClass(td, 'cell');
				cell = view.grid.rows[x][y];
				cell.live_color = view.grid.coord_to_color(x, y);
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
				// addClass(cell.element, 'live');
				removeClass(cell.element, 'dead');

			} else {
				// removeClass(cell.element, 'live');
				addClass(cell.element, 'dead');

			}
		});
	}

	view.animate = function() {
		var tick_frequency = 3000 / view.speed.value;
		if (tick_frequency !== Infinity) {
			view.grid.step();
			view.update();
		} else {
			tick_frequency = 1000;
		}
		setTimeout(function() {
			window.requestAnimationFrame(view.animate);
		}, tick_frequency);
	}
	

	view.start = function() {
		if (!view.running) {
			window.requestAnimationFrame(view.animate);
		}
		view.running = true;
	}

	view.stop = function() {
		view.running = false;
	}

	view.init();
}

function GameOfLife() {
	var gol = this;
	gol.grid = new Grid(55, 55);
	gol.view = new View(this.grid);

	gol.randomize_config = function() {
		// TODO: Get rid of this and put it in gol.set_config
		gol.grid.randomize_config();
		gol.view.update();
	}
	gol.set_config = function(config, start_x, start_y) {
		// Can I do something cleaner here than have start_x and start_y?
		gol.grid.set_config(config, start_x, start_y);
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

function Configuration(c_type) {
	/*
	Configurations are stored as a two-dimensional array of cells.
	The array is the minimum size needed for the configuration-- not the size
	of the overall grid.

	TODO: What's a better way to store the config?
	*/
	var config = this;
	config.types = {
		'block': [
			[1, 1],
			[1, 1]
		],
		'beehive': [
			[0, 1, 1, 0],
			[1, 0, 0, 1],
			[0, 1, 1, 0]
		],
		'loaf': [
			[0, 1, 1, 0],
			[1, 0, 0, 1],
			[0, 1, 0, 1],
			[0, 0, 1, 0]
		],
		'boat': [
			[1, 1, 0],
			[1, 0, 1],
			[0, 1, 0]
		],
		'toad': [
			[0, 0, 0, 0],
			[0, 1, 1, 1],
			[1, 1, 1, 0],
			[0, 0, 0, 0],
		],
		'beacon': [
			[1, 1, 0, 0],
			[1, 1, 0, 0],
			[0, 0, 1, 1],
			[0, 0, 1, 1]
		],
		'blinker': [
			[0, 1, 0],
			[0, 1, 0],
			[0, 1, 0]
		],
		'glider': [
			[1, 0, 1],
			[0, 1, 1],
			[0, 1, 0]
		],
		'pulsar': [
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
			[0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
			[0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
			[0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
			[0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
			[0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
			[0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		],
		'lightweight_spaceship': [
			[0, 0, 0, 0, 0, 0, 0],
			[0, 1, 0, 0, 1, 0, 0],
			[0, 0, 0, 0, 0, 1, 0],
			[0, 1, 0, 0, 0, 1, 0],
			[0, 0, 1, 1, 1, 1, 0],
			[0, 0, 0, 0, 0, 0, 0],
		]
	}
	config.map = config.types[c_type];
	if (!config.map) {
		console.log("Invalid configuration given!");
	}
}

var game_of_life = new GameOfLife();



// shim layer with setTimeout fallback
window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();
