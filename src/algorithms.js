import { Settings } from "./settings.js";
import { Field } from "./field.js";
import { SyncRobotCell, AsyncRobotCell } from "./cell.js";

/**
 * Represents an algorithm with settings and field data.
 */
export class Algorithm {
	/**
	 * Constructs an instance of the class.
	 *
	 * @param {Settings} settings - The configuration settings for the instance.
	 * @param {Field} field - The field data associated with the instance.
	 */
	constructor(settings, field) {
		/** @type {Settings} settings - The configuration settings for the instance. */
		this.settings = settings;

		/** @type {Field} field - The field data associated with the instance. */
		this.field = field;

		/** @type {boolean} isRunning */
		this.isRunning = false;

		/** @type {number} tickCount */
		this.tickCount = 0;
	}

	/**
	 * Ticks the algorithm.
	 */
	tick() {
		throw new Error("A subclass must implement this method.");
	}

	/**
	 * Starts the algorithm.
	 */
	start() {
		this.isRunning = true;
	}

	/**
	 * Stops the algorithm.
	 */
	stop() {
		this.isRunning = false;
	}

	/**
	 * Toggles the running state of the algorithm.
	 */
	toggle() {
		this.isRunning = !this.isRunning;
	}
}

/**
 * First Come First Serve (FCDFS) algorithm
 * @extends {Algorithm}
 */
export class FCDFS extends Algorithm {
	/**
	 * Ticks the FCDFS algorithm.
	 * @override
	 */
	tick() {
		if (!this.isRunning) return;
		// Run tick

		// 1. If we can, then spawn a new robot at the spawn position
		if (!this.field.isOccupied(this.field.spawn_position)) {
			this.field.setCell(
				this.field.spawn_position,
				new SyncRobotCell(this.field.spawn_position, this.field),
			);
		}

		// 2. Move the robot to the next position
		// We need to precompute the list of robots to update
		// So we don't update the same robot twice or skip a robot

		const toUpdate = this.field.matrix
			.flat()
			.filter((cell) => cell instanceof SyncRobotCell && !cell.isSettled);

		for (const cell of toUpdate) {
			cell.move();
		}

		// 4. Calculate the robots next position
		for (const row of this.field.matrix) {
			for (const cell of row) {
				if (cell instanceof SyncRobotCell) {
					if (cell.isSettled) continue;
					cell.update(this.tickCount);
				}
			}
		}

		// OUTSIDE: Render the state
		this.tickCount++;
	}
}

/**
 * Async First Come First Serve (AFCDFS) algorithm
 * @extends {Algorithm}
 */
export class AFCDFS extends Algorithm {
	/**
	 * Ticks the AFCDFS algorithm.
	 * @override
	 */
	tick() {
		if (!this.isRunning) return;
		// Run tick

		// 1. If we can, then spawn a new robot at the spawn position
		if (!this.field.isOccupied(this.field.spawn_position)) {
			this.field.setCell(
				this.field.spawn_position,
				new AsyncRobotCell(this.field.spawn_position, this.field),
			);
		}

		// 2. Move the robot to the next position
		// We need to precompute the list of robots to update
		// So we don't update the same robot twice or skip a robot

		const toUpdate = this.field.matrix
			.flat()
			.filter((cell) => cell instanceof AsyncRobotCell && !cell.isSettled);

		for (const cell of toUpdate) {
			cell.move();
		}

		// 4. Calculate the robots next position
		for (const row of this.field.matrix) {
			for (const cell of row) {
				if (cell instanceof AsyncRobotCell) {
					if (cell.isSettled) continue;
					// Here the the robot becomes active with probability p
					cell.isActive = Math.random() < this.settings.p;
					cell.update(this.tickCount);
				}
			}
		}

		// OUTSIDE: Render the state
		this.tickCount++;
	}
}
