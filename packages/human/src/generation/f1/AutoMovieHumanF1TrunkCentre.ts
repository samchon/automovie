import { AutoMovieHumanConicLoft as H } from "../conic/AutoMovieHumanConicLoft";
import {
  AutoMovieHumanConicRecentre as Recentre,
} from "../conic/AutoMovieHumanConicRecentre";
import { AutoMovieHumanConicSection as S } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanF1Trunk } from "./AutoMovieHumanF1Trunk";
import { AutoMovieViewChain } from "@automovie/engine";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicRecentre,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanF1TrunkCentre,
  IAutoMovieViewChain,
} from "@automovie/interface";

/**
 * f1's trunk about its own centre line (the Human skill's step 2, Re-base, and Centres Before Curves, steps 2 and 3): the line its
 * sections are centred on, and the stored wall re-expressed about it. Nothing builds from this module yet; it is the converted family the
 * re-base switches in together with its dependents.
 *
 * Today's course is the figure's vertical authoring axis. Each section's own centre is the centroid of its area, the one point a uniform
 * scale of the section leaves still and the mean position of everything the section encloses; on f1 it stands 16 to 41 mm in front of
 * the authoring axis from the pelvis to the waist, behind it at the shoulders and the neck (-17 mm at station 646) and 19 to 38 mm in
 * front through the head. The centre line is those centroids averaged along the course by a Gaussian of half the family's mean guide
 * reach, then drawn as the natural cubic through the knots, which is twice differentiable.
 *
 * The scale is measured (`test/src/reference-conics/FamilyConicTrunkCentre.ts`, every half millimetre of the wall): at the whole mean
 * reach (105 mm) the line passes the neck by, and the shoulders' sections read worse than about the authoring axis (least star-shape
 * margin 0.433 against 0.456, greatest chord ratio between uniform phases 6.76 against 6.00); at half of it every worst reading improves
 * (0.483, 5.25, and the least ratio of back reach to front reach 0.671 against 0.343); at a quarter the margin gains 0.02 more and the
 * reach ratio 0.16, while the line's greatest slope doubles (0.32 to 0.61 mm a millimetre) and its bend doubles (6.8 to 14.7 per metre),
 * and every line of constant phase, a mesh column or a net's column, slants across the skin by that slope.
 *
 * The line moves the origin along `u` only: the trunk stands on its median line, where `AutoMovieHumanConicRecentre.shift` admits no
 * other move, and the section planes are not changed.
 */
export namespace AutoMovieHumanF1TrunkCentre {
  /**
   * The centre line's smoothing scale as a share of the family's mean guide reach.
   *
   * Half: the least smoothing at which no worst reading of f1's sections is lost to the line passing a narrow stretch by (the namespace's
   * measurement). A share of the family's own size, so a larger person's line is smoothed over more of her course.
   */
  export const SCALE_SHARE: number = 0.5;

  /** Phases a section's area is integrated over. */
  const ROUND: number = 1440;

  /** A family re-expressed about a centre line. */
  export type IRecentred = IAutoMovieHumanF1TrunkCentre.IRecentred;

  /**
   * The centroid of a section's area in its chart, `[u, v]` mm about the point the section is charted about.
   *
   * In polar form about that point the area is `A = (1/2) integral r^2 dt` and its first moments are `(1/3) integral r^3 cos t dt` and
   * `(1/3) integral r^3 sin t dt` (the triangle from the origin to an element of the boundary has area `r^2 dt / 2` and its centroid at
   * two thirds of `r`), integrated by the trapezoid rule over uniform phases, which converges fast on a periodic integrand.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The polar area and first-moment integrals of a star-shaped region, read on the engine's own chain radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over uniform phases accumulating three sums.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A section the engine does not admit is refused; the mean of a few guide points is not used in place of the area's centroid.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the phases, a fixed count.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure measurement of one section coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one pair.
   */
  export function centroid(section: IAutoMovieViewChain.ISection): [number, number] {
    if (section.fault !== null) throw new Error("trunk centre: the section is not admitted: " + section.fault);
    let [area, u, v]: [number, number, number] = [0, 0, 0];
    for (let j: number = 0; j < ROUND; ++j) {
      const t: number = (2 * Math.PI * j) / ROUND;
      const r: number = AutoMovieViewChain.radius(section, t);
      area += r * r;
      u += r * r * r * Math.cos(t);
      v += r * r * r * Math.sin(t);
    }
    return [(2 * u) / (3 * area), (2 * v) / (3 * area)];
  }

