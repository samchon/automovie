import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One exact source-authored instance transform and sparse override.
 *
 * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Exposes `IAutoMovieExplicitInstanceTransform` as the portable data boundary for the map coordinate transform precision requirement.
 * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Types `IAutoMovieExplicitInstanceTransform` for the world site transform lineage precision system contract.
 */
export interface IAutoMovieExplicitInstanceTransform {
  /**
   * Stable non-blank identity unique inside the set.
   *
   * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Exposes `id` as the portable data boundary for the map coordinate transform precision requirement.
   * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Types `id` for the world site transform lineage precision system contract.
   */
  id: string;
  /**
   * Translation relative to the set anchor, in meters.
   *
   * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Exposes `translation` as the portable data boundary for the map coordinate transform precision requirement.
   * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Types `translation` for the world site transform lineage precision system contract.
   */
  translation: IAutoMovieVector3;
  /**
   * Exact unit quaternion in glTF `(x, y, z, w)` order.
   *
   * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Exposes `rotation` as the portable data boundary for the map coordinate transform precision requirement.
   * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Types `rotation` for the world site transform lineage precision system contract.
   */
  rotation: IAutoMovieQuaternion;
  /**
   * Strictly positive scale on each local axis.
   *
   * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Exposes `scale` as the portable data boundary for the map coordinate transform precision requirement.
   * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Types `scale` for the world site transform lineage precision system contract.
   */
  scale: IAutoMovieVector3;
  /**
   * Optional prototype id; omitted selects the set's default prototype.
   *
   * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Exposes `prototype` as the portable data boundary for the map coordinate transform precision requirement.
   * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Types `prototype` for the world site transform lineage precision system contract.
   */
  prototype?: string;
  /**
   * Omitted means visible.
   *
   * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Exposes `visible` as the portable data boundary for the map coordinate transform precision requirement.
   * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Types `visible` for the world site transform lineage precision system contract.
   */
  visible?: boolean;
  /**
   * Optional exact `#RRGGBB` palette override.
   *
   * Decoded from sRGB by `srgbHexToLinearColor` like every other palette entry;
   * see `IAutoMovieInstanceVariation.palette` for how that differs from
   * `IAutoMovieColor`.
   *
   * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Exposes `palette` as the portable data boundary for the map coordinate transform precision requirement.
   * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Types `palette` for the world site transform lineage precision system contract.
   */
  palette?: string;
  /**
   * Optional exact overrides for declared numeric traits.
   *
   * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Exposes `traits` as the portable data boundary for the map coordinate transform precision requirement.
   * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Types `traits` for the world site transform lineage precision system contract.
   */
  traits?: Record<string, number>;
}
