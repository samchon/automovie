import type { IAutoMovieCameraClearanceEnvelope } from "@automovie/interface";

import type { IFilmCameraClearanceSample } from "./IFilmCameraClearanceSample";

/** Original evaluator override fields without changing defaults or optionality. */
export interface IFilmCameraClearanceEvaluationOverrides {
  /** Optional original body and parent-rig envelope. */
  envelope?: IAutoMovieCameraClearanceEnvelope;

  /** Optional geometry revision being read. */
  revision?: string;

  /** Optional current geometry revision. */
  currentRevision?: string;

  /** Optional fixed-clock rate in hertz. */
  sampleRate?: number;

  /** Optional shot duration in seconds. */
  duration?: number;

  /** Optional existing sampled readings. */
  samples?: IFilmCameraClearanceSample[];
}
