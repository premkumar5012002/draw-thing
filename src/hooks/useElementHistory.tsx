import { nanoid } from "nanoid";
import { useState } from "react";
import { useImmer } from "use-immer";

import { newElement } from "@/elements/newElement";
import { adjustElementCoordinates } from "@/lib/utils";
import { resizeCoordinates } from "@/elements/resizeElement";
import { Element, ElementState, ElementType, SelectedElementState } from "@/types";

export const useElementHistory = () => {
	const [index, setIndex] = useState<number>(-1);

	const [history, setHistory] = useImmer<ElementState[]>([]);

	const [temporaryElement, setTemporaryElement] = useState<ElementState | null>(null);

	const [selectedElement, setSelectedElement] = useState<SelectedElementState | null>(null);

	const addElement = (element: Element) => {
		const elementState: ElementState = {
			id: nanoid(),
			element,
			active: true,
		};

		setHistory((state) => {
			state.splice(index + 1);
			state.push(elementState);
		});

		setSelectedElement(elementState);

		setIndex((index) => index + 1);
	};

	const onDraw = (x: number, y: number) => {
		if (selectedElement) {
			const { type, coordinates, points } = selectedElement.element;
			if (coordinates) {
				const { x1, y1 } = coordinates;
				const updatedCoordinates = { x1, y1, x2: x, y2: y };
				const updatedElement = newElement(type, updatedCoordinates);
				const updatedElementState = { ...selectedElement, element: updatedElement };
				setSelectedElement(updatedElementState);
				updateElement(updatedElementState);
			} else if (points) {
				const updatedElement = { ...selectedElement.element, points: [...points, { x, y }] };
				const updatedElementState = { ...selectedElement, element: updatedElement };
				setSelectedElement(updatedElementState);
				updateElement(updatedElementState);
			}
		}
	};

	const onMove = (x: number, y: number) => {
		if (selectedElement) {
			const { id, element, offset, offsets } = selectedElement;
			const { type, coordinates, points } = element;
			if (coordinates && offset) {
				const { x1, y1, x2, y2 } = coordinates;
				const newX1 = x - offset.x;
				const newY1 = y - offset.y;
				const width = x2 - x1;
				const heigth = y2 - y1;
				const updatedCoordinates = { x1: newX1, y1: newY1, x2: newX1 + width, y2: newY1 + heigth };
				const updatedElement = newElement(type, updatedCoordinates);
				updateHistory(id, updatedElement);
			} else if (points && offsets) {
				const newPoints = points.map((_, index) => {
					return {
						x: x - offsets.x[index],
						y: y - offsets.y[index],
					};
				});
				const updatedElement = { ...selectedElement.element, points: newPoints };
				updateHistory(id, updatedElement);
			}
		}
	};

	const onResize = (x: number, y: number) => {
		if (selectedElement && selectedElement.position) {
			const { id, element, position } = selectedElement;
			const { type, coordinates } = element;
			if (coordinates) {
				const updatedCoordinates = resizeCoordinates(x, y, position, coordinates);
				if (updatedCoordinates) {
					const updatedElement = newElement(type, updatedCoordinates);
					updateHistory(id, updatedElement);
				}
			}
		}
	};

	const updateHistory = (id: string, element: Element) => {
		if (temporaryElement) {
			const updatedElementState: ElementState = {
				...temporaryElement,
				element,
			};
			setTemporaryElement(updatedElementState);
			updateElement(updatedElementState);
		} else if (selectedElement) {
			const nextElementState: ElementState = {
				id: nanoid(),
				element,
				active: true,
				prevStateId: id,
			};
			setTemporaryElement(nextElementState);
			replaceElement(nextElementState);
		}
	};

	const updateElement = (updatedElementState: ElementState) => {
		setHistory((state) => {
			const index = state.findIndex(({ id }) => id === updatedElementState.id);
			if (index === -1) return;
			state[index] = updatedElementState;
		});
	};

	const replaceElement = (nextElementState: ElementState) => {
		setHistory((state) => {
			// Clearing all element history after current index
			if (index < history.length) {
				state.splice(index + 1);
			}

			const prevElementIndex = state.findIndex(({ id }) => id === nextElementState.prevStateId);

			if (prevElementIndex === -1) return;

			state[prevElementIndex].active = false;
			state[prevElementIndex].nextStateId = nextElementState.id;
			state.push(nextElementState);
		});

		setIndex((index) => index + 1);
	};

	const onUndo = () => {
		if (index <= -1) return;

		setHistory((state) => {
			const lastElementState = state[index];

			state[index].active = false;

			// If last element is not last element in the history then active the prev element
			if (index > 0) {
				state[index - 1].active = true;
			}

			// If last element state contains previous state then active it.
			if (lastElementState.prevStateId) {
				const prevElementStateIndex = state.findIndex(
					(state) => state.id === lastElementState.prevStateId
				);

				if (prevElementStateIndex === -1) return;

				state[prevElementStateIndex].active = true;
			}
		});

		setIndex((index) => index - 1);
	};

	const onRedo = () => {
		if (index >= history.length - 1) return;

		setHistory((state) => {
			const lastElementState = state[index];
			const nextElementState = state[index + 1];

			nextElementState.active = true;

			if (index === -1) return;

			if (lastElementState.nextStateId === nextElementState.id) {
				lastElementState.active = false;
			}

			if (nextElementState.prevStateId) {
				const prevElementStateIndex = state.findIndex(
					({ id }) => id === nextElementState.prevStateId
				);

				if (prevElementStateIndex === -1) return;

				state[index].active = false;
			}
		});

		setIndex((index) => index + 1);
	};

	const isAdjustmentRequired = (type: ElementType) => ["LINE", "RECT"].includes(type);

	const adjustElementCoordinatesOnMouseUp = () => {
		if (temporaryElement && isAdjustmentRequired(temporaryElement.element.type)) {
			const { element } = temporaryElement;
			const updatedCoordinates = adjustElementCoordinates(element);
			if (updatedCoordinates) {
				const updatedElement = newElement(element.type, updatedCoordinates);
				updateElement({ ...temporaryElement, element: updatedElement });
			}
		} else if (selectedElement && isAdjustmentRequired(selectedElement.element.type)) {
			const { element } = selectedElement;
			const updatedCoordinates = adjustElementCoordinates(element);
			if (updatedCoordinates) {
				const updatedElement = newElement(element.type, updatedCoordinates);
				updateElement({ ...selectedElement, element: updatedElement });
			}
		}
	};

	const clear = () => {
		setSelectedElement(null);
		setTemporaryElement(null);
	};

	const activeElementState = history.filter((state) => state.active);

	const elements = activeElementState.map((state) => state.element);

	return {
		elements,
		activeElementState,
		selectedElement,
		addElement,
		onDraw,
		onMove,
		onResize,
		onUndo,
		onRedo,
		updateElement,
		adjustElementCoordinatesOnMouseUp,
		setSelectedElement,
		clear,
	};
};
