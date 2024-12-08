/**
 * Class representing the simulation settings.
 */
export class Settings {
	/**
	 * Create a Settings instance.
	 * @param {boolean} [is_async=false] - Indicates if the process is asynchronous.
	 * @param {number|null} [p=null] - Probability value, to simulate if a bot is awake, must be in the range (0, 1].
	 * @throws {Error} Throws an error if `p` is not in the range (0, 1] when `is_async` is true.
	 */
	constructor() {
		/** @type {boolean} - Indicates if we should simulate async robots */
		this.shouldAsync = false;

		/** @type {boolean} - indicates if we are simulating the robots asynchronously. */
		this.isAsync = false;

		/** @type {number} - Probability value, must be in the range (0, 1]. */
		this.p = 0.5;

		/** @type {Object} - The colors for the simulation. */
		this.colors = {
			empty: "#FFFFFF",
			wall: "#000000",
			robot: "#0000FF",
			spawn: "#FF0000",
		};

		/** @type {number} - The time for each tick in seconds. */
		this.simulationSpeed = 1;

		/** @type {string} currentFieldMap - The current field map href. */
		this.currentFieldMap = "./palyak/palya4.png";
	}

	/**
	 * Get the empty color.
	 * @returns {string} The empty color.
	 */
	get empty_color() {
		return this.colors.empty;
	}

	/**
	 * Set the empty color.
	 * @param {string} color - The new empty color.
	 */
	set empty_color(color) {
		this.colors.empty = color;
	}

	/**
	 * Get the wall color.
	 * @returns {string} The wall color.
	 */
	get wall_color() {
		return this.colors.wall;
	}

	/**
	 * Set the wall color.
	 * @param {string} color - The new wall color.
	 */
	set wall_color(color) {
		this.colors.wall = color;
	}

	/**
	 * Get the robot color.
	 * @returns {string} The robot color.
	 */
	get robot_color() {
		return this.colors.robot;
	}

	/**
	 * Set the robot color.
	 * @param {string} color - The new robot color.
	 */
	set robot_color(color) {
		this.colors.robot = color;
	}

	/**
	 * Get the spawn color.
	 * @returns {string} The spawn color.
	 */
	get spawn_color() {
		return this.colors.spawn;
	}

	/**
	 * Set the spawn color.
	 * @param {string} color - The new spawn color.
	 */
	set spawn_color(color) {
		this.colors.spawn = color;
	}
}
