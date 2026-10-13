import { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * The two bone-local articulation deltas a two-bone solve produces: apply
 * `upper` on the chain-root joint and `lower` on the mid joint (each lowered
 * into clinical angles by the caller's own axes/rest-frame conventions).
 */
export interface IAutoMovieTwoBoneArticulation {
  /** Bone-local articulation delta for the chain-root joint. */
  upper: IAutoMovieQuaternion;

  /** Bone-local articulation delta for the mid joint. */
  lower: IAutoMovieQuaternion;
}
