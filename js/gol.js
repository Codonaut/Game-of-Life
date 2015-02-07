/*
-- Insert a formation wherever you want
a) Hover over table cell and have it filled in
b) Hover over table cell and have a formation appear with start_x, and start_y from cursor
c) Click to plcae that
*/
var gol;
var canvas = document.createElement("canvas");
canvas.style.display = "none";
document.getElementById('container').appendChild(canvas);
var ctx = canvas.getContext('2d');
var img = new Image();
img.addEventListener("load", function() {
	canvas.width = img.width;
	canvas.height = img.height;
  	ctx.drawImage(img, 0, 0);
  	gol = new GameOfLife();
}, false);
img.src = 'img/mona_lisa.jpg';


function Grid(w, h) {
	var grid = this;
	grid.width = w;
	grid.height = h;
	grid.rows = [];
	grid.previewed_cells = [];

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
		for (x=0; x<grid.width; x++) {
			for (y=0; y<grid.height; y++) {
				fn(grid.rows[x][y]);
			}
		}
	}
	grid.traverse_range = function(fn, x1, y1, x2, y2) {
		for (x=x1; x<x2; x++) {
			for (y=y1; y<y2; y++) {
				fn(grid.rows[x][y]);
			}
		}
	}

	grid.coord_to_color = function(x, y) {
		/*
			Map x position to red, and y position to blue.
		*/
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
		return avg_color_of_img_range(img_start_x, img_start_y, img_cell_width, img_cell_height);
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

	grid.preview_config = function(config, start_x, start_y) {
		var map, x, y, cell;
		grid.remove_previews();
		if (!start_x) {
			start_x = 0;
		}
		if (!start_y) {
			start_y = 0;
		}
		map = config.map;
		for (x=start_x; x<start_x+map[0].length+1; x++) {
			for (y=start_y; y<start_y+map.length+1; y++) {
				cell = grid.rows[x][y];
				if (map[x-start_x] && map[x-start_x][y-start_y]) {
					cell.previewed_live = true;
					grid.previewed_cells.push(cell);
				}
			}
		}
	}

	grid.remove_previews = function() {
		var i,
			removed = [];
		for (i=0; i<grid.previewed_cells.length; i++) {
			grid.previewed_cells[i].previewed_live = false;
			removed.push(grid.previewed_cells[i]);
		}
		grid.previewed_cells = [];
		return removed;
	}
	
	grid.set_config = function(config, start_x, start_y) {
		if (config === 'random') {
			grid.traverse(function(cell) {
				cell.live = Math.random() > .5;
			});
		} else if (config === 'full') {
			grid.traverse(function(cell) {
				cell.live = true;
			});
		} else if (config === 'empty') {
			grid.traverse(function(cell) {
				cell.live = false;
			});
		} else {
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
						cell.live = true;
					} else {
						cell.live = false;
					}
				}
			}
		}
	}

	function Cell(x, y) {
		var cell = this;
		cell.x = x;
		cell.y = y;
		cell.live = false;
		cell.previewed_live = false;
		cell.live_neighbors = 0;
		cell.element = null;
		cell.live_color = "red";	// This gets set later, but red is the fallback
		cell.dead_color = "#ffffff";
		cell.previewed_live_color = "blue";
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

	Cell.prototype.register_event_handlers = function() {
		var cell = this;
		cell.element.addEventListener('mouseover', function(evt) {
			console.log("Starting");
			var start = new Date();
			gol.grid.preview_config(new Configuration('block'), cell.x, cell.y);
			gol.view.update(cell.x, cell.y, cell.x+2, cell.y+2);		// TODO: Update affected section only
			var finish = new Date();
			var difference = new Date();
			difference.setTime(finish.getTime() - start.getTime());
			// console.log( difference.getMilliseconds() );
		});

		cell.element.addEventListener('mouseleave', function(evt) {
			console.log("Leaving");
			var range = coord_range_from_cell_arr(gol.grid.remove_previews());
			// var start = new Date();
			// console.log(range);
			// console.log(gol.grid.previewed_cells);
			console.log(range);
			gol.view.update(range[0], range[1], range[2], range[3]); // TODO: Can I just pass in range?
			// var finish = new Date();
			// var difference = new Date();
			// difference.setTime(finish.getTime() - start.getTime());
			// console.log( difference.getMilliseconds() );
		})
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
				cell.register_event_handlers();
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

	view.update = function(x1, y1, x2, y2) {
		if (x1 || y1 || x2 || y2) {
			grid.traverse_range(function(cell) {
				if (cell.live) {
					removeClass(cell.element, 'dead');
					cell.element.style.backgroundColor = cell.live_color;
				} else if (cell.previewed_live) {
					cell.element.style.backgroundColor = cell.previewed_live_color;
				} else {
					addClass(cell.element, 'dead');
					cell.element.style.backgroundColor = cell.dead_color;
				}
			}, x1, y1, x2+1, y2+1);
		} else {
			grid.traverse(function(cell) {
				if (cell.live) {
					removeClass(cell.element, 'dead');
					cell.element.style.backgroundColor = cell.live_color;
				} else if (cell.previewed_live) {
					cell.element.style.backgroundColor = cell.previewed_live_color;
				} else {
					addClass(cell.element, 'dead');
					cell.element.style.backgroundColor = cell.dead_color;
				}
			});
		}
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
		console.log("Setting next animation " + tick_frequency);
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

	gol.set_config = function(config, start_x, start_y) {
		/*	config is either a string "random"/"full"/"empty" or a valid instance of Configuration.
			start_x and start_y are the starting position of the configuration, if a Configuration
			instance is passed in.
		*/
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
	*/
	var config = this;
	config.type = c_type;
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
		alert("Invalid configuration given!");
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


function coord_range_from_cell_arr(arr) {
	var i,
		cell,
		min_x, max_x,
		min_y, max_y;
	for (i=0; i<arr.length; i++) {
		cell = arr[i];
		if (min_x === undefined || min_x > cell.x) {
			min_x = cell.x;
		}
		if (min_y === undefined || min_y > cell.y) {
			min_y = cell.y;
		}
		if (max_x === undefined || max_x < cell.x) {
			max_x = cell.x;
		}
		if (max_y === undefined || max_y < cell.y) {
			max_y = cell.y;
		}
	}
	return [min_x, min_y, max_x, max_y];
}