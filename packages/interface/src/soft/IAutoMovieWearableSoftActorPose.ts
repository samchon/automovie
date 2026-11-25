import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";

/** One evaluated actor's resolved bone frames at an absolute soft step. */
export interface IAutoMovieWearableSoftActorPose {
  /** Stable actor participant identity. */
  actor: string;

  /** Resolved humanoid bones at this boundary. */
  bones: readonly IAutoMovieResolvedBone[];
}
