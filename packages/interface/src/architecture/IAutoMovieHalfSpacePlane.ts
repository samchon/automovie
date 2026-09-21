import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One world-space half-space plane used by a logical volume.
 *
 * @evidence requirements/interior/spatial-hierarchy-and-zones.md#interior-space-boundaries Exposes `IAutoMovieHalfSpacePlane` as the portable data boundary for the interior space boundaries requirement.
 * @evidence specifications/interior-space/space-level-zone-topology.md#interior-space-hierarchy-zone-overlay Types `IAutoMovieHalfSpacePlane` for the interior space hierarchy zone overlay system contract.
 */
export interface IAutoMovieHalfSpacePlane {
  /**
   * Non-zero plane normal; it need not be normalized.
   *
   * @evidence requirements/interior/spatial-hierarchy-and-zones.md#interior-space-boundaries Exposes `normal` as the portable data boundary for the interior space boundaries requirement.
   * @evidence specifications/interior-space/space-level-zone-topology.md#interior-space-hierarchy-zone-overlay Types `normal` for the interior space hierarchy zone overlay system contract.
   */
  normal: IAutoMovieVector3;

  /**
   * Finite plane offset in the same scale as the normal.
   *
   * @evidence requirements/interior/spatial-hierarchy-and-zones.md#interior-space-boundaries Exposes `offset` as the portable data boundary for the interior space boundaries requirement.
   * @evidence specifications/interior-space/space-level-zone-topology.md#interior-space-hierarchy-zone-overlay Types `offset` for the interior space hierarchy zone overlay system contract.
   */
  offset: number;
}
