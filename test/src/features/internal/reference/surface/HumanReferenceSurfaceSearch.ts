/**
 * Two numeric helpers of the triangle search: the exact closest point of a
 * triangle to a point, and the median partition that builds the hierarchy over
 * triangles. Both are exact; the hierarchy only orders and prunes the search.
 */
export namespace HumanReferenceSurfaceSearch {
  /**
   * Squared distance from a point to a triangle, and the nearest point, by the
   * seven Voronoi regions of Ericson, Real-Time Collision Detection, 5.1.5.
   *
   * @param px X of the point, mm.
   * @param py Y of the point, mm.
   * @param pz Z of the point, mm.
   * @param P Flat vertex positions, mm.
   * @param a Offset into `P` of the triangle's first vertex, three times its index.
   * @param b Offset into `P` of the second vertex.
   * @param c Offset into `P` of the third vertex.
   * @param q Receives the nearest point, mm.
   * @returns The squared distance, mm squared.
   */
  export function closest(
    px: number,
    py: number,
    pz: number,
    P: Float64Array,
    a: number,
    b: number,
    c: number,
    q: [number, number, number],
  ): number {
    const ax: number = P[a]!;
    const ay: number = P[a + 1]!;
    const az: number = P[a + 2]!;
    const abx: number = P[b]! - ax;
    const aby: number = P[b + 1]! - ay;
    const abz: number = P[b + 2]! - az;
    const acx: number = P[c]! - ax;
    const acy: number = P[c + 1]! - ay;
    const acz: number = P[c + 2]! - az;
    const apx: number = px - ax;
    const apy: number = py - ay;
    const apz: number = pz - az;
    const set: (x: number, y: number, z: number) => number = (x: number, y: number, z: number): number => {
      q[0] = x;
      q[1] = y;
      q[2] = z;

      return (px - x) ** 2 + (py - y) ** 2 + (pz - z) ** 2;
    };

    // The vertex region of the first corner.
    const d1: number = abx * apx + aby * apy + abz * apz;
    const d2: number = acx * apx + acy * apy + acz * apz;
    if (d1 <= 0 && d2 <= 0) return set(ax, ay, az);

    // The vertex region of the second corner.
    const bpx: number = px - P[b]!;
    const bpy: number = py - P[b + 1]!;
    const bpz: number = pz - P[b + 2]!;
    const d3: number = abx * bpx + aby * bpy + abz * bpz;
    const d4: number = acx * bpx + acy * bpy + acz * bpz;
    if (d3 >= 0 && d4 <= d3) return set(P[b]!, P[b + 1]!, P[b + 2]!);

    // The edge region between the first and second corners.
    const vc: number = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v: number = d1 / (d1 - d3);

      return set(ax + v * abx, ay + v * aby, az + v * abz);
    }

    // The vertex region of the third corner.
    const cpx: number = px - P[c]!;
    const cpy: number = py - P[c + 1]!;
    const cpz: number = pz - P[c + 2]!;
    const d5: number = abx * cpx + aby * cpy + abz * cpz;
    const d6: number = acx * cpx + acy * cpy + acz * cpz;
    if (d6 >= 0 && d5 <= d6) return set(P[c]!, P[c + 1]!, P[c + 2]!);

    // The edge region between the first and third corners.
    const vb: number = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w: number = d2 / (d2 - d6);

      return set(ax + w * acx, ay + w * acy, az + w * acz);
    }

    // The edge region between the second and third corners.
    const va: number = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const w: number = (d4 - d3) / (d4 - d3 + (d5 - d6));

      return set(
        P[b]! + w * (P[c]! - P[b]!),
        P[b + 1]! + w * (P[c + 1]! - P[b + 1]!),
        P[b + 2]! + w * (P[c + 2]! - P[b + 2]!),
      );
    }

    // Inside the face: barycentric coordinates from the three signed areas.
    const denom: number = 1 / (va + vb + vc);
    const v: number = vb * denom;
    const w: number = vc * denom;

    return set(ax + abx * v + acx * w, ay + aby * v + acy * w, az + abz * v + acz * w);
  }

  /**
   * Partially orders a segment of triangle indices so that the k-th holds the
   * median triangle centre on an axis, with the smaller centres before it and
   * the larger after (Hoare's selection).
   *
   * @param order Triangle indices, reordered in place.
   * @param centre Flat triangle centres, three per triangle.
   * @param axis Axis to order on: 0, 1 or 2.
   * @param s First position of the segment.
   * @param e Position after the last of the segment.
   * @param k Position that receives the median.
   */
  export function select(
    order: Int32Array,
    centre: Float64Array,
    axis: number,
    s: number,
    e: number,
    k: number,
  ): void {
    let l: number = s;
    let r: number = e - 1;

    while (r > l) {
      const pivot: number = centre[3 * order[(l + r) >> 1]! + axis]!;
      let i: number = l;
      let j: number = r;

      while (i <= j) {
        while (centre[3 * order[i]! + axis]! < pivot) i++;
        while (centre[3 * order[j]! + axis]! > pivot) j--;
        if (i <= j) {
          const swap: number = order[i]!;
          order[i] = order[j]!;
          order[j] = swap;
          i++;
          j--;
        }
      }

      if (k <= j) r = j;
      else if (k >= i) l = i;
      else break;
    }
  }
}
