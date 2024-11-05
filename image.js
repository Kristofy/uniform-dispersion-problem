/**
 * Extracts pixel data from an image.
 *
 * @param {HTMLImageElement} image - The image element from which to extract pixel data.
 * @returns {ImageData} The pixel data of the image.
 */
export function loadImageData(image) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	canvas.width = image.width;
	canvas.height = image.height;
	context.drawImage(image, 0, 0);
	return context.getImageData(0, 0, image.width, image.height);
}

/**
 * Fetches an image from a URL and extracts its pixel data.
 *
 * @param {string} url - The URL of the image.
 * @returns {Promise<ImageData>} A promise that resolves to the pixel data of the image.
 */
export function loadImageDataFromUrl(url) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(loadImageData(image));
		image.onerror = reject;
		image.src = url;
	});
}

/**
 * Converts a color to an RGB array.
 *
 * @param {string} color - The color to convert.
 * @returns {Unit8ClampedArray} The RGBA array.
 * @example colorToRGBA("#00FF00"); // [0, 255, 0, 255]
 */
export const colorToRGB = (() => {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d", { willReadFrequently: true });
	canvas.width = 1;
	canvas.height = 1;

	return (color) => {
		context.fillStyle = color;
		context.fillRect(0, 0, 1, 1);
		return context.getImageData(0, 0, 1, 1).data;
	};
})();

/**
 * Converts every pixel in an image to the closest color in a palette.
 *
 * @param {ImageData} image - The image to quantize.
 * @param {Array<string>} palette - The palette of colors to quantize to.
 * @returns {ImageData} The quantized image.
 */
export function quantizeImage(image, palette) {
	const euclideanDistanceSquared = (a, b) =>
		a.reduce(
			(distance, channel, index) => distance + (channel - b[index]) ** 2,
			0,
		);

	const colors = palette.map(colorToRGB);
	const data = image.data;
	const quantized = new Uint8ClampedArray(data.length);
	for (let i = 0; i < data.length; i += 4) {
		const pixel = data.slice(i, i + 3);
		const closestColor = colors.reduce(
			(closest, color, index) => {
				const distance = euclideanDistanceSquared(pixel, color);
				return distance < closest.distance ? { distance, index } : closest;
			},
			{ distance: Number.POSITIVE_INFINITY, index: -1 },
		).index;

		const [r, g, b, a] = colors[closestColor];
		quantized[i] = r;
		quantized[i + 1] = g;
		quantized[i + 2] = b;
		quantized[i + 3] = a;
	}

	const newImage = new ImageData(quantized, image.width, image.height);

	return newImage;
}

/**
 * Pads an image with a single pixel border of the given value.
 *
 * @param {ImageData} image - The image to pad.
 * @param {Uint8ClampedArray} value - The RGBA value to use for padding.
 * @returns {ImageData} The padded image.
 */
export function padImage(image, value) {
	const { width, height, data } = image;
	const newWidth = width + 2;
	const newHeight = height + 2;
	const paddedData = new Uint8ClampedArray(newWidth * newHeight * 4);

	for (let y = 0; y < newHeight; y++) {
		for (let x = 0; x < newWidth; x++) {
			const newIndex = (y * newWidth + x) * 4;
			// If the pixel is on the border, set it to the given value
			if (x === 0 || x === newWidth - 1 || y === 0 || y === newHeight - 1) {
				paddedData[newIndex + 0] = value[0];
				paddedData[newIndex + 1] = value[1];
				paddedData[newIndex + 2] = value[2];
				paddedData[newIndex + 3] = value[3];
			} else {
				// Otherwise, copy the pixel from the original image
				const oldIndex = ((y - 1) * width + (x - 1)) * 4;
				paddedData[newIndex + 0] = data[oldIndex + 0];
				paddedData[newIndex + 1] = data[oldIndex + 1];
				paddedData[newIndex + 2] = data[oldIndex + 2];
				paddedData[newIndex + 3] = data[oldIndex + 3];
			}
		}
	}

	return new ImageData(paddedData, newWidth, newHeight);
}

/**
 * Rotates an image by 90 degrees.
 *
 * @param {ImageData} image - The image to rotate.
 * @returns {ImageData} The rotated image.
 */
export function rotateImage90(image) {
	const { width, height, data } = image;
	const rotatedData = new Uint8ClampedArray(width * height * 4);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const oldIndex = (y * width + x) * 4;
			const newIndex = ((width - x - 1) * height + y) * 4;
			rotatedData[newIndex + 0] = data[oldIndex + 0];
			rotatedData[newIndex + 1] = data[oldIndex + 1];
			rotatedData[newIndex + 2] = data[oldIndex + 2];
			rotatedData[newIndex + 3] = data[oldIndex + 3];
		}
	}

	return new ImageData(rotatedData, height, width);
}

/**
 * Flips an image horizontally.
 *
 * @param {ImageData} image - The image to flip.
 * @returns {ImageData} The flipped image.
 */
export function flipHorizontalImage(image) {
	const { width, height, data } = image;
	const flippedData = new Uint8ClampedArray(width * height * 4);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const oldIndex = (y * width + x) * 4;
			const newIndex = (y * width + (width - x - 1)) * 4;
			flippedData[newIndex + 0] = data[oldIndex + 0];
			flippedData[newIndex + 1] = data[oldIndex + 1];
			flippedData[newIndex + 2] = data[oldIndex + 2];
			flippedData[newIndex + 3] = data[oldIndex + 3];
		}
	}

	return new ImageData(flippedData, width, height);
}

/**
 * Flips an image vertically.
 *
 * @param {ImageData} image - The image to flip.
 * @returns {ImageData} The flipped image.
 */
export function flipVerticalImage(image) {
	const { width, height, data } = image;
	const flippedData = new Uint8ClampedArray(width * height * 4);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const oldIndex = (y * width + x) * 4;
			const newIndex = ((height - y - 1) * width + x) * 4;
			flippedData[newIndex + 0] = data[oldIndex + 0];
			flippedData[newIndex + 1] = data[oldIndex + 1];
			flippedData[newIndex + 2] = data[oldIndex + 2];
			flippedData[newIndex + 3] = data[oldIndex + 3];
		}
	}

	return new ImageData(flippedData, width, height);
}
