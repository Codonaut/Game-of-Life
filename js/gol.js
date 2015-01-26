/*
A Game of Life implementation.  This script expects there to be a containing element
with id "container".  It displays the game as a 100x100 grid of divs, each with 
class="cell", and class="live" if alive.
*/

var $container;
var size_px = {'width': null, 'height': null};
var num_cells = {'width': 20, 'height': 20};
var cell_size = {'width': null, 'height': null};
var gutter_width = 1;
var cells;

function create_cells() {
	cells = [];
	cell_size.width = (size_px.width - gutter_width*(num_cells.width-1)) / num_cells.width;
	cell_size.height = (size_px.height - gutter_width*(num_cells.height-1)) / num_cells.height;
	for (var i=0; i<num_cells.height; i++) {
		var curr_y = i*cell_size.height + i*gutter_width;
		var curr_row = $('<tr></tr>');
		cells.push([]);
		for (var j=0; j<num_cells.width; j++) {
			var curr_x = j*cell_size.width + j*gutter_width;
			var cell = $('<td class="cell"></td>').attr({
				'width': cell_size.width,
				'height': cell_size.height,
			}).click(function() {
				$(this).toggleClass('live');

			});
			cells[i].push({
				'html_cell': cell,
				'live': false
			});
			curr_row.append(cell);
		}
		$container.append(curr_row);
	}
}

function count_live_neighbors(cells, x, y) {
	var cell = cells[x][y];
	var live_neighbors = 0;
	for (var i=-1; i<2; i++) {
		for (var j=-1; j<2; j++) {
			if (x+i > 0 && y+j > 0) {
				if (cells[x+i][y+j]['live']) {

				}
			}
		}
	}
}

function do_tick() {

}

$(document).ready(function() {
	$container = $('#container');
	size_px.width = $container.width();
	size_px.height = $container.height();

	create_cells();
	// setInterval(do_tick, 500);
});
