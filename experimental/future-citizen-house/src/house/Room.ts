import { Rect } from "./Rect";

/** One room of the plan: its storey, clear floor cells and lining finish. */
export type Room = {
  /** Room space identity. */
  id: string;
  /** Storey index: 0 for the ground floor, 1 for the upper floor. */
  level: 0 | 1;
  /** Clear floor rectangles inside the wall faces; an L-shaped room has more than one. */
  cells: readonly Rect[];
  /** Wall lining material, such as `plaster` or `tile`. */
  finish: string;
};
