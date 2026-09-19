import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A deterministic draught pushing on the panel.
 *
 * The gust is a **triangular** wave rather than a sinusoid on purpose. Only `+
 * − × ÷`, `Math.abs`, `Math.floor` and `Math.sqrt` are exactly specified by
 * IEEE-754 and ECMAScript alike; `Math.sin` is implementation-approximated, and
 * a curtain whose folds depend on which engine built the frame is not a
 * deterministic curtain.
 *
 * The draught is uniform over the panel and does not resolve the local surface
 * normal, so it billows a hanging curtain rather than modelling lift. That is
 * the bounded first tier, stated here instead of implied by a coefficient.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IAutoMovieSoftWind` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMovieSoftWind` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMovieSoftWind {
  /**
   * Direction the draught pushes; non-zero and need not be unit.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `direction` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `direction` for the interior space soft furnishing planting system contract.
   */
  direction: IAutoMovieVector3;

  /**
   * Steady component of the draught's acceleration in m/s²; may be negative.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `acceleration` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `acceleration` for the interior space soft furnishing planting system contract.
   */
  acceleration: number;

  /**
   * Amplitude of the triangular gust in m/s²; `>= 0`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `gustAcceleration` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `gustAcceleration` for the interior space soft furnishing planting system contract.
   */
  gustAcceleration: number;

  /**
   * Gust frequency in Hz; `>= 0`, where `0` holds the gust at its peak.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `gustHz` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `gustHz` for the interior space soft furnishing planting system contract.
   */
  gustHz: number;
}
