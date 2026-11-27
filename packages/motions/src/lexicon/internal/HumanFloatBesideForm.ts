import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The side float's form: the pitches, angles, reaches and shares the float is
 * laid by.
 */
export namespace HumanFloatBesideForm {
  /*
   * The trunk's forward pitch while floating, degrees: provisional, the body
   * trailing 20 degrees below the horizontal, near the front crawl's 80 of
   * `AquaticRescue`.
   */
  export const PITCH: number = 70;

  /*
   * The neck's extension that lifts the face toward the horse's head, degrees:
   * provisional.
   */
  export const NECK: number = -30;

  /*
   * The mouth's height above the surface, metres: the towed victim's clearance
   * in `AquaticRescue`.
   */
  export const CLEAR: number = 0.08;

  /*
   * Seconds of one flutter-kick cycle: provisional.
   */
  export const KICK: number = 0.8;

  /*
   * The hips' mean flexion and its flutter amplitude, degrees: provisional.
   */
  export const HIP: readonly [number, number] = [10, 15];

  /*
   * The knees' mean flexion and its flutter amplitude, degrees: provisional.
   */
  export const KNEE: readonly [number, number] = [25, 15];

  /*
   * The share of the near arm's length from shoulder to palm the float keeps
   * between the shoulder and the held part: provisional, a bent but working
   * arm.
   */
  export const REACH_SHARE: number = 0.75;

  /*
   * Degrees the near shoulder sits behind the held part's lateral line:
   * provisional, the body trailing along the horse.
   */
  export const TRAIL: number = 20;

  /*
   * Metres the slide-off path rises at its middle, clearing the saddle's side:
   * provisional.
   */
  export const ARC: number = 0.15;

  /*
   * The displayed palm skin's largest admitted miss of the held part's skin,
   * metres: the lead's and the handles' contact tolerance.
   */
  export const REACH: number = 0.01;

  /*
   * The root of the float shape measured once, before it is placed.
   */
  export const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
}
