import type { IAutoMovieBuiltEnvironment } from "./IAutoMovieBuiltEnvironment";

/**
 * Building-wide support scan with an optional world ground plane and contact
 * slack.
 */
export namespace IAutoMovieBuiltEnvironmentSupportSweep {
  /**
   * Building-wide support scan with an optional world ground plane and contact
   * slack.
   *
   * The requirement this answers asks for two capabilities in one sentence:
   * express what supports what, and find the floating or disconnected elements.
   * {@link builtEnvironmentSupportStatus} is the first and cannot be the second,
   * because it judges a relation the author already named, and an oriel window
   * nobody suspected is a query nobody wrote. This sweeps the record instead
   * and needs no declaration at all.
   *
   * Reports a measurement rather than an authored support relation. For each
   * non-grounded body it chooses the highest candidate part-box top no higher
   * than underside plus tolerance with an overlapping footprint, then reports
   * signed clearance and owner. This identifies the nearest admitted proxy, not
   * a proven physical support.
   *
   * Candidate part boxes avoid treating a multi-part support's entire union as
   * material: a shelf board can support a subject below the shelf back's
   * highest point. The subject still uses its union box, so a notch or gap in
   * its footprint remains outside this approximation's ability to distinguish.
   *
   * Every element and population is a body. An underside at or below `groundY +
   * tolerance` is grounded, including bodies below the ground plane. Candidate
   * tops may reach tolerance above the underside; the first footprint overlap
   * yields a signed clearance, and clearance no greater than tolerance is
   * borne. Other bodies are floating. The subject's union footprint can bridge
   * notches, and candidate part boxes can include empty space, so these are
   * proxy classifications rather than mesh-contact certificates. `groundY`
   * defaults to zero, and the point basis accompanies degenerate bounds.
   *
   * Throws a `RangeError` when the tolerance is negative or non-finite, or
   * `groundY` is not finite. Population-bound errors also propagate, including
   * the unsupported `along-route` layout. `measured` counts resolved bodies,
   * `compared` the candidate parts examined, and `unresolved` lists the bodies
   * that occupy no place.
   */
  export type IProps = {
    /**
     * Borrowed building whose element/population proxies are scanned for ground
     * or lower-body support.
     */
    environment: IAutoMovieBuiltEnvironment;

    /** World height a body may rest on directly, in metres. Defaults to `0`. */
    groundY?: number;

    /** Contact slack in metres. Defaults to `AutoMovieEngineSupportTolerance`. */
    tolerance?: number;
  };
}
