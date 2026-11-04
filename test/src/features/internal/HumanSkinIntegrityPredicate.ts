import { HumanSkinIntegrityVector as Vec } from "./HumanSkinIntegrityVector";

/**
 * Exact-enough geometric predicates on triangles: the sign of an orientation,
 * and from it whether two triangles cross.
 *
 * Every orientation is decided in floating point with Shewchuk's error bound
 * (Shewchuk 1997, see `packages/human/docs/sources`), and an outcome within
 * the bound counts as contact, not crossing. Where edges meet edges exactly,
 * so that no orientation is strict, the overlap of the two triangles along
 * their planes' common line decides, and it must exceed a billionth of the
 * coordinates: far above double rounding, far below any modelled feature.
 */
export namespace HumanSkinIntegrityPredicate {
  /** Unit roundoff of a double. */
  export const EPSILON: number = 2 ** -53;

  /** Shewchuk's error bound on the 3D orientation determinant, as a multiple of its permanent. */
  const ORIENT3: number = (7 + 56 * EPSILON) * EPSILON;

  /** Shewchuk's error bound on the 2D orientation determinant. */
  const ORIENT2: number = (3 + 16 * EPSILON) * EPSILON;

  /** The overlap along the planes' common line below which two triangles only touch, as a share of the coordinates. */
  const OVERLAP: number = 1e-9;

  /**
   * Sign of the orientation of `d` against the plane of `a, b, c`: 1 above,
   * -1 below, and 0 when the determinant lies within its error bound.
   */
  export function orient3(P: Float64Array, a: number, b: number, c: number, d: number): number {
    // Differences to the fourth point, as Shewchuk's filter forms them.
    const dx: number = P[3 * d]!;
    const dy: number = P[3 * d + 1]!;
    const dz: number = P[3 * d + 2]!;
    const adx: number = P[3 * a]! - dx;
    const ady: number = P[3 * a + 1]! - dy;
    const adz: number = P[3 * a + 2]! - dz;
    const bdx: number = P[3 * b]! - dx;
    const bdy: number = P[3 * b + 1]! - dy;
    const bdz: number = P[3 * b + 2]! - dz;
    const cdx: number = P[3 * c]! - dx;
    const cdy: number = P[3 * c + 1]! - dy;
    const cdz: number = P[3 * c + 2]! - dz;

    // The six products the determinant and its permanent share.
    const bdxcdy: number = bdx * cdy;
    const cdxbdy: number = cdx * bdy;
    const cdxady: number = cdx * ady;
    const adxcdy: number = adx * cdy;
    const adxbdy: number = adx * bdy;
    const bdxady: number = bdx * ady;

    // The determinant is trusted only beyond the rounding error its permanent bounds.
    const det: number = adz * (bdxcdy - cdxbdy) + bdz * (cdxady - adxcdy) + cdz * (adxbdy - bdxady);
    const permanent: number =
      (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz) +
      (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz) +
      (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz);
    const bound: number = ORIENT3 * permanent;

    return det > bound ? 1 : det < -bound ? -1 : 0;
  }

  /** Sign of the 2D orientation of `a, b, c`, or 0 within its error bound. */
  export function orient2(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
    const left: number = (ax - cx) * (by - cy);
    const right: number = (ay - cy) * (bx - cx);
    const det: number = left - right;
    const bound: number = ORIENT2 * (Math.abs(left) + Math.abs(right));

    return det > bound ? 1 : det < -bound ? -1 : 0;
  }

  /** The number of corners two triangles share. */
  export function shared(I: Uint32Array, t: number, u: number): number {
    let count: number = 0;

    for (let i: number = 0; i < 3; i++) for (let j: number = 0; j < 3; j++) if (I[3 * t + i] === I[3 * u + j]) count++;

    return count;
  }

