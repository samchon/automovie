import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeCourse } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { EquineFlightClock } from "./EquineFlightClock";
import { QuadrupedHoofTrack } from "./QuadrupedHoofTrack";
import type { QuadrupedPoleSwing } from "./QuadrupedPoleSwing";
import type { QuadrupedRidePose } from "./QuadrupedRidePose";

/**
 * One limb's ride goal at a sample: its hoof track's foothold or swing point, carried by the flying body in a jump's flight, lifted by its gait's arc, the footing's extra lift and the poles it crosses, and folded at the carpus or hock by its gait.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal's parts and where each comes from.
 * @evidence contracts/development/design.md#principled-representation The limb's sample state in, one pose goal out.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rideQuadruped` for each limb at each sample.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace QuadrupedSwingGoal {
  /**
   * A limb's step at a phase: its stance, whether it is planted, its swing's progress and rise (`QuadrupedHoofTrack.step`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a step holds and its source.
   * @evidence contracts/development/design.md#principled-representation The return type of the hoof track's step, not a second record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by `QuadrupedHoofTrack`; named here for the swing goal.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copy of the record.
   */
  export type Step = ReturnType<typeof QuadrupedHoofTrack.step>;

  /**
   * The end of the body a limb belongs to, as the gait's lift and fold name it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two ends the gait's lift and fold key on.
   * @evidence contracts/development/design.md#principled-representation The keys of the gait's lift record, so the two never drift apart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by `AutoMovieArchetypeQuadrupedGait`; named here for the swing goal.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No restated literals.
   */
  export type End = keyof AutoMovieArchetypeQuadrupedGait.IGait["lift"];

  /**
   * One limb's state at a sample.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit or role.
   * @evidence contracts/development/design.md#principled-representation The values the ride already reads for the limb.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `rideQuadruped`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IInput {
    /** The limb. */
    limb: AutoMovieArchetypeQuadrupedBody.Limb;
    /** The landing index of the stance it is in or has just left. */
    index: number;
    /** The gait of that stance's stride. */
    gait: AutoMovieArchetypeQuadrupedGait.IGait;
    /** The animal's height at the withers, metres. */
    withers: number;
    /** The limb's five actual neutral joints, model metres. */
    rest: readonly IAutoMovieVector3[];
    /** The limb's step. */
    step: Step;
    /** The stance a swing goes to; absent while planted. */
    following: QuadrupedHoofTrack.IStance | undefined;
    /** Whether footholds are anchored in the world. */
    worldAnchors: boolean;
    /** The authored footing, absent on level ground. */
    ground: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined;
    /** Whether this is a jump's trial assembly, which reads no footing for its footholds. */
    trial: boolean;
    /**
     * The hoof's foothold mover, clear of the footing's concave edges.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the world point it takes and the cleared point it returns, metres.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback the caller supplies; its implementation is the caller's.
     */
    clear: (point: IAutoMovieVector3) => IAutoMovieVector3;
    /** Whether the swing is carried by the flying body of a jump. */
    carried: boolean;
    /**
     * The course state at a second with the body's displayed placement.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the film second it takes and the course state it returns.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback the caller supplies; its implementation is the caller's.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback the caller supplies; its implementation is the caller's.
     */
    shown: (seconds: number) => AutoMovieArchetypeCourse.IState;
    /** The current course state with the body's displayed placement. */
    current: AutoMovieArchetypeCourse.IState;
    /** The swing's liftoff second. */
    off: number;
    /** The swing's landing second. */
    on: number;
    /** The share of the gait's lift and fold the speed calls for, 0 to 1. */
    going: number;
    /** The ride's pole apexes, absent when its footing has no poles. */
    crossings: QuadrupedPoleSwing.Crossings | undefined;
  }

  /**
   * The limb's pose goal.
   *
   * @param input The limb's state at the sample.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the output.
   * @evidence contracts/development/implementation.md#principled-implementation The hoof track's target, carried in a jump's flight (`EquineFlightClock.swing`); the lift is the gait's height, by landmark when stated, plus the footing's lift, raised to a crossed pole's apex (`QuadrupedPoleSwing`), times the swing's rise; the fold the gait's times the rise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One aim, one goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A planted or flying hoof reads no pole apex.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beside the track and pole reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The pole apex is cached by its reader.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one goal.
   */
  export function of(input: IInput): QuadrupedRidePose.IGoal {
    const { gait, rest, step, carried, going, off, on }: IInput = input;
    const fore: boolean = input.limb.endsWith("Fore");
    const end: End = fore ? "fore" : "hind";
    const height: number =
      gait.elevation === undefined
        ? gait.lift[end] * input.withers
        : QuadrupedHoofTrack.elevation(rest, gait.elevation, fore);
    const aim = (
      moment: AutoMovieArchetypeCourse.IState,
      amount: number,
    ): EquineFlightClock.IAim =>
      QuadrupedHoofTrack.target(
        moment,
        rest[4]!,
        step.from,
        input.following,
        amount,
        input.worldAnchors,
        input.trial ? undefined : input.ground,
        rest[0]!.z + rest[4]!.z - rest[3]!.z,
        input.clear,
      );
    return {
      ...(carried
        ? EquineFlightClock.swing(
            aim,
            input.shown,
            input.current,
            off,
            on,
            step.along,
          )
        : aim(input.current, step.along)),
      lift:
        Math.max(
          going * height + (input.ground?.swingLift ?? 0),
          step.planted || carried
            ? 0
            : (input.crossings?.(input.limb, input.index, rest, aim, off, on) ??
                0),
        ) * step.rise,
      fold: going * gait.fold[end] * step.rise,
    };
  }
}
