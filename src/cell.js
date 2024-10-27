import { Point, Vector2 } from "./vector.js";
import { Field } from "./field.js";
/**
 * Represents the base class for a cell with a position.
 */
export class CellBase {
	/**
	 * Creates an instance of CellBase.
	 * @param {Point} position - The position of the cell.
	 */
	constructor(position) {
		/** @type {Point} - The position of the cell. */
		this.position = position.clone();
	}

	/**
	 * Renders the cell.
	 * This method must be implemented by subclasses.
	 * @abstract
	 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
	 * @param {number} size - The size of the cell.
	 * @throws {Error} Throws an error if the method is not implemented by subclasses.
	 */
	render(ctx, size) {
		throw new Error("Render method must be implemented by subclasses");
	}

	/**
	 * Updates the cell.
	 * This method must be implemented by subclasses.
	 * @abstract
	 * @throws {Error} Throws an error if the method is not implemented by subclasses.
	 */
	update() {
		throw new Error("Update method must be implemented by subclasses");
	}

	/**
	 * Factory method to create a cell instance based on the pixel color.
	 * @param {Point} position - The cell's position.
	 * @param {Uint8ClampedArray} color - The color of the pixel (RGBA).
	 * @param {Object} palette - The color for each cell type.
	 * @returns {CellBase} The cell instance corresponding to the pixel color.
	 */
	static createCell(position, color, palette) {
		const is = (color, other_color) =>
			color.every((c, i) => c === other_color[i]);
		if (is(color, palette.empty)) {
			return new EmptyCell(position);
		}

		if (is(color, palette.wall)) {
			return new WallCell(position);
		}

		if (is(color, palette.robot)) {
			return new RobotCell(position);
		}

		throw new Error(`Invalid color: ${color}`);
	}
}

export class EmptyCell extends CellBase {
	/**
	 * Renders the cell.
	 * This method must be implemented by subclasses.
	 * @abstract
	 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
	 * @param {number} size - The size of the cell.
	 * @throws {Error} Throws an error if the method is not implemented by subclasses.
	 */
	render(ctx, size) {}

	update() {}
}

export class WallCell extends CellBase {
	/**
	 * Renders the cell.
	 * This method must be implemented by subclasses.
	 * @abstract
	 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
	 * @param {number} size - The size of the cell.
	 * @throws {Error} Throws an error if the method is not implemented by subclasses.
	 */
	render(ctx, size) {
		ctx.fillStyle = "#000000";
		ctx.fillRect(this.position.x * size, this.position.y * size, size, size);
	}

	update() {}
}

/**
 * Represents a robot cell that extends the CellBase class.
 *
 * @extends {CellBase}
 */
export class RobotCell extends CellBase {
	/**
	 * Creates an instance of the class.
	 *
	 * @constructor
	 * @param {Point} position - The position object.
	 * @param {Field} field - The field object.
	 */
	constructor(position, field) {
		super(position);
		/** @type {boolean} isSettled - True if the robot is settled, false otherwise. */
		this.isSettled = false;

		/** @type {Vector2 | null} primaryDirection */
		this.primaryDirection = null;

		/** @type {Point} nextPosition */
		this.nextPosition = this.position.clone();

		/** @type {Array<Point>} history */
		this.history = [];

		/** @type {Field} field */
		this.field = field;

		/** @type {Array<string>} logs */
		this.logs = [];
	}

	/**
	 * Gets the secondary direction, which is the primary direction rotated by 90 degrees.
	 * @returns {Vector2 | null} The secondary direction.
	 */
	get secondaryDirection() {
		if (!this.primaryDirection) return null;
		return this.primaryDirection.rotate90();
	}

	/**
	 * Get the diagonal direction, based on the current position.
	 * @returns {Vector2 | null} The diagonal direction.
	 */
	get diag() {
		throw new Error("Diagonal direction must be implemented by subclasses");
	}

