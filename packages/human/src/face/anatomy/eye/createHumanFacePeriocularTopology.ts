import type { IHumanFacePeriocularGrid } from "./structures/IHumanFacePeriocularGrid";
import type { IHumanFacePeriocularTopology } from "./structures/IHumanFacePeriocularTopology";

/**
 * Define one source sheet's cell and perimeter incidence. Declared collapsed
 * columns use their row-zero endpoint; all other source identities are kept.
 * The shell producer and mapping reader consume this same topology, so the
 * reader cannot measure a different triangulation from the generated shell.
 *
 * @evidence contracts/common.md#principled-implementation The indexed quotient identifies only source-declared repeated endpoints and retains every regular grid cell.
 * @evidence contracts/common.md#clear-and-simple-design One incidence owner serves shell construction and mapping observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate distance, part identity or area tolerance selects aliases.
 * @evidence contracts/common.md#meaningful-documentation States the source quotient and its shared consumers.
 * @evidence contracts/modeling.md#shared-boundaries Both sheets and their side walls read the same canonical perimeter.
 */
export function createHumanFacePeriocularTopology(input: IHumanFacePeriocularGrid): IHumanFacePeriocularTopology {
  const { stride, height, collapsedColumns } = input;
  const canonical = (vertex: number): number => collapsedColumns.has(vertex % stride) ? vertex % stride : vertex;
  const cells: IHumanFacePeriocularTopology["cells"] = [];
  for (let row = 0; row + 1 < height; row++)
    for (let column = 0; column + 1 < stride; column++) {
      const a = row * stride + column, b = a + 1, d = a + stride, c = d + 1;
      cells.push([canonical(a), canonical(b), canonical(c), canonical(d)]);
    }
  const n = stride * height;
  const perimeter = [...Array.from({ length: stride }, (_, c) => c),
    ...Array.from({ length: height - 1 }, (_, r) => (r + 2) * stride - 1),
    ...Array.from({ length: stride - 1 }, (_, c) => n - 2 - c),
    ...Array.from({ length: height - 2 }, (_, r) => (height - 2 - r) * stride)].map(canonical);
  return { cells, perimeter };
}
