import type { IAutoMovieCameraClearanceEnvelope } from "../scene/IAutoMovieCameraClearanceEnvelope";
import type { IAutoMovieCameraClearanceSample } from "./IAutoMovieCameraClearanceSample";

/** Complete deterministic input for one camera take. */
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
