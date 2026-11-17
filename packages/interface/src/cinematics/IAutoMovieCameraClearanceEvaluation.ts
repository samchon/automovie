import type { IAutoMovieCameraClearanceEnvelope } from "../scene/IAutoMovieCameraClearanceEnvelope";
import type { IAutoMovieCameraClearanceSample } from "./IAutoMovieCameraClearanceSample";

/**
 * Complete deterministic input for one camera take.
 *
 * @evidence contracts/development/design.md#principled-representation Revision identities, a camera-local sphere envelope and world-space samples bind one shot-local second clock; evaluateCameraClearance checks positive finite rate, nonnegative duration and a complete ordered sample grid.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The clearance compiler supplies the same explicit plan the pure evaluator reads, without exposing scene evaluation or renderer objects.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Revision mismatch returns stale; interpolation between samples still requires linear translation, constant scale, bounded obstacle motion and the documented rotation approximation.
 * @evidence contracts/development/common.md#meaningful-documentation States revision comparison, sample clock, geometry frames and caller-owned intersample premises.
 */
export interface IAutoMovieCameraClearanceEvaluation {
  /** Resolved camera identity. */
  camera: string;

  /** Camera-local body and optional parent-rig envelope. */
  envelope: IAutoMovieCameraClearanceEnvelope;

  /** Geometry revision from which the obstacle states were read. */
  revision: string;

  /** Geometry revision that remains current at evaluation time. */
  currentRevision: string;

  /** Endpoint-inclusive fixed-clock samples per second. */
  sampleRate: number;

  /** Shot duration in seconds. */
  duration: number;

  /** State at every base fixed-clock and additional causal-key instant. */
  samples: IAutoMovieCameraClearanceSample[];
}
