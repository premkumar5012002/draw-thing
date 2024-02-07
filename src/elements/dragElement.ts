import { distance, nearPoint } from "@/lib/utils";
import { Coordinates, Element, ElementState } from "@/types";

export const getElementStateAtPosition = (x: number, y: number, elementState: ElementState[]) => {
	for (const state of elementState) {
		const elementPosition = positionWithinElement(x, y, state.element);
		if (elementPosition) {
			return { ...state, position: elementPosition };
		}
	}
	return null;
};

const onLine = (x: number, y: number, coordinates: Coordinates, maxDistance: number = 1) => {
	const { x1, y1, x2, y2 } = coordinates;
	const a = { x: x1, y: y1 };
	const b = { x: x2, y: y2 };
	const c = { x, y };
	const offset = distance(a, b) - (distance(a, c) + distance(b, c));
	return Math.abs(offset) < maxDistance ? "INSIDE" : null;
};

export const positionWithinElement = (x: number, y: number, element: Element) => {
	const { type, coordinates, points } = element;

	if (coordinates) {
		const { x1, y1, x2, y2 } = coordinates;
		switch (type) {
			case "RECT": {
				const topLeft = nearPoint(x, y, x1, y1, "TL");
				const topRight = nearPoint(x, y, x2, y1, "TR");
				const bottomLeft = nearPoint(x, y, x1, y2, "BL");
				const bottomRight = nearPoint(x, y, x2, y2, "BR");
				const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "INSIDE" : null;
				return topLeft || topRight || bottomLeft || bottomRight || inside;
			}
			case "LINE": {
				const on = onLine(x, y, coordinates);
				const start = nearPoint(x, y, x1, y1, "START");
				const end = nearPoint(x, y, x2, y2, "END");
				return start || end || on;
			}
		}
	}

	if (points) {
		const betweenAnyPoint = element.points?.some((point, index) => {
			const nextPoint = element.points?.[index + 1];
			if (nextPoint === undefined) return false;
			const coordinates = { x1: point.x, y1: point.y, x2: nextPoint.x, y2: nextPoint.y };
			return onLine(x, y, coordinates, 5) != null;
		});
		const between = betweenAnyPoint ? "INSIDE" : null;
		const start = nearPoint(x, y, points[0].x, points[0].y, "INSIDE");
		const end = nearPoint(x, y, points[points.length - 1].x, points[points.length - 1].y, "INSIDE");
		return start || end || between;
	}
};
