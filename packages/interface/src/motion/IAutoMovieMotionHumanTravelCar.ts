import type { IAutoMovieMotionHumanSeated } from "./IAutoMovieMotionHumanSeated";
import type { IAutoMovieMotionObstacleAperture } from "./IAutoMovieMotionObstacleAperture";

/**
 * Getting into a car through its door: the person stands in the doorway with
 * the back to the seat, sits down onto it sideways with the legs still outside,
 * then swings round on the seat to face the way the seat faces, and the head is
 * ducked under the door's top throughout. Register `HumanTravelCar.getIn` to
 * use it.
 *
 * People get into a car seat by sitting first and bringing the legs in after,
 * and lower the head under the roof's edge as they go (the "sit-then-swing"
 * entry of the ergonomics of vehicle ingress; Giacomin and Quattrocolo 1997,
 * Appl Ergon 28:261, describe it; the timing and the angles here are
 * provisional, not read from them). The sitting is `sit` onto the seat turned
 * to face out of the door; the swing turns the seated body about the seat's
 * middle by the minimum-jerk profile (Flash and Hogan 1985) over `SWING`
 * seconds. The duck is a forward flexion of the spine added wherever the crown,
 * inside the door's plane or within `HEAD` of it, would come nearer than
 * `CLEAR` to the opening's top; it is solved at `SAMPLES` instants at plan time
 * and grows and fades over `LEAD` seconds around each, so the head goes down
 * before it reaches the edge.
 *
 * Refused: an opening narrower than the body's chest (`reach` on `aperture`,
 * with the width needed), and one so low that even `DUCK` degrees of flexion
 * leave the crown above its top (`reach` on `aperture`, with the height
 * needed). First pass: the legs are carried round with the body and are not
 * lifted over the sill, and the door's leaf is taken as open.
 */
export namespace IAutoMovieMotionHumanTravelCar {
  /** Parameters of getting in. */
  export interface IParams {
    /** The seat sat on, as `AutoMovieMotionHumanObject.seat` reads it from the car. */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /** The door's opening, as `HumanObstacle.apertures` reads it from the car. */
    through: IAutoMovieMotionObstacleAperture;

    /** Seated hold forwarded to sit, seconds; sit's own when absent. */
    hold?: number;
  }
}
