import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieSoftBodyDomain } from "./IAutoMovieSoftBodyDomain";
import type { IAutoMovieSoftFurnishing } from "./IAutoMovieSoftFurnishing";

/**
 * Architecture/cloth binding request with explicit domain-ownership check
 * policy.
 */
export namespace IAutoMovieValidateSoftFurnishings {
  /**
   * Borrowed building, furnishing and cloth records for reference admission and
   * initial held-particle containment. Every supplied domain is validated, even
   * when furnishings is empty or domainOwnership is prevalidated. Duplicate
   * domain ids are reported while lookup selects the last record; building
   * identity admission is the caller's responsibility.
   *
   * Static anchors and a valid selected named state are applied before room
   * checks. A missing state is reported, then base targets are used for
   * containment. Volume-less rooms skip geometric checks; volume checks inspect
   * particle points, not faces or later trajectories. Moving bindings are not
   * evaluated. Domains rejected by admission can still reach configuration
   * inspection when rest-array length matches, so malformed containers or
   * derived numerical failures may throw.
   *
   * Inputs remain unchanged. Returned violations may retain offending values or
   * newly measured points; no state history or renderer resource is retained.
   */
  export type IProps = {
    /**
     * Previously admitted building whose id, spaces and element ids resolve
     * furnishing references and initial room containment.
     */
    environment: IAutoMovieBuiltEnvironment;

    /**
     * Bindings to inspect in order, including kind/mode, supports and selected
     * state; an empty list still leaves domain admission active.
     */
    furnishings: IAutoMovieSoftFurnishing[];

    /**
     * Complete candidate cloth catalogue; each entry receives
     * validateSoftBodyDomain and duplicate-id checks, whether referenced or
     * not.
     */
    domains: IAutoMovieSoftBodyDomain[];

    /**
     * Omission or validate runs the cross-furnishing domain-ownership check.
     * prevalidated skips only that check because the caller already performed
     * it over the relevant wider set; domain validation always runs.
     */
    domainOwnership?: "validate" | "prevalidated" | undefined;
  };
}