	/**
	 * Moves the robot cell to a new position.
	 */
	move() {
		if (this.isSettled) return;
		if (this.nextPosition.equals(this.position)) return;
		if (
			this.history.length === 0 ||
			!this.position.equals(this.history[this.history.length - 1])
		) {
			this.history.push(this.position.clone());
		}

		this.field.moveRobot(this.position, this.nextPosition);
		this.position = this.nextPosition.clone();
	}

	/**
	 * Renders the cell.
	 * This method must be implemented by subclasses.
	 * @abstract
	 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
	 * @param {number} size - The size of the cell.
	 * @throws {Error} Throws an error if the method is not implemented by subclasses.
	 */
	render(ctx, size) {
		throw new Error("Render method must be implemented by subclasses");
	}

	update() {
		throw new Error("Update method must be implemented by subclasses");
	}
}

export class SyncRobotCell extends RobotCell {
	/**
	 * Get the diagonal direction, based on the current position.
	 * @returns {Vector2 | null} The diagonal direction.
	 * @override
	 */
	get diag() {
		if (!this.primaryDirection) return null;
		let total = new Vector2(0, 0);

		for (const dir of Vector2.cardinalDirections) {
			const looking = this.position.add(dir);
			if (this.field.isOccupied(looking)) {
				total = total.add(dir);
			}
		}
		return this.position.subtract(total);
	}

	/**
	 * Updates the robot cell.
	 * @param {number} tick - The tick value.
	 * @override
	 */
	update(tick) {
		// The implementation is exactly based on the paper https://arxiv.org/pdf/2404.19564
		// The FCDFS algorithm

		const v = this.position;
		this.logs.push(`Tick ${tick}: Current position: ${v.toString()}`);

		// If there is something in every direction, the robot is settled
		if (
			Vector2.cardinalDirections.every((dir) =>
				this.field.isOccupied(v.add(dir)),
			)
		) {
			this.isSettled = true;
			this.logs.push(
				`Tick ${tick}: Robot is settled at position: ${v.toString()}`,
			);
			return;
		}

		// If there is still a direction to go
		// Check if we have already a chosen primary direction
		if (this.primaryDirection === null) {
			// If we are not settled, we need to check if we can move in the primary direction
			for (const dir of Vector2.cardinalDirections) {
				const looking = v.add(dir);
				if (!this.field.isOccupied(looking)) {
					this.primaryDirection = dir;
					this.logs.push(
						`Tick ${tick}: Primary direction set to: ${dir.toString()}`,
					);
					break;
				}
			}
		}

		// Here primaryDirection is guaranteed to be set
		// If we can move in the primary direction, we do so
		if (!this.field.isOccupied(v.add(this.primaryDirection))) {
			this.nextPosition = v.add(this.primaryDirection);
			this.logs.push(
				`Tick ${tick}: Moving to next position: ${this.nextPosition.toString()}`,
			);
			return;
		}

		// If we can't move in the primary direction, we try the secondary direction
		if (!this.field.isOccupied(v.add(this.secondaryDirection))) {
			this.nextPosition = v.add(this.secondaryDirection);
			this.logs.push(
				`Tick ${tick}: Moving to secondary position: ${this.nextPosition.toString()}`,
			);
			return;
		}

		// If we can't move in the secondary direction
		// Check if we are in a corner, first the corner with 3 walls blocking
		const occupiedCount = Vector2.cardinalDirections.reduce(
			(count, dir) => count + this.field.isOccupied(v.add(dir)),
			0,
		);

		// If we are in a corner, we are settled
		if (occupiedCount >= 3) {
			this.isSettled = true;
			this.logs.push(
				`Tick ${tick}: Robot is settled in a corner at position: ${v.toString()}`,
			);
			return;
		}

		// Right now we are either in a corner with 2 walls blocking, or in a hall
		// check if this is a corner proof: https://arxiv.org/pdf/2404.19564
		if (
			this.history.length < 2 ||
			this.history[this.history.length - 2].equals(this.diag) ||
			!this.field.isOccupied(this.diag)
		) {
			this.isSettled = true;
			this.logs.push(
				`Tick ${tick}: Robot is settled due to corner a at position: ${v.toString()}`,
			);
			return;
		}

		// Otherwise we are in a hall
		// We need to change the primary direction
		// Since there is at most 2 walls blocking, we can move in at least one other direction
		// then the primary direction or the secondary direction (since, these direction are blocked)
		for (const dir of Vector2.cardinalDirections) {
			const looking = v.add(dir);

			// We are not allowed to go back
			if (this.history[this.history.length - 1].equals(looking)) {
				continue;
			}
			// If we can move in this direction, we set it as the primary direction
			if (!this.field.isOccupied(looking)) {
				this.primaryDirection = dir;
				this.nextPosition = looking;
				this.logs.push(
					`Tick ${tick}: Changing primary direction to: ${dir.toString()}`,
				);
				this.logs.push(
					`Tick ${tick}: Moving to next position: ${this.nextPosition.toString()}`,
				);
				return;
			}
		}

		throw new Error("Invalid state");
	}

