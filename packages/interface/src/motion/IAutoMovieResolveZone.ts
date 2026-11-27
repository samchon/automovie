/**
 * Position selection within a named floor zone, consumed by
 * resolveZone.
 */
export namespace IAutoMovieResolveZone {
  /**
   * The point of a zone a move goes to: a named landmark, or the zone's centre
   * moved toward a bearing by a share of its radius, so a scene names where to
   * go and the set decides the coordinates.
   */
  export type IWhere =
    | string
    | {
        /**
         * Horizontal radians from world +Z toward +X; caller supplies a finite
         * angle, with no runtime normalization or validation.
         */
        bearing: number;
        /**
         * Radial fraction in [0, 1], checked by resolveZone; zero
         * selects the centre and one the boundary. Height remains
         * zone.center.y.
         */
        share: number;
      };
}
