import { Settings } from "./settings.js";
import { Field } from "./field.js";
import { FCDFS, AFCDFS, Algorithm } from "./algorithms.js";
import { Vector2 } from "./vector.js";
import { EmptyCell, RobotCell, SyncRobotCell, WallCell } from "./cell.js";
import { geometricMean } from "./graph.js";

/**
 * @param {Settings} settings
 * @param {HTMLElement} element
 * @param {number} n_iter
 * @param {object} goals
 */
function createSimulation(settings, element, n_iter, goals) {
	/********************
	 * Main Render Loop *
	 ********************/

	/** @type {Algorithm | null} */
	let algorithm = null;

	// Statistics
	let e_maxElement = null;
	let e_totalElement = null;
	let t_maxElement = null;
	let t_totalElement = null;
	let mElement = null;

	// avg stats
	let avgE_maxElement = null;
	let avgE_totalElement = null;
	let avgT_maxElement = null;
	let avgT_totalElement = null;
	let avgMElement = null;

	// total values
	let totalE_max = 0;
	let totalE_total = 0;
	let totalT_max = 0;
	let totalT_total = 0;
	let totalM = 0;

	const goalE_max = goals.e_max ?? 0;
	const goalE_total = goals.e_total ?? 0;
	const goalT_max = goals.t_max ?? 0;
	const goalT_total = goals.t_total ?? 0;
	const goalM = goals.makespan ?? 0;

	// delta elements
	let deltaE_maxElement = null;
	let deltaE_totalElement = null;
	let deltaT_maxElement = null;
	let deltaT_totalElement = null;
	let deltaMElement = null;

	let iter = 0;

	/**
	 * Set up the simulation.
	 */
	async function setup() {
		const field = await Field.fromUrl(settings.currentFieldMap, settings);
		// Stop the simulation if it was running
		// Change the button text to "Start"

		settings.isAsync = settings.shouldAsync;
		if (settings.isAsync) {
			algorithm = new AFCDFS(settings, field);
		} else {
			algorithm = new FCDFS(settings, field);
		}
		algorithm?.start();

		// Set up the stats
		e_maxElement = element.getElementsByClassName("e-max")[0];
		e_totalElement = element.getElementsByClassName("e-total")[0];
		t_maxElement = element.getElementsByClassName("t-max")[0];
		t_totalElement = element.getElementsByClassName("t-total")[0];
		mElement = element.getElementsByClassName("makespan")[0];

		avgE_maxElement = element.getElementsByClassName("avg-e-max")[0];
		avgE_totalElement = element.getElementsByClassName("avg-e-total")[0];
		avgT_maxElement = element.getElementsByClassName("avg-t-max")[0];
		avgT_totalElement = element.getElementsByClassName("avg-t-total")[0];
		avgMElement = element.getElementsByClassName("avg-makespan")[0];

		deltaE_maxElement = element.getElementsByClassName("delta-e-max")[0];
		deltaE_totalElement = element.getElementsByClassName("delta-e-total")[0];
		deltaT_maxElement = element.getElementsByClassName("delta-t-max")[0];
		deltaT_totalElement = element.getElementsByClassName("delta-t-total")[0];
		deltaMElement = element.getElementsByClassName("delta-makespan")[0];
	}

	let accumulatedTime = 0;
	/**
	 * Renders the current frame.
	 *
	 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
	 * @param {number} deltaTime - The time since the last frame.
	 * @param {number} width - The width of the canvas.
	 * @param {number} height - The height of the canvas.
	 * @param {Settings} settings - The simulation
	 */
	function render(ctx, width, height, deltaTime, settings) {
		if (iter >= n_iter) {
			return;
		}

		/** @type {Field} field - the current field */
		const field = algorithm.field;

		// Make the cells square, and center the field
		const cellWidth = width / field.cols;
		const cellHeight = height / field.rows;
		const cellSize = Math.min(cellWidth, cellHeight);
		const offsetX = (width - cellSize * field.cols) / 2;
		const offsetY = (height - cellSize * field.rows) / 2;
		ctx.clearRect(0, 0, width, height);

		const fieldWidth = field.cols * cellSize;
		const fieldHeight = field.rows * cellSize;

		accumulatedTime += deltaTime;

		ctx.save();
		ctx.translate(offsetX, offsetY);

		// Update the simulation
		while (accumulatedTime > settings.simulationSpeed) {
			accumulatedTime -= settings.simulationSpeed;
			algorithm.tick();
		}

		// Update canvas
		field.render(ctx, fieldWidth, fieldHeight);

		ctx.restore();

		// Update the stats
		e_maxElement.value = algorithm.e_max;
		e_totalElement.value = algorithm.e_total;
		t_maxElement.value = algorithm.t_max;
		t_totalElement.value = algorithm.t_total;
		mElement.value = algorithm.m;

		// Check if the simulation is finished
		if (algorithm.isDone()) {
			iter += 1;

			// Stop the simulation
			algorithm.stop();

			// Update the totals
			totalE_max += algorithm.e_max;
			totalE_total += algorithm.e_total;
			totalT_max += algorithm.t_max;
			totalT_total += algorithm.t_total;
			totalM += algorithm.m;

			// Update the average stats with 2 decimals
			avgE_maxElement.value = (totalE_max / iter).toFixed(2);
			avgE_totalElement.value = (totalE_total / iter).toFixed(2);
			avgT_maxElement.value = (totalT_max / iter).toFixed(2);
			avgT_totalElement.value = (totalT_total / iter).toFixed(2);
			avgMElement.value = (totalM / iter).toFixed(2);

			// update delta elements
			deltaE_maxElement.value = (totalE_max / iter - goalE_max).toFixed(2);
			deltaE_totalElement.value = (totalE_total / iter - goalE_total).toFixed(
				2,
			);
			deltaT_maxElement.value = (totalT_max / iter - goalT_max).toFixed(2);
			deltaT_totalElement.value = (totalT_total / iter - goalT_total).toFixed(
				2,
			);
			deltaMElement.value = (totalM / iter - goalM).toFixed(2);

			if (iter < n_iter) {
				setup();
			}
		}
	}

	/***********************************
	 * Initial setup for interactivity *
	 ***********************************/
	window.addEventListener("DOMContentLoaded", async () => {
		// Set up the State
		// Sete up elements
		// Set up the canvas
		let canvas = null;
		while (canvas === null) {
			canvas = element.querySelector("canvas");
			await new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, 200);
			});
		}
		const ctx = canvas.getContext("2d");

		// Set up for logs
		function resizeCanvas() {
			const rect = canvas.getBoundingClientRect();
			const scale = window.devicePixelRatio;

			canvas.width = rect.width * scale;
			canvas.height = rect.height * scale;

			ctx.scale(scale, scale);
		}

		// Level selector modal
		// Set canvas size to match device pixel ratio
		let resizeTimeout = null;
		window.addEventListener("resize", () => {
			if (resizeTimeout !== null) {
				clearTimeout(resizeTimeout);
			}
			// Debounced resize
			resizeTimeout = setTimeout(() => {
				resizeCanvas();
				render(ctx, canvas.width, canvas.height, 0, settings);
			}, 100);
		});

		// The first pain of the canvas
		requestAnimationFrame(async () => {
			resizeCanvas();
			await setup();

			// Set up the main animation loop
			const FPS = 60;
			let lastFrameTime = 0;

			function renderLoop(timestamp) {
				const deltaTime = (timestamp - lastFrameTime) / 1000;
				lastFrameTime = timestamp;

				render(ctx, canvas.width, canvas.height, deltaTime, settings);

				setTimeout(() => {
					requestAnimationFrame(renderLoop);
				}, 1000 / FPS);
			}

			requestAnimationFrame(renderLoop);
		});
	});
}

