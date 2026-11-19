import type { IAutoMovieCamera } from "../scene/IAutoMovieCamera";
import type { IAutoMovieCameraFrameEntry } from "./IAutoMovieCameraFrameEntry";

/**
 * Inputs to deterministic world-space camera path compilation.
 *
 * @evidence contracts/development/design.md#principled-representation IProps carries a staged lens and timed measured subjects; world metres, degrees and shot-local seconds remain distinct in its member contracts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Hero and alternate-take compilers use the same inputs to compileCameraMove; no rendering or platform state is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required camera and action records reuse canonical types, with the sole optional aspect fallback explicitly described.
 * @evidence contracts/development/common.md#meaningful-documentation IProps explains path generation, ordering, aspect assumptions and synchronous subject sampling.
 */
export namespace IAutoMovieCompileCameraMove {
  /**
   * One camera's admitted frame actions and measured subjects, borrowed for compilation into a fresh translation/rotation clip.
   *
   * Framing fixes the distance and the aim. The frame must show the framing's {@link FRAMING_HEIGHT_FRACTION} multiple of the subject's height vertically and of its width (twice `radius`) horizontally, each by the pinhole fit `d = (visible / 2) / tan(half-angle)`, and the camera stands at whichever distance is larger. It aims at {@link FRAMING_AIM_FRACTION} of the height above the subject's base. The camera approaches along its staged bearing, the direction from the aim point to the staged camera, so the side staging chose is kept and only the distance is solved; a camera staged on the aim point uses +Z.
   *
   * Move picks the path over the span `[start, start + duration]`, clipped to the shot, where an `"auto"` duration runs to the next entry's start or the shot end:
   *
   * - `static` holds one framed key at the start.
   * - `push-in` dollies from 1.25 to 0.8 times the framed distance, eased in and out over eight segments.
   * - `orbit` swings 45 degrees about world up around the start aim, eased over eight segments.
   * - `truck` slides one framed distance toward the camera's screen-left while looking at the subject, eased over eight segments and riding the subject's animated base when it has one; a camera staged straight above or below uses world -X as screen-left.
   * - `follow` re-frames against the animated base at 4 Hz, at least two keys, or holds one framed key for an unsampled subject. Lookahead uses a separate subject sample for the rotation, capped at the shot end, while fitting translation to the current sample.
   * - `whip` keeps the staged position and turns from the staged rotation onto the aim within 0.2 seconds, without solving a distance.
   *
   * Keys are linear, so the gap between two entries plays as a re-frame move, and a key landing within 1e-9 s of the previous one replaces it, the later framing winning. Entries must be sorted by `start` and must not overlap. A supplied lookahead must be finite and nonnegative on a follow move. The `performShot` action gate checks these premises. Compilation returns null for no entries, and throws for an unknown framing/move or a follow key count outside safe-integer representation. Subject callbacks run synchronously for truck/follow samples, are not retained by the clip, and their exceptions propagate.
   *
   * @evidence contracts/development/design.md#principled-representation Positions and subject bounds use world metres, camera fovY uses degrees and actions use shot-local seconds. performShot gates timing and camera inputs; this low-level compiler does not validate all numerical premises or guarantee visible enclosure between keys.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Hero and coverage compilation share the same camera/action/subject contracts and differ only in their staged camera, entries and clip identity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The optional aspect has a stated square fallback; it is not evidence that a narrower output contains the subject. No camera or subject identity changes the grammar.
   * @evidence contracts/development/common.md#meaningful-documentation Defines world placement, timebase, aspect fallback, input ordering, callback lifetime and the null/error outcomes.
   */
  export type IProps = {
    /** Identifier copied to the returned clip without validation or rewriting. */
    clipId: string;

    /** Staged camera: id addresses node tracks, fovY in degrees sets fit, and world transform sets bearing and whip origin. Must satisfy the framing gate's finite-position and lens premises. */
    camera: IAutoMovieCamera;

    /** Read without mutation in ascending start order, with non-overlapping shot-local spans; empty means no camera clip. Subject sizes are metres and callbacks receive shot-local seconds. */
    entries: IAutoMovieCameraFrameEntry[];

    /** Positive finite shot duration in seconds; clips explicit action ends and becomes the output clip duration. */
    shotDuration: number;

    /** Delivered width/height ratio for horizontal fit. Omitted, non-finite or non-positive values use 1; that square assumption does not bound a narrower portrait frame. */
    aspect?: number;
  };
}
