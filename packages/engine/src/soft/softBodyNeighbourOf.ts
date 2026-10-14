import { SOFT_BODY_NEIGHBOURS } from "./SOFT_BODY_NEIGHBOURS";

/** Find one row-major particle's ordered lattice neighbour, or -1 beyond the rectangular lattice.
 *
 * @evidence contracts/common.md#principled-implementation Column/row offsets are taken from the canonical twelve-entry table and checked against rectangular dimensions before constructing the row-major index; callers supply admitted integer dimensions and a table index.
 * @evidence contracts/common.md#clear-and-simple-design The same indexing owner serves rest-edge setup, strain measurement and Jacobi gathers, so boundary exclusion cannot drift between phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The -1 result is the lattice's explicit absent-neighbour sentinel, not a replacement particle or geometric coordinate.
 * @evidence contracts/common.md#meaningful-documentation States rectangular admission premises and the absent-neighbour result.
 * @evidence contracts/performance.md#efficient-algorithms One fixed table read and four boundary comparisons take constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work All solver phases share the same table and calculation; there is no per-particle cache whose validity could diverge from dimensions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an integer is returned; the immutable offset table belongs to the module and no caller records are retained.
 */
export const softBodyNeighbourOf: (
  columns: number,
  rows: number,
  column: number,
  row: number,
  at: number,
) => number = (
  columns: number,
  rows: number,
  column: number,
  row: number,
  at: number,
): number => {
  const neighbourColumn: number = column + SOFT_BODY_NEIGHBOURS[at][0];
  const neighbourRow: number = row + SOFT_BODY_NEIGHBOURS[at][1];
  if (neighbourColumn < 0 || neighbourColumn >= columns) return -1;
  if (neighbourRow < 0 || neighbourRow >= rows) return -1;
  return neighbourRow * columns + neighbourColumn;
};
