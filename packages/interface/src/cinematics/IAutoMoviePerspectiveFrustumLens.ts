import type { IAutoMovieDeliveryCrop } from "./IAutoMovieDeliveryCrop";

/**
 * Perspective gate and depth interval shared by frustum intersection queries.
 *
 * Callers admit finite positive lens scalars, near below far and representable
 * arithmetic. deliveryCropNdc validates a supplied crop when a query reaches
 * its side-plane calculation; earlier sphere/depth rejection can skip it.
 * Queries borrow this record synchronously without mutation or retention.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines depth and gate units, finite ordered premises, omitted crop and conditional crop admission.
 * @evidence contracts/development/design.md#principled-representation near and far use camera-space metres; halfY and aspect define the uncropped perspective gate without conflating FOV degrees with its tangent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Box, segment and sphere frustum queries share this lens while keeping their geometry and rejection policies separate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This input is not a validated camera certificate and does not promise exact floating-point boundary predicates.
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
