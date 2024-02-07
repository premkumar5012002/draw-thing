import getStroke from "perfect-freehand";
import { RoughCanvas } from "roughjs/bin/canvas";

import { Element } from "@/types";
import { getSvgPathFromStroke } from "@/lib/utils";

export const drawElement = (
	element: Element,
	roughtCanvas: RoughCanvas,
	context: CanvasRenderingContext2D
) => {
	if (element.type === "LINE" || element.type === "RECT") {
		drawRoughCanvas(element, roughtCanvas);
	} else if (element.type === "PENCIL") {
		drawPencil(element, context);
	}
};

const drawRoughCanvas = (element: Element, roughtCanvas: RoughCanvas) => {
	if (element.roughElement) {
		roughtCanvas.draw(element.roughElement);
	}
};

const drawPencil = (element: Element, context: CanvasRenderingContext2D) => {
	if (element.points) {
		const stroke = getSvgPathFromStroke(getStroke(element.points));
		context.fill(new Path2D(stroke));
	}
};
