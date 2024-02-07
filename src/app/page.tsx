"use client";

import rough from "roughjs";
import {
	IconLine,
	IconPencil,
	IconSquare,
	IconPointer,
	IconTypography,
	IconArrowBackUp,
	IconArrowForwardUp,
	IconMinus,
	IconPlus,
} from "@tabler/icons-react";
import { FC, MouseEvent, useLayoutEffect, useRef, useState, Dispatch, useEffect } from "react";

import { ToolType, ActionType, Point } from "@/types";
import { newElement } from "@/elements/newElement";
import { cn, cursorForPosition } from "@/lib/utils";
import { drawElement } from "@/elements/drawElement";
import { getElementStateAtPosition } from "@/elements/dragElement";

import { useElementHistory } from "@/hooks/useElementHistory";

export default function Home() {
	const elementHistory = useElementHistory();

	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [scale, setScale] = useState(1);

	const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

	const [scaleOffset, setScaleOffset] = useState<Point>({ x: 0, y: 0 });

	const [currentTool, setCurrentTool] = useState<ToolType | null>(null);

	const [currentAction, setCurrentAction] = useState<ActionType | null>(null);

	const [startPanMousePosition, setStartPanMousePosition] = useState({ x: 0, y: 0 });

	useLayoutEffect(() => {
		const canvas = canvasRef.current;

		if (canvas instanceof HTMLCanvasElement === false) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		const ctx = canvas.getContext("2d");

		if (ctx === null) return;

		const scaledWidth = canvas.width * scale;
		const scaledHeight = canvas.height * scale;

		const scaledOffsetX = (scaledWidth - canvas.width) / 2;
		const scaledOffsetY = (scaledHeight - canvas.height) / 2;

		if (scaleOffset.x !== scaledOffsetX || scaleOffset.y !== scaledOffsetY) {
			setScaleOffset({ x: scaledOffsetX, y: scaledOffsetY });
		}

		ctx.translate(panOffset.x * scale - scaledOffsetX, panOffset.y * scale - scaledOffsetY);
		ctx.scale(scale, scale);

		const roughCanvas = rough.canvas(canvas);

		for (const element of elementHistory.elements) {
			drawElement(element, roughCanvas, ctx);
		}
	}, [elementHistory.elements, panOffset, scale]);

	useEffect(() => {
		const panFunction = (event: WheelEvent) => {
			setPanOffset((prevState) => ({
				x: prevState.x - event.deltaX,
				y: prevState.y - event.deltaY,
			}));
		};

		document.addEventListener("wheel", panFunction);

		return () => {
			document.removeEventListener("wheel", panFunction);
		};
	}, []);

	const getMouseCoordinates = (event: MouseEvent) => {
		const clientX = (event.clientX - panOffset.x * scale + scaleOffset.x) / scale;
		const clientY = (event.clientY - panOffset.y * scale + scaleOffset.y) / scale;
		return { clientX, clientY };
	};

	const handleMouseUp = () => {
		if (currentAction === "DRAWING" || currentAction === "RESIZING") {
			elementHistory.adjustElementCoordinatesOnMouseUp();
		}

		if (currentAction === "WRITING") return;

		setCurrentAction(null);
		elementHistory.clear();
	};

	const handleMouseDown = (event: MouseEvent) => {
		const { clientX, clientY } = getMouseCoordinates(event);

		if (event.button === 1) {
			setCurrentAction("PANNING");
			setStartPanMousePosition({ x: clientX, y: clientY });
			return;
		}

		if (currentAction === "WRITING") return;

		if (currentTool === "LINE" || currentTool === "RECT" || currentTool === "PENCIL") {
			const coordinates = {
				x1: clientX,
				y1: clientY,
				x2: clientX,
				y2: clientY,
			};

			const element = newElement(currentTool, coordinates);
			elementHistory.addElement(element);
			setCurrentAction("DRAWING");
		}

		if (currentTool === "SELECTION") {
			const elementStateWithPosition = getElementStateAtPosition(
				clientX,
				clientY,
				elementHistory.activeElementState
			);

			if (elementStateWithPosition === null) return;

			if (elementStateWithPosition.position === "INSIDE") {
				setCurrentAction("MOVING");
			} else {
				setCurrentAction("RESIZING");
			}

			if (elementStateWithPosition.element.coordinates) {
				const { x1, y1 } = elementStateWithPosition.element.coordinates;
				const offset = { x: clientX - x1, y: clientY - y1 };
				elementHistory.setSelectedElement({ ...elementStateWithPosition, offset });
			}

			if (elementStateWithPosition.element.points) {
				const points = elementStateWithPosition.element.points;
				const offsets = {
					x: points.map((point) => clientX - point.x),
					y: points.map((point) => clientY - point.y),
				};
				elementHistory.setSelectedElement({ ...elementStateWithPosition, offsets });
			}
		}
	};

	const handleMouseMove = (event: MouseEvent) => {
		const { clientX, clientY } = getMouseCoordinates(event);

		if (currentAction === "PANNING") {
			const deltaX = clientX - startPanMousePosition.x;
			const deltaY = clientY - startPanMousePosition.y;
			setPanOffset(({ x, y }) => ({
				x: x + deltaX,
				y: y + deltaY,
			}));
		}

		if (currentTool === "SELECTION") {
			const elementStateWithPosition = getElementStateAtPosition(
				clientX,
				clientY,
				elementHistory.activeElementState
			);

			const position = elementStateWithPosition?.position;

			(event.target as HTMLCanvasElement).style.cursor = position
				? cursorForPosition(position)
				: "default";
		}

		if (currentAction === "DRAWING") {
			elementHistory.onDraw(clientX, clientY);
		}

		if (currentAction === "MOVING") {
			elementHistory.onMove(clientX, clientY);
		}

		if (currentAction === "RESIZING") {
			elementHistory.onResize(clientX, clientY);
		}
	};

	const onZoom = (lvl: number) => {
		setScale((prevState) => {
			const maxLvl = Math.max(prevState + lvl, 0.1);
			return Math.min(maxLvl, 20);
		});
	};

	return (
		<div className="h-screen w-screen">
			<ToolBar currentTool={currentTool} setCurrentTool={setCurrentTool} />

			<canvas
				id="canvas"
				ref={canvasRef}
				onMouseUp={handleMouseUp}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
			>
				Canvas is not supported your browser
			</canvas>

			<div className="fixed z-50 bottom-2.5 left-2.5 right-0 flex gap-3">
				<ZoomToolBar scale={scale} onZoom={onZoom} />
				<UndoAndRedoButton onUndo={elementHistory.onUndo} onRedo={elementHistory.onRedo} />
			</div>
		</div>
	);
}

