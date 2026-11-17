/** Position selection within a named floor zone, consumed by resolveAutoMovieZone. */
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
