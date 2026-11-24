import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A knockdown: the legs give way and the body goes down away from the blow,
 * sitting onto the floor and falling back to lie supine.
 *
 * The collapse is a buckle, not a dive: the knees and hips fold while the
 * pelvis goes back and down behind the feet (as in the stepping-response
 * failures of Maki and McIlroy 1997, where a push too large for one step ends
 * in a fall), the seat meets the floor at 0.45 s, about the free-fall time of
 * the pelvis from its height slowed by the buckling legs, and the trunk rolls
 * back until the back rests on the floor by 1.1 s, the arms trailing. The feet
 * stay where they stood until the seat lands; then the seat stays where it
 * landed and the heels slide out as the legs straighten.
 *
 * Each pose rests on the floor without penetrating it: the root's height is
 * solved so the lowest point of the body's own collision shapes touches the
 * floor. The seat and the lie are fitted to the body the same way: the knee at
 * the seat is the one that puts the feet on the floor the seat sits on, and the
 * lying arm's extension and elbow are the ones that lay the arm on the floor
 * beside the body, so any stature sits and lies on the floor exactly. The body
 * goes down away from the blow (the `from` target), turned so its back falls
 * toward that direction.
 *
 * The trunk's recline and the hip's fold at the seat are provisional readings.
 */
export namespace IAutoMovieMotionHumanKnockdown {
  /** Parameters. */
  export interface IParams {
    /** Where the blow came from; a place ahead of the performer when absent. */
    target?: IAutoMovieMotionTarget;

    /**
     * How long the body lies after landing, seconds; 1 when absent. The seat
     * lands at 0.45 s and the back rests by 1.1 s after the start, so the
     * action lasts 1.1 s plus this. 0 ends the action on the lie; a longer lie
     * fits a stunned or unconscious body.
     */
    hold?: number;
  }
}