	/**
	 * Renders the cell.
	 * This method must be implemented by subclasses.
	 * @abstract
	 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
	 * @param {number} size - The size of the cell.
	 * @throws {Error} Throws an error if the method is not implemented by subclasses.
	 * @override
	 */
	render(ctx, size) {
		if (this.isSettled) {
			ctx.fillStyle = "#00FF00"; // Green for settled
		} else {
			ctx.fillStyle = "#0000FF"; // Blue for not settled
		}
		ctx.fillRect(
			this.position.x * size,
			this.position.y * size,
			size - 1,
			size - 1,
		);
	}
}

export class AsyncRobotCell extends RobotCell {
	/**
	 * Get the diagonal direction, based on the current position.
	 * @returns {Vector2 | null} The diagonal direction.
	 * @override
	 */
	get diag() {
		if (!this.primaryDirection) return null;
		let total = new Vector2(0, 0);

		for (const dir of Vector2.cardinalDirections) {
			const looking = this.position.add(dir);
			if (this.isWallOrSettledRobot(looking)) {
				total = total.add(dir);
			}
		}
		return this.position.subtract(total);
	}

	/**
	 * Creates an instance of the class.
	 *
	 * @constructor
	 * @param {Point} position - The position object.
	 * @param {Field} field - The field object.
	 */
	constructor(position, field) {
		super(position, field);

		/**
		 * @type {boolean} isActive - True if the robot is active, false otherwise.
		 * This changes dynamically during the simulation
		 */
		this.isActive = false;
	}

	isBroadcastingRobot(position) {
		const cell = this.field.getCell(position);
		if (cell instanceof AsyncRobotCell) {
			return !cell.isSettled;
		}
		return false;
	}

	isWallOrSettledRobot(position) {
		// In theory, the robot can check its surroundings
		// In every tick that it is active, and based on that
		// we can determine if the occupied position is an active robot
		// If we can observe a robot being active in an occupied position
		// then if the occupied position is not an active robot, then
		// it must be a wall or a settled robot

		return (
			this.field.isOccupied(position) && !this.isBroadcastingRobot(position)
		);
	}

