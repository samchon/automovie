import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The throw's form: every coefficient of its launch, its clock, its trunk
 * and its hand's places by style, each with its source or marked provisional
 * where no study read gives the value. Read by `throwObject`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds and its reader; each member states its unit, source or provisional status.
 * @evidence contracts/development/design.md#principled-representation One closed style union and one table per coefficient keyed by it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The style and the seven tables the throw's plan reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is a share of the body's arm, so no length is stated in metres.
 */
export namespace throwObjectForm {
  /** How the object is thrown. */
  export type Style = "overarm" | "underarm" | "toss";

  /** Release angle above the horizontal by style, degrees (provisional). */
  export const ANGLE: Readonly<Record<Style, number>> = {
    overarm: 20,
    underarm: 40,
    toss: 50,
  };

  /** Seconds before and after the release through which the hand holds the launch velocity (provisional). */
  export const CARRY: number = 0.01;

  /** Windup seconds by style (provisional). */
  export const WINDUP: Readonly<Record<Style, number>> = {
    overarm: 0.5,
    underarm: 0.45,
    toss: 0.35,
  };

  /** The trunk's turn toward the throwing side in the windup, degrees (provisional). */
  export const TURN: Readonly<Record<Style, number>> = {
    overarm: 40,
    underarm: 20,
    toss: 10,
  };

  /**
   * The trunk's forward inclination at release by style, degrees: about 30
   * degrees in the overarm throw (Fleisig, Barrentine, Zheng, Escamilla and
   * Andrews 1999, J Biomech 32:1371). No study read gives the underarm
   * throw's or the toss's, so they stay upright (provisional).
   */
  export const TILT: Readonly<Record<Style, number>> = {
    overarm: 30,
    underarm: 0,
    toss: 0,
  };

  /**
   * The throwing elbow's flexion at release by style, degrees, where a study
   * gives it: about 20 to 25 degrees in the overarm throw, so the middle of
   * that range (Fleisig et al. 1999). A style without one keeps its `PLACES`
   * release.
   */
  export const ELBOW: Readonly<Partial<Record<Style, number>>> = {
    overarm: 22.5,
  };

  /**
   * The hand's grip places around the throwing shoulder, in arm lengths of
   * the performer's floor frame: `x` toward the throwing side, `y` up, `z`
   * forward (provisional). The chamber and the finish are read from the
   * standing shoulder; the release from the shoulder of the trunk's release
   * pose, and for a style with an `ELBOW` only its direction is read, its
   * distance being the arm's at that flexion.
   */
  export const PLACES: Readonly<
    Record<Style, Record<"chamber" | "release" | "finish", IAutoMovieVector3>>
  > = {
    overarm: {
      chamber: { x: 0.35, y: 0.25, z: -0.6 },
      release: { x: 0.2, y: 0.35, z: 0.35 },
      finish: { x: -0.5, y: -0.7, z: 0.4 },
    },
    underarm: {
      chamber: { x: 0.3, y: -0.9, z: -0.55 },
      release: { x: 0.15, y: -0.65, z: 0.55 },
      finish: { x: 0.1, y: 0.1, z: 0.6 },
    },
    toss: {
      chamber: { x: 0.2, y: -0.75, z: -0.1 },
      release: { x: 0.1, y: -0.4, z: 0.55 },
      finish: { x: 0.05, y: -0.2, z: 0.6 },
    },
  };
}