  /**
   * Whether two triangles cross: some edge of one passes strictly through the
   * other's interior; or, edges meeting edges exactly, their chords on the
   * planes' common line overlap; or, both lying in one plane within rounding,
   * their interiors overlap. Touching at a shared vertex, along an edge, or
   * within the predicates' error bound is contact, not crossing.
   */
  export function crosses(P: Float64Array, I: Uint32Array, t: number, u: number): boolean {
    const a: number = I[3 * t]!;
    const b: number = I[3 * t + 1]!;
    const c: number = I[3 * t + 2]!;
    const d: number = I[3 * u]!;
    const e: number = I[3 * u + 1]!;
    const f: number = I[3 * u + 2]!;

    // Corners of the second triangle all strictly on one side of the first's plane cannot cross it.
    const sd: number = orient3(P, a, b, c, d);
    const se: number = orient3(P, a, b, c, e);
    const sf: number = orient3(P, a, b, c, f);

    if (sd !== 0 && sd === se && se === sf) return false;

    // The same from the second triangle's plane.
    const sa: number = orient3(P, d, e, f, a);
    const sb: number = orient3(P, d, e, f, b);
    const sc: number = orient3(P, d, e, f, c);

    if (sa !== 0 && sa === sb && sb === sc) return false;

    // Six corners in one plane: no edge pierces anything, so the plane decides.
    if (sd === 0 && se === 0 && sf === 0 && sa === 0 && sb === 0 && sc === 0) return coplanar(P, a, b, c, d, e, f);

    return (
      pierces(P, d, e, sd, se, a, b, c) ||
      pierces(P, e, f, se, sf, a, b, c) ||
      pierces(P, f, d, sf, sd, a, b, c) ||
      pierces(P, a, b, sa, sb, d, e, f) ||
      pierces(P, b, c, sb, sc, d, e, f) ||
      pierces(P, c, a, sc, sa, d, e, f) ||
      chordsOverlap(P, [a, b, c], [sa, sb, sc], [d, e, f], [sd, se, sf])
    );
  }

  /** Whether segment `p q`, its ends strictly either side of the plane, passes through the interior of `a b c`. */
  function pierces(P: Float64Array, p: number, q: number, sp: number, sq: number, a: number, b: number, c: number): boolean {
    if (sp * sq >= 0) return false;

    // The segment passes inside the triangle when it keeps one side of all three edges.
    const s: number = orient3(P, p, q, a, b);

    if (s === 0) return false;

    return orient3(P, p, q, b, c) === s && orient3(P, p, q, c, a) === s;
  }

  /**
   * Whether two triangles, each with corners strictly either side of the
   * other's plane, overlap along the line their planes share by more than a
   * billionth of their coordinates. It decides the degenerate crossings no
   * edge pierces strictly, where an edge of one passes exactly through an edge
   * or a corner of the other, as a mirror-symmetric skin can place them.
   */
  function chordsOverlap(P: Float64Array, A: number[], sA: number[], B: number[], sB: number[]): boolean {
    if (!straddles(sA) || !straddles(sB)) return false;

    // The planes' common line, where each triangle cuts a chord.
    const nA: Vec.V3 = Vec.normal(P, A[0]!, A[1]!, A[2]!);
    const nB: Vec.V3 = Vec.normal(P, B[0]!, B[1]!, B[2]!);
    const line: Vec.V3 = Vec.cross(nA, nB);
    const length: number = Math.hypot(...line);

    if (length === 0) return false;

    const direction: Vec.V3 = [line[0] / length, line[1] / length, line[2] / length];

    // Each chord as an interval along the line; they overlap when the triangles cross.
    const [a0, a1]: [number, number] = chord(P, A, sA, nB, B[0]!, direction);
    const [b0, b1]: [number, number] = chord(P, B, sB, nA, A[0]!, direction);
    let scale: number = 0;

    for (const v of [...A, ...B]) for (let k: number = 0; k < 3; k++) scale = Math.max(scale, Math.abs(P[3 * v + k]!));

    return Math.min(a1, b1) - Math.max(a0, b0) > OVERLAP * (1 + scale);
  }

  /** Whether a triangle's corner signs include one strictly above and one strictly below a plane. */
  function straddles(s: number[]): boolean {
    return s.includes(1) && s.includes(-1);
  }

