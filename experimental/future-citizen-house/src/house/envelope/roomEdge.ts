import { roomById } from "../roomById";

/** Clear cell limits remain the source of each opening's measured edge. */

export const roomEdge = (
  id: string,
  axis: "x" | "z",
  end: "min" | "max",
  cell = 0
): number => roomById(id).cells[cell][(axis === "x" ? 0 : 2) + (end === "max" ? 1 : 0)];
