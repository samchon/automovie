import { AutoMovieHumanConicLoft as H } from "./AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection as S } from "./AutoMovieHumanConicSection";
import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";
import { AutoMovieHumanF1Centres as Centres } from "./AutoMovieHumanF1Centres";
import { AutoMovieHumanF1Placement as Placement } from "./AutoMovieHumanF1Placement";
import { AutoMovieHumanF1Placing as T } from "./AutoMovieHumanF1Placing";
import { AutoMovieViewChain, AutoMovieViewJointedCourse } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicRecentre,
  IAutoMovieHumanConicSection,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewChain,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";

/**
 * The laws of a course (the Human skill's Centres Before Curves, steps 2 and 3): the line a family's sections are centred on, the
 * skeletal datum line tissue is measured from, and the least half length a turn may take.
 *
 * Two centres are kept apart. The loft centre is the course point a section is charted and star-shaped about; it should be the
 * section's own centre, because a section read from an off-centre point is lopsided in phase and loses its star-shape sooner. The
 * scaling centre is where the skeleton crosses the section plane; a tissue ratio applied about it leaves the skeleton where it is. The
 * two differ wherever the bone does not run through the middle of the flesh (the femur lies in front of the thigh's centre behind the
 * knee and behind it at the hip; the spine lies behind the trunk's centre).
 */
export namespace AutoMovieHumanF1CourseLaw {
  /**
   * One turn read against the turn rule.
   *
   * @evidence contracts/development/design.md#principled-representation The stored half length beside the least the rule allows for the turn's angle and the reach on its concave side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One row of the turn-rule table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A turn whose middle lies outside the family's knots reports NaN reach and margin, not a guess.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units.
   */
  export interface IFold {
    /** The interior centre's name. */
    centre: string;
    /** The station of the turn's middle, mm. */
    station: number;
    /** The stored half arclength, mm. */
    half: number;
    /** The turn's angle, radians. */
    angle: number;
    /** The section's reach toward the turn's centre of curvature at the turn's middle, mm. */
    concave: number;
    /** The least half length the rule allows, mm: `(15 / 16) angle concave`. */
    least: number;
    /** `half / least`: under 1 the sections cross on the concave side. */
    margin: number;
  }

  /**
   * The skeletal datum line of a course: joint centres by their names in the placing table, or segment origins by their frames' names.
   * The limbs' are their bones' joint centres. The trunk's rig has no vertebra: its only skeletal datums are the origins of the pelvis
   * (the hip centres' midpoint), the thorax (suprasternale, a point on the front of the manubrium, not on the spine) and the head (the
   * bitragion midpoint), so the trunk's line is a stand-in whose place front to back is uncertain by the sternum-to-vertebral-body depth
   * at the thorax.
   */
  export const SKELETON: Readonly<Record<string, { points?: readonly string[]; frames?: readonly string[] }>> = {
    trunk: { frames: ["pelvis", "thorax", "head"] },
    arm: { points: ["upperarm", "lowerarm", "hand", "middle1"] },
    hand: { points: ["upperarm", "lowerarm", "hand", "middle1"] },
    leg: { points: ["thigh", "calf", "foot"] },
  };

  /**
   * The least half length of a turn whose sections stay apart on the concave side, mm.
   *
   * The engine's jointed turn of angle `theta` over the arclength `2 h` turns its tangent by `theta S(x)`, `S(x) = 10 x^3 - 15 x^4 +
   * 6 x^5` of the share `x` of that arclength (`AutoMovieViewAxis.jointed`). The curvature is `theta S'(x) / (2 h)` and `S'` is greatest
   * at the middle, 15/8, so the greatest curvature is `15 theta / (16 h)`. A point at the distance `r` from the course on the side of the
   * centre of curvature moves along the course at the speed `1 - kappa r`; the sections cross where that reaches zero (the regular-offset
   * condition), so they stay apart while `h > (15 / 16) theta r`. The derivation is this package's (`docs/techniques/joint-logic.md`),
   * checked against the engine's course jets by the unit test.
   *
   * @evidence contracts/development/implementation.md#principled-implementation `(15 / 16) theta r` from the smoothstep's greatest slope and the offset curve's speed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative or nonfinite angle or reach is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure formula coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number.
   */
  export function halfLeast(angle: number, reach: number): number {
    if (!(Number.isFinite(angle) && Number.isFinite(reach) && angle >= 0 && reach >= 0)) throw new Error("turn rule needs a finite nonnegative angle and reach");
    return (15 / 16) * angle * reach;
  }

