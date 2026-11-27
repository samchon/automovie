import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanStrikingReach } from "./IAutoMovieMotionHumanStrikingReach";

/**
 * What a planned strike decided, for audits and captures: the landing offset it
 * intended (declared accuracy plus seeded scatter), the goal it planned at its
 * launch, how its reach solve came out, and the second its weapon met a
 * surface. Audits compare a strike against this plan, so a clumsy strike still
 * passes when it lands where it meant to.
 *
 * Each strike's plan carries its record (IPlan.record), built on demand from
 * the plan's geometry, so reading one evaluates the strike's postures.
 */
export namespace IAutoMovieMotionHumanStrikingRecord {
  /** One strike's decisions. */
  export interface IRecord {
    /**
     * The end joint of the limb that carries the weapon: the punching hand, or
     * the foot of the kicking or kneeing leg.
     */
    limb: "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

    /** The intended landing offset from the aim point, world metres. */
    offset: IAutoMovieVector3;

    /** The contact goal predicted at the launch, offset included, world metres. */
    planned: IAutoMovieVector3;

    /**
     * Where the weapon's surface reaches at the planned contact, world metres:
     * the planned point, or the limb's highest or farthest reachable point when
     * the target lies beyond it.
     */
    reached: IAutoMovieVector3;

    /** The reach solve's status at the planned contact. */
    status: IAutoMovieMotionHumanStrikingReach.ISolution["status"];

    /**
     * The film second the weapon met a surface by a second, if it has.
     *
     * @param seconds Film seconds.
     * @returns The contact second, or undefined.
     */
    stop(seconds: number): number | undefined;
  }

  /**
   * A strike's plan: the plan itself carries its record, built on demand from
   * its current geometry and committed stop.
   */
  export interface IPlan extends IAutoMovieMotionHumanActionPlan {
    /**
     * What the strike decided, read from its current geometry.
     *
     * @returns The record.
     */
    record(): IAutoMovieMotionHumanStrikingRecord.IRecord;
  }
}
