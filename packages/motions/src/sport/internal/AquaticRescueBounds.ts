/**
 * The bounds an aquatic rescue is laid by: its swim, tow and grip, its
 * clearances and its stroke and kick.
 */
export namespace AquaticRescueBounds {
  /**
   * A lifeguard's approach swim, metres per second: provisional, a sustained
   * sprint front crawl.
   */
  export const SWIM: number = 1.2;

  /**
   * The tow, metres per second: provisional, inside the 0.4 to 1.0 m/s rescue
   * band.
   */
  export const TOW: number = 0.6;

  /** Seconds to take the cross-chest hold once alongside: provisional. */
  export const GRIP: number = 0.6;

  /**
   * The rescuer's pelvis behind the victim's during the tow, metres:
   * provisional, the rescuer's chest just behind the victim's back.
   */
  export const BEHIND: number = 0.65;

  /** The victim stops this far short of the edge, metres: a reach for the deck. */
  export const SHORT: number = 0.5;

  /** The towed victim's mouth above the surface, metres: provisional. */
  export const CLEAR: number = 0.08;

  /**
   * How far short of the hold the crawl stops, metres: provisional, beyond a
   * struggling victim's reach.
   */
  export const STANDOFF: number = 0.8;

  /**
   * Seconds before reaching the victim over which the crawl's strokes die away:
   * provisional, about one stroke.
   */
  export const NEAR: number = 1.2;

  /** Seconds of one front-crawl arm cycle on the approach: provisional. */
  export const STROKE: number = 1.2;

  /** Seconds of one scissor kick: provisional. */
  export const KICK: number = 1;
}
