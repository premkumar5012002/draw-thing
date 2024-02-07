import { Coordinates, Position } from "@/types";

export const resizeCoordinates = (
	clientX: number,
	clientY: number,
	position: Position,
	coordinates: Coordinates
) => {
	const { x1, y1, x2, y2 } = coordinates;
	if (position === "TL" || position === "START") {
		return { x1: clientX, y1: clientY, x2, y2 };
	} else if (position === "BR" || position === "END") {
		return { x1, y1, x2: clientX, y2: clientY };
	} else if (position === "TR") {
		return { x1, y1: clientY, x2: clientX, y2 };
	} else {
		return { x1: clientX, y1, x2, y2: clientY };
	}
};
