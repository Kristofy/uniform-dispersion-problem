import { Settings } from "./settings.js";
import { Field } from "./field.js";
import { FCDFS, AFCDFS, Algorithm } from "./algorithms.js";
import { Vector2 } from "./vector.js";
import { EmptyCell, RobotCell, SyncRobotCell, WallCell } from "./cell.js";
import { geometricMean } from "./graph.js";

/********************
 * Main Render Loop *
 ********************/

/** @type {Algorithm | null} */
let algorithm = null;

let e_maxElement = null;
let e_totalElement = null;
let t_maxElement = null;
let t_totalElement = null;
let mElement = null;

/**
 * Set up the simulation.
 * @param {Settings} settings - The settings to use.
 */
async function setup(settings) {
	// Stop the simulation if it was running
	algorithm?.stop();
	// Change the button text to "Start"
	const startPauseButton = document.getElementById("start-pause-button");
	startPauseButton.textContent = "Start";

	const field = await Field.fromUrl(settings.currentFieldMap, settings);
	settings.isAsync = settings.shouldAsync;
	if (settings.isAsync) {
		algorithm = new AFCDFS(settings, field);
	} else {
		algorithm = new FCDFS(settings, field);
	}
	window.algorithm = algorithm;

	document.getElementById("async-notification").classList.add("hidden");

	// Set up the stats
	e_maxElement = document.getElementById("e-max");
	e_totalElement = document.getElementById("e-total");
	t_maxElement = document.getElementById("t-max");
	t_totalElement = document.getElementById("t-total");
	mElement = document.getElementById("makespan");
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
	console.log(algorithm.m);
}

/***********************************
 * Initial setup for interactivity *
 ***********************************/
window.addEventListener("DOMContentLoaded", async () => {
	// Set up the State
	const settings = new Settings();

	// Sete up elements
	// Set up the canvas
	const canvas = document.getElementById("main-canvas");
	const ctx = canvas.getContext("2d");

	// Set up for logs
	const cellLogs = document.getElementById("cell-logs");
	const botHistory = document.getElementById("bot-history");

	const speedSlider = document.getElementById("speed-slider");
	const startPauseButton = document.getElementById("start-pause-button");

	const resetButton = document.getElementById("reset-button");

	const pValueSlider = document.getElementById("p-slider");
	const asyncSwitch = document.getElementById("async-switch");

	// get simulation speed
	speedSlider.addEventListener("input", () => {
		settings.simulationSpeed = Number.parseFloat(speedSlider.value);
	});

	// Start / stop
	startPauseButton.addEventListener("click", () => {
		startPauseButton.textContent = algorithm.isRunning ? "Start" : "Pause";
		algorithm.toggle();
	});

	// Reset the current level
	resetButton.addEventListener("click", async () => {
		setup(settings);
	});

	// Toggle async
	asyncSwitch.addEventListener("change", () => {
		settings.shouldAsync = asyncSwitch.checked;
		if (settings.shouldAsync !== settings.isAsync) {
			document.getElementById("async-notification").classList.remove("hidden");
		} else {
			document.getElementById("async-notification").classList.add("hidden");
		}
	});

	// Set the p value
	pValueSlider.addEventListener("input", () => {
		settings.p = Number.parseFloat(pValueSlider.value);
	});

	// Resize the canvas to fill browser window dynamically, with device pixel ratio
	function resizeCanvas() {
		const rect = canvas.getBoundingClientRect();
		const scale = window.devicePixelRatio;

		canvas.width = rect.width * scale;
		canvas.height = rect.height * scale;

		ctx.scale(scale, scale);
	}

	// Level selector modal
	document
		.getElementById("level-selector-button")
		.addEventListener("click", () => {
			document
				.getElementById("level-selector-modal")
				.classList.remove("hidden");
			loadLevelThumbnails();
		});

	document
		.getElementById("close-modal-button")
		.addEventListener("click", () => {
			document.getElementById("level-selector-modal").classList.add("hidden");
		});

	document
		.getElementById("set-optimal-spawn-button")
		.addEventListener("click", () => {
			const field = algorithm.field;
			const isWall = field.matrix.map((row) =>
				row.map((cell) => cell instanceof WallCell),
			);

			const point = geometricMean(isWall);
			console.log(point);

			field.spawn_position = new Vector2(point.x, point.y);
		});

	// Load levels from ./palyak directory
	async function loadLevelThumbnails() {
		// TODO: this supports external url, add a way to expand this list from the client
		try {
			const levelsFileUrl = "./palyak/levels.json";
			const response = await fetch(levelsFileUrl);
			const levelsJson = await response.json();
			const hrefs = levelsJson.levels;
			console.log(hrefs);
			const thumbnails = document.getElementById("level-thumbnails");
			thumbnails.innerHTML = "";
			for (const href of hrefs) {
				const thumbnail = document.createElement("img");
				thumbnail.src = href;
				thumbnail.width = 100;
				thumbnail.height = 100;
				thumbnail.style.cursor = "pointer";
				thumbnail.addEventListener("click", async () => {
					settings.currentFieldMap = href;
					await setup(settings);
					document
						.getElementById("level-selector-modal")
						.classList.add("hidden");
				});
				thumbnails.appendChild(thumbnail);
			}
		} catch (error) {
			console.error("Error fetching PNG files:", error);
		}
	}

	// Set canvas size to match device pixel ratio
	let resizeTimeout = null;
	window.addEventListener("resize", () => {
		if (resizeTimeout !== null) {
			clearTimeout(resizeTimeout);
		}
		// Debounced resize
		resizeTimeout = setTimeout(() => {
			resizeCanvas();
			render(ctx, canvas.width, canvas.height, 0, field, settings);
		}, 100);
	});

	// Check the onclick event
	canvas.addEventListener("click", (event) => {
		const field = algorithm.field;
		const cellWidth = canvas.width / field.cols;
		const cellHeight = canvas.height / field.rows;
		const cellSize = Math.min(cellWidth, cellHeight);
		const offsetX = (canvas.width - cellSize * field.cols) / 2;
		const offsetY = (canvas.height - cellSize * field.rows) / 2;

		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left - offsetX;
		const y = event.clientY - rect.top - offsetY;
		const row = Math.floor(y / cellSize);
		const col = Math.floor(x / cellSize);

		const cell = field.getCell(new Vector2(col, row));
		if (cell instanceof RobotCell) {
			cellLogs.innerHTML = cell.logs.join("\n");
			botHistory.innerHTML = cell.history
				.map((position) => `(${position.x}, ${position.y})`)
				.join("\n");
		} else if (cell instanceof WallCell) {
			cellLogs.innerHTML = "Wall cell";
			botHistory.innerHTML = "";
		} else if (cell instanceof EmptyCell) {
			cellLogs.innerHTML = "Empty cell";
			botHistory.innerHTML = "";
		}
	});

	// The first pain of the canvas
	requestAnimationFrame(async () => {
		resizeCanvas();
		await setup(settings);

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
