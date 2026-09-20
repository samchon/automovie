import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieSoftAnchorBinding } from "./IAutoMovieSoftAnchorBinding";

/**
 * One particle held at a stated place.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IAutoMovieSoftAnchor` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMovieSoftAnchor` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMovieSoftAnchor {
  /**
   * Stable anchor identity within the domain.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `id` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `id` for the interior space soft furnishing planting system contract.
   */
  id: string;

  /**
   * Row-major particle index; `0 <= particle < columns * rows`.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `particle` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `particle` for the interior space soft furnishing planting system contract.
   */
  particle: number;

  /**
   * Where the anchor holds that particle in world space, or `null` to hold it
   * exactly at its own rest position. `null` is the honest default: a seam that
   * never moves should not have to restate a coordinate the rest mesh already
   * carries, where a typo would silently pre-stretch the panel.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `position` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `position` for the interior space soft furnishing planting system contract.
   */
  position: IAutoMovieVector3 | null;

  /**
   * Optional moving owner whose local point replaces the static position at
   * each fixed-step boundary. When present, validation requires `position` to
   * be null; the engine never silently combines the two frames.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Distinguishes world anchors from object and actor-bone anchors.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Reads one immutable evaluated owner pose before the soft solve.
   */
  binding?: IAutoMovieSoftAnchorBinding;
}
