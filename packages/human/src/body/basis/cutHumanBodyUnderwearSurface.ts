import type { IHumanBodyUnderwearSurfaceCutInput } from "./IHumanBodyUnderwearSurfaceCutInput";
import type { IHumanBodyUnderwearSurfaceCutResult } from "./IHumanBodyUnderwearSurfaceCutResult";

/**
 * Cut the triangles of a skin surface where a coverage field is positive.
 *
 * A triangle with all three corners inside is kept; one with one or two is clipped at the piecewise-linear zero of the field along its edges. An interior crossing is read from the edge's lower index, so both triangles share it. A crossing at an exact-zero endpoint instead shares that source corner with every incident edge. A triangle with no positive corner is dropped, as is the repeated-corner triangle when a clipped quadrilateral reduces to a triangle at that endpoint. The winding is kept.
 *
 * The result is the kept surface still on the skin (the caller lifts it), and per output vertex the unit interpolated normal, which the caller lifts along. `field` is one value per skin vertex, `positions` and `normals` are the posed skin's vertex arrays, and every kept normal must be nonzero: the lift is undefined along a zero normal. A skin with no kept triangle gives empty arrays. Crossings are never moved away from source corners to enlarge a sliver; numerical and final Float32 mesh admission remain downstream.
 *
 * @evidence contracts/common.md#principled-implementation Piecewise-linear edge crossings share a lower-index edge identity, exact-zero corners share native identity, and clipped triangle winding follows the actual source surface.
 * @evidence contracts/common.md#clear-and-simple-design One emitted-vertex map owns corner/crossing reuse while a three-corner branch emits the kept triangle or clipped quadrilateral in source order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero or nonfinite interpolated normal refuses before normalization; source coverage and complete indexed arrays remain caller premises, and slivers are retained for actual numerical/export admission rather than moved or hidden.
 * @evidence contracts/common.md#meaningful-documentation The comment explains positive-field selection, exact-zero identity, winding, metre positions, returned unit normals and downstream Float32 admission.
 * @evidence contracts/performance.md#efficient-algorithms Each triangle performs bounded corner work and map lookups; vertex emission is amortized per unique kept corner or crossing, so time and temporary/output storage scale with source triangles and emitted vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared edge/corner map prevents neighbouring triangles from recomputing or independently rounding the same contour vertex.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only owned cut positions, unit normals and indices escape; the identity map and small per-triangle arrays expire after synchronous return, with no external handle or cache.
 */
export function cutHumanBodyUnderwearSurface(
  props: IHumanBodyUnderwearSurfaceCutInput,
): IHumanBodyUnderwearSurfaceCutResult {
  const { positions, normals, field }: typeof props = props;
  const points: number[] = [];
  const lifted: number[] = [];
  const emitted: Map<string, number> = new Map<string, number>();
  const emit: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number => {
    // a kept corner (b === a), or the crossing on the edge a-b read from its
    // lower index so both triangles of the edge share it
    let [low, high]: number[] = a <= b ? [a, b] : [b, a];
    // A source corner on the contour has one identity across all its edges.
    if (field[low] === 0) high = low;
    else if (field[high] === 0) low = high;
    const key: string = low + "/" + high;
    let id: number | undefined = emitted.get(key);
    if (id !== undefined) return id;
    const t: number =
      low === high ? 0 : field[low] / (field[low] - field[high]);
    const normal: number[] = [0, 1, 2].map(
      (k: number): number =>
        normals[low * 3 + k] +
        t * (normals[high * 3 + k] - normals[low * 3 + k]),
    );
    const norm: number = Math.hypot(normal[0], normal[1], normal[2]);
    if (!(norm > 0) || !Number.isFinite(norm))
      throw new Error(
        "Underwear cutting needs each kept interpolated normal to be finite and nonzero.",
      );
    lifted.push(...normal.map((value: number): number => value / norm));
    for (let k: number = 0; k < 3; k++)
      points.push(
        positions[low * 3 + k] +
          t * (positions[high * 3 + k] - positions[low * 3 + k]),
      );
    id = points.length / 3 - 1;
    emitted.set(key, id);
    return id;
  };
  const indices: number[] = [];
  for (let i: number = 0; i < props.indices.length; i += 3) {
    const corners: number[] = [0, 1, 2].map(
      (k: number): number => props.indices[i + k],
    );
    const inside: boolean[] = corners.map((v: number): boolean => field[v] > 0);
    const kept: number = inside.filter(Boolean).length;
    if (kept === 0) continue;
    if (kept === 3) {
      indices.push(...corners.map((v: number): number => emit(v, v)));
      continue;
    }
    // rotate the winding so the lone corner (inside with one kept, the
    // outside one with two) comes first
    const lone: number = inside.findIndex(
      (flag: boolean): boolean => flag === (kept === 1),
    );
    const [a, b, c]: number[] = [0, 1, 2].map(
      (k: number): number => corners[(lone + k) % 3],
    );
    if (kept === 1) indices.push(emit(a, a), emit(a, b), emit(a, c));
    else {
      const ab: number = emit(a, b);
      const ca: number = emit(c, a);
      indices.push(ab, emit(b, b), emit(c, c));
      if (ab !== ca) indices.push(ab, emit(c, c), ca);
    }
  }
  return { points, normals: lifted, indices };
}
