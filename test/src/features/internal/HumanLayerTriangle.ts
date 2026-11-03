/**
 * Distance from a point to a triangle of a flat position buffer.
 *
 * The routine allocates nothing: the closest point and the feature it lies on
 * are written to a caller's buffer, since a nearest query calls it for every
 * candidate triangle of every ring point.
 */
export namespace HumanLayerTriangle {
  /** Feature of a triangle a closest point lies on: a vertex (0 to 2). */
  export const VERTEX_A: number = 0;

  /** Feature: edge from the first to the second vertex. */
  export const EDGE_AB: number = 3;

  /** Feature: edge from the second to the third vertex. */
  export const EDGE_BC: number = 4;

  /** Feature: edge from the first to the third vertex. */
  export const EDGE_AC: number = 5;

  /** Feature: the face. */
  export const FACE: number = 6;

  /**
   * Squared distance from a point to a triangle given by flat offsets into P
   * (Ericson, Real-Time Collision Detection, 2005, section 5.1.5).
   *
   * @param p The point, mm.
   * @param P Flat positions, mm.
   * @param ia Offset of the first vertex in `P`.
   * @param ib Offset of the second vertex.
   * @param ic Offset of the third vertex.
   * @param out Receives the closest point (0 to 2) and its feature (3): 0 to 2 a vertex, then `EDGE_AB`, `EDGE_BC`, `EDGE_AC` or `FACE`.
   */
  export function closest(p: [number, number, number], P: Float64Array, ia: number, ib: number, ic: number, out: Float64Array): number {
    const ax: number = P[ia]!;
    const ay: number = P[ia + 1]!;
    const az: number = P[ia + 2]!;
    const abx: number = P[ib]! - ax;
    const aby: number = P[ib + 1]! - ay;
    const abz: number = P[ib + 2]! - az;
    const acx: number = P[ic]! - ax;
    const acy: number = P[ic + 1]! - ay;
    const acz: number = P[ic + 2]! - az;
    const apx: number = p[0] - ax;
    const apy: number = p[1] - ay;
    const apz: number = p[2] - az;
    const d1: number = abx * apx + aby * apy + abz * apz;
    const d2: number = acx * apx + acy * apy + acz * apz;

    if (d1 <= 0 && d2 <= 0) return store(p, out, ax, ay, az, VERTEX_A);

    const bpx: number = apx - abx;
    const bpy: number = apy - aby;
    const bpz: number = apz - abz;
    const d3: number = abx * bpx + aby * bpy + abz * bpz;
    const d4: number = acx * bpx + acy * bpy + acz * bpz;

    if (d3 >= 0 && d4 <= d3) return store(p, out, ax + abx, ay + aby, az + abz, 1);

    const vc: number = d1 * d4 - d3 * d2;

    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const s: number = d1 / (d1 - d3);

      return store(p, out, ax + s * abx, ay + s * aby, az + s * abz, EDGE_AB);
    }

    const cpx: number = apx - acx;
    const cpy: number = apy - acy;
    const cpz: number = apz - acz;
    const d5: number = abx * cpx + aby * cpy + abz * cpz;
    const d6: number = acx * cpx + acy * cpy + acz * cpz;

    if (d6 >= 0 && d5 <= d6) return store(p, out, ax + acx, ay + acy, az + acz, 2);

    const vb: number = d5 * d2 - d1 * d6;

    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const s: number = d2 / (d2 - d6);

      return store(p, out, ax + s * acx, ay + s * acy, az + s * acz, EDGE_AC);
    }

    const va: number = d3 * d6 - d5 * d4;

    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const s: number = (d4 - d3) / (d4 - d3 + (d5 - d6));

      return store(p, out, ax + abx + s * (acx - abx), ay + aby + s * (acy - aby), az + abz + s * (acz - abz), EDGE_BC);
    }

    const denom: number = 1 / (va + vb + vc);
    const v: number = vb * denom;
    const w: number = vc * denom;

    return store(p, out, ax + abx * v + acx * w, ay + aby * v + acy * w, az + abz * v + acz * w, FACE);
  }
}

/** Write a closest point and its feature to a buffer, returning its squared distance from p. */
function store(p: [number, number, number], out: Float64Array, x: number, y: number, z: number, feature: number): number {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = feature;

  return (p[0] - x) ** 2 + (p[1] - y) ** 2 + (p[2] - z) ** 2;
}
