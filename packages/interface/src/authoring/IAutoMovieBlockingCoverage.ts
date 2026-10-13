import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";

/**
 * One additional take and the staged camera that owns it.
 *
 * The take plays its single intent across the whole beat from its own staged
 * camera and carries no focus or focal length.
 *
 * @evidence contracts/common.md#principled-implementation `blockBeat` requires a staged, non-duplicated camera whose framing and move are in the closed unions, and `performShot` also refuses the elected hero camera before `compileCameraCoverage` plays the intent from time 0 across the beat.
 * @evidence contracts/common.md#clear-and-simple-design Extends `IAutoMovieBlockingCamera` with one field rather than copying its grammar, so hero and coverage intents share framing, move and subject semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Framing and move get runtime set checks here because coverage has no later coherence gate; the compiled take writes null lens intents instead of inventing a focus or focal length.
 * @evidence contracts/common.md#meaningful-documentation States that the take spans the whole beat from its own staged camera, that the id must differ from the hero and every sibling, and that no lens intent is carried.
 * @author Samchon
 */
export interface IAutoMovieBlockingCoverage extends IAutoMovieBlockingCamera {
  /**
   * Staged camera id for this take, distinct from the hero camera and from
   * every other coverage take.
   */
  camera: string;
}
