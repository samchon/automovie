/**
 * The two closed vertex sequences a trimmed face meets its trim along, joined
 * by one band of triangles: the edge of a face's kept grid cells nearest a
 * trim loop, and the loop's own vertices (the rail points the blend shares).
 *
 * Both sequences are read by one monotone parameter, each its own
 * normalised arclength from aligned starts (`AutoMovieSolidMesh`), which
 * holds for any simple cycle a clip leaves. Each is turned
 * to increase and started at its least parameter, and the band is the merge
 * of the two by that parameter (the zipper of contour tiling, Fuchs, Kedem
 * and Uselton, Optimal surface reconstruction from planar contours, CACM
 * 20(10), 1977, with the greedy shortest-step rule): every edge of each
 * sequence is used by exactly one triangle of the band, so with the cells on
 * one side and the blend on the other each is shared by two triangles and
 * the seam is closed with no vertex but the two sequences'.
 *
 * @evidence contracts/common.md#principled-implementation Two vertex sequences are stitched by merging their arclength parameters, which never crosses itself on any simple pair of cycles.
 * @evidence contracts/common.md#clear-and-simple-design One zipper from two parameterised sequences to triangles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequences are aligned by their starts and turns, not by nearest-vertex matching.
 * @evidence contracts/common.md#meaningful-documentation States the parameter and the merge rule.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the two sequences' lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work The parameters are computed once by the caller.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the triangle list only.
 */
export namespace AutoMovieSolidZip {
  /** One sequence: vertex indices and their parameters, in the same order. */
  export interface ISequence {
    /** Vertex indices of the mesh. */
    vertices: number[];

    /** Each vertex's parameter, radians, any branch. */
    angles: number[];
  }

  /**
   * The band of triangles between two closed sequences.
   *
   * @param a One sequence, at least three vertices.
   * @param b The other, at least three vertices.
   * @returns Triangles as index triples, all of one turning sense in the
   *   parameter plane; the caller turns them outward.
   */
  export function band(a: ISequence, b: ISequence): [number, number, number][] {
    const x: ISequence = increasing(a);
    const y: ISequence = increasing(b);
    const n: number = x.vertices.length;
    const m: number = y.vertices.length;

    // Both from a common start: y begins at its first vertex past x's start.
    const out: [number, number, number][] = [];
    let i: number = 0;
    let j: number = 0;
    const ax = (k: number): number => x.angles[k % n]! + Math.floor(k / n) * TWO_PI;
    const ay = (k: number): number => y.angles[k % m]! + Math.floor(k / m) * TWO_PI;
    while (i < n || j < m) {
      const advanceX: boolean = j >= m || (i < n && ax(i + 1) - ay(j) <= ay(j + 1) - ax(i));
      if (advanceX) {
        out.push([x.vertices[i % n]!, x.vertices[(i + 1) % n]!, y.vertices[j % m]!]);
        i++;
      } else {
        out.push([x.vertices[i % n]!, y.vertices[(j + 1) % m]!, y.vertices[j % m]!]);
        j++;
      }
    }
    return out;
  }

  /**
   * A sequence reordered to increase in its parameter from its least value,
   * the parameters unwrapped onto one increasing turn from it.
   *
   * @param s The sequence, in either turning sense.
   * @returns The reordered copy.
   */
  export function increasing(s: ISequence): ISequence {
    const n: number = s.vertices.length;

    // The turning sense from the summed wrapped steps.
    let turn: number = 0;
    for (let k: number = 0; k < n; k++) turn += wrap(s.angles[(k + 1) % n]! - s.angles[k]!);
    const order: number[] = Array.from({ length: n }, (_: unknown, k: number): number => (turn >= 0 ? k : n - 1 - k));

    // Start at the least parameter reduced to one turn.
    let start: number = 0;
    for (let k: number = 1; k < n; k++)
      if (reduce(s.angles[order[k]!]!) < reduce(s.angles[order[start]!]!)) start = k;
    const vertices: number[] = [];
    const angles: number[] = [];
    let previous: number = reduce(s.angles[order[start]!]!);
    for (let k: number = 0; k < n; k++) {
      const at: number = order[(start + k) % n]!;
      const value: number = k === 0 ? previous : previous + positive(s.angles[at]! - previous);
      vertices.push(s.vertices[at]!);
      angles.push(value);
      previous = value;
    }
    return { vertices, angles };
  }
}

/** A whole turn. */
const TWO_PI: number = 2 * Math.PI;

/** An angle step reduced to `(-pi, pi]`. */
function wrap(t: number): number {
  return t - TWO_PI * Math.round(t / TWO_PI);
}

/** An angle reduced to `[0, 2 pi)`. */
function reduce(t: number): number {
  const r: number = t % TWO_PI;
  return r < 0 ? r + TWO_PI : r;
}

/** An angle step reduced to `[0, 2 pi)`. */
function positive(t: number): number {
  return reduce(t);
}
