/**
 * Cut the triangles of a skin surface where a coverage field is positive.
 *
 * A triangle with all three corners inside is kept; one with one or two is
 * clipped at the zero of the field along its edges (linear, the crossing held
 * at least 5% of an edge from either corner so no clipped triangle
 * degenerates), and a crossing is read from the edge's lower index, so both
 * triangles of an edge share it and the cut is as manifold as the skin. A
 * triangle with no corner inside is dropped. The winding is kept.
 *
 * The result is the kept surface still on the skin (the caller lifts it), and
 * per output vertex the unit interpolated normal, which the caller lifts
 * along. `field` is one value per skin vertex, `positions` and `normals` are
 * the posed skin's vertex arrays, and every kept normal must be nonzero: the
 * lift is undefined along a zero normal. A skin with no kept triangle gives
 * empty arrays.
 *
 * @evidence contracts/common.md#principled-implementation The zero of a piecewise-linear field on a triangle lies on its edges at the linear interpolation, so clipping along the edges is exact for the linear pieces of the field and approximate at its kinks; sharing each crossing by the edge's lower index makes two triangles of an edge agree on it, and the 5% clamp keeps every clipped triangle non-degenerate at the cost of moving a crossing by at most 5% of an edge.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: clip a surface by a per-vertex field. The field, the lift and the material belong to their own files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cut reads the field and the mesh only; no vertex, landmark or body is named.
 * @evidence contracts/common.md#meaningful-documentation The comment states the clipping rule, its clamp, the shared crossing, the winding and what the caller supplies and receives.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function clips one surface and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The kept triangles follow from the skin's own triangulation and the field; nothing is added per author feature.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function.
 */
export function cutHumanBodyUnderwearSurface(props: {
  indices: readonly number[];
  positions: readonly number[];
  normals: readonly number[];
  field: ArrayLike<number>;
}): { points: number[]; normals: number[]; indices: number[] } {
  const { positions, normals, field } = props;
  const points: number[] = [];
  const lifted: number[] = [];
  const emitted = new Map<string, number>();
  const emit = (a: number, b: number): number => {
    // a kept corner (b === a), or the crossing on the edge a-b read from its
    // lower index so both triangles of the edge share it
    const [low, high] = a <= b ? [a, b] : [b, a];
    const key = low + "/" + high;
    let id = emitted.get(key);
    if (id !== undefined) return id;
    const t =
      low === high
        ? 0
        : Math.min(
            0.95,
            Math.max(0.05, field[low] / (field[low] - field[high])),
          );
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
      indices.push(ab, emit(b, b), emit(c, c), ab, emit(c, c), ca);
    }
  }
  return { points, normals: lifted, indices };
}