const templateHTML = `
 <div id="template-id" class="flex flex-row items-center justify-evenly w-full">
	<div class="w-1/3 h-1/3 flex flex-col items-center justify-center">
		<h1 class="text-center text-2xl font-bold mb-2 mt-4">template-id-map (template-id-isAsync template-id-p)</h1>
		<canvas class="w-full h-full"></canvas>
	</div>
	<div class="flex flex-col items-center justify-evenly">
		<div id="template-id-statistics-container" class="w-full h-2/3 flex justify-start pr-4">
			<div class="flex flex-col items-start">
				<table class="w-full">
					<thead>
						<tr>
							<th class="px-4 py-2">State</th>
							<th class="px-4 py-2">T<sub>total</sub></th>
							<th class="px-4 py-2">T<sub>max</sub></th>
							<th class="px-4 py-2">E<sub>total</sub></th>
							<th class="px-4 py-2">E<sub>max</sub></th>
							<th class="px-4 py-2">Makespan</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<th class="px-4 py-2">Current</th>
							<td class="px-4 py-2 template-id-t-total">
								<input type="text" id="template-id-t-total" name="template-id-t-total" value="0" readonly
									class="w-full p-2 border border-gray-300 rounded bg-gray-100 t-total">
							</td>
							<td class="px-4 py-2 template-id-t-max">
								<input type="text" id="template-id-t-max" name="template-id-t-max" value="0" readonly
									class="w-full p-2 border border-gray-300 rounded bg-gray-100 t-max">
							</td>
							<td class="px-4 py-2 template-id-e-total">
								<input type="text" id="template-id-e-total" name="template-id-e-total" value="0" readonly
									class="w-full p-2 border border-gray-300 rounded bg-gray-100 e-total">
							</td>
							<td class="px-4 py-2 template-id-e-max">
								<input type="text" id="template-id-e-max" name="template-id-e-max" value="0" readonly
									class="w-full p-2 border border-gray-300 rounded bg-gray-100 e-max">
							</td>
							<td class="px-4 py-2 template-id-makespan">
								<input type="text" id="template-id-makespan" name="template-id-makespan" value="0" readonly
									class="w-full p-2 border border-gray-300 rounded bg-gray-100 makespan">
							</td>
						</tr>
						<tr>
							<th class="px-4 py-2">Average</th>

							<td class="px-4 py-2 template-id-avg-t-total">
								<input type="text" id="template-id-avg-t-total" name="template-id-avg-t-total" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 avg-t-total">
								</td>
							<td class="px-4 py-2 template-id-avg-t-max">
								<input type="text" id="template-id-avg-t-max" name="template-id-avg-t-max" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 avg-t-max">
							</td>
							<td class="px-4 py-2 template-id-avg-e-total">
								<input type="text" id="template-id-avg-e-total" name="template-id-avg-e-total" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 avg-e-total">
							</td>
							<td class="px-4 py-2 template-id-avg-e-max">
								<input type="text" id="template-id-avg-e-max" name="template-id-avg-e-max" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 avg-e-max">
							</td>
							<td class="px-4 py-2 template-id-avg-makespan">
								<input type="text" id="template-id-avg-makespan" name="template-id-avg-makespan" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 avg-makespan">
							</td>
						</tr>
						<tr>
							<th class="px-4 py-2">Delta</th>

							<td class="px-4 py-2 template-id-delta-t-total">
								<input type="text" id="template-id-delta-t-total" name="template-id-delta-t-total" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 delta-t-total">
								</td>
							<td class="px-4 py-2 template-id-delta-t-max">
								<input type="text" id="template-id-delta-t-max" name="template-id-delta-t-max" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 delta-t-max">
							</td>
							<td class="px-4 py-2 template-id-delta-e-total">
								<input type="text" id="template-id-delta-e-total" name="template-id-delta-e-total" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 delta-e-total">
							</td>
							<td class="px-4 py-2 template-id-delta-e-max">
								<input type="text" id="template-id-delta-e-max" name="template-id-delta-e-max" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 delta-e-max">
							</td>
							<td class="px-4 py-2 template-id-delta-makespan">
								<input type="text" id="template-id-delta-makespan" name="template-id-delta-makespan" value="0"
									readonly class="w-full p-2 border border-gray-300 rounded bg-gray-100 delta-makespan">
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>

</div>
`;

