import type { IAutoMovieQuaternion } from "@automovie/interface";

/** Aligned rigid-map dual quaternion; real is rotation and dual carries metres. */
export interface IBodyBoneDualQuaternion {
  real: IAutoMovieQuaternion;
  dual: IAutoMovieQuaternion;
}
