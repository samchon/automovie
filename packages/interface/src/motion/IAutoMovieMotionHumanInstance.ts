/**
 * An instanced member: a performer that displays a template member's placed
 * posture, read whole film frames earlier and moved rigidly by the offset it
 * stands at from the template, so a rear rank marching with its front rank
 * costs no plans and no fits of its own.
 *
 * At its start the law reads where it stands relative to the template, in the
 * template's heading frame: an offset and a turn. Each posture is the
 * template's at `t - shift / 24` with the root, every limb goal's world point
 * and bend, and every goal's rotation moved by that offset and turn about the
 * template's root; a goal's contact lies in its end joint's own rest frame and
 * turns with the joint, so it is kept; joint angles are the template's. So the
 * instance's feet are planted where the template's are, moved, and a gaze layer
 * on it still looks at its own target. The move stays rigid only while the
 * template keeps its heading, so a span in which the template turns by more
 * than `TURN` refuses (a wheel needs full members), and so does a template on
 * another body, whose limbs the instance would carry. A goal attached to a bone
 * is in that bone's frame and is kept; a goal that keeps clear of or rests on
 * world colliders is refused, since those belong to the template's place. The
 * instance gives up its own per-step draws for one whole-frame shift: the
 * declared price of `IAutoMovieMotionHumanEnsemble.detail`.
 *
 * Its contact windows are none: a planted goal it carries is the template's,
 * moved, and the slip of an instance is the template's own.
 */
export namespace IAutoMovieMotionHumanInstance {
  /** Parameters. */
  export interface IParams {
    /** The template performer, composed before the instance. */
    of: string;

    /** How long the instance lasts, seconds, positive. */
    duration: number;

    /** Whole film frames it lags the template by, at least 0; 0 when absent. */
    shift?: number;
  }
}