/*
Experiment Name Ttotal Tmax Etotal Emax M
FCDFS, Fig. 4 Env. (n = 669) 35103 99 35772 100 1338
AsynchFCDFS (p = 0.75), Fig. 4 Env. 35103 99 69092 137 2565
AsynchFCDFS (p = 0.5), Fig. 4 Env. 35103 99 118658 171 4350
FCDFS, Fig. 5 Env. (n = 277) 5909 38 6186 39 554
AsynchFCDFS (p = 0.75), Fig. 5 Env. 5909 38 11783 46 1027
AsynchFCDFS (p = 0.5), Fig. 5 Env. 5909 38 20001 68 1725
*/

// generate HTML given settings
const simulation = document.getElementById("simulation");
const generateHTML = (mapName, isAsync, p, prefix) => {
	const html = document.createElement("div");
	// replace template-id with prefix
	html.innerHTML = templateHTML
		.replace("template-id-isAsync", isAsync ? "Async, " : "Sync")
		.replace("template-id-p", isAsync ? `p = ${p}` : "")
		.replace("template-id-map", mapName)
		.replace("template-id", prefix);

	// append to "simulation" div
	simulation.appendChild(html);
};

// generate fig 4
generateHTML("fig4", false, 0.5, "fig4-sync");
generateHTML("fig4", true, 0.75, "fig4-async-p75");
generateHTML("fig4", true, 0.5, "fig4-async-p50");

