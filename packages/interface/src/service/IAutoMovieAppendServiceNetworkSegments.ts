import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieViolationCollector } from "../validation/IAutoMovieViolationCollector";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";
import type { IAutoMovieServicePort } from "./IAutoMovieServicePort";
import type { IAutoMovieServiceSystem } from "./IAutoMovieServiceSystem";

/**
 * Segment validation inputs, reference indexes and synchronous numerical diagnostic callbacks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Segment validation inputs, reference indexes and synchronous numerical diagnostic callbacks. Routes and radii use world metres, sections use square metres, distance returns Euclidean metres and endpoint coincidence appends metre-gap findings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Indexes must describe the same network, callbacks are synchronous and not retained, and exceptions propagate; sampled crossing and sleeve-proximity checks are not continuous physical-fit certificates.
 * @evidence contracts/development/design.md#principled-representation Routes and radii use world metres, sections use square metres, distance returns Euclidean metres and endpoint coincidence appends metre-gap findings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface validateServiceNetwork shares its system, port and penetration indexes and collector; appendServiceNetworkSegments returns a new set of cited sleeve ids for unused-sleeve reporting.
 */
export namespace IAutoMovieAppendServiceNetworkSegments {
  /**
   * Segment validation inputs, reference indexes and synchronous numerical diagnostic callbacks.
   *
   * @evidence contracts/development/design.md#principled-representation Routes and radii use world metres, sections use square metres, distance returns Euclidean metres and endpoint coincidence appends metre-gap findings.
   * @evidence contracts/development/design.md#minimal-and-owned-surface validateServiceNetwork shares its system, port and penetration indexes and collector; appendServiceNetworkSegments returns a new set of cited sleeve ids for unused-sleeve reporting.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Indexes must describe the same network, callbacks are synchronous and not retained, and exceptions propagate; sampled crossing and sleeve-proximity checks are not continuous physical-fit certificates.
   * @evidence contracts/development/common.md#meaningful-documentation Segment validation inputs, reference indexes and synchronous numerical diagnostic callbacks. Routes and radii use world metres, sections use square metres, distance returns Euclidean metres and endpoint coincidence appends metre-gap findings.
   */
  export type IProps = {
    /** Borrowed network whose segments are checked in declaration order and whose sleeve records resolve penetrationIds. */
    network: IAutoMovieServiceNetwork;

    /** Borrowed served building used by route crossing and sleeve-boundary checks. */
    environment: IAutoMovieBuiltEnvironment;

    /** Borrowed system-id index from this network, used to resolve each segment's system. */
    systems: ReadonlyMap<string, IAutoMovieServiceSystem>;

    /** Borrowed first-declaration port index from this network, used for endpoints, direction, units and section matching. */
    ports: ReadonlyMap<string, IAutoMovieServicePort>;

    /** Borrowed ids declared by network.penetrations; every id must have a matching record even if that record has other defects. */
    penetrationIds: ReadonlySet<string>;

    /** Diagnostic prefix before .segments[index], normally $input. */
    root: string;

    /** Caller-owned synchronous diagnostic sink; it may retain authored route points and sleeve values. */
    out: IAutoMovieViolationCollector;

    /**
     * Synchronous finite-positive gate for radius in metres and section in square metres; receives value, path, label and out, appends findings and propagates exceptions.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronous finite-positive gate for radius in metres and section in square metres; receives value, path, label and out, appends findings and propagates exceptions. Member documentation states the supplied records, units and absence meanings used by appendServiceNetworkSegments.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns callback captures and their release; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments provides the callback body and its numerical method; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns the callback body and its decomposition; the invocation and result obligations remain on this member.
     */
    positive: (
      value: number,
      path: string,
      label: string,
      out: IAutoMovieViolationCollector,
    ) => void;

    /**
     * Synchronous Euclidean distance in metres between two borrowed world points; used with 1e-9 metre slack for distinct consecutive route vertices. Not retained; exceptions propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronous Euclidean distance in metres between two borrowed world points; used with 1e-9 metre slack for distinct consecutive route vertices. Not retained; exceptions propagate. Member documentation states the supplied records, units and absence meanings used by appendServiceNetworkSegments.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts distance declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms distance declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work distance declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources distance declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns callback captures and their release; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation distance declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments provides the callback body and its numerical method; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure distance declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns the callback body and its decomposition; the invocation and result obligations remain on this member.
     */
    distance: (one: IAutoMovieVector3, other: IAutoMovieVector3) => number;

    /**
     * Synchronous endpoint check for borrowed route point and target port position in world metres; receives path, port id and out. The standard validator appends gaps above 1e-6 metres. Not retained; exceptions propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronous endpoint check for borrowed route point and target port position in world metres; receives path, port id and out. The standard validator appends gaps above 1e-6 metres. Not retained; exceptions propagate. Member documentation states the supplied records, units and absence meanings used by appendServiceNetworkSegments.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts coincident declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms coincident declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work coincident declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources coincident declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns callback captures and their release; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation coincident declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments provides the callback body and its numerical method; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure coincident declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkSegments owns the callback body and its decomposition; the invocation and result obligations remain on this member.
     */
    coincident: (
      point: IAutoMovieVector3,
      target: IAutoMovieVector3,
      path: string,
      portId: string,
      out: IAutoMovieViolationCollector,
    ) => void;
  };
}
