import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { Element, Point, Position } from "@/types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const average = (a: number, b: number) => (a + b) / 2;

export const getSvgPathFromStroke = (points: number[][], closed = true) => {
	const len = points.length;

	if (len < 4) {
		return ``;
	}

	let a = points[0];
	let b = points[1];
	const c = points[2];

	let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(
		2
	)} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`;

	for (let i = 2, max = len - 1; i < max; i++) {
		a = points[i];
		b = points[i + 1];
		result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
	}

	if (closed) {
		result += "Z";
	}

	return result;
};

export const nearPoint = (x: number, y: number, x1: number, y1: number, position: Position) => {
	return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? position : null;
};

export const distance = (a: Point, b: Point) => {
	return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const cursorForPosition = (position: Position) => {
	switch (position) {
		case "START":
		case "END":
		case "TL":
		case "BR":
			return "nwse-resize";
		case "TR":
		case "BL":
			return "nesw-resize";
		case "INSIDE":
			return "move";
		default:
			return "default";
	}
};

export const adjustElementCoordinates = (element: Element) => {
	const { type, coordinates } = element;
	if (coordinates) {
		const { x1, y1, x2, y2 } = coordinates;
		if (type === "RECT") {
			const minX = Math.min(x1, x2);
			const maxX = Math.max(x1, x2);
			const minY = Math.min(y1, y2);
			const maxY = Math.max(y1, y2);
			return { x1: minX, y1: minY, x2: maxX, y2: maxY };
		} else {
			if (x1 < x2 || (x1 === x2 && y1 < y2)) {
				return { x1, y1, x2, y2 };
			} else {
				return { x1: x2, y1: y2, x2: x1, y2: y1 };
			}
		}
	}
};
