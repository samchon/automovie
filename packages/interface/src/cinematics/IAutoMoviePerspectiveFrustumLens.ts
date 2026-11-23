import type { IAutoMovieDeliveryCrop } from "./IAutoMovieDeliveryCrop";

/**
 * Perspective gate and depth interval shared by frustum intersection queries.
 *
 * Callers admit finite positive lens scalars, near below far and representable
 * arithmetic. deliveryCropNdc validates a supplied crop when a query reaches
 * its side-plane calculation; earlier sphere/depth rejection can skip it.
 * Queries borrow this record synchronously without mutation or retention.
 */
export interface IAutoMoviePerspectiveFrustumLens {
  /** Positive finite near depth in camera metres, strictly below far. */
  near: number;

  /** Finite far depth in camera metres, strictly above near. */
  far: number;

  /** Positive finite tan(vertical field of view / 2), dimensionless. */
  halfY: number;

  /** Positive finite uncropped gate width divided by height. */
  aspect: number;

  /** Normalized top-left pixel-edge crop; omission uses the complete gate. */
  crop?: IAutoMovieDeliveryCrop;
}
