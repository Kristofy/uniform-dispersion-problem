import { Settings } from "./settings.js";
import { Field } from "./field.js";
import { SyncRobotCell, AsyncRobotCell, WallCell, RobotCell } from "./cell.js";

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

		/** @type {number} - total steps taken of every robot */
		this.t_total = 0;
		/** @type {number} - maximum steps taken by a robot */
		this.t_max = 0;
		/** @type {number} - total energy consumed by every robot */
		this.e_total = 0;
		/** @type {number} - maximum energy consumed by a robot */
		this.e_max = 0;
		/** @type {number} Makespan - the first timestamp where all robots are settled */
		this.m = 0;

		/** @type {WeakMap<RobotCell, number>} The energy expanded by certain robots */
		this.ePerRobot = new WeakMap();

		/** @type {WeakMap<RobotCell, number>} The time taken by certain robots */
		this.tPerRobot = new WeakMap();
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

		// Check if we are done
		if (
			this.field.matrix.every((row) =>
				row.every(
					(cell) =>
						(cell instanceof SyncRobotCell && cell.isSettled) ||
						cell instanceof WallCell,
				),
			)
		) {
			if (this.m === 0) {
				this.m = this.tickCount;
				console.log("Makespan", this.m);
			}

			return;
		}

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

		/** @type {SyncRobotCell[]} */
		const toUpdate = this.field.matrix
			.flat()
			.filter((cell) => cell instanceof SyncRobotCell && !cell.isSettled);

		// Check if we will move and if so then increment the total steps
		this.t_total += toUpdate.filter(
			(cell) => !cell.position.equals(cell.nextPosition),
		).length;

		// update the maximum steps taken by a robot
		for (const cell of toUpdate) {
			if (!cell.position.equals(cell.nextPosition)) {
				this.tPerRobot.set(cell, (this.tPerRobot.get(cell) ?? 0) + 1);
			}
		}

		this.t_max = this.field.matrix
			.flat()
			.filter((cell) => cell instanceof SyncRobotCell)
			.map((cell) => this.tPerRobot.get(cell) ?? 0)
			.reduce((a, b) => Math.max(a, b), 0);

		for (const cell of toUpdate) {
			cell.move();
		}

		for (const cell of toUpdate) {
			this.ePerRobot.set(cell, (this.ePerRobot.get(cell) ?? 0) + 1);
		}

		// Every non settled cell contributes to the energy
		this.e_total += toUpdate.length;

		this.e_max = this.field.matrix
			.flat()
			.filter((cell) => cell instanceof SyncRobotCell)
			.map((cell) => this.ePerRobot.get(cell) ?? 0)
			.reduce((a, b) => Math.max(a, b), 0);

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
