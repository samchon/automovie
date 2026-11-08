import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidFoot } from "./AutoMovieSolidFoot";
import { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
const { dot } = AutoMovieSolidVector;

/**
 * A through-cut: an opening in the skin (the palpebral fissure, the oral
 * fissure) as a closed trim loop in the skin's own chart.
 *
 * Nothing lies behind such a cut for a blend to reach, so it is not a diff: the
 * margin is a closed curve on the surface and the chart's domain gets it as a
 * hole (Sederberg et al. 2008, watertight trims as shared parameter curves).
 * The margin's points come from the landmarks that define it (endocanthion,
 * palpebrale superius, exocanthion, palpebrale inferius and the courses
 * between them; the cheilia and the stomion line), each taken to its foot on
 * the surface (`AutoMovieSolidFoot`), and the loop is the periodic cubic
 * B-spline through the feet at uniform loop parameters
 * (`AutoMovieSplineCurve.interpolate`), so it is C2 in the chart and on
 * the skin, and passes through its feet to the inverse filter's stated numerical accuracy. The skin is the surface outside the
 * loop; its tessellation stops at the loop's points, which the margin's
 * consumers (a lid band, a rolled rim, a lining) read from the same function.
 *
 * A rolled rim, where the skin turns into the opening (the lid margin's
 * rounded edge, the vermilion's inner turn), is one more blend
 * (`AutoMovieSolidBlend`) from {@link ITrim.ribbon}, the skin's jet across
 * the loop toward the hole, to the inner surface's ribbon.
 *
 * Landmarks must be ordered on one chart sheet, with any periodic phase unwrapped consistently by the guesses. Admission checks only a 16-sample-per-span polygon's proper crossings and sampled chart regularity; it does not certify the entire cubic loop is simple or regular between those samples.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the loop's layout, its inside test and its ribbon.
 * @evidence contracts/development/design.md#principled-representation Represents A through-cut: an opening in the skin (the palpebral fissure, the oral fissure) as a closed trim loop in the skin's own chart: companion namespace of 5 members (`ITrim`, `IResult`, `DENSITY`, `create`, `selfCrossing`); units and frames named in its text: radians, radian, second, world, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidTrim` in packages/engine/src/geometry/construction/AutoMovieSolidTrim.ts; its surface is the 5 members listed and the text shows 10 other files naming it, mostly packages/engine (5), test (4), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieSolidTrim {
  /**
   * A chart trim with its prepared loop, foot metadata, sampled classifier and transverse-ribbon reader.
   *
   * @evidence contracts/development/design.md#principled-representation The periodic control layout and chart evaluator describe the margin, while a sampled polygon supplies the opening classifier and orientation used by ribbons.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One result keeps the loop and the readings used by tessellation/margin consumers together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The mutable loop is shared by at/ribbon while inside uses a separately prepared polygon; direct mutation can make them disagree, and the type provides no invalidation or continuous regularity certificate.
   * @evidence contracts/development/common.md#meaningful-documentation Names chart layout, feet, periodic query semantics and each reader's purpose without claiming a fully certified simple opening.
   */
  export interface ITrim {
    /** The surface's name. */
    surface: string;

    /** The loop's control points `[u_0 .. u_{M-1}, v_0 .. v_{M-1}]`, the layout of `AutoMovieSplineCurve` and of a root loop. */
    loop: number[];

    /** The landmarks' feet, `[u, v]`, the loop's values at parameters `2 pi m / M`. */
    feet: [number, number][];

    /**
     * The loop at a parameter.
     *
     * @param t Loop parameter, radians, any real value.
     * @returns `[u, v, du/dt, dv/dt]`.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Reads the prepared periodic cubic in the surface chart and its analytic first loop-parameter derivative.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure A four-number reading gives both location and tangent to margin consumers.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This chart evaluation neither projects back to the surface domain nor certifies a regular/simple loop at that parameter.
     * @evidence contracts/development/common.md#meaningful-documentation Gives radian periodic query and the returned chart/derivative order.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The callable type has no body; create installs the constant-support SplineCurve evaluator.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Each reading reuses the same prepared control array; current values are not memoized per query.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The installed callback returns a fresh tuple and retains only its owning trim's controls/count, without a growing query cache.
     */
    at(t: number): [number, number, number, number];

    /**
     * Whether a chart point lies in the opening.
     *
     * @param u First chart parameter.
     * @param v Second chart parameter, on any branch of a periodic phase.
     *
     * @evidence contracts/development/implementation.md#principled-implementation Uses odd/even crossings of the prepared sampled chart polygon after choosing the phase branch nearest its mean.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One boolean reader hides only the polygon representation, not another world-space cut geometry.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Classifies the finite polygon rather than the exact cubic boundary; boundary behavior follows strict crossing comparisons and a one-sheet periodic premise.
     * @evidence contracts/development/common.md#meaningful-documentation States chart input and periodic branch handling; the trim comment names the sampled approximation.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature has no implementation; create's callback performs the O(16M) scan.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work All queries share the polygon/phase mean prepared once by create, provided the loop/surface is not mutated.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returning a boolean retains no query point; the owning trim controls the prepared polygon lifetime.
     */
    inside(u: number, v: number): boolean;

    /**
     * The skin's ribbon across the loop toward the opening, square to the
     * loop in the surface's first fundamental form.
     *
     * @param t Loop parameter.
     * @param a Scale of the cross parameter, world mm per unit.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The installed reader solves the chart metric for an inward unit-world-speed direction and evaluates its scaled surface ribbon at the queried loop point.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure It connects the trim's chart tangent/orientation to the shared SolidRibbon evaluator.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Current sampled admission does not prove a direction at every t; an unsampled square failure is replaced by zero direction, so a returned record is not always a valid transverse boundary jet.
     * @evidence contracts/development/common.md#meaningful-documentation Gives inward direction, metric meaning and mm cross-parameter scale, including the unresolved fallback limitation.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This callable type chooses no solve algorithm; create and SolidRibbon own the actual fixed-size operations.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses prepared loop/orientation but reads the queried surface for direction and again in SolidRibbon; no shared queried jet is passed between them.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback retains its trim/surface dependencies and returns one small ribbon; it owns no growing parameter cache or resource handle.
     */
    ribbon(t: number, a: number): AutoMovieSolidRibbon.IRibbon;
  }

  /**
   * An optional prepared trim and the premise failures reported before return.
   *
   * @evidence contracts/development/design.md#principled-representation Null trim distinguishes an encountered admission failure from a prepared opening, with producer/contract/detail diagnostics retained for its caller.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields carry the geometry-or-failure result without throwing away diagnostic context.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A nonnull trim is not a proof against unsampled crossings/degeneracy; create currently stops at its first detected failure.
   * @evidence contracts/development/common.md#meaningful-documentation States nullable trim and reported-diagnostic meaning.
   */
  export interface IResult {
    /** The trim, or null when a landmark has no foot or the loop crosses itself. */
    trim: ITrim | null;

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** Samples per landmark span of the polygon the inside test reads. */
  export const DENSITY: number = 16;

  /**
   * The trim through a margin's landmarks.
   *
   * @param surface The skin surface.
   * @param landmarks The margin's points in order round the opening, at least 4, mm.
   * @param guesses Each landmark's chart point to start its foot from, in its region.
   * @param tolerance The feet's tangential tolerance, mm.
   * @returns The trim and its diagnostics.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Solves regional landmark feet, admits their station domains, interpolates an ordered periodic chart loop and prepares polygon parity plus inverse-metric inward ribbon directions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation owns geometry, classifier/orientation and first-failure diagnostics, reusing the existing foot, spline and ribbon operations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Crossing checks detect only strict intersections of sampled nonadjacent polygon edges, not touches/overlaps or all cubic intersections; chart regularity is also sampled and later square failure falls back to zero direction. These are unresolved admission gaps.
   * @evidence contracts/development/common.md#meaningful-documentation Gives landmark count/order, regional guesses, mm tolerance, chart-sheet premise and exact scope of the sampled tests/fallback.
   * @evidence contracts/development/implementation.md#efficient-algorithms For M landmarks and D=16, bounded foot solves plus O(MD) sampling/regularity checks and an O((MD)^2) edge-pair scan prepare O(MD) retained data; later inside queries are O(MD).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Controls, polygon, mean phase and orientation are prepared once, but returned loop mutation invalidates none of the derived state and ribbon queries fetch their surface jet twice across helpers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Failure releases local preparation and returns diagnostics; success transfers controls/feet and callback-retained polygon/surface state to the caller, without a global cache or acquired task.
   */
  export function create(
    surface: IAutoMovieSolidSurface,
    landmarks: readonly Readonly<Vec3>[],
    guesses: readonly (readonly [number, number])[],
    tolerance: number,
  ): IResult {
    const producer: string = `solid.trim.${surface.name}`;
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const fail = (contract: string, detail: string): IResult => {
      diagnostics.push({ producer, level: 5, contract, detail });
      return { trim: null, diagnostics };
    };
    if (!(landmarks.length >= 4) || guesses.length !== landmarks.length)
      return fail(
        "margin landmarks",
        `${landmarks.length} landmarks and ${guesses.length} guesses; at least 4, one guess each`,
      );

    // The feet.
    const feet: [number, number][] = [];
    for (let m: number = 0; m < landmarks.length; m++) {
      const foot: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(
        surface,
        landmarks[m]!,
        guesses[m]!,
        tolerance,
      );
      if (foot === null)
        return fail(
          "landmark foot",
          `no foot for landmark ${m} at ${landmarks[m]!.join(", ")}`,
        );
      const outside: string | null = AutoMovieSolidIntersection.beyond(
        surface,
        foot.u,
      );
      if (outside !== null)
        return fail(
          "landmark foot",
          `landmark ${m}'s foot lies past the face: ${outside}`,
        );
      feet.push([foot.u, foot.v]);
    }
    const loop: number[] = AutoMovieSplineCurve.interpolate(feet);
    const count: number = feet.length;
    const at = (t: number): [number, number, number, number] =>
      AutoMovieSplineCurve.evaluate(loop, count, t);

    // The dense polygon the inside test and the crossing check read.
    const polygon: [number, number][] = Array.from(
      { length: count * DENSITY },
      (_: unknown, i: number): [number, number] => {
        const p: [number, number, number, number] = at(
          (2 * Math.PI * i) / (count * DENSITY),
        );
        return [p[0], p[1]];
      },
    );
    const crossing: number = selfCrossing(polygon);
    if (crossing >= 0)
      return fail(
        "simple margin",
        `the loop through the landmarks crosses itself at sample ${crossing}`,
      );
    const mean: number =
      polygon.reduce(
        (sum: number, p: [number, number]): number => sum + p[1],
        0,
      ) / polygon.length;

    // `e = G^-1 (-dv, du)` always lies left of the loop's tangent, since
    // `det[c', G^-1 R c'] = (R c')^T G^-1 (R c') > 0` for the positive definite
    // `G^-1`; the opening is on the left of a counter-clockwise loop, so the
    // loop's signed area in the chart turns `e` toward it.
    let area: number = 0;
    for (
      let i: number = 0, j: number = polygon.length - 1;
      i < polygon.length;
      j = i++
    )
      area += polygon[j]![0] * polygon[i]![1] - polygon[i]![0] * polygon[j]![1];
    const turning: number = area > 0 ? 1 : -1;
    const inside = (u: number, v: number): boolean => {
      // The phase on the branch nearest the loop's mean, as a root loop does.
      const w: number =
        surface.period === undefined
          ? v
          : v + surface.period * Math.round((mean - v) / surface.period);
      let odd: boolean = false;
      for (
        let i: number = 0, j: number = polygon.length - 1;
        i < polygon.length;
        j = i++
      ) {
        const a: [number, number] = polygon[i]!;
        const b: [number, number] = polygon[j]!;
        if (
          a[0] > u !== b[0] > u &&
          w < ((b[1] - a[1]) * (u - a[0])) / (b[0] - a[0]) + a[1]
        )
          odd = !odd;
      }
      return odd;
    };

    // Square to the loop in the first fundamental form, of unit world speed,
    // turned toward the opening; null where the chart degenerates.
    const square = (t: number): [number, number, number, number] | null => {
      const [u, v, du, dv]: [number, number, number, number] = at(t);
      const j: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
        surface,
        u,
        v,
      );
      if (j === null) return null;
      const E: number = dot(j.u, j.u);
      const F: number = dot(j.u, j.v);
      const G: number = dot(j.v, j.v);
      const e: [number, number] | null = AutoMovieSolidVector.solve2(
        E,
        F,
        F,
        G,
        [-dv, du],
      );
      if (e === null) return null;
      const speed: number = Math.sqrt(
        E * e[0] * e[0] + 2 * F * e[0] * e[1] + G * e[1] * e[1],
      );
      if (!(speed > 0)) return null;
      const k: number = turning / speed;
      return [u, v, e[0] * k, e[1] * k];
    };
    for (let i: number = 0; i < polygon.length; i++)
      if (square((2 * Math.PI * i) / polygon.length) === null)
        return fail(
          "regular chart",
          `the surface's chart degenerates on the loop at sample ${i}`,
        );
    const ribbon = (t: number, a: number): AutoMovieSolidRibbon.IRibbon => {
      // Sampled regularity does not certify the intervals between samples;
      // the existing zero-direction fallback remains an explicit limitation.
      const [u, v, du, dv]: [number, number, number, number] =
        square(t) ??
        ([...at(t).slice(0, 2), 0, 0] as [number, number, number, number]);
      return AutoMovieSolidRibbon.of(surface, u, v, du, dv, a);
    };

    return {
      trim: { surface: surface.name, loop, feet, at, inside, ribbon },
      diagnostics,
    };
  }

  /**
   * The first sample whose edge crosses a later non-adjacent edge of a
   * closed polygon, or -1 when it is simple.
   *
   * @param points The closed polygon.
   * @returns The sample index or -1.
   */
  function selfCrossing(points: readonly [number, number][]): number {
    const n: number = points.length;
    const turn = (
      a: readonly [number, number],
      b: readonly [number, number],
      c: readonly [number, number],
    ): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    for (let i: number = 0; i < n; i++)
      for (let j: number = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const a: [number, number] = points[i]!;
        const b: [number, number] = points[(i + 1) % n]!;
        const c: [number, number] = points[j]!;
        const d: [number, number] = points[(j + 1) % n]!;
        if (
          turn(a, b, c) * turn(a, b, d) < 0 &&
          turn(c, d, a) * turn(c, d, b) < 0
        )
          return i;
      }
    return -1;
  }
}
