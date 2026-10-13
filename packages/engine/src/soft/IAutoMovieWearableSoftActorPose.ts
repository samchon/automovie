import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";

/** Evaluated actor skeleton available to one soft fixed step. */
export interface IAutoMovieWearableSoftActorPose {
  /** Stable actor participant identity. */
  actor: string;
  /** Resolved humanoid bones at this boundary. */
  bones: readonly IAutoMovieResolvedBone[];
}
