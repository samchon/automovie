import type { IAutoMovieStageSetPiece } from "@automovie/interface";

/** The staged placement of every prop in {@link propRegistry}, same order. */
export const propSet = (): IAutoMovieStageSetPiece[] => [
  { node: "table", model: "table", position: { x: 0, y: 0.3, z: 0 } },
  {
    node: "lamp",
    model: "lamp",
    // Half of the 1.2-scaled 0.6 m box above the table's top face at y = 0.6:
    // the lamp stands on the affordance it cites rather than near it.
    position: { x: 0, y: 0.96, z: 0 },
    scale: 1.2,
  },
  { node: "sconce", model: "sconce", position: { x: -4.5, y: 1.5, z: 0 } },
  { node: "charger", model: "charger", position: { x: 0.5, y: 0.7, z: 0 } },
  { node: "pendant", model: "pendant", position: { x: 0, y: 3, z: 3 } },
  { node: "chime", model: "chime", position: { x: 0, y: 2, z: -2 } },
  { node: "cabinet", model: "cabinet", position: { x: -4, y: 0.3, z: 4 } },
  { node: "door", model: "door", position: { x: 4, y: 1, z: 0 } },
  { node: "crate", model: "crate", position: { x: 20, y: 0.3, z: 20 } },
  {
    node: "sculpture",
    model: "sculpture",
    position: { x: -3, y: 0, z: 0 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    scale: { x: 1, y: 2, z: 0.5 },
  },
];
