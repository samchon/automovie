import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The airborne kernel of the gymnastic and jumping laws: a body in flight is a
 * set of joint angles, a heading and a tip, placed where its centre of mass
 * lies on the drag-free parabola its take-off speed gives.
 *
 * A flight posture is written by its joints alone, with no limb goal, so
 * placing it by its centre moves only its root and the centre read from it is
 * the one the film shows; a posture a law wrote with limb goals is first frozen
 * into the joints its own resolution gives. A rigid turn carries either kind,
 * its world goals going round with its root.
 *
 * The physics is the drag-free projectile's closed form, as the jump's flight
 * uses it: the centre rises and falls under gravity alone, so a take-off's
 * vertical speed fixes the flight time to any height, and a body that keeps its
 * shape turns at the constant mean rate of its kept angular momentum, so a
 * turn's angle is that rate times the time. A turn about the centre of mass
 * leaves that point on its parabola.
 */
export namespace IAutoMovieMotionHumanGymnasticsFlight {
  /**
   * The centre and its velocity at a ballistic instant of a plan: an instant
   * from which the plan's displayed centre follows a parabola. Result returned
   * by GymnasticsFlight.launch. The centre, world metres, and its velocity,
   * m/s.
   */
  export type ILaunchResult = {
    /** Launch centre of mass in world metres. */
    centre: IAutoMovieVector3;
    /** Launch centre-of-mass velocity in world metres per second. */
    velocity: IAutoMovieVector3;
  };
}
