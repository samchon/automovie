import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The single degree of freedom one moving member travels on.
 *
 * A door leaf and a lift car are the same arithmetic under different names, so
 * they share one record rather than each growing a private one: the value a
 * named state gives is a displacement from the element's own rest pose, and the
 * engine composes it after that pose so it rides down the hierarchy.
 *
 * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-operable-state Exposes `IAutoMovieTravelMotion` as the portable data boundary for the building opening operable state requirement.
 * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-operable-sweep-invariant Types `IAutoMovieTravelMotion` for the building envelope opening operable sweep invariant system contract.
 */
export type IAutoMovieTravelMotion =
  | IAutoMovieTravelMotion.IRevolute
  | IAutoMovieTravelMotion.IPrismatic;
export namespace IAutoMovieTravelMotion {
  /**
   * A hinge: the member turns about an axis through a pivot.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-circulation Exposes `IRevolute` as the portable data boundary for the building external circulation requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-exterior-circulation-input-output Types `IRevolute` for the building envelope exterior circulation input output system contract.
   */
  export interface IRevolute {
    /**
     * Discriminator.
     *
     * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-circulation Exposes `kind` as the portable data boundary for the building external circulation requirement.
     * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-exterior-circulation-input-output Types `kind` for the building envelope exterior circulation input output system contract.
     */
    kind: "revolute";

    /**
     * Non-zero turn axis in the moving element's own local frame.
     *
     * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-circulation Exposes `axis` as the portable data boundary for the building external circulation requirement.
     * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-exterior-circulation-input-output Types `axis` for the building envelope exterior circulation input output system contract.
     */
    axis: IAutoMovieVector3;

    /**
     * A point on that axis in the same local frame.
     *
     * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-circulation Exposes `pivot` as the portable data boundary for the building external circulation requirement.
     * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-exterior-circulation-input-output Types `pivot` for the building envelope exterior circulation input output system contract.
     */
    pivot: IAutoMovieVector3;

    /**
     * Lowest travel in radians; at most `0`, because rest is `0`.
     *
     * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-circulation Exposes `min` as the portable data boundary for the building external circulation requirement.
     * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-exterior-circulation-input-output Types `min` for the building envelope exterior circulation input output system contract.
     */
    min: number;

    /**
     * Highest travel in radians; at least `0`, and within a turn of `min`.
     *
     * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-circulation Exposes `max` as the portable data boundary for the building external circulation requirement.
     * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-exterior-circulation-input-output Types `max` for the building envelope exterior circulation input output system contract.
     */
    max: number;
  }

  /**
   * A slide: the member travels along an axis without turning.
   *
   * @evidence requirements/interior/scope-and-host-boundary.md#interior-without-exterior Exposes `IPrismatic` as the portable data boundary for the interior without exterior requirement.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-independent-set-state Types `IPrismatic` for the interior space independent set state system contract.
   */
  export interface IPrismatic {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/scope-and-host-boundary.md#interior-without-exterior Exposes `kind` as the portable data boundary for the interior without exterior requirement.
     * @evidence specifications/interior-space/scope-and-host.md#interior-space-independent-set-state Types `kind` for the interior space independent set state system contract.
     */
    kind: "prismatic";

    /**
     * Non-zero travel axis in the moving element's own local frame.
     *
     * @evidence requirements/interior/scope-and-host-boundary.md#interior-without-exterior Exposes `axis` as the portable data boundary for the interior without exterior requirement.
     * @evidence specifications/interior-space/scope-and-host.md#interior-space-independent-set-state Types `axis` for the interior space independent set state system contract.
     */
    axis: IAutoMovieVector3;

    /**
     * Lowest travel in metres along the unit axis; at most `0`.
     *
     * @evidence requirements/interior/scope-and-host-boundary.md#interior-without-exterior Exposes `min` as the portable data boundary for the interior without exterior requirement.
     * @evidence specifications/interior-space/scope-and-host.md#interior-space-independent-set-state Types `min` for the interior space independent set state system contract.
     */
    min: number;

    /**
     * Highest travel in metres along the unit axis; at least `0`.
     *
     * @evidence requirements/interior/scope-and-host-boundary.md#interior-without-exterior Exposes `max` as the portable data boundary for the interior without exterior requirement.
     * @evidence specifications/interior-space/scope-and-host.md#interior-space-independent-set-state Types `max` for the interior space independent set state system contract.
     */
    max: number;
  }
}
