import rough from "roughjs";

import { Element, ElementType, Coordinates } from "@/types";

const generator = rough.generator();

export const newElement = (type: ElementType, coordinates: Coordinates): Element => {
	if (type === "LINE") {
		return newLine(coordinates);
	} else if (type === "RECT") {
		return newRectangle(coordinates);
	} else {
		return newPencil(coordinates);
	}
};

const newLine = (coordinates: Coordinates): Element => {
	const { x1, y1, x2, y2 } = coordinates;
	const roughElement = generator.line(x1, y1, x2, y2);
	return { type: "LINE", coordinates, roughElement };
};

const newRectangle = (coordinates: Coordinates): Element => {
	const { x1, y1, x2, y2 } = coordinates;
	const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
	return { type: "RECT", coordinates, roughElement };
};

const newPencil = (coordinates: Coordinates): Element => {
	const { x1, y1 } = coordinates;
	return { type: "PENCIL", points: [{ x: x1, y: y1 }] };
};