// generate fig 5
generateHTML("fig5", false, 0.5, "fig5-sync");
generateHTML("fig5", true, 0.75, "fig5-async-p75");
generateHTML("fig5", true, 0.5, "fig5-async-p50");

const simulationSpeed = 0.003;

const fig4SyncSettings = new Settings();
fig4SyncSettings.currentFieldMap = "./palyak/fig4.png";
fig4SyncSettings.simulationSpeed = simulationSpeed;
const fig4SyncElement = document.getElementById("fig4-sync");
createSimulation(fig4SyncSettings, fig4SyncElement, 1, {
	t_total: 35_103,
	t_max: 99,
	e_total: 35_772,
	e_max: 100,
	makespan: 1338,
});

const fig4AsyncP75Settings = new Settings();
fig4AsyncP75Settings.currentFieldMap = "./palyak/fig4.png";
fig4AsyncP75Settings.simulationSpeed = simulationSpeed;
fig4AsyncP75Settings.p = 0.75;
fig4AsyncP75Settings.shouldAsync = true;
const fig4AsyncP75Element = document.getElementById("fig4-async-p75");
createSimulation(fig4AsyncP75Settings, fig4AsyncP75Element, 10, {
	t_total: 35_103,
	t_max: 99,
	e_total: 69_092,
	e_max: 137,
	makespan: 2565,
});

const fig4AsyncP50Settings = new Settings();
fig4AsyncP50Settings.currentFieldMap = "./palyak/fig4.png";
fig4AsyncP50Settings.simulationSpeed = simulationSpeed;
fig4AsyncP50Settings.p = 0.5;
fig4AsyncP50Settings.shouldAsync = true;
const fig4AsyncP50Element = document.getElementById("fig4-async-p50");
createSimulation(fig4AsyncP50Settings, fig4AsyncP50Element, 10, {
	t_total: 35_103,
	t_max: 99,
	e_total: 118_658,
	e_max: 171,
	makespan: 4350,
});

const fig5SyncSettings = new Settings();
fig5SyncSettings.currentFieldMap = "./palyak/fig5.png";
fig5SyncSettings.simulationSpeed = simulationSpeed;
const fig5SyncElement = document.getElementById("fig5-sync");
createSimulation(fig5SyncSettings, fig5SyncElement, 1, {
	t_total: 5909,
	t_max: 38,
	e_total: 6186,
	e_max: 39,
	makespan: 554,
});

const fig5AsyncP75Settings = new Settings();
fig5AsyncP75Settings.currentFieldMap = "./palyak/fig5.png";
fig5AsyncP75Settings.simulationSpeed = simulationSpeed;
fig5AsyncP75Settings.p = 0.75;
fig5AsyncP75Settings.shouldAsync = true;
const fig5AsyncP75Element = document.getElementById("fig5-async-p75");
createSimulation(fig5AsyncP75Settings, fig5AsyncP75Element, 10, {
	t_total: 5_909,
	t_max: 38,
	e_total: 11_783,
	e_max: 46,
	makespan: 1027,
});

const fig5AsyncP50Settings = new Settings();
fig5AsyncP50Settings.currentFieldMap = "./palyak/fig5.png";
fig5AsyncP50Settings.simulationSpeed = simulationSpeed;
fig5AsyncP50Settings.p = 0.5;
fig5AsyncP50Settings.shouldAsync = true;
const fig5AsyncP50Element = document.getElementById("fig5-async-p50");
createSimulation(fig5AsyncP50Settings, fig5AsyncP50Element, 10, {
	t_total: 5909,
	t_max: 38,
	e_total: 20_001,
	e_max: 68,
	makespan: 1725,
});
