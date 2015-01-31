/*
TODO: Fix stop button and clicking on cells DONE
Put the mona lisa in? DONE
-- Insert a formation wherever you want
-- Separate view and model data more
*/
var game_of_life;
var canvas = document.createElement("canvas");
canvas.style.display = "none";
document.getElementById('container').appendChild(canvas);
var ctx = canvas.getContext('2d');
var img = new Image();
img.addEventListener("load", function() {
	canvas.width = img.width;
	canvas.height = img.height;
  	ctx.drawImage(img, 0, 0);
  	game_of_life = new GameOfLife();
}, false);
img.src = 'img/mona_lisa.jpg';


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
		// var x_mult = x / grid.width,
		// 	y_mult = y / grid.height,
		// 	green = '99',
		// 	red =  Math.floor(256 * x_mult).toString(16),
		// 	blue = Math.floor(256 * y_mult).toString(16);
		// while (red.length < 2) {
		// 	red = "0" + red;
		// }
		// while (blue.length < 2) {
		// 	blue = "0" + blue;
		// }
		// return '#' + red + green + blue;

		function avg_color_of_img_range(x, y, width, height) {
			var color_data = ctx.getImageData(x, y, width, height).data;
			var rgb = {r: 0, g: 0, b: 0};
			var block_size = 4;
			var i;
			var count = 0;
			// console.log(x + "  " + y + "  " + width + "  " + height);
			// console.log(color_data);
			for (i=0; i<color_data.length; i+=block_size) {
				rgb.r += color_data[i];
				rgb.g += color_data[i+1];
				rgb.b += color_data[i+2];
				count ++;
			}
			rgb.r = Math.floor(rgb.r / count).toString(16);
			rgb.g = Math.floor(rgb.g / count).toString(16);
			rgb.b = Math.floor(rgb.b / count).toString(16);
			while (rgb.r.length < 2) {
				rgb.r = "0" + rgb.r;
			}
			while (rgb.g.length < 2) {
				rgb.g = "0" + rgb.g;
			}
			while (rgb.b.length < 2) {
				rgb.b = "0" + rgb.b;
			}
			return "#" + rgb.r + rgb.g + rgb.b;
		}
		var img_cell_width = Math.floor(img.width / grid.width);
		var img_cell_height = Math.floor(img.height / grid.height);
		var img_start_x = img_cell_width*x,
			img_start_y = img_cell_height*y;
		// console.log("Cell_x and cell_Y: (" + x + ", " + y + ").  Imgx and imgy: (" + img_x + ", " + img_y + ")");
		return avg_color_of_img_range(img_start_x, img_start_y, img_cell_width, img_cell_height);

		// function color(x, y) {
		// 	return canvas.getContext('2d').getImageData(x, y, 1, 1).data;
		// }
		// return "red";
		/*
		try {
		        data = context.getImageData(0, 0, width, height);
		    } catch(e) {
		        // security error, img on diff domain 
		        return defaultRGB;
		    }

		    length = data.data.length;

		    while ( (i += blockSize * 4) < length ) {
		        ++count;
		        rgb.r += data.data[i];
		        rgb.g += data.data[i+1];
		        rgb.b += data.data[i+2];
		    }*/
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

	grid.full_config = function() {
		grid.traverse(function(cell) {
			cell.update_liveliness(true);
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
		// if (live) {
		// 	cell.element.style.backgroundColor = cell.live_color;
		// } else {
		// 	cell.element.style.backgroundColor = "#ffffff";
		// }
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
		for (y=0; y<view.grid.height; y++) {
			tr = document.createElement('tr');
			for (x=0; x<view.grid.width; x++) {
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
				removeClass(cell.element, 'dead');
				cell.element.style.backgroundColor = cell.live_color;
			} else {
				addClass(cell.element, 'dead');
				cell.element.style.backgroundColor = "#ffffff";
			}
		});
	}

	view.animate = function() {
		if (!view.running) {
			return;
		}
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
	gol.grid = new Grid(79, 120);
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
	gol.full_config = function() {
		// TODO: Get rid of this and put it in gol.set_config
		gol.grid.full_config();
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

// shim layer with setTimeout fallback
window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

