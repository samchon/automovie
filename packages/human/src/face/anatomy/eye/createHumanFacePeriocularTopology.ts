import type { IHumanFacePeriocularGrid } from "./structures/IHumanFacePeriocularGrid";
import type { IHumanFacePeriocularTopology } from "./structures/IHumanFacePeriocularTopology";

/**
 * Define one source sheet's cell and perimeter incidence. Declared collapsed
 * columns use their row-zero endpoint; all other source identities are kept.
 * The shell producer and mapping reader consume this same topology, so the
 * reader cannot measure a different triangulation from the generated shell.
 *
 * @evidence contracts/common.md#principled-implementation Declared collapsed columns identify all their rows with the same row-zero source endpoint; other incidence remains unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One cell/perimeter owner gives shell construction and mapping measurement the identical structured source topology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller supplies valid grid dimensions and declared physical endpoint columns; no coordinate coincidence or hidden tolerance chooses identity.
 * @evidence contracts/common.md#meaningful-documentation The prose states the endpoint quotient and producer/reader shared triangulation.
 * @evidence contracts/performance.md#efficient-algorithms Stride times height determines O(SH) cell work/storage and O(S+H) perimeter work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same canonical ordinal rule serves every cell and perimeter occurrence and is shared by both shell and mapping consumers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned cell/perimeter arrays belong to the caller; the input set is read only and no retained task/resource is acquired.
 */
export function createHumanFacePeriocularTopology(
  input: IHumanFacePeriocularGrid,
): IHumanFacePeriocularTopology {
  const { stride, height, collapsedColumns }: IHumanFacePeriocularGrid = input;
  const canonical: (vertex: number) => number = (vertex: number): number =>
    collapsedColumns.has(vertex % stride) ? vertex % stride : vertex;
  const cells: IHumanFacePeriocularTopology["cells"] = [];
  for (let row: number = 0; row + 1 < height; row++)
    for (let column: number = 0; column + 1 < stride; column++) {
      const a: number = row * stride + column,
        b: number = a + 1,
        d: number = a + stride,
        c: number = d + 1;
      cells.push([canonical(a), canonical(b), canonical(c), canonical(d)]);
    }
  const n: number = stride * height;
  const perimeter: number[] = [
    ...Array.from({ length: stride }, (_: unknown, c: number): number => c),
    ...Array.from(
      { length: height - 1 },
      (_: unknown, r: number): number => (r + 2) * stride - 1,
    ),
    ...Array.from(
      { length: stride - 1 },
      (_: unknown, c: number): number => n - 2 - c,
    ),
    ...Array.from(
      { length: height - 2 },
      (_: unknown, r: number): number => (height - 2 - r) * stride,
    ),
  ].map(canonical);
  return { cells, perimeter };
}