  /**
   * Every turn of a family against the turn rule: the reach is the family's own section read toward the centre of curvature at the
   * turn's middle, where the curvature is greatest.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The concave direction is the course's curvature vector in the section's chart; the reach is the section's polar radius at that phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One course jet and one section read per turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The mean reach or a guide's reach is not used in place of the concave side's; an inadmissible course or section is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the turns.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure measurement coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain records.
   */
  export function folds(family: IAutoMovieHumanConicLoft.IFamily): IFold[] {
    const prepared: IAutoMovieViewJointedCourse.ICourse | string = AutoMovieViewJointedCourse.prepare(family.centres, family.halves);
    if (typeof prepared === "string") throw new Error("course of " + family.name + ": " + prepared);
    const names: readonly string[] = T.COURSES[family.name] ?? [];
    const axis: IAutoMovieViewAxis.IAxis = H.axis(family);
    const read: (s: number) => number[] = H.reader(family);
    return prepared.turns
      .filter((turn: IAutoMovieViewJointedCourse.ITurn): boolean => turn.angle > 0)
      .map((turn: IAutoMovieViewJointedCourse.ITurn): IFold => {
        const station: number = turn.start + turn.half;
        const jet: IAutoMovieViewAxisJet.IJet | null = axis.jet?.(station) ?? null;
        let concave: number = NaN;
        if (jet !== null && station >= family.knots[0]! && station <= family.knots.at(-1)!) {
          const bend: readonly number[] = jet.second.origin;
          const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
          const section: IAutoMovieViewChain.ISection = S.chain(read(station), family.layout);
          if (section.fault !== null) throw new Error("section of " + family.name + " at " + station + ": " + section.fault);
          concave = AutoMovieViewChain.radius(section, Math.atan2(dot(bend, jet.value.v), dot(bend, jet.value.u)));
        }
        const least: number = Number.isNaN(concave) ? NaN : halfLeast(turn.angle, concave);
        return { centre: names[turn.centre] ?? String(turn.centre), station, half: turn.half, angle: turn.angle, concave, least, margin: turn.half / least };
      });
  }

  /**
   * Where the skeletal datum line (`SKELETON`) crosses each knot's section plane, in the section chart `[u, v]`, mm from the course
   * point; null for a family without a line or a station whose plane the line does not cross.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The plane through the course point with normal `v x u` meets a bone `a + l (b - a)` at `l = n . (o - a) / n . (b - a)`; the point's chart coordinates are its offsets along `u` and `v`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One plane-line meeting per bone and knot; the nearest admitted meeting is kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bone is not extended past its ends, so a station past the line reports none.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in knots times bones.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure measurement coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain pairs.
   */
  export function skeleton(family: IAutoMovieHumanConicLoft.IFamily): ([number, number] | null)[] {
    const line: { points?: readonly string[]; frames?: readonly string[] } | undefined = SKELETON[family.name];
    const bones: AutoMovieVector3Tuple[] =
      line === undefined
        ? (T.COURSES[family.name] ?? []).filter((name: string): boolean => Centres.describe(name).kind === "joint").map((name: string): AutoMovieVector3Tuple => Placement.point(name))
        : [...(line.points ?? []).map((name: string): AutoMovieVector3Tuple => Placement.point(name)), ...(line.frames ?? []).map((name: string): AutoMovieVector3Tuple => Placement.frame(name).origin)];
    const axis: IAutoMovieViewAxis.IAxis = H.axis(family);
    return family.knots.map((station: number): [number, number] | null => {
      const frame: ReturnType<IAutoMovieViewAxis.IAxis["at"]> = axis.at(station);
      const [o, u, v]: AutoMovieVector3Tuple[] = [[...frame.origin] as AutoMovieVector3Tuple, [...frame.u] as AutoMovieVector3Tuple, [...frame.v] as AutoMovieVector3Tuple];
      const n: AutoMovieVector3Tuple = F.cross(v!, u!);
      let best: [number, number] | null = null;
      for (let k: number = 1; k < bones.length; ++k) {
        const [a, b]: AutoMovieVector3Tuple[] = [bones[k - 1]!, bones[k]!];
        const along: number = F.dot(n, F.sub(b!, a!));
        if (along === 0) continue;
        const share: number = F.dot(n, F.sub(o!, a!)) / along;
        if (!(share >= 0 && share <= 1)) continue;
        const q: AutoMovieVector3Tuple = F.sub(F.add(a!, F.scale(F.sub(b!, a!), share)), o!);
        const at: [number, number] = [F.dot(q, u!), F.dot(q, v!)];
        if (best === null || Math.hypot(at[0], at[1]) < Math.hypot(best[0], best[1])) best = at;
      }
      return best;
    });
  }