const ToolBar: FC<{ currentTool: ToolType | null; setCurrentTool: Dispatch<ToolType> }> = ({
	currentTool,
	setCurrentTool,
}) => {
	return (
		<div className="rounded-md fixed z-50 top-2.5 left-0 right-0 mx-auto flex items-center justify-center gap-1.5 shadow border p-1.5 w-min bg-white">
			{/* Selection Tool */}
			<button
				className={cn(
					"p-2 rounded-md hover:bg-slate-100",
					currentTool === "SELECTION" && "bg-blue-50 text-blue-500"
				)}
				onClick={() => setCurrentTool("SELECTION")}
			>
				<IconPointer size={18} />
			</button>

			{/* Rectangle Tool */}
			<button
				className={cn(
					"p-2 rounded-md hover:bg-slate-100",
					currentTool === "RECT" && "bg-blue-50 text-blue-500"
				)}
				onClick={() => setCurrentTool("RECT")}
			>
				<IconSquare size={18} />
			</button>

			{/* Line Tool */}
			<button
				className={cn(
					"p-2 rounded-md hover:bg-slate-100",
					currentTool === "LINE" && "bg-blue-50 text-blue-500"
				)}
				onClick={() => setCurrentTool("LINE")}
			>
				<IconLine size={18} />
			</button>

			{/* Pencil Tool */}
			<button
				className={cn(
					"p-2 rounded-md hover:bg-slate-100",
					currentTool === "PENCIL" && "bg-blue-50 text-blue-500"
				)}
				onClick={() => setCurrentTool("PENCIL")}
			>
				<IconPencil size={18} />
			</button>
		</div>
	);
};

const ZoomToolBar: FC<{
	scale: number;
	onZoom: (lvl: number) => void;
}> = ({ scale, onZoom }) => {
	return (
		<div className="rounded-md flex items-center justify-center divide-x shadow border w-min bg-white">
			<button className={cn("p-2 hover:bg-slate-100")} onClick={() => onZoom(-0.1)}>
				<IconMinus size={18} />
			</button>
			<span className="px-2 text-xs font-medium">
				{new Intl.NumberFormat("en-GB", { style: "percent" }).format(scale)}
			</span>
			<button className={cn("p-2 hover:bg-slate-100")} onClick={() => onZoom(0.1)}>
				<IconPlus size={18} />
			</button>
		</div>
	);
};

const UndoAndRedoButton: FC<{ onUndo: () => void; onRedo: () => void }> = ({ onUndo, onRedo }) => {
	return (
		<div className="rounded-md flex items-center justify-center divide-x shadow border w-min bg-white">
			<button className={cn("p-2 hover:bg-slate-100")} onClick={onUndo}>
				<IconArrowBackUp size={18} />
			</button>
			<button className={cn("p-2 hover:bg-slate-100")} onClick={onRedo}>
				<IconArrowForwardUp size={18} />
			</button>
		</div>
	);
};
