import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanWeaponPresent,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A presentation's stance and pose.
 */
export interface IHumanWeaponPosePosed {
  /*
   * The trunk's whole turn, degrees, positive toward the performer's left: a
   * long gun's blade toward the firing side on foot, with a seated performer's
   * turn toward the target.
   */
  turn: number;

  /*
   * The entry posture with the trunk turned and the supporting hand on its
   * planned handle.
   */
  bladed: IAutoMovieMotionHumanPosture;

  /*
   * The sight line's start, world metres.
   */
  eye: IAutoMovieVector3;

  /*
   * What is aimed at, world metres.
   */
  target: IAutoMovieVector3;

  /*
   * The unit direction from the root to the target on the floor.
   */
  line: IAutoMovieVector3;

  /*
   * How the weapon is carried.
   */
  carriage: IAutoMovieMotionHumanWeaponPresent.Carriage;

  /*
   * The firing hand's grip frame the carriage asks.
   */
  pose: IAutoMovieMotionHumanStrikingHeld.IHandFrame;

  /*
   * Tool geometry in the hand frame, using both prop ends for a one-hand
   * shoulder carriage.
   */
  tool: IAutoMovieMotionHumanStrikingHeld.ITool;

  /*
   * Distance in metres from the tip to the point the stroke keeps.
   */
  back: number;
}