  /** The interval along `direction` where a triangle meets the plane of normal `n` through `origin`. */
  function chord(P: Float64Array, T: number[], s: number[], n: Vec.V3, origin: number, direction: Vec.V3): [number, number] {
    const o: Vec.V3 = Vec.at(P, origin);
    const h: number[] = T.map((v: number): number => Vec.dot(n, Vec.sub(Vec.at(P, v), o)));
    const along: number[] = [];

    for (let k: number = 0; k < 3; k++) {
      // A corner on the plane is an end of the chord.
      if (s[k] === 0) along.push(Vec.dot(direction, Vec.at(P, T[k]!)));

      // An edge with corners either side crosses the plane at one point.
      const j: number = (k + 1) % 3;

      if (s[k]! * s[j]! < 0) {
        const t: number = h[k]! / (h[k]! - h[j]!);
        const p: Vec.V3 = Vec.at(P, T[k]!);
        const q: Vec.V3 = Vec.at(P, T[j]!);

        along.push(Vec.dot(direction, [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]), p[2] + t * (q[2] - p[2])]));
      }
    }

    return [Math.min(...along), Math.max(...along)];
  }

  /** Whether two triangles in one plane overlap in their interiors, read in the coordinate plane the normal is most along. */
  function coplanar(P: Float64Array, a: number, b: number, c: number, d: number, e: number, f: number): boolean {
    // Drop the axis the larger normal points along; the projection keeps its area.
    const n1: Vec.V3 = Vec.normal(P, a, b, c);
    const n2: Vec.V3 = Vec.normal(P, d, e, f);
    const n: Vec.V3 = Math.hypot(...n1) >= Math.hypot(...n2) ? n1 : n2;
    const drop: number =
      Math.abs(n[0]) >= Math.abs(n[1]) && Math.abs(n[0]) >= Math.abs(n[2]) ? 0 : Math.abs(n[1]) >= Math.abs(n[2]) ? 1 : 2;
    const i: number = drop === 0 ? 1 : 0;
    const j: number = drop === 2 ? 1 : 2;
    const A: [number, number][] = [a, b, c].map((v: number): [number, number] => [P[3 * v + i]!, P[3 * v + j]!]);
    const B: [number, number][] = [d, e, f].map((v: number): [number, number] => [P[3 * v + i]!, P[3 * v + j]!]);

    // Two edges cross strictly when each has the other's ends on opposite sides.
    for (let x: number = 0; x < 3; x++)
      for (let y: number = 0; y < 3; y++) {
        const p: [number, number] = A[x]!;
        const q: [number, number] = A[(x + 1) % 3]!;
        const r: [number, number] = B[y]!;
        const s: [number, number] = B[(y + 1) % 3]!;

        if (
          orient2(p[0], p[1], q[0], q[1], r[0], r[1]) * orient2(p[0], p[1], q[0], q[1], s[0], s[1]) < 0 &&
          orient2(r[0], r[1], s[0], s[1], p[0], p[1]) * orient2(r[0], r[1], s[0], s[1], q[0], q[1]) < 0
        )
          return true;
      }

    // No edge crosses, so one triangle may still lie inside the other; a corner or the centre is inside it then.
    for (const p of [...B, centre(B)]) if (inside(A, p[0], p[1])) return true;

    for (const p of [...A, centre(A)]) if (inside(B, p[0], p[1])) return true;

    return false;
  }

  /** Whether a point lies strictly inside a triangle of the plane. */
  function inside(T: [number, number][], x: number, y: number): boolean {
    const s0: number = orient2(T[0]![0], T[0]![1], T[1]![0], T[1]![1], x, y);
    const s1: number = orient2(T[1]![0], T[1]![1], T[2]![0], T[2]![1], x, y);
    const s2: number = orient2(T[2]![0], T[2]![1], T[0]![0], T[0]![1], x, y);

    return s0 !== 0 && s0 === s1 && s1 === s2;
  }

  /** The centroid of a triangle of the plane. */
  function centre(T: [number, number][]): [number, number] {
    return [(T[0]![0] + T[1]![0] + T[2]![0]) / 3, (T[0]![1] + T[1]![1] + T[2]![1]) / 3];
  }
}
