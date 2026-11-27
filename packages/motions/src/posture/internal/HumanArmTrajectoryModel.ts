import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmGeometryTypes } from "./HumanArmGeometryTypes";
import type { HumanArmSurfaceLift } from "./HumanArmSurfaceLift";
import { HumanArmTrajectoryEvaluate } from "./HumanArmTrajectoryEvaluate";
import { HumanArmTrajectoryInvalid } from "./HumanArmTrajectoryInvalid";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryStep } from "./HumanArmTrajectoryStep";
import { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/*
 * The objective and the constraints of an arms' trajectory
 * (`HumanArmTrajectory`), evaluated at an iterate; its context is built by
 * `HumanArmTrajectoryContext` and its convex model by
 * `HumanArmTrajectoryConvex`, both on the terms of `HumanArmTrajectoryTerms`.
 *
 * Objective: each arm's squared coordinate accelerations; its elbow's and
 * wrist's squared Cartesian steps, CHOMP's arc length (Zucker et al. 2013, IJRR
 * 32:1164), so the workspace travel is short; and on the hold the hand's
 * squared distance and rotation off its site, the rotation giving way where the
 * arm's range cannot meet it (`HumanPosture.IGoal.contact`).
 *
 * Constraints, met by TrajOpt's exact l1 penalty: on the hold the hand's
 * contact on its site's disc and each declared effector point within its
 * physical displacement bound; every collider probe of the arm (the tangle
 * audit's corners) no deeper in any shape than its allowance at every waypoint,
 * and the arm's axis spheres swept between two waypoints no deeper (the
 * sphere's motion is a capsule, TrajOpt's continuous check); two arms' probes
 * as clear of each other; the elbow's, wrist's and fingertips' speed within the
 * audit's travel bound; and, hard, the joints' ranges. The hand's contact is a
 * unilateral contact on its site: its place along the surface is within the
 * disc and drawn to the site, its height along the touched collider's outward
 * normal is no lower than the site's, and the lift is minimised, so the hand
 * stands off by the least that keeps its own colliders out of the touched
 * segment.
 */
export namespace HumanArmTrajectoryModel {
  /*
   * The hand on its site at a hold waypoint.
   */
  export interface ISite {
    /*
     * The world point the contact is put at.
     */
    point: IAutoMovieVector3;
    /*
     * The contact in the hand's rest frame from the wrist.
     */
    contact: IAutoMovieVector3;
    /*
     * The hand's world rotation on the site; free when absent.
     */
    rotation?: IAutoMovieQuaternion;
    /*
     * The effector's hard point-displacement limits, in the same local frame as
     * contact.
     */
    limits?: IAutoMovieHumanLimbGoal["limits"];
    /*
     * The radius of the region's disc about the point the contact may land in,
     * metres.
     */
    disc: number;
    /*
     * Maximum distance in metres between the hand skin and a held material
     * site.
     */
    skinDistance?: number;
    /*
     * The segment of another arm of the problem the site rides on, which that
     * arm moves as it is solved: the site's point, normal and rotation are then
     * that segment's own (`point` and `rotation` above where the base holds
     * it). A site of the body or another body rides nothing.
     */
    on?: ISiteOn;
  }

  /*
   * One of an arm's three segments.
   */
  export type Segment = "upperArm" | "lowerArm" | "hand";

  /*
   * A declared rest of one of the arm's segments on a bone of the same body
   * over the hold (a self-hug's forearm on the other forearm or the chest).
   */
  export interface IRest {
    /*
     * The arm's segment.
     */
    part: RestPart;
    /*
     * The bone it lies on.
     */
    on: string;
  }

  /*
   * The largest violation of a constraint other than clearance accepted as
   * feasible: a millimetre, or a millimetre per step; the solve refuses past
   * it.
   */
  export const TOLERANCE: number = T.TOLERANCE;

  /*
   * A minimum-jerk movement's peak speed over its mean, 1.875 (Flash and Hogan
   * 1985, J Neurosci 5:1688): the peak a law's own timed straight path reaches,
   * `UNIT` times its length over its time.
   */
  export const UNIT: number = 1.875;

  /*
   * The fastest a hand moves in a daily reach, metres a second: the returning
   * phase's peak hand velocity of drinking from a glass, 560 ± 79.1 mm/s over
   * 20 controls (Alt Murphy, Sunnerhagen, Johnels and Willén 2006, J NeuroEng
   * Rehabil 3:18, table 2, the faster of its reaching and returning phases), at
   * its mean plus three standard deviations. A span fixed from outside (a
   * weight, a meeting, a cue) cannot stretch for a detour, so there the course
   * may move as fast as this or the law's own pace, whichever is larger.
   */
  export const ENVELOPE: number = 0.56 + 3 * 0.0791;

  /*
   * The travel a speed-bounded probe may make over an interval, millimetres:
   * the law's own pace there (`IContext.speed`, read at the interval's middle)
   * over it less the tolerance a violation is accepted within, so a step the
   * model accepts at its tolerance still lies within the pace.
   * Parameter c: The context.
   * Parameter k: The interval's first waypoint.
   * Returns: The bound, millimetres.
   */
  export function stepLimit(c: IContext, k: number): number {
    const dt: number = c.times[k + 1]! - c.times[k]!;
    return 1000 * c.speed((c.times[k]! + c.times[k + 1]!) / 2) * dt - TOLERANCE;
  }

  /*
   * The authored self-support bones and native body for an arm course.
   */
  export interface IMaterialSource {
    /*
     * The supported bone of each hand, when the author names one.
     */
    bones: readonly (string | undefined)[];
    /*
     * The action's original base at a second on its waypoints' clock.
     */
    at(seconds: number): HumanArmGeometryTypes.IBase;
  }

  /*
   * Own support part ordinals and the posed geometry for an interior encounter.
   */
  export interface IMaterial {
    /*
     * Each supported bone in the body geometry, or -1 when absent.
     */
    parts: readonly number[];
    /*
     * Actual arm and obstacle geometry at an interior encounter.
     */
    frame(a: number, seconds: number): IAutoMovieMotionHumanArmGeometry.IFrame;
  }

  /*
   * What a solve reads, built once (`HumanArmTrajectoryContext.of`).
   */
  export interface IContext {
    /*
     * Native self-contact geometry at an interior material encounter.
     */
    material?: IMaterial;
    /*
     * The number of waypoints.
     */
    n: number;
    /*
     * Whether the problem is a still configuration, read without its steps,
     * speeds and sweeps and smoothed only among its inner waypoints.
     */
    still: boolean;
    /*
     * Whether the last waypoint is a variable: every arm holds its site there,
     * a hold that lasts to the end with nothing to return to; otherwise the
     * last waypoint is the arm it returns to (`back`).
     */
    open: boolean;
    /*
     * Each arm's coordinates a still configuration is drawn to, the squared
     * distance from them weighed by `HumanArmTrajectoryTerms.ANCHOR` in the
     * objective; none for an arm left free, and none for a trajectory.
     */
    anchor?: readonly (readonly number[] | undefined)[];
    /*
     * The waypoints' seconds.
     */
    times: readonly number[];
    /*
     * The fastest any speed-bounded probe may move at a second, metres a
     * second: the peak the law's own timing gives its straight course there
     * (`UNIT` times the fastest probe's straight arc over the transport's
     * seconds, and on the hold the fastest of the hold's own motion and the
     * transports'), so no course moves a point faster than the law's own timed
     * arm, and a detour takes proportionally longer, the time scaling of a
     * fixed path (Hollerbach and Flash 1982, Biol Cybern 44:67); on a span
     * fixed from outside, which cannot stretch, no less than `ENVELOPE`, a
     * daily reach's fastest hand. Set by the laid course
     * (`HumanArmTrajectoryLaid`), kept by its refinements; a problem no course
     * is laid for has no law's pace to read and none bounds it.
     */
    speed: (seconds: number) => number;
    /*
     * Each arm's coordinates one frame before the first waypoint and one after
     * the last, where the arm goes on moving there: a stretch cut from a laid
     * course (`HumanArmTrajectory.solve`), whose ends' accelerations read the
     * course beyond them; absent at an end, the arm is at rest beyond it, as at
     * an action's own rest and return.
     */
    beyond?: IContextBeyond;
    /*
     * Each arm's setup.
     */
    setups: IAutoMovieMotionHumanArmGeometry.ISetup[];
    /*
     * Each arm's frame at each waypoint.
     */
    frames: IAutoMovieMotionHumanArmGeometry.IFrame[][];
    /*
     * Each arm's site at each waypoint, on the hold.
     */
    sites: (ISite | undefined)[][];
    /*
     * Each arm's coordinates at the first waypoint.
     */
    rest: number[][];
    /*
     * Each arm's coordinates at the last waypoint, where it is not a variable
     * (`open`); the bound of the chart's disc either way.
     */
    back: number[][];
    /*
     * Each arm's free coordinates, the variables.
     */
    free: number[][];
    /*
     * Each arm's first variable within a waypoint's.
     */
    offset: number[];
    /*
     * The variables per waypoint, every arm's.
     */
    width: number;
    /*
     * Each arm's coordinates' hard bounds; none for the chart's two.
     */
    bounds: ([number, number] | null)[][];
    /*
     * The depth a probe may keep against a shape at a waypoint, metres
     * (negative inside).
     */
    allowed: (a: number, k: number, probe: number, shape: number) => number;
    /*
     * The same between a probe of one arm and a collider of the other
     * (`S.colliders`, by index), a declared rest read on the collider's bone.
     */
    between: (a: number, k: number, probe: number, shape: number) => number;
    /*
     * How much deeper than `between` a probe of one arm's segment may lie in
     * the other arm's collider shape (by index) at a waypoint when both
     * segments are in their arms' declared grasp of one object, metres; none
     * for any other pair. On the hold, where both hands are on their sites, it
     * is unbounded (`Infinity`): the pair is the allowed-collision set of the
     * shared grasp, as a motion planner's allowed-collision matrix excuses the
     * links that grasp an object. As the hands close on it and part from it, it
     * is the segment's own depth in that shape with both arms on the hold (the
     * goal's own solution, `guess`), read at that waypoint's base as the rest
     * reference is, scaled by the share of the reach made, so it falls to the
     * margin every pair keeps at rest and a parting hand cannot pass through
     * the other arm. Clearance against the body stays.
     */
    grasped: (
      a: number,
      k: number,
      own: Segment,
      other: Segment,
      shape: number,
    ) => number | undefined;
    /*
     * The depth a body corner (`G.IFrame.body`) may keep inside one of the
     * arm's own collider shapes (`S.colliders`, by index) at a waypoint, metres
     * (negative inside): the reverse of `allowed`, as the audit reads every
     * pair both ways.
     */
    inside: (a: number, k: number, corner: number, shape: number) => number;
    /*
     * Whether an arm's segment lies on a bone at a waypoint, a declared rest
     * (`IRest`).
     */
    lying: (
      a: number,
      k: number,
      segment: ContextLyingSegment,
      bone: string,
    ) => boolean;
    /*
     * Each site's outward normal, the touched collider's at the site's point.
     */
    normals: (IAutoMovieVector3 | undefined)[][];
    /*
     * Whether a probe's pair with a bone is a declared rest at a waypoint
     * (`IRest`), read both ways.
     */
    rested: (a: number, k: number, probe: number, bone: string) => boolean;
    /*
     * Each site's touched collider, the shape nearest its point; -1 where none.
     */
    touched: number[][];
    /*
     * The prepared signed height above the touched shape of each fixed site.
     */
    siteHeights: (number | undefined)[][];
    /*
     * Each arm's frame's shapes any placement of the arm can come within the
     * pairs' reach of, at each waypoint, ascending
     * (`HumanArmShapes.reachable`): the only shapes a sphere screen reads
     * there.
     */
    reachable: readonly (readonly number[])[][];
  }

  /*
   * A reading's worst violation past its slack: its excess, what it is, the
   * refusal's axis, the waypoint it is read at (an interval's first, for a step
   * or a sweep) and the term it breaks: `speed`, `swept`, `site`, `lift`,
   * `limit`, `probe`, `embedded` or `crossing`, empty when none does.
   */
  export interface IWorst {
    /*
     * The excess past the slack: millimetres, or coordinate units.
     */
    value: number;

    /*
     * Its words, for a refusal.
     */
    what: string;

    /*
     * The refusal's axis: `duration`, `target` or `region`.
     */
    axis: string;

    /*
     * The waypoint it is read at.
     */
    at: number;

    /*
     * The term it breaks; empty when none does.
     */
    term: string;
  }

  /*
   * An iterate's reading.
   */
  export interface IEvaluation {
    /*
     * Each arm placed at each waypoint.
     */
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced[][];
    /*
     * The objective.
     */
    objective: number;
    /*
     * The constraints' violations summed, millimetres.
     */
    violation: number;
    /*
     * The worst violation past its slack (`IWorst`).
     */
    worst: IWorst;

    /*
     * The worst violation past its slack of every term but the speed: what the
     * path itself breaks, whatever its pace. A path whose `placement` is within
     * the tolerance fails at most its speed, which the same path over a longer
     * span meets (Hollerbach 1984).
     */
    placement: IWorst;
    /*
     * Each arm's deepest probe pairs (`HumanArmTrajectoryPairs.deepest`) and
     * the body's corners in it (`embedded`) at each inner waypoint, as the
     * reading found them, which the convex model reads again at the same
     * iterate.
     */
    pairs: IPairsItemItem[][];
    /*
     * The one-sided clearance of each hand on a touched surface.
     */
    lifts: (HumanArmSurfaceLift.IReading | undefined)[][];
    /*
     * Each arm's probes' sweeps over each interval, by its first waypoint: the
     * axis spheres' (`HumanArmTrajectorySweep.of`) and the collider probes'
     * (`HumanArmTrajectorySweep.links`), as the reading found them; none for a
     * still configuration.
     */
    swept: HumanArmTrajectorySweep.ISwept[][][];
    /*
     * The two arms' pairs with each other at each inner waypoint
     * (`HumanArmTrajectoryPairs.crossing`, read to `CUT`), as the reading found
     * them; no entry at a waypoint that is not solved for, and none for one
     * arm.
     */
    crossing: Map<string, P.ICrossing>[];
    /*
     * Whether each waypoint takes part in a violation past its slack and
     * `TOLERANCE`, the test a trajectory is refused by: the waypoint a site, a
     * limit or a pair is read at, and both ends of an interval whose step or
     * sweep is.
     */
    failing: boolean[];
  }

  /*
   * Whether a waypoint's coordinates are variables: every waypoint but the
   * first, where the arm leaves its rest, and the last, where it returns,
   * unless the hold lasts to the end (`IContext.open`).
   * Parameter c: The context.
   * Parameter k: The waypoint.
   * Returns: Whether the waypoint is solved for.
   */
  export function inner(c: Pick<IContext, InnerC>, k: number): boolean {
    return k > 0 && (k < c.n - 1 || (c.open && k === c.n - 1));
  }

  /*
   * The iterate after a step of the convex subproblem
   * (`HumanArmTrajectoryStep`).
   */
  export const stepped: typeof HumanArmTrajectoryStep = HumanArmTrajectoryStep;

  /*
   * An arm's coordinates projected onto its hard ranges, the nearest point of
   * that convex set (a projected step, Bertsekas 1976, "On the
   * Goldstein-Levitin-Polyak gradient projection method", IEEE TAC 21:174): the
   * chart's swing brought back to the disc `invalid` reads, along its radius,
   * and each boxed coordinate clamped to its bounds. Coordinates in range are
   * returned as they are, so the one reading `invalid` refuses by holds on
   * every iterate.
   * Parameter c: The context.
   * Parameter a: The arm.
   * Parameter v: The coordinates.
   * Returns: The coordinates in range.
   */
  export function ranged(
    c: RangeContext,
    a: number,
    v: readonly number[],
  ): number[] {
    const out: number[] = [...v];
    const xy: number = Math.hypot(out[0]!, out[1]!);
    const disc: number = swing(c, a);
    if (xy > disc) {
      out[0] = (out[0]! * disc) / xy;
      out[1] = (out[1]! * disc) / xy;
    }
    c.free[a]!.forEach((d: number): void => {
      const b: [number, number] | null | undefined = c.bounds[a]![d];
      if (b !== null && b !== undefined)
        out[d] = Math.min(b[1], Math.max(b[0], out[d]!));
    });
    return out;
  }

  /*
   * The chart radius owned by HumanArmTrajectoryInvalid.swing.
   */
  export const swing: typeof HumanArmTrajectoryInvalid.swing =
    HumanArmTrajectoryInvalid.swing;

  /*
   * The objective and the constraints' violations at an iterate, read in full
   * or, given an earlier reading and the waypoints changed since it, at those
   * waypoints only (`HumanArmTrajectoryEvaluate`, which owns the reading).
   * Parameter c: The context.
   * Parameter x: Each arm's coordinates at each waypoint.
   * Parameter kept: An earlier reading of this context and the waypoints whose
   * coordinates changed since it; absent, every waypoint is read.
   * Parameter contact: The waypoints whose clearance pairs are read
   * (`HumanArmTrajectoryEvaluate`); absent, every waypoint's.
   * Returns: The arms placed, the objective, the summed violation and the worst
   * one past its slack.
   */
  export function evaluate(
    c: IContext,
    x: readonly (readonly number[])[][],
    kept?: IEvaluateKept,
    contact?: readonly boolean[],
  ): IEvaluation {
    return HumanArmTrajectoryEvaluate(c, x, kept, contact);
  }
  /*
   * Configuration validity owned by HumanArmTrajectoryInvalid.of.
   */
  export const invalid: typeof HumanArmTrajectoryInvalid =
    HumanArmTrajectoryInvalid;

  /*
   * The chart and coordinate ranges needed to project one arm.
   */
  type RangeContext = Pick<IContext, "rest" | "back" | "free" | "bounds">;

  /*
   * The record of `IEvaluateKept`'s site.
   */
  type IEvaluateKept = { reading: IEvaluation; laid: readonly boolean[] };
}

/*
 * The alternatives of `InnerC`'s site.
 */
type InnerC = "n" | "open";

/*
 * The record of `IPairsItemItem`'s site.
 */
type IPairsItemItem = {
  deepest: Map<number, P.IPair>;
  embedded: Map<number, P.IEmbedded>;
};

/*
 * The alternatives of `ContextLyingSegment`'s site.
 */
type ContextLyingSegment = "upperArm" | "lowerArm" | "hand";

/*
 * The record of `IContextBeyond`'s site.
 */
type IContextBeyond = {
  before?: readonly (readonly number[])[];
  after?: readonly (readonly number[])[];
};

/*
 * The alternatives of `RestPart`'s site.
 */
type RestPart = "upperArm" | "lowerArm";

/*
 * The record of `ISiteOn`'s site.
 */
type ISiteOn = {
  /*
   * The other arm's index in the problem.
   */
  arm: number;
  /*
   * Its segment.
   */
  owner: SiteOnOwner;
  /*
   * The point in the segment's frame.
   */
  point: IAutoMovieVector3;
  /*
   * The touched collider's outward normal there, in the segment's frame; none
   * for a grip on an object both hands hold, a closed chain whose contact is
   * held to the point on every axis.
   */
  normal?: IAutoMovieVector3;
  /*
   * The hand's rotation in the segment's frame.
   */
  rotation?: IAutoMovieQuaternion;
};

/*
 * The alternatives of `SiteOnOwner`'s site.
 */
type SiteOnOwner = "upper" | "lower" | "hand";
