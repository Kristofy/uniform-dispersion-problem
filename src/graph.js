import { Point } from "./vector.js";

/**
 * Grid SSSP
 *
 * Runs an SSSP algorithm
 * @param {Array<Array<boolean>>} grid - The grid to traverse, where true is a wall and false is empty
 * @param {Array<number>} source - The source node
 * @returns {Array<Array<number>>} - the distance matrix
 */
function gridSSSP(grid, source) {
	if (grid.length === 0) return [];
	const n = grid.length;
	const m = grid[0].length;

	if (source[0] < 0 || source[0] >= n || source[1] < 0 || source[1] >= m) {
		return [];
	}
	if (grid[source[0]][source[1]]) return [];

	const dist = Array.from({ length: n }, () =>
		Array(m).fill(Number.POSITIVE_INFINITY),
	);
	dist[source[0]][source[1]] = 0;

	const q = [source];
	const dx = [0, 0, 1, -1];
	const dy = [1, -1, 0, 0];
	while (q.length) {
		const [x, y] = q.shift();
		for (let i = 0; i < 4; i++) {
			const nx = x + dx[i];
			const ny = y + dy[i];
			if (nx < 0 || nx >= n || ny < 0 || ny >= m) continue;
			if (grid[nx][ny]) continue;
			if (dist[nx][ny] > dist[x][y] + 1) {
				dist[nx][ny] = dist[x][y] + 1;
				q.push([nx, ny]);
			}
		}
	}

	return dist;
}

/**
 * Calculates the geometric mean on a grid represented as a graph.
 *
 * The geometric mean is defined as the cell that has the maximum distance
 * to any other point on the grid minimized. The grid consists of only WALL
 * and EMPTY cells.
 *
 * @param {Array<Array<boolean>>} grid - The grid to traverse, where true is a wall and false is empty.
 * @returns {Point} - The cell that has the maximum distance to any other point on the grid minimized.
 */
export function geometricMean(grid) {
	if (grid.length === 0) return -1;
	const n = grid.length;
	const m = grid[0].length;

	let maxPoint = null;
	let minDist = Number.POSITIVE_INFINITY;
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < m; j++) {
			if (grid[i][j]) continue;
			const dist = gridSSSP(grid, [i, j]);
			let maxDist = 0;
			for (let x = 0; x < n; x++) {
				for (let y = 0; y < m; y++) {
					if (grid[x][y]) continue;
					maxDist = Math.max(maxDist, dist[x][y]);
				}
			}

			if (maxDist < minDist) {
				minDist = maxDist;
				maxPoint = new Point(i, j);
			}
		}
	}

	return maxPoint;
}
