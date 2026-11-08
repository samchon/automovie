/**
 * The two closed vertex sequences a trimmed face meets its trim along, joined
 * by one band of triangles: the edge of a face's kept grid cells nearest a
 * trim loop, and the loop's own vertices (the rail points the blend shares).
 *
 * Callers provide compatible aligned cyclic parameters, usually normalized arclength from the mesh's boundary readers. The zipper orients/rotates each sequence and greedily advances one boundary by comparing the two candidate parameter gaps. With valid disjoint boundary sequences this consumes every boundary edge once and adds no vertices. Simple individual cycles alone do not prove the resulting world triangles are noncrossing, nondegenerate or globally optimal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the parameter and the merge rule.
 * @evidence contracts/development/design.md#principled-representation Represents The two closed vertex sequences a trimmed face meets its trim along, joined by one band of triangles: the edge of a face's kept grid cells nearest a trim loop, and the loop's own vertices (the rail points the blend shares): companion namespace of 3 members (`ISequence`, `band`, `increasing`); units and frames named in its text: world, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidZip` in packages/engine/src/geometry/construction/AutoMovieSolidZip.ts; its surface is the 3 members listed and the text shows 3 other files naming it, mostly packages/engine (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieSolidZip {
  /**
   * Matching vertex and cyclic-parameter arrays in their boundary order.
   *
   * @evidence contracts/development/design.md#principled-representation Vertex labels and a one-turn scalar correspondence describe one boundary for monotone zipper traversal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two parallel arrays preserve mesh identity without copying world positions into this operator.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not enforce equal lengths, finite monotone parameters, distinct vertices or compatible geometry with another boundary.
   * @evidence contracts/development/common.md#meaningful-documentation Names vertex/parameter correspondence and the parameter's 2pi periodic convention.
   */
  export interface ISequence {
    /** Vertex indices of the mesh. */
    vertices: number[];

    /** Cyclic parameter with period 2pi, any branch; mesh callers commonly use normalized arclength. */
    angles: number[];
  }

  /**
   * The band of triangles between two closed sequences.
   *
   * @param a One sequence, at least three vertices.
   * @param b The other, at least three vertices.
   * @returns Triangles as index triples, all of one turning sense in the
   *   parameter plane; the caller turns them outward.
   *
   * @evidence contracts/development/implementation.md#principled-implementation After orienting both sequences, advances one of two boundary indices per triangle using the smaller candidate parameter-gap criterion, producing a combinatorial strip between compatible cycles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One linear two-index walk owns triangle connectivity; the mesh caller owns geometric correspondence and outward orientation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not inspect world distances, test intersections/degeneracy or prove optimal triangulation; valid aligned disjoint sequences and matching array lengths are caller premises.
   * @evidence contracts/development/common.md#meaningful-documentation Gives minimum boundary size, index-only output and the caller's orientation/geometric responsibility.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N+M) orientation/traversal and exactly N+M triangle triples for valid N/M boundaries, with O(N+M) reordered scratch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses already supplied cyclic parameters and vertex indices instead of recomputing arclength or evaluating geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reordered arrays are call-local; only the fresh triangle-index triples escape, retaining no input arrays or world geometry.
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
    const ax = (k: number): number =>
      x.angles[k % n]! + Math.floor(k / n) * TWO_PI;
    const ay = (k: number): number =>
      y.angles[k % m]! + Math.floor(k / m) * TWO_PI;
    while (i < n || j < m) {
      const advanceX: boolean =
        j >= m || (i < n && ax(i + 1) - ay(j) <= ay(j + 1) - ax(i));
      if (advanceX) {
        out.push([
          x.vertices[i % n]!,
          x.vertices[(i + 1) % n]!,
          y.vertices[j % m]!,
        ]);
        i++;
      } else {
        out.push([
          x.vertices[i % n]!,
          y.vertices[(j + 1) % m]!,
          y.vertices[j % m]!,
        ]);
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Infers turn from summed wrapped increments, chooses the least reduced start and unwraps successive parameters in that traversal order; valid one-turn correspondence is assumed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A reversal/start index table drives one copying pass without sorting vertex geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not validate length agreement, nonzero winding, duplicate parameters or finite input; zero accumulated turn uses the existing forward tie and positive remainders can be zero.
   * @evidence contracts/development/common.md#meaningful-documentation States orientation/start normalization, one-turn intent and returned-copy ownership rather than an independent admission guarantee.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three linear passes and O(N) order/output storage avoid a comparison sort.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same order table is used for both vertex and parameter copying, preserving their pairing.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns new vertex/angle arrays and releases its local order table; the supplied sequence is not mutated or retained.
   */
  export function increasing(s: ISequence): ISequence {
    const n: number = s.vertices.length;

    // The turning sense from the summed wrapped steps.
    let turn: number = 0;
    for (let k: number = 0; k < n; k++)
      turn += wrap(s.angles[(k + 1) % n]! - s.angles[k]!);
    const order: number[] = Array.from(
      { length: n },
      (_: unknown, k: number): number => (turn >= 0 ? k : n - 1 - k),
    );

    // Start at the least parameter reduced to one turn.
    let start: number = 0;
    for (let k: number = 1; k < n; k++)
      if (reduce(s.angles[order[k]!]!) < reduce(s.angles[order[start]!]!))
        start = k;
    const vertices: number[] = [];
    const angles: number[] = [];
    let previous: number = reduce(s.angles[order[start]!]!);
    for (let k: number = 0; k < n; k++) {
      const at: number = order[(start + k) % n]!;
      const value: number =
        k === 0 ? previous : previous + positive(s.angles[at]! - previous);
      vertices.push(s.vertices[at]!);
      angles.push(value);
      previous = value;
    }
    return { vertices, angles };
  }
}

/** A whole turn. */
const TWO_PI: number = 2 * Math.PI;

/** An angle step reduced to `[-pi, pi)` under ordinary representable turn arithmetic. */
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
