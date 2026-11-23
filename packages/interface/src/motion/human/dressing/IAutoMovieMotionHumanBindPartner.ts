import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanTiming } from "../compose/IAutoMovieMotionHumanTiming";
import type { IAutoMovieMotionHumanDressPartner } from "./IAutoMovieMotionHumanDressPartner";

/**
 * Bind another performer with a held restraint: handcuffs closed on a wrist and
 * linked to the other wrist, a rope tied round the wrists or the ankles, a
 * wrist tied to a chair's back. The binder carries the restraint to the
 * partner's region as a dressing does, the restraint is worn there from the
 * arrival, and from then the bound parts keep the places they had, within the
 * link's slack, until a later grip takes the restraint off.
 */
export interface IAutoMovieMotionHumanBindPartner extends Omit<
  IAutoMovieMotionHumanDressPartner,
  "hold"
> {
  /**
   * How long the hand stays at the region before letting go: a pause of the arm
   * phrase's visit; a beat when absent.
   */
  hold?: IAutoMovieMotionHumanTiming.Pause;

  /** What the restraint binds the region to. */
  link: IAutoMovieMotionHumanBindPartner.ILink;
}

/** Companion types of {@link IAutoMovieMotionHumanBindPartner}. */
export namespace IAutoMovieMotionHumanBindPartner {
  /** The second end of the binding and its slack. */
  export interface ILink {
    /**
     * The partner's other bound region, such as the other wrist; absent when
     * the restraint binds to a target.
     */
    region?: AutoMovieHumanoidRegion;

    /**
     * The scene point the region is bound to, such as a chair's back rail;
     * absent when a second region is bound.
     */
    target?: IAutoMovieMotionTarget;

    /**
     * The most the two ends may separate, metres: a chain's or a rope's free
     * length.
     */
    slack: number;
  }
}
