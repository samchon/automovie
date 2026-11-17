import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * World-point and phase-tangent readers for a station and its physical difference neighbours.
 *
 * The interface package owns these declarations; AutoMovieHumanBodySurfaceNormals in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation World-point and phase-tangent readers for a station and its physical difference neighbours. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IStationJet, IStationSample declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IStationJet, IStationSample separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanBodySurfaceNormals exchanges the named IStationJet, IStationSample contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanBodySurfaceNormals {
  /** A chain's sections at a station and its two difference neighbours.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A chain's sections at a station and its two difference neighbours.
   * @evidence contracts/development/design.md#principled-representation `here`: Actual world value/phase tangent plan, independent of physical station2. `lo`: The station STEP mm below, clamped into the chain. `hi`: The station STEP mm above, clamped into the chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodySurfaceNormals.stationJet. Also types AutoMovieHumanBodySurfaceNormals.cache, AutoMovieHumanBodySurfaceNormals.stations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `here`, `lo`, `hi`; callers supply the complete record.
   */
  export interface IStationJet {
    /**
     * Actual world value/phase tangent plan, independent of physical station2.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Actual world value/phase tangent plan, independent of physical station2.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanBodySurfaceNormals and the callback provider must satisfy the documented here contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanBodySurfaceNormals and its callback provider own the cost of each here invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanBodySurfaceNormals and the callback provider determine when the inputs to here describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanBodySurfaceNormals and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanBodySurfaceNormals.IStationJet.here callable contract, without an implementation body. AutoMovieHumanBodySurfaceNormals and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanBodySurfaceNormals.IStationJet.here declares only the invocation boundary; decomposition belongs to AutoMovieHumanBodySurfaceNormals and the callback provider.
     */
    here: (phaseRadians: number) => {
      /** Sampled position in the curve's source frame, millimetres. */
      p: AutoMovieVector3Tuple;
      /** First derivative of the world position with respect to section phase, millimetres per radian; it is not normalized. */
      t: AutoMovieVector3Tuple;
    };

    /** The station STEP mm below, clamped into the chain. */
    lo: IStationSample;

    /** The station STEP mm above, clamped into the chain. */
    hi: IStationSample;
  }

  /** Caller-owned actual world value plan of one station.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Caller-owned actual world value plan of one station.
   * @evidence contracts/development/design.md#principled-representation `at`: Actual world point reader retained by this normal calculation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBodySurfaceNormals.place. Also types AutoMovieHumanBodySurfaceNormals.sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`; callers supply the complete record.
   */
  export interface IStationSample {
    /**
     * Actual world point reader retained by this normal calculation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Actual world point reader retained by this normal calculation.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanBodySurfaceNormals and the callback provider must satisfy the documented at contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanBodySurfaceNormals and its callback provider own the cost of each at invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanBodySurfaceNormals and the callback provider determine when the inputs to at describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanBodySurfaceNormals and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanBodySurfaceNormals.IStationSample.at callable contract, without an implementation body. AutoMovieHumanBodySurfaceNormals and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanBodySurfaceNormals.IStationSample.at declares only the invocation boundary; decomposition belongs to AutoMovieHumanBodySurfaceNormals and the callback provider.
     */
    at: (phaseRadians: number) => AutoMovieVector3Tuple;
  }
}
