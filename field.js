import { Vector2, Point } from "./vector.js";
import { CellBase, EmptyCell, WallCell, RobotCell } from "./cell.js";
import { Settings } from "./settings.js";
import { colorToRGB, flipVerticalImage, rotateImage90 } from "./image.js";
import { padImage, quantizeImage, loadImageDataFromUrl } from "./image.js";

/**
 * Represents a field which is an n by m matrix of CellBase instances.
 */
export class Field {
	/**
	 * Creates an instance of field.
	 * @param {number} rows - The number of rows in the layer.
	 * @param {number} cols - The number of columns in the layer.
	 * @param {Array<Array<CellBase>>} matrix - The matrix of cells.
	 * @param {Vector2} spawn_position - The position of the spawn point.
	 */
	constructor(rows, cols, matrix, spawn_position) {
		/** @type {number} - The number of rows in the field. */
		this.rows = rows;

		/** @type {number} - The number of columns in the field. */
		this.cols = cols;

		/** @type {Point} - The position of the spawn point. */
		this.spawn_position = spawn_position.clone();

		// Deep copy the matrix
		/** @type {Array<Array<CellBase>>} */
		this.matrix = matrix.map((row) =>
			row.map((cell) =>
				Object.assign(Object.create(Object.getPrototypeOf(cell)), cell),
			),
		);

		// TODO: Check if valid (has exaclty one spawnpoint)
	}

	/**
	 * Creates a Field instance from a given URL.
	 * @param {string} url - The URL to fetch the field data from.
	 * @param {Settings} settings - Settings for the url processing, and simulation.
	 * @returns {Promise<Field>} A promise that resolves to a Field instance.
	 */
	static async fromUrl(url, settings) {
		const palette = {
			empty: colorToRGB(settings.empty_color),
			wall: colorToRGB(settings.wall_color),
			robot: colorToRGB(settings.spawn_color),
		};

		const imageData = await loadImageDataFromUrl(url);
		const rotatedImageData = rotateImage90(imageData);
		const flippedImageData = flipVerticalImage(rotatedImageData);
		const qImageData = quantizeImage(flippedImageData, [
			settings.empty_color,
			settings.wall_color,
			settings.spawn_color,
		]);
		const mapImage = padImage(qImageData, palette.wall);

		const spawn_color_rgba = colorToRGB(settings.spawn_color);
		// XXX: Do we have to pad rotate the image?
		// Map every pixel to a cell
		const matrix = Array.from({ length: mapImage.height }, (_, x) =>
			Array.from({ length: mapImage.width }, (_, y) => {
				const pos = new Point(x, y);
				const index = (x * mapImage.width + y) * 4;
				const color = Array.from(mapImage.data.slice(index, index + 4));

				// If this is the spawn, then add an empty cell
				const is_spawn = color.every(
					(channel, index) => channel === spawn_color_rgba[index],
				);
				if (is_spawn) {
					return CellBase.createCell(pos, palette.empty, palette);
				}

				return CellBase.createCell(pos, color, palette);
			}),
		);

		let spawn_position = null;
		for (let x = 0; x < mapImage.height; x++) {
			for (let y = 0; y < mapImage.width; y++) {
				const index = (x * mapImage.width + y) * 4;
				const color = Array.from(mapImage.data.slice(index, index + 4));
				if (
					color.every((channel, index) => channel === spawn_color_rgba[index])
				) {
					if (spawn_position !== null) {
						throw new Error("Multiple spawn points found in the field data");
					}
					spawn_position = new Vector2(x, y);
				}
			}
		}

		if (spawn_position === null) {
			throw new Error("No spawn point found in the field data");
		}

		return new Field(mapImage.height, mapImage.width, matrix, spawn_position);
	}

	/**
	 * Gets the cell at the specified position.
	 * @param {Vector2} position - The position of the cell.
	 * @returns {CellBase} The cell at the specified position.
	 */
	getCell(position) {
		const { x, y } = position;
		if (x >= 0 && x < this.rows && y >= 0 && y < this.cols) {
			return this.matrix[x][y];
		}
		throw new Error("Cell position out of bounds");
	}

	/**
	 * Sets the cell at the specified position.
	 * @param {Vector2} position - The position of the cell.
	 * @param {CellBase} cell - The cell to set at the specified position.
	 */
	setCell(position, cell) {
		const { x, y } = position;
		if (x >= 0 && x < this.rows && y >= 0 && y < this.cols) {
			this.matrix[x][y] = cell;
		} else {
			throw new Error("Cell position out of bounds");
		}
	}

	/**
	 * Checks if the cell at the specified position is a wall.
	 * @param {Vector2} position - The position of the cell.
	 * @returns {boolean} True if the cell is a wall, false otherwise.
	 */
	isWall(position) {
		const cell = this.getCell(position);
		return cell instanceof WallCell;
	}

	/**
	 * Checks if the cell at the specified position is occupied by anything, a robot settled or active or a wall.
	 * @param {Vector2} position - The position of the cell.
	 * @returns {boolean} True if the cell is occupied.
	 */
	isOccupied(position) {
		const cell = this.getCell(position);
		return cell instanceof RobotCell || cell instanceof WallCell;
	}

	/**
	 * Renders the entire field.
	 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context to draw on.
	 * @param {number} width - The width of the canvas.
	 * @param {number} height - The height of the canvas.
	 */
	render(ctx, width, height) {
		// Given the width and height of the canvas, we can calculate how much should we shrink
		// the cells to fit the canvas without stretching them.
		ctx.clearRect(0, 0, width, height);
		const cellSize = Math.min(width / this.cols, height / this.rows);

		// Draw the border
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		ctx.strokeRect(0, 0, width, height);

		// Draw grid
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1;
		for (let x = 1; x < this.rows; x++) {
			ctx.beginPath();
			ctx.moveTo(0, x * cellSize);
			ctx.lineTo(this.cols * cellSize, x * cellSize);
			ctx.stroke();
		}

		for (let y = 1; y < this.cols; y++) {
			ctx.beginPath();
			ctx.moveTo(y * cellSize, 0);
			ctx.lineTo(y * cellSize, this.rows * cellSize);
			ctx.stroke();
		}

		// Draw the spawn point
		ctx.fillStyle = "yellow";
		ctx.fillRect(
			this.spawn_position.x * cellSize,
			this.spawn_position.y * cellSize,
			cellSize - 1,
			cellSize - 1,
		);

		// Render each cell
		for (const row of this.matrix) {
			for (const cell of row) {
				// translate the cell position to the canvas position
				cell.render(ctx, cellSize);
			}
		}
	}

	/**
	 * Moves the robot from one position to another.
	 * @param {Vector2} from - The robot's current position.
	 * @param {Vector2} to - The robot's target position.
	 * @throws {Error} Throws an error if the move is invalid.
	 */
	moveRobot(from, to) {
		if (from.equals(to)) return;

		const fromCell = this.getCell(from);
		const toCell = this.getCell(to);

		if (!(fromCell instanceof RobotCell)) {
			throw new Error("The starting position does not contain a robot");
		}

		if (!(toCell instanceof EmptyCell)) {
			throw new Error("The target position is not empty");
		}

		const manhattanDistance = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
		if (manhattanDistance !== 1) {
			throw new Error(
				"The target position is not within a single unit of distance",
			);
		}

		// For performance, we can swap the cells instead of copying them
		const temp = this.matrix[to.x][to.y];
		this.matrix[to.x][to.y] = this.matrix[from.x][from.y];
		this.matrix[from.x][from.y] = temp;
	}
}
