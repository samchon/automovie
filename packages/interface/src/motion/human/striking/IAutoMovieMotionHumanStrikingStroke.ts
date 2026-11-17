import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieSuperposeMinimumJerk } from "../../IAutoMovieSuperposeMinimumJerk";
import type { IAutoMovieMotionHumanStrikingAim } from "./IAutoMovieMotionHumanStrikingAim";

/**
 * One strike's end-joint path (the wrist or the ankle), from its launch
 * through an optional via point (a kick's chamber) to its contact and back,
 * as superposed minimum-jerk units, with the target's online corrections and
 * the stop at the first surface the weapon meets.
 *
 * A strike aims through its target: its delivery unit would end beyond the
 * contact point, at the share where its speed has fallen to the measured
 * share of its peak at impact ({@link impactShare}), so it lands moving fast
 * instead of arriving at rest. The unit's end is placed along the strike's
 * declared impact direction (straight on, across for a hook or a round kick,
 * up for an uppercut), and a correcting unit over the same span puts the
 * joint exactly on the contact point at the contact second. Units start with
 * zero velocity and acceleration, so the path is continuous in position,
 * velocity and acceleration everywhere except at a contact, where the weapon
 * stops on the surface it met (an impact) and recoils from there on a
 * minimum-jerk unit to its return point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation point: Chamber or via point in world metres. begin: Start of the motion toward the via point, film seconds. end: Arrival at the via point, film seconds.
 * @evidence contracts/development/design.md#principled-representation point: Chamber or via point in world metres. begin: Start of the motion toward the via point, film seconds. end: Arrival at the via point, film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingStroke.ts (StrikingStroke.create, return); striking/StrikingStroke.ts (StrikingStroke.delivery, d); striking/StrikingStroke.ts (StrikingStroke.create, input); striking/punchGeometry.ts (punchGeometry.build).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieSuperposeMinimumJerk.IUnit, IAutoMovieMotionHumanStrikingAim.ITracker identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStrikingStroke {
  /**
   * A planned delivery, film seconds and world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation World points and a direction, film-second instants, an optional via point with its timing, a speed share and an optional peak speed in m/s; the delivery's span is checked when building.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a punch and a kick (with its chamber) pass to the builder.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
   */
  export interface IDelivery {
    /** The end joint at the launch. */
    origin: IAutoMovieVector3;

    /** An optional via point (a chamber) with the second it is reached and how early the delivery overlaps it. */
    via?: {
      /** Chamber or via point in world metres. */
      point: IAutoMovieVector3;
      /** Start of the motion toward the via point, film seconds. */
      begin: number;
      /** Arrival at the via point, film seconds. */
      end: number;
      /** Seconds by which delivery begins before the chamber's end. */
      overlap: number;
    };

    /** Where the end joint is at the contact. */
    impact: IAutoMovieVector3;

    /** The direction the joint travels at the contact. */
    direction: IAutoMovieVector3;

    /** The launch, film seconds. */
    launch: number;

    /** The contact, film seconds. */
    contact: number;

    /** The share of peak speed left at the contact. */
    speed: number;

    /**
     * The joint's peak speed on the delivery unit, m/s: the unit then starts
     * so late that it reaches this peak, the joint holding its place before.
     * When the delivery is too short for that (the unit would have to start
     * before the launch), the unit spans the whole delivery and its peak
     * exceeds this one. Absent, the unit spans the whole delivery from the
     * launch.
     */
    peak?: number;
  }

  /**
   * What a stroke evaluates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and the meaning of an absent value.
   * @evidence contracts/development/design.md#principled-representation The delivery's units, optional tracking, the return in world metres and seconds, an optional own-scan gap and the jointly resolved stop, where null means resolved to meet nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the punch and kick laws pass; the gap and scan serve a stroke not resolved jointly, which the strike laws no longer use, and remain for that capability and its CI test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's units and the tracker type.
   */
  export interface IInput {
    /** The end joint at the launch, world metres. */
    origin: IAutoMovieVector3;

    /** The delivery's units. */
    units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[];

    /** The target's corrections, when the strike tracks one. */
    tracker?: IAutoMovieMotionHumanStrikingAim.ITracker;

    /** The planned contact, film seconds: the free recoil starts here when nothing is met. */
    contact: number;

    /**
     * Where the joint returns to, read when the return starts (at the
     * contact or the stop), so it may rest on what arrives before then (a
     * step corrected over the delivery).
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what is returned and when it is read.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback type with no body: the caller supplies the function, so no method, structure, cost or retention is declared here.
     */
    back(): IAutoMovieVector3;

    /** The recoil's duration, seconds. */
    recoil: number;

    /**
     * A point the recoil passes on its way back (a kick's re-chamber, which
     * clears the struck body before the foot comes down); a straight return
     * when absent.
     */
    rechamber?: IAutoMovieVector3;

    /**
     * The weapon's signed gap to the struck body at a second, given the end
     * joint's position then; positive while apart. Absent when nothing can be
     * met (a strike at the air).
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the sign and the meaning of absence.
     * @evidence contracts/development/implementation.md#principled-implementation Supplied by the caller as a signed distance from the weapon to the struck body's colliders at that second.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure A single callback the scan reads.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
     * @evidence contracts/development/implementation.md#efficient-algorithms The caller's distance query, once per scan sample.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The stroke memoises the scan, not each gap.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callback retains what its caller gives it.
     */
    gap?: (end: IAutoMovieVector3, seconds: number) => number;

    /** The contact scan's span and step, film seconds. */
    scan: {
      /** Beginning of the contact scan in film seconds. */
      from: number;
      /** End of the contact scan in film seconds. */
      to: number;
      /** Positive sample spacing of the contact scan, seconds. */
      step: number;
    };

    /**
     * The contact second the performance resolved jointly with every other
     * weapon (`resolveAutoMovieContactEvents`), or null when it resolved that
     * the weapon meets nothing; the stroke's own scan runs only when absent.
     */
    fixed?: number | null;
  }

  /**
   * An evaluated stroke.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its timebase and frame.
   * @evidence contracts/development/design.md#principled-representation The shown path, the free path and the stop as functions of the film second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three readings the strike laws compose and record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
   */
  export interface IStroke {
    /**
     * The end joint at a second.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the timebase and the frame.
     * @evidence contracts/development/implementation.md#principled-implementation The free path before the stop; after it the met point, held for the dwell and recoiling on minimum-jerk units.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One stop read and one branch.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
     * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the units.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the memoised stop.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the stroke.
     */
    end(seconds: number): IAutoMovieVector3;

    /**
     * The second the weapon met a surface, when it has by a second.
     *
     * @param seconds Film seconds.
     * @returns The contact second, or undefined.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the timebase and the meaning of undefined.
     * @evidence contracts/development/implementation.md#principled-implementation The jointly resolved second when given; otherwise the stroke's own fixed-step scan of the gap, bisected at the first crossing and never reading past the asked second.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The resolved second, the memo, then the scan.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
     * @evidence contracts/development/implementation.md#efficient-algorithms The scan advances once over its span across all calls.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The scan's progress and its found second are memoised for the stroke's life.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one scan position and one found second, released with the stroke.
     */
    stop(seconds: number): number | undefined;

    /**
     * The end joint on its free path, as if it met nothing: what a joint
     * contact resolution sweeps.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what the free path is and who reads it.
     * @evidence contracts/development/implementation.md#principled-implementation The delivery's units with the corrections started by the second, and after the planned contact the free recoil from where the units settle.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One superposition.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
     * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the units and corrections.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the second and the stroke's input.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    free(seconds: number): IAutoMovieVector3;
  }
}
