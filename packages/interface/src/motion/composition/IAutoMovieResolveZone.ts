/**
 * Position selection within a named floor zone, consumed by resolveAutoMovieZone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Zone selection is a landmark name or a bearing in radians from +Z toward +X with a dimensionless radius share in [0, 1]. resolveAutoMovieZone rejects unknown zones/landmarks and invalid shares; omission selects the centre and outputs keep the zone's world-metre height.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieResolveZone contracts used by packages/engine/src/composition/resolveAutoMovieZone.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Zone selection is a landmark name or a bearing in radians from +Z toward +X with a dimensionless radius share in [0, 1]. resolveAutoMovieZone rejects unknown zones/landmarks and invalid shares; omission selects the centre and outputs keep the zone's world-metre height. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieResolveZone contract belongs to interface; packages/engine/src/composition/resolveAutoMovieZone.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieResolveZone {
  /**
   * The point of a zone a move goes to: a named landmark, or the zone's centre
   * moved toward a bearing by a share of its radius, so a scene names where to
   * go and the set decides the coordinates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines landmark selection or polar floor offset with radian bearing and unitless radial share.
   * @evidence contracts/development/design.md#principled-representation resolveAutoMovieZone checks share in [0,1] and known landmark ids; callers supply finite bearing and valid zone geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The zone resolver consumes this selector and returns a fresh world position at the zone centre height for polar selection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The union separates a named point from a polar fraction instead of combining unrelated optional fields.
   */
  export type IWhere =
    | string
    | {
        /** Horizontal radians from world +Z toward +X; caller supplies a finite angle, with no runtime normalization or validation. */
        bearing: number;
        /** Radial fraction in [0, 1], checked by resolveAutoMovieZone; zero selects the centre and one the boundary. Height remains zone.center.y. */
        share: number;
      };
}
