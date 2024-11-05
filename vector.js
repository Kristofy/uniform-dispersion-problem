/**
 * Class representing a 2D vector.
 */
export class Vector2 {
	/**
	 * Create a vector.
	 * @param {number} x - The x coordinate.
	 * @param {number} y - The y coordinate.
	 */
	constructor(x = 0, y = 0) {
		/** @type {number} */
		this.x = x;
		/** @type {number} */
		this.y = y;
	}

	/**
	 * Add another vector to this vector.
	 * @param {Vector2} v - The vector to add.
	 * @returns {Vector2} New vector with the sum of the two vectors.
	 */
	add(v) {
		return new Vector2(this.x + v.x, this.y + v.y);
	}

	/**
	 * Subtract another vector from this vector.
	 * @param {Vector2} v - The vector to subtract.
	 * @returns {Vector2} New vector with the result of the subtraction.
	 */
	subtract(v) {
		return new Vector2(this.x - v.x, this.y - v.y);
	}

	/**
	 * Multiply this vector by a scalar.
	 * @param {number} scalar - The scalar to multiply by.
	 * @returns {Vector2} New vector with the result of the multiplication.
	 */
	multiply(scalar) {
		return new Vector2(this.x * scalar, this.y * scalar);
	}

	/**
	 * Divide this vector by a scalar.
	 * @param {number} scalar - The scalar to divide by.
	 * @returns {Vector2} New vector with the result of the division.
	 */
	divide(scalar) {
		return new Vector2(this.x / scalar, this.y / scalar);
	}

	/**
	 * Calculate the magnitude (length) of this vector.
	 * @returns {number} The magnitude of the vector.
	 */
	magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	/**
	 * Normalize this vector (make it have a magnitude of 1).
	 * @returns {Vector2} New normalized vector.
	 */
	normalize() {
		const mag = this.magnitude();
		if (mag !== 0) {
			return this.divide(mag);
		}
		return new Vector2(0, 0);
	}

	/**
	 * Calculate the dot product of this vector and another vector.
	 * @param {Vector2} v - The other vector.
	 * @returns {number} The dot product.
	 */
	dot(v) {
		return this.x * v.x + this.y * v.y;
	}

	/**
	 * Calculate the distance between this vector and another vector.
	 * @param {Vector2} v - The other vector.
	 * @returns {number} The distance.
	 */
	distance(v) {
		const dx = this.x - v.x;
		const dy = this.y - v.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	 * Create a copy of this vector.
	 * @returns {Vector2} A new vector with the same coordinates.
	 */
	clone() {
		return new Vector2(this.x, this.y);
	}

	/**
	 * Check if this vector is equal to another vector.
	 * @param {Vector2} v - The other vector.
	 * @returns {boolean} True if the vectors are equal, false otherwise.
	 */
	equals(v) {
		return this.x === v.x && this.y === v.y;
	}

	/**
	 * Calculate the absolute value of this vector.
	 * @returns {Vector2} New vector with absolute values of the coordinates.
	 */
	abs() {
		return new Vector2(Math.abs(this.x), Math.abs(this.y));
	}

	/**
	 * Rotate this vector 90 degrees counterclockwise.
	 * @returns {Vector2} New vector rotated 90 degrees counterclockwise.
	 */
	rotate90() {
		return new Vector2(-this.y, this.x);
	}

	/**
	 * Get a string representation of this vector.
	 * @returns {string} A string representing the vector.
	 */
	toString() {
		return `Vector2(${this.x}, ${this.y})`;
	}

	/**
	 * Get a vector representing the north direction.
	 * @returns {Vector2} A new vector pointing north.
	 */
	static get north() {
		return new Vector2(0, -1);
	}

	/**
	 * Get a vector representing the south direction.
	 * @returns {Vector2} A new vector pointing south.
	 */
	static get south() {
		return new Vector2(0, 1);
	}

	/**
	 * Get a vector representing the west direction.
	 * @returns {Vector2} A new vector pointing west.
	 */
	static get west() {
		return new Vector2(-1, 0);
	}

	/**
	 * Get a vector representing the east direction.
	 * @returns {Vector2} A new vector pointing east.
	 */
	static get east() {
		return new Vector2(1, 0);
	}

	/**
	 * Get a list of the 4 cardinal directions (north, south, west, east).
	 *
	 * In clockwise order, starting from north.
	 * @returns {Vector2[]} An array of vectors representing the 4 cardinal directions.
	 */
	static get cardinalDirections() {
		return [Vector2.north, Vector2.south, Vector2.west, Vector2.east];
	}
}

export class Point extends Vector2 {
	/**
	 * Get a new point one unit above this point.
	 * @returns {Point} A new point one unit above.
	 */
	above() {
		return new Point(this.x, this.y - 1);
	}

	/**
	 * Get a new point one unit below this point.
	 * @returns {Point} A new point one unit below.
	 */
	below() {
		return new Point(this.x, this.y + 1);
	}

	/**
	 * Get a new point one unit to the left of this point.
	 * @returns {Point} A new point one unit to the left.
	 */
	left() {
		return new Point(this.x - 1, this.y);
	}

	/**
	 * Get a new point one unit to the right of this point.
	 * @returns {Point} A new point one unit to the right.
	 */
	right() {
		return new Point(this.x + 1, this.y);
	}
}
