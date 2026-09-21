import { IAutoMovieMesh } from "@automovie/interface";

import { AUTOMOVIE_WELD_GRID } from "./AUTOMOVIE_WELD_GRID";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * The triangles of a mesh that carry no surface because two of their corners
 * weld to the same grid point: a pole ring, a collapsed cap, a face whose
 * placement shrank an edge below the weld.
 *
 * This is the one definition of a redundant face. `inspectAutoMovieMeshTopology`
 * skips exactly these when it counts edges, and an exporter that must
 * compare each surviving face's orientation before and after a transform
 * asks this instead of the whole topology, whose edge, manifold and volume
 * figures it would not read. Corners compare as rounded grid integers, so the
 * answer is the same as comparing welded keys without building one.
 *
 * Index admission precedes the scan and input arrays are never mutated.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Distinguishes the faces that carry surface from the ones a weld collapses, so a later operation can preserve or omit each one deliberately.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports which output faces an operation left without area on the shared weld grid, as the one degeneracy fact every topology measurement uses.
 */
export const degenerateAutoMovieTriangles = (
  mesh: IAutoMovieMesh,
): number[] => {
  const indices = triangleIndicesOf(mesh, "mesh degeneracy");
  const p = mesh.positions;
  const grid = (at: number, axis: number): number =>
    Math.round(p[at * 3 + axis]! * AUTOMOVIE_WELD_GRID);
  // Two grid coordinates are one welded coordinate exactly when their key
  // strings would be: -0 reads as "0", and a NaN corner reads as "NaN", so
  // it welds with another NaN corner. `===` gives the first; the second
  // needs its own clause because NaN never equals itself.
  const equal = (x: number, y: number): boolean =>
    x === y || (Number.isNaN(x) && Number.isNaN(y));
  const same = (a: number, b: number): boolean =>
    equal(grid(a, 0), grid(b, 0)) &&
    equal(grid(a, 1), grid(b, 1)) &&
    equal(grid(a, 2), grid(b, 2));
  const degenerate: number[] = [];
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index]!;
    const b = indices[index + 1]!;
    const c = indices[index + 2]!;
    if (same(a, b) || same(b, c) || same(c, a)) degenerate.push(index / 3);
  }
  return degenerate;
};
