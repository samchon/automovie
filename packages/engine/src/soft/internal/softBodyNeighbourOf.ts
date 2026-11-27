import { SOFT_BODY_NEIGHBOURS } from "../SOFT_BODY_NEIGHBOURS";

/*
 * Find one row-major particle's ordered lattice neighbour, or -1 beyond the
 * rectangular lattice.
 */
export function softBodyNeighbourOf(
  columns: number,
  rows: number,
  column: number,
  row: number,
  at: number,
): number {
  const neighbourColumn: number = column + SOFT_BODY_NEIGHBOURS[at][0];
  const neighbourRow: number = row + SOFT_BODY_NEIGHBOURS[at][1];
  if (neighbourColumn < 0 || neighbourColumn >= columns) return -1;
  if (neighbourRow < 0 || neighbourRow >= rows) return -1;
  return neighbourRow * columns + neighbourColumn;
}
