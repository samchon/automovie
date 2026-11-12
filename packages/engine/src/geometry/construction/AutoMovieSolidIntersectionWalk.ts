import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidTraceLaw } from "./AutoMovieSolidTraceLaw";
import { AutoMovieSolidTraceSolve } from "./AutoMovieSolidTraceSolve";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World point or direction used by the original predictor. */
type Vec3 = AutoMovieSolidVector.Vec3;
/** The original s/phi/y/theta iterate order. */
type Vec4 = [number, number, number, number];
/** Surface partials used to construct the intersection tangent. */
type IJet = IAutoMovieSolidSurface.IJet;
/** The unchanged public meeting-point result. */
type IPoint = AutoMovieSolidIntersection.IPoint;
/** The unchanged public input, borrowed for its original seed reads. */
type IInput = AutoMovieSolidIntersection.IInput;
/** World-vector operations for the original tangent and predictor equations. */
const { add, cross, dot, norm, scale, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/**
 * Original arc-mode loop preparation, separate from parameterized trace publication.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents original step controls, local arrays and failure values at create.
 * @evidence contracts/development/design.md#principled-representation Represents Original arc-mode loop preparation, separate from parameterized trace publication: companion namespace of 2 members (`IWalk`, `create`); units and frames named in its text: second, local, world. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidIntersectionWalk` in packages/engine/src/geometry/construction/AutoMovieSolidIntersectionWalk.ts; its surface is the 2 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidIntersectionWalk {
  /** A walked reference law and the original starting preimages. */
  interface IWalk {
    /** The original reference-guide law used for requested arc parameterization. */
    law: AutoMovieSolidTraceLaw.ILaw;

    /** `[s, phi, y, theta]` at `t = 0`. */
    x: Vec4;

    /** The host face at `t = 0`. */
    face: number;
  }

  /**
   * Walk the loop from the seed by pseudo-arclength continuation, once to
   * measure its polygonal length and once in equal chords, then make the
   * reference-guide law used for requested normalized arclength.
   *
   * Each step predicts `P + h T` along the curve's unit tangent
   * `T = n_A x n_B` (turned with the previous) and corrects on the plane
   * square to `T` through the prediction; the first walk halves a step that
   * fails or lands more than a quarter step off, and ends where the start
   * lies ahead within a step; the second takes `walkPoints * count` equal
   * steps of that length. The first step's length is the arc a part ring
   * step covers there, `|A_phi| 2 pi / count`.
   *
   * The internal caller supplies captured count/tolerance values and the
   * unchanged public controls (64 first-walk steps per target, 4 guide
   * points per target and 6 closing trials). Valid finite counts, host-face
   * indices and regular callback jets remain premises, not new admissions.
   *
   * @returns The walk, or why it failed.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original tangent-plane pseudo-arclength walk followed by equal-chord walks and the existing periodic reference law; arc remains an approximation to requested exact arclength.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation returns the reference law and original start preimages for parameterized tracing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves halving, tangent fallback, secant arithmetic and last valid walk on closing exhaustion; adds no numerical or domain repair.
   * @evidence contracts/development/common.md#meaningful-documentation States mm chords, callback ownership, fixed limits passed from the public constants and original string failures.
   * @evidence contracts/development/implementation.md#efficient-algorithms For C targets, the first walk permits walkSteps*C steps with bounded failed halvings; one initial and at most closingSteps equal walks each use walkPoints*C points, plus existing solve costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the original previous iterate/tangent and accepted reference points; each secant candidate deliberately performs the same new equal walk.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Walk arrays and iterates are local; the returned law owns its prepared reference controls and the result owns one start tuple, with no global cache or task.
   */
  export function create(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    input: IInput,
    count: number,
    tolerance: number,
    walkSteps: number,
    walkPoints: number,
    closingSteps: number,
  ): IWalk | string {
    /** Read the two original surface jets and consistently orient their cross-normal tangent. */
    const tangent: (p: IPoint, along: Vec3 | null) => Vec3 | null = (
      p: IPoint,
      along: Vec3 | null,
    ): Vec3 | null => {
      /** Part partials at this accepted preimage. */
      const a: IJet | null = AutoMovieSolidDomain.jet(part, p.s, p.phi);

      /** Current host-face partials at the same meeting. */
      const b: IJet | null = AutoMovieSolidDomain.jet(
        host.faces[p.face]!,
        p.y,
        p.theta,
      );
      if (a === null || b === null) return null;

      /** Original normalized intersection tangent, absent at degeneracy. */
      const t: Vec3 | null = AutoMovieSolidVector.unit(
        cross(cross(a.u, a.v), cross(b.u, b.v)),
      );
      if (t === null) return null;
      return along !== null && dot(t, along) < 0 ? scale(t, -1) : t;
    };

    /** The original affine plane equation for a pseudo-arclength correction. */
    const across: (c: Vec3, m: Vec3) => AutoMovieSolidTraceLaw.ILaw = (
      c: Vec3,
      m: Vec3,
    ): AutoMovieSolidTraceLaw.ILaw => ({
      g: (p: Vec3): number => dot(sub(p, c), m),
      grad: (): [Vec3, number] => [m, 0],
      gt: (): number => 0,
      extra: (): number => 0,
      angle: (): number => 0,
    });

    // The seed refined on the plane through it square to the curve.

    /** The caller's starting host-face identity. */
    const face0: number = input.seed.face ?? 0;

    /** Original seed preimages, in their established coordinate order. */
    const x0: Vec4 = [
      input.seed.s,
      input.seed.phi,
      input.seed.y,
      input.seed.theta,
    ];

    /** Part jet used by the original seed plane and initial chord. */
    const a0: IJet | null = AutoMovieSolidDomain.jet(part, x0[0], x0[1]);

    /** Host jet used by the seed-plane tangent. */
    const b0: IJet | null = AutoMovieSolidDomain.jet(
      host.faces[face0]!,
      x0[2],
      x0[3],
    );
    if (a0 === null || b0 === null)
      return "the seed has no owned regular surface chart";

    /** Original seed tangent before the existing correction solve. */
    const t0: Vec3 | null = AutoMovieSolidVector.unit(
      cross(cross(a0.u, a0.v), cross(b0.u, b0.v)),
    );
    if (t0 === null) return "the surfaces touch at the seed";

    /** Seed corrected on the original tangent-normal plane. */
    const start: IPoint | null = AutoMovieSolidTraceSolve.solve(
      part,
      host,
      across(a0.p, t0),
      0,
      x0,
      face0,
      tolerance,
    );
    if (start === null) return "no meeting near the seed";

    /** The same corrected tangent with its existing seed-tangent fallback. */
    const T0: Vec3 = tangent(start, t0) ?? t0;

    // One step of length h from a point along its tangent.

    /** Original tangent prediction and correction, including its branch-distance acceptance. */
    const step: (
      p: IPoint,
      T: Vec3,
      h: number,
      previous: IPoint | null,
    ) => IPoint | null = (
      p: IPoint,
      T: Vec3,
      h: number,
      previous: IPoint | null,
    ): IPoint | null => {
      /** World tangent prediction at the requested mm chord. */
      const predicted: Vec3 = add(p.point, scale(T, h));

      /** Accepted preimages before the original secant guess. */
      const x: Vec4 = [p.s, p.phi, p.y, p.theta];

      /** Original same-face extrapolation or unchanged-face starting guess. */
      const guess: Vec4 =
        previous === null || previous.face !== p.face
          ? x
          : [
              2 * x[0] - previous.s,
              2 * x[1] - previous.phi,
              2 * x[2] - previous.y,
              2 * x[3] - previous.theta,
            ];

      /** Meeting corrected using the original predicted plane. */
      const next: IPoint | null = AutoMovieSolidTraceSolve.solve(
        part,
        host,
        across(predicted, T),
        0,
        guess,
        p.face,
        tolerance,
      );
      return next !== null &&
        norm(sub(next.point, predicted)) <= 0.25 * h + 10 * tolerance
        ? next
        : null;
    };

    // The first walk: the loop's length.

    /** Original phase-sized initial chord, reduced only by existing failed halvings. */
    let h: number = (norm(a0.v) * 2 * Math.PI) / count;

    /** Current accepted point of the first length walk. */
    let p: IPoint = start;

    /** Current consistently directed tangent. */
    let T: Vec3 = T0;

    /** Previous first-walk iterate used by the existing predictor. */
    let previous: IPoint | null = null;

    /** Accumulated world chords of the first walk, mm. */
    let length: number = 0;

    /** Whether the original ahead-within-one-step test closed the walk. */
    let closed: boolean = false;
    for (let k: number = 0; k < walkSteps * count; k++) {
      /** Displacement from the current point back toward its start. */
      const ahead: Vec3 = sub(start.point, p.point);
      if (k > 2 && norm(ahead) <= h && dot(ahead, T) > 0) {
        length += norm(ahead);
        closed = true;
        break;
      }

      /** Candidate retained through the original failed-halving loop. */
      let next: IPoint | null = null;
      for (
        let halving: number = 0;
        halving < AutoMovieSolidTraceSolve.HALVINGS && next === null;
        halving++
      ) {
        next = step(p, T, h, previous);
        if (next === null) h /= 2;
      }
      if (next === null)
        return `lost after ${length} mm of the walk, at [${p.point.map((x: number): string => x.toFixed(1)).join(", ")}] mm on host face ${p.face}`;
      length += norm(sub(next.point, p.point));
      previous = p;
      p = next;

      /** Continue the first walk with the same tangent orientation. */
      const t: Vec3 | null = tangent(p, T);
      if (t === null) return `the surfaces touch ${length} mm along the walk`;
      T = t;
    }
    if (!closed)
      return `the walk does not return to its start in ${walkSteps * count} steps`;

    // The second walk: equal chords whose last, closing the loop, matches the
    // others. The first walk's length sums uneven steps, so `length / n`
    // leaves the closing chord off by their difference; the chord is set by
    // the secant method on that closing mismatch, a few walks at most.

    /** Original reference point population from the public walkPoints control. */
    const n: number = walkPoints * count;

    /** Repeat the original fixed-chord walk for one secant candidate. */
    const equal: (chord: number) => Vec3[] | string = (
      chord: number,
    ): Vec3[] | string => {
      /** Accepted world points for this one reference candidate. */
      const points: Vec3[] = [start.point];

      /** Current point of the equal-chord walk. */
      let q: IPoint = start;

      /** Original consistently oriented equal-walk tangent. */
      let along: Vec3 = T0;

      /** Previous equal-walk iterate used by the same predictor. */
      let before: IPoint | null = null;
      for (let k: number = 1; k < n; k++) {
        /** Next accepted point of this fixed-chord reference walk. */
        let next: IPoint | null = step(q, along, chord, before);

        // Where the curve turns within less than a chord, the tangent
        // prediction a whole chord ahead is refused. The chord is then walked
        // in halved steps along the curve, as the first walk goes, and the
        // point its length ahead stands in for the one a straight chord ahead.
        if (next === null) {
          let from: IPoint = q;
          let heading: Vec3 = along;
          let last: IPoint | null = before;
          let left: number = chord;
          let h: number = chord / 2;
          for (
            let halving: number = 0;
            left > 1e-9 * chord && halving < AutoMovieSolidTraceSolve.HALVINGS;

          ) {
            const part: IPoint | null = step(from, heading, Math.min(h, left), last);
            if (part === null) {
              h /= 2;
              halving++;
              continue;
            }
            left -= norm(sub(part.point, from.point));
            last = from;
            from = part;
            const turned: Vec3 | null = tangent(from, heading);
            if (turned === null) break;
            heading = turned;
          }
          if (left <= 1e-9 * chord) next = from;
        }
        if (next === null)
          return `the equal-chord walk is lost at step ${k} of ${n}, at [${q.point.map((x: number): string => x.toFixed(1)).join(", ")}] mm on host face ${q.face}`;
        points.push(next.point);
        before = q;
        q = next;

        /** Continue this candidate using the same directed tangent. */
        const t: Vec3 | null = tangent(q, along);
        if (t === null)
          return `the surfaces touch at step ${k} of the equal-chord walk`;
        along = t;
      }
      return points;
    };

    /** Closing chord minus the chosen chord, with the original sign. */
    const mismatch: (points: Vec3[], chord: number) => number = (
      points: Vec3[],
      chord: number,
    ): number => norm(sub(points[0]!, points[points.length - 1]!)) - chord;

    /** Current secant chord candidate from the first measured length. */
    let c0: number = length / n;

    /** Last accepted reference-point candidate. */
    let p0: Vec3[] | string = equal(c0);
    if (typeof p0 === "string") return p0;

    /** Closing mismatch at that accepted candidate. */
    let g0: number = mismatch(p0, c0);

    /** Original next secant trial chord. */
    let c1: number = c0 + g0 / n;
    for (let i: number = 0; i < closingSteps && Math.abs(g0) > 1e-9 * c0; i++) {
      /** Reference points for the next trial, or its original failure. */
      const p1: Vec3[] | string = equal(c1);
      if (typeof p1 === "string") break;

      /** Closing mismatch for the successful trial. */
      const g1: number = mismatch(p1, c1);

      /** Original secant update, including its equal-residual fallback. */
      const c2: number = g1 === g0 ? c1 : c1 - (g1 * (c1 - c0)) / (g1 - g0);
      [c0, p0, g0, c1] = [c1, p1, g1, c2];
    }
    return {
      law: AutoMovieSolidTraceLaw.arc(p0),
      x: [start.s, start.phi, start.y, start.theta],
      face: start.face,
    };
  }
}
