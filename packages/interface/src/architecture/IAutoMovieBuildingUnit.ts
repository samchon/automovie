/**
 * One building unit and the roots of its visible and logical hierarchies.
 *
 * The element root is also the unit's coordinate root, so one unit is moved,
 * turned, or tilted as a whole by its own root transform without touching the
 * others.
 *
 * @evidence requirements/building-exterior/coordinates-and-shared-boundaries.md#building-coordinate-transform-chain Exposes `IAutoMovieBuildingUnit` as the portable data boundary for the building coordinate transform chain requirement.
 * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-coordinate-input-output Types `IAutoMovieBuildingUnit` for the building envelope coordinate input output system contract.
 */
export interface IAutoMovieBuildingUnit {
  /**
   * Stable building identity within the work.
   *
   * @evidence requirements/building-exterior/coordinates-and-shared-boundaries.md#building-coordinate-transform-chain Exposes `id` as the portable data boundary for the building coordinate transform chain requirement.
   * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-coordinate-input-output Types `id` for the building envelope coordinate input output system contract.
   */
  id: string;

  /**
   * Root visible element. It must have no element parent.
   *
   * @evidence requirements/building-exterior/coordinates-and-shared-boundaries.md#building-coordinate-transform-chain Exposes `element` as the portable data boundary for the building coordinate transform chain requirement.
   * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-coordinate-input-output Types `element` for the building envelope coordinate input output system contract.
   */
  element: string;

  /**
   * Root logical space. It must have no logical-space parent.
   *
   * @evidence requirements/building-exterior/coordinates-and-shared-boundaries.md#building-coordinate-transform-chain Exposes `space` as the portable data boundary for the building coordinate transform chain requirement.
   * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-coordinate-input-output Types `space` for the building envelope coordinate input output system contract.
   */
  space: string;
}
