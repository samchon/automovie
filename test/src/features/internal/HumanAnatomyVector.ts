/**
 * Vector arithmetic of the Human anatomy observers, on `[x, y, z]` tuples in
 * millimetres (frame: forward +X, up +Y, the body's left +Z). Reached through
 * `HumanAnatomy`, which re-exports every function by the same name.
 */
export namespace HumanAnatomyVector {
  /** A point or a direction. */
  export type V3 = [number, number, number];

  /** Difference. */
  export function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Sum. */
  export function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Scaled vector. */
  export function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product. */
  export function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** Distance. */
  export function dist(a: V3, b: V3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /** Unit vector. */
  export function unit(a: V3): V3 {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** Point along a line. */
  export function lerp(a: V3, b: V3, s: number): V3 {
    return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
  }

  /** Two unit vectors completing a normal to an orthonormal frame. */
  export function basis(n: V3): [V3, V3] {
    const helper: V3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u: V3 = unit(cross(n, helper));
    return [u, cross(n, u)];
  }

  /** The vector's part perpendicular to a unit axis. */
  export function reject(a: V3, axis: V3): V3 {
    return sub(a, scale(axis, dot(a, axis)));
  }

  /** Perimeter of the convex hull of planar points (Andrew's monotone chain). */
  export function hull(points: [number, number][]): number {
    const p: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return 0;
    const cross2: (o: [number, number], a: [number, number], b: [number, number]) => number = (o: [number, number], a: [number, number], b: [number, number]): number =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower: [number, number][] = [];
    for (const q of p) {
      while (lower.length >= 2 && cross2(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
      lower.push(q);
    }
    const upper: [number, number][] = [];
    for (let i: number = p.length - 1; i >= 0; i--) {
      const q: [number, number] = p[i]!;
      while (upper.length >= 2 && cross2(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
      upper.push(q);
    }
    const ring: [number, number][] = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    let sum: number = 0;
    for (let i: number = 0; i < ring.length; i++) {
      const a: [number, number] = ring[i]!;
      const b: [number, number] = ring[(i + 1) % ring.length]!;
      sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return sum;
  }

  /**
   * Distance to a closed triangle, including a triangle collapsed to a segment
   * or point. An interior plane projection gives the perpendicular distance;
   * otherwise the closest point lies on one of the three closed edges.
   *
   * @evidence contracts/common.md#principled-implementation Minimizes Euclidean distance over the triangle's face and boundary. Oriented edge half-planes admit the plane projection without a cancellation-prone Gram determinant. A zero cross product uses closed-segment minima, and a zero-length segment uses its point; no area epsilon flattens a thin face. Inputs are finite coordinates in ordinary body millimetres, not an exact-arithmetic predicate for unrepresentable coordinate differences or products.
   * @evidence contracts/common.md#clear-and-simple-design One face decision and one three-edge boundary pass cover ordinary, thin, collinear and repeated-vertex triangles without separate fixture-dependent paths.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No triangle is dropped and no NaN is replaced with a guessed distance. Degeneracy follows zero geometric extent rather than a query horizon or fitted tolerance.
   * @evidence contracts/common.md#meaningful-documentation States the closed-set interpretation, units, numerical premise and why face and edge minima suffice.
   * @evidence contracts/performance.md#efficient-algorithms Constant work and scratch per triangle: one scaled normal, at most three side tests and three segment projections. It avoids the fourth-order dot-product determinants that lose thin faces.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure leaf calculation receives one point and three vertices and coordinates no repeated requests; the surface index owns hierarchy reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources All vectors and scalars are call-local; the function retains no geometry, query or external resource.
   */
  export function triangleDistance(p: V3, a: V3, b: V3, c: V3): number {
    const ab: V3 = sub(b, a);
    const ac: V3 = sub(c, a);
    const extent: number = Math.max(Math.abs(ab[0]), Math.abs(ab[1]), Math.abs(ab[2]), Math.abs(ac[0]), Math.abs(ac[1]), Math.abs(ac[2]));
    if (extent === 0) return dist(p, a);
    const normal: V3 = cross([ab[0] / extent, ab[1] / extent, ab[2] / extent], [ac[0] / extent, ac[1] / extent, ac[2] / extent]);
    const length: number = Math.hypot(...normal);
    const vertices: [V3, V3, V3] = [a, b, c];
    if (length > 0) {
      const n: V3 = [normal[0] / length, normal[1] / length, normal[2] / length];
      let inside: boolean = true;

      // A component normal to the plane contributes zero to each oriented
      // side test, so the point need not be projected and reconstructed.
      for (let edge: number = 0; edge < 3; edge++) {
        const start: V3 = vertices[edge]!;
        if (dot(cross(sub(vertices[(edge + 1) % 3]!, start), sub(p, start)), n) < 0) inside = false;
      }
      if (inside) return Math.abs(dot(sub(p, a), n));
    }
    let nearest: number = Infinity;
    for (let edge: number = 0; edge < 3; edge++) {
      const start: V3 = vertices[edge]!;
      const direction: V3 = sub(vertices[(edge + 1) % 3]!, start);
      const delta: V3 = sub(p, start);
      const edgeLength: number = Math.hypot(...direction);
      if (edgeLength === 0) nearest = Math.min(nearest, Math.hypot(...delta));
      else {
        const unitEdge: V3 = [direction[0] / edgeLength, direction[1] / edgeLength, direction[2] / edgeLength];
        const along: number = Math.max(0, Math.min(edgeLength, dot(delta, unitEdge)));
        nearest = Math.min(nearest, Math.hypot(delta[0] - along * unitEdge[0], delta[1] - along * unitEdge[1], delta[2] - along * unitEdge[2]));
      }
    }
    return nearest;
  }

  /** Rotate a vector by a unit quaternion `[x, y, z, w]`. */
  export function rotate(q: number[], v: V3): V3 {
    const x: number = q[0]!;
    const y: number = q[1]!;
    const z: number = q[2]!;
    const w: number = q[3]!;
    const t: V3 = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])];
    return [v[0] + w * t[0] + (y * t[2] - z * t[1]), v[1] + w * t[1] + (z * t[0] - x * t[2]), v[2] + w * t[2] + (x * t[1] - y * t[0])];
  }
}