  /**
   * A family's centre line as its shift from the family's course at each knot: the sections' area centroids, averaged along the course by
   * a Gaussian of `share` of the family's mean guide reach over the knots (each weighted by the stretch of course it stands for), to a
   * hundredth of a millimetre, the precision the family's own knot values are stored at. A family on its median line keeps `v = 0`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The section's own centre is its area's centroid; a normalized Gaussian average over arclength; the natural cubic through the knots is drawn by `AutoMovieHumanConicRecentre.axis`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One centroid and one reach per knot, then one weighted average per knot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative or nonfinite share is refused, and a share of zero returns the centroids unsmoothed; a bilateral family's `v` is exactly zero, not a small average.
   * @evidence contracts/development/implementation.md#efficient-algorithms Quadratic in the knot count, a few dozen, after one section read per knot.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each knot's section is resolved once for its centroid and its reach.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two fresh arrays.
   */
  export function line(family: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1Trunk, share: number = SCALE_SHARE): IAutoMovieHumanConicRecentre.ILine {
    if (!(Number.isFinite(share) && share >= 0)) throw new Error("trunk centre: the smoothing share must be finite and nonnegative");
    const knots: readonly number[] = family.knots;
    const read: (s: number) => number[] = H.reader(family);
    const centres: [number, number][] = [];
    let reach: number = 0;
    for (const s of knots) {
      const chain: IAutoMovieHumanConicSection.IChain = S.resolve(read(s), family.layout);
      centres.push(centroid(AutoMovieViewChain.of(chain.input)));
      reach += chain.guides.reduce((sum: number, k: number): number => sum + Math.hypot(chain.input.points[k]![0], chain.input.points[k]![1]), 0) / chain.guides.length;
    }
    const width: number = (share * reach) / knots.length;
    const median: boolean = family.layout.mirror || family.layout.anchors.some((anchor: IAutoMovieHumanConicSection.IAnchor): boolean => anchor.mid === true);

    // Each knot stands for half the course to each neighbour, so unevenly spaced knots average as the course they sample.
    const span: number[] = knots.map((s: number, k: number): number => ((knots[k + 1] ?? s) - (knots[k - 1] ?? s)) / 2);
    const smoothed = (component: 0 | 1): number[] =>
      knots.map((s: number, k: number): number => {
        let [sum, total]: [number, number] = [0, 0];
        knots.forEach((other: number, j: number): void => {
          const weight: number = width === 0 ? (j === k ? 1 : 0) : span[j]! * Math.exp(-(((other - s) / width) ** 2) / 2);
          sum += weight * centres[j]![component];
          total += weight;
        });
        return Math.round((100 * sum) / total) / 100;
      });
    return { u: smoothed(0), v: median ? knots.map((): number => 0) : smoothed(1) };
  }

  /**
   * A family re-expressed about a centre line: its knot values by `AutoMovieHumanConicRecentre.shift`, which admits both sections at
   * every knot and every middle and refuses a move the section model cannot make, and its course by
   * `AutoMovieHumanConicRecentre.axis`. The wall is the stored wall: the same world points at every station, because the natural cubic is
   * linear in its knot values. A closed tip and the reliefs are not carried: a tip shrinks about the course point and a relief's window is
   * a rectangle of the chart, so both are laid again on this wall.
   *
   * @evidence contracts/development/implementation.md#principled-implementation An exact adapter: coordinates about a moved origin are the coordinates less the move, on a course moved by the same line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `shift` and one `axis` on one line.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every refusal of `shift` is passed on; no value is rounded or clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in fields times knots beside `shift`'s own admission.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The line is computed once when the caller gives none and serves both the values and the course.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh rows; the course retains the base course and two knot-sized splines.
   */
  export function recentre(family: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1Trunk, origin: IAutoMovieHumanConicRecentre.ILine = line(family)): IRecentred {
    return { line: origin, knots: family.knots, layout: family.layout, values: Recentre.shift(family, origin), axis: Recentre.axis(H.axis(family), family.knots, origin) };
  }
}
