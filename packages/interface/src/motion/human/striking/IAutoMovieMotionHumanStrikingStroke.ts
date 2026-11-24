import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieSuperposeMinimumJerk } from "../../IAutoMovieSuperposeMinimumJerk";
import type { IAutoMovieMotionHumanStrikingAim } from "./IAutoMovieMotionHumanStrikingAim";

/**
 * One strike's end-joint path (the wrist or the ankle), from its launch through
 * an optional via point (a kick's chamber) to its contact and back, as
 * superposed minimum-jerk units, with the target's online corrections and the
 * stop at the first surface the weapon meets.
 *
 * A strike aims through its target: its delivery unit would end beyond the
 * contact point, at the share where its speed has fallen to the measured share
 * of its peak at impact ({@link impactShare}), so it lands moving fast instead
 * of arriving at rest. The unit's end is placed along the strike's declared
 * impact direction (straight on, across for a hook or a round kick, up for an
 * uppercut), and a correcting unit over the same span puts the joint exactly on
 * the contact point at the contact second. Units start with zero velocity and
 * acceleration, so the path is continuous in position, velocity and
 * acceleration everywhere except at a contact, where the weapon stops on the
 * surface it met (an impact) and recoils from there on a minimum-jerk unit to
 * its return point.
 */
export namespace IAutoMovieMotionHumanStrikingStroke {
  /** A planned delivery, film seconds and world metres. */
  export interface IDelivery {
    /** The end joint at the launch. */
    origin: IAutoMovieVector3;

    /**
     * An optional via point (a chamber) with the second it is reached and how
     * early the delivery overlaps it.
     */
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
     * The joint's peak speed on the delivery unit, m/s: the unit then starts so
     * late that it reaches this peak, the joint holding its place before. When
     * the delivery is too short for that (the unit would have to start before
     * the launch), the unit spans the whole delivery and its peak exceeds this
     * one. Absent, the unit spans the whole delivery from the launch.
     */
    peak?: number;
  }

  /** What a stroke evaluates. */
  export interface IInput {
    /** The end joint at the launch, world metres. */
    origin: IAutoMovieVector3;

    /** The delivery's units. */
    units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[];

    /** The target's corrections, when the strike tracks one. */
    tracker?: IAutoMovieMotionHumanStrikingAim.ITracker;

    /**
     * The planned contact, film seconds: the free recoil starts here when
     * nothing is met.
     */
    contact: number;

    /**
     * Where the joint returns to, read when the return starts (at the contact
     * or the stop), so it may rest on what arrives before then (a step
     * corrected over the delivery).
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
     * The contact second the performance resolved jointly with every other
     * weapon (`resolveAutoMovieContactEvents`), or null when it resolved that
     * the weapon meets nothing; absent, as for a weapon the performance does
     * not resolve, the stroke meets nothing.
     */
    fixed?: number | null;
  }

  /** An evaluated stroke. */
  export interface IStroke {
    /**
     * The end joint at a second.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     */
    end(seconds: number): IAutoMovieVector3;

    /**
     * The second the weapon met a surface, when it has by a second.
     *
     * @param seconds Film seconds.
     * @returns The contact second, or undefined.
     */
    stop(seconds: number): number | undefined;

    /**
     * The end joint on its free path, as if it met nothing: what a joint
     * contact resolution sweeps.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     */
    free(seconds: number): IAutoMovieVector3;
  }
}