  /**
   * A family's loft-centre line as its shift from today's course at each knot (`AutoMovieHumanConicRecentre.ILine`).
   *
   * `course` is today's course: every shift is zero, which re-expresses the family as itself. `sections` is the line through the
   * sections' own centres, each the mean of its four guide extremes, smoothed along the course by a Gaussian of the given scale over the
   * knots (each weighted by the stretch of course it stands for), then drawn as the natural cubic through the knots, which is twice
   * differentiable. The default scale is the family's mean guide reach: a centre that wanders within less than the section's own radius
   * is the form of the skin there (a breast, a belly, a calf), which the outlines carry, and a course that followed it would bend the
   * section planes' origins as fast as the wall itself. A family on its median line keeps `v = 0`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The section's centre by its four guide extremes; a normalized Gaussian average over arclength; the natural cubic through the knots (in `AutoMovieHumanConicRecentre.axis`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One centre per knot and one weighted average per knot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The `course` choice returns exact zeros; a negative or nonfinite scale is refused, and a scale of zero returns the raw centres unsmoothed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Quadratic in the knot count, a few dozen.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the centres once through `AutoMovieHumanF1Centres.offsets`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two fresh arrays.
   */
  export function centreLine(family: IAutoMovieHumanConicLoft.IFamily, choice: "course" | "sections", scale?: number): IAutoMovieHumanConicRecentre.ILine {
    if (choice === "course") return { u: family.knots.map((): number => 0), v: family.knots.map((): number => 0) };
    const read: (s: number) => number[] = H.reader(family);
    const reach = (s: number): number => {
      const chain: IAutoMovieHumanConicSection.IChain = S.resolve(read(s), family.layout);
      return chain.guides.reduce((sum: number, k: number): number => sum + Math.hypot(chain.input.points[k]![0], chain.input.points[k]![1]), 0) / chain.guides.length;
    };
    const knots: readonly number[] = family.knots;
    const width: number = scale ?? knots.reduce((sum: number, s: number): number => sum + reach(s), 0) / knots.length;
    if (!(Number.isFinite(width) && width >= 0)) throw new Error("centre line needs a finite nonnegative smoothing scale");
    const centres: [number, number][] = Centres.offsets(family).map((o: Centres.IOffset): [number, number] => o.centroid);
    const median: boolean = family.layout.mirror || family.layout.anchors.some((anchor: IAutoMovieHumanConicSection.IAnchor): boolean => anchor.mid === true);

    // Each knot stands for half the course to each neighbour, so unevenly spaced knots average as the course they sample.
    const span: number[] = knots.map((s: number, k: number): number => ((knots[k + 1] ?? s) - (knots[k - 1] ?? s)) / 2);
    const smoothed = (component: 0 | 1): number[] =>
      knots.map((s: number, k: number): number => {
        if (width === 0) return centres[k]![component];
        let [sum, total]: [number, number] = [0, 0];
        knots.forEach((other: number, j: number): void => {
          const weight: number = span[j]! * Math.exp(-(((other - s) / width) ** 2) / 2);
          sum += weight * centres[j]![component];
          total += weight;
        });
        return sum / total;
      });
    return { u: smoothed(0), v: median ? knots.map((): number => 0) : smoothed(1) };
  }
}
