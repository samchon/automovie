import type { IAutoMovieProductionFrameRate } from "../production/IAutoMovieProductionFrameRate";
import type { IAutoMovieCamera } from "../scene/IAutoMovieCamera";
import type { IAutoMovieCameraFrameEntry } from "./IAutoMovieCameraFrameEntry";

/** Inputs to deterministic world-space camera path compilation. */
export namespace IAutoMovieCompileCameraMove {
  /**
   * One camera's admitted frame actions and measured subjects, borrowed for
   * compilation into a fresh translation/rotation clip.
   *
   * Framing fixes the distance and the aim. The frame must show the framing's
   * {@link FRAMING_HEIGHT_FRACTION} multiple of the subject's height vertically
   * and of its width (twice `radius`) horizontally, each by the pinhole fit `d
   * = (visible / 2) / tan(half-angle)`, and the camera stands at whichever
   * distance is larger. It aims at {@link FRAMING_AIM_FRACTION} of the height
   * above the subject's base. The camera approaches along its staged bearing,
   * the direction from the aim point to the staged camera, so the side staging
   * chose is kept and only the distance is solved; a camera staged on the aim
   * point uses +Z.
   *
   * Move picks the path over the span `[start, start + duration]`, clipped to
   * the shot, where an `"auto"` duration runs to the next entry's start or the
   * shot end:
   *
   * - `static` holds one framed key at the start.
   * - `push-in` dollies from 1.25 to 0.8 times the framed distance, eased in and
   *   out.
   * - `orbit` swings 45 degrees about world up around the start aim, eased in and
   *   out.
   * - `truck` slides one framed distance toward the camera's screen-left while
   *   looking at the subject, eased in and out and riding the subject's
   *   animated base when it has one; a camera staged straight above or below
   *   uses world -X as screen-left.
   * - `follow` re-frames against the animated base at every key, or holds one
   *   framed key for an unsampled subject. Lookahead uses a separate subject
   *   sample for the rotation, capped at the shot end, while fitting
   *   translation to the current sample.
   * - `whip` keeps the staged position and turns from the staged rotation onto
   *   the aim within 0.2 seconds, without solving a distance.
   *
   * Push-in, orbit, truck and follow are keyed at the span's ends and at every
   * `frameRate` frame between them, so the speed between delivered frames is
   * the eased path's own. An entry followed by another holds its last pose
   * until its span ends. An entry starting where an earlier entry of positive
   * span ended continues from the pose the camera reached, taking its bearing
   * and starting distance from that position. A moving entry eases from there
   * to its own framing's end distance, so it reverses only when that authored
   * end lies farther out. A static entry keeps the reached pose under the
   * previous entry's framing and takes its own framed distance under a
   * different one. A first pose that differs from the reached one, by a
   * re-frame or a new aim, is a step at the entry's start, the reached pose
   * kept as its own key 1e-6 s before. A gap between two entries plays as a
   * linear re-frame, and any other key landing within 1e-9 s of the previous
   * one replaces it. Entries must be sorted by `start` and must not overlap. A
   * supplied lookahead must be finite and nonnegative on a follow move. The
   * `performShot` action gate checks these premises. Compilation returns null
   * for no entries, and throws for an unknown framing/move or an invalid frame
   * rate or a frame index outside safe-integer representation. Subject
   * callbacks run synchronously for truck/follow samples, are not retained by
   * the clip, and their exceptions propagate.
   */
  export type IProps = {
    /** Identifier copied to the returned clip without validation or rewriting. */
    clipId: string;

    /**
     * Staged camera: id addresses node tracks, fovY in degrees sets fit, and
     * world transform sets bearing and whip origin. Must satisfy the framing
     * gate's finite-position and lens premises.
     */
    camera: IAutoMovieCamera;

    /**
     * Read without mutation in ascending start order, with non-overlapping
     * shot-local spans; empty means no camera clip. Subject sizes are metres
     * and callbacks receive shot-local seconds.
     */
    entries: IAutoMovieCameraFrameEntry[];

    /**
     * Positive finite shot duration in seconds; clips explicit action ends and
     * becomes the output clip duration.
     */
    shotDuration: number;

    /**
     * Delivered width/height ratio for horizontal fit. Omitted, non-finite or
     * non-positive values use 1; that square assumption does not bound a
     * narrower portrait frame.
     */
    aspect?: number;

    /**
     * Exact delivery frame rate in frames per second. Push-in, orbit, truck and
     * follow are keyed at every shot-local frame instant `k × denominator /
     * numerator` inside their spans, so a delivered frame reads the eased path
     * itself. Omitted, the compiler keys at 24 frames per second; terms that
     * are not positive safe integers throw.
     */
    frameRate?: IAutoMovieProductionFrameRate;
  };
}
