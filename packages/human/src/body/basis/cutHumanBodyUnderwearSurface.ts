import type { IHumanBodyUnderwearSurfaceCutInput } from "./IHumanBodyUnderwearSurfaceCutInput";
import type { IHumanBodyUnderwearSurfaceCutResult } from "./IHumanBodyUnderwearSurfaceCutResult";

/**
 * Cut the triangles of a skin surface where a coverage field is positive.
 *
 * A triangle with all three corners inside is kept; one with one or two is
 * clipped at the piecewise-linear zero of the field along its edges. An
 * interior crossing is read from the edge's lower index, so both triangles
 * share it. A crossing at an exact-zero endpoint instead shares that source
 * corner with every incident edge. A triangle with no positive corner is
 * dropped, as is the repeated-corner triangle when a clipped quadrilateral
 * reduces to a triangle at that endpoint. The winding is kept.
 *
 * The result is the kept surface still on the skin (the caller lifts it), and
 * per output vertex the unit interpolated normal, which the caller lifts
 * along. `field` is one value per skin vertex, `positions` and `normals` are
 * the posed skin's vertex arrays, and every kept normal must be nonzero: the
 * lift is undefined along a zero normal. A skin with no kept triangle gives
 * empty arrays. Crossings are never moved away from source corners to enlarge
 * a sliver; numerical and final Float32 mesh admission remain downstream.
 */
export function cutHumanBodyUnderwearSurface(
  props: IHumanBodyUnderwearSurfaceCutInput,
): IHumanBodyUnderwearSurfaceCutResult {
  const { positions, normals, field } = props;
  const points: number[] = [];
  const lifted: number[] = [];
  const emitted = new Map<string, number>();
  const emit = (a: number, b: number): number => {
    // a kept corner (b === a), or the crossing on the edge a-b read from its
    // lower index so both triangles of the edge share it
    let [low, high] = a <= b ? [a, b] : [b, a];
    // A source corner on the contour has one identity across all its edges.
    if (field[low] === 0) high = low;
    else if (field[high] === 0) low = high;
    const key = low + "/" + high;
    let id = emitted.get(key);
    if (id !== undefined) return id;
    const t =
      low === high
        ? 0
        : field[low] / (field[low] - field[high]);
    const normal = [0, 1, 2].map(
      (k) =>
        normals[low * 3 + k] +
        t * (normals[high * 3 + k] - normals[low * 3 + k]),
    );
    const norm = Math.hypot(normal[0], normal[1], normal[2]);
    lifted.push(...normal.map((value) => value / norm));
    for (let k = 0; k < 3; k++)
      points.push(
        positions[low * 3 + k] +
          t * (positions[high * 3 + k] - positions[low * 3 + k]),
      );
    id = points.length / 3 - 1;
    emitted.set(key, id);
    return id;
  };
  const indices: number[] = [];
  for (let i = 0; i < props.indices.length; i += 3) {
    const corners = [0, 1, 2].map((k) => props.indices[i + k]);
    const inside = corners.map((v) => field[v] > 0);
    const kept = inside.filter(Boolean).length;
    if (kept === 0) continue;
    if (kept === 3) {
      indices.push(...corners.map((v) => emit(v, v)));
      continue;
    }
    // rotate the winding so the lone corner (inside with one kept, the
    // outside one with two) comes first
    const lone = inside.findIndex((flag) => flag === (kept === 1));
    const [a, b, c] = [0, 1, 2].map((k) => corners[(lone + k) % 3]);
    if (kept === 1) indices.push(emit(a, a), emit(a, b), emit(a, c));
    else {
      const ab = emit(a, b);
      const ca = emit(c, a);
      indices.push(ab, emit(b, b), emit(c, c));
      if (ab !== ca) indices.push(ab, emit(c, c), ca);
    }
  }
  return { points, normals: lifted, indices };
}
