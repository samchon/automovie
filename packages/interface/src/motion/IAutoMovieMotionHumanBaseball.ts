import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Baseball and softball positions without the bat's swing or the pitch : the
 * catcher's crouch, fielding a ground ball, and the batting stance with its
 * load. The glove hand is the left; no glove or bat is held.
 *
 * - Catcher's crouch: the hips sink to a half squat (`exercise.drop`, provisional
 *   for a catcher) with the trunk pitched 20 degrees, the glove presented palm
 *   forward 0.6 of the arm ahead of the crouched chest, the throwing fist
 *   behind the right knee.
 * - Ground ball: a squat to parallel thighs with the trunk inclined, the spine
 *   taking what the folded hips leave the pelvis
 *   (`AutoMovieMotionHumanTrunk.sunk`), until the shoulders stand where the
 *   reaching arm takes the glove, which stands on its fingertips on the floor
 *   0.3 of the arm ahead of them, open forward and up, the throwing hand above
 *   it to cover the ball (provisional places).
 * - Batting stance: the left foot steps out to two shoulder widths, the knees
 *   give 3 % of the stature, both fists stacked on the implied bat's handle
 *   `HANDS` of the arm ahead of the right shoulder; the load at the stroke
 *   draws the hands a tenth of the arm back (provisional; the load precedes the
 *   stride, Welch et al. 1995).
 *
 * Each is a phrase: into the position in 0.8 s, held, and back to standing in
 * 0.8 s (provisional).
 *
 * Not drafted: the swing, the bunt and the check swing (the implement strike
 * owner's, whose file does not exist yet), the pitch (a row of the throw law),
 * the windmill pitch, the catcher's throw and base running slides.
 */
export namespace IAutoMovieMotionHumanBaseball {
  /** Parameters. */
  export interface IParams {
    /** The position. */
    kind: IAutoMovieMotionHumanBaseball.Kind;

    /** Seconds held, at least 0; 1 when absent. */
    hold?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** Capture cases of the baseball positions from quiet standing. The positions. */
  export type Kind = "catcherCrouch" | "groundBall" | "battingStance";
}