	/**
	 * Updates the robot cell.
	 * @param {number} tick - The tick value.
	 * @override
	 */
	update(tick) {
		// The implementation is exactly based on the paper https://arxiv.org/pdf/2404.19564
		// The Async FCDFS algorithm

		if (!this.isActive) return;
		if (this.isSettled) return;

		const v = this.position;

		// If there is something in every direction, the robot is settled
		if (
			Vector2.cardinalDirections.every((dir) =>
				this.isWallOrSettledRobot(v.add(dir)),
			)
		) {
			this.isSettled = true;
			this.logs.push(
				`Tick ${tick}: Robot is settled at position: ${v.toString()}`,
			);
			return;
		}

		// There is still a direction to go

		// Check if we have already a chosen primary direction
		if (this.primaryDirection === null) {
			// If there is a robot around us, we can't move, we will wait
			if (
				Vector2.cardinalDirections.some((dir) =>
					this.isBroadcastingRobot(v.add(dir)),
				)
			) {
				this.logs.push(`Tick ${tick}: Robot is broadcasting around us`);
				return;
			}

			// If we are the only ones broadcasting, we can move
			// Lets choose a primary direction
			for (const dir of Vector2.cardinalDirections) {
				const looking = v.add(dir);
				if (!this.field.isOccupied(looking)) {
					this.primaryDirection = dir;
					this.logs.push(
						`Tick ${tick}: Primary direction set to: ${dir.toString()}`,
					);
					break;
				}
			}
		}

		// If there is a broadcasting robot in the primary direction, we will wait
		if (this.isBroadcastingRobot(v.add(this.primaryDirection))) {
			this.logs.push(
				`Tick ${tick}: Robot is broadcasting in primary direction, we will wait`,
			);
			return;
		}

		// If we can move in the primary direction, we do so
		if (!this.field.isOccupied(v.add(this.primaryDirection))) {
			this.nextPosition = v.add(this.primaryDirection);
			this.logs.push(
				`Tick ${tick}: Moving to next position: ${this.nextPosition.toString()}`,
			);
			return;
		}

		// We couldn't move in the primary direction, we will try the secondary direction
		// If there is a broadcasting robot in the secondary direction, we will wait
		if (this.isBroadcastingRobot(v.add(this.secondaryDirection))) {
			this.logs.push(
				`Tick ${tick}: Robot is broadcasting in secondary direction, we will wait`,
			);
			return;
		}

		// If we can move in the secondary direction, we do so
		if (!this.field.isOccupied(v.add(this.secondaryDirection))) {
			this.nextPosition = v.add(this.secondaryDirection);
			this.logs.push(
				`Tick ${tick}: Moving to secondary position: ${this.nextPosition.toString()}`,
			);
			return;
		}

		// Check if we are in a corner
		const occupiedCount = Vector2.cardinalDirections.reduce(
			(count, dir) => count + this.isWallOrSettledRobot(v.add(dir)),
			0,
		);

		// If we are in a corner, we are settled
		if (occupiedCount >= 3) {
			this.isSettled = true;
			this.logs.push(
				`Tick ${tick}: Robot is settled in a corner at position: ${v.toString()}`,
			);
			return;
		}

		// Right now we are either in a corner with 2 walls blocking, or in a hall
		// check if we are in a corner
		if (
			!this.field.isOccupied(this.diag) ||
			this.isBroadcastingRobot(this.diag)
		) {
			this.isSettled = true;
			this.logs.push(
				`Tick ${tick}: Robot is settled due to corner a at position: ${v.toString()}`,
			);
			return;
		}

		// Otherwise we are in a hall, so we need to change the primary direction
		for (const dir of Vector2.cardinalDirections) {
			const looking = v.add(dir);

			// We are not allowed to go back
			if (this.history[this.history.length - 1].equals(looking)) {
				continue;
			}

			// If we can move in this direction, we set it as the primary direction
			if (!this.field.isOccupied(looking)) {
				this.primaryDirection = dir;
				this.logs.push(
					`Tick ${tick}: Changing primary direction to: ${dir.toString()}`,
				);

				this.nextPosition = looking;
				this.logs.push(
					`Tick ${tick}: Moving to next position: ${this.nextPosition.toString()}`,
				);
				return;
			}
		}
	}

	/**
	 * Renders the cell.
	 * This method must be implemented by subclasses.
	 * @abstract
	 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
	 * @param {number} size - The size of the cell.
	 * @throws {Error} Throws an error if the method is not implemented by subclasses.
	 * @override
	 */
	render(ctx, size) {
		if (this.isSettled) {
			ctx.fillStyle = "#FFA500"; // Orange for settled
		} else if (this.isActive) {
			ctx.fillStyle = "#0000FF"; // Blue for active
		} else {
			ctx.fillStyle = "#808080"; // Gray for inactive but not yet settled
		}
		ctx.fillRect(
			this.position.x * size,
			this.position.y * size,
			size - 1,
			size - 1,
		);
	}
}
