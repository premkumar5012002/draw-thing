import { Drawable } from "roughjs/bin/core";

export type ToolType = ElementType | "SELECTION";

export type ElementType = "LINE" | "RECT" | "PENCIL";

export type ActionType = "DRAWING" | "MOVING" | "RESIZING" | "WRITING" | "PANNING";

export type Coordinates = { x1: number; y1: number; x2: number; y2: number };

export type Position = "START" | "END" | "TL" | "TR" | "BL" | "BR" | "INSIDE";

export interface Point {
	x: number;
	y: number;
}

export interface Element {
	type: ElementType;
	points?: Point[];
	roughElement?: Drawable;
	coordinates?: Coordinates;
}

export interface ElementState {
	id: string;
	active: boolean;
	element: Element;
	prevStateId?: string;
	nextStateId?: string;
}

export interface SelectedElementState extends ElementState {
	offset?: Point;
	offsets?: {
		x: number[];
		y: number[];
	};
	position?: Position;
}
