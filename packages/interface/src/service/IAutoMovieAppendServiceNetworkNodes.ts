import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieViolationCollector } from "../validation/IAutoMovieViolationCollector";
import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";
import type { IAutoMovieServiceSystem } from "./IAutoMovieServiceSystem";

/**
 * Node and port admission context with mutable indexes for later connectivity diagnostics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Node and port admission context with mutable indexes for later connectivity diagnostics. Node and port coordinates are world metres, port sections are square metres and demands use each system's unit; callbacks check finite scalar ranges while the node validator checks references and vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Callbacks run synchronously, are not retained and may propagate exceptions; borrowed records are not repaired, and the indexes are updated even for defective port declarations.
 * @evidence contracts/development/design.md#principled-representation Node and port coordinates are world metres, port sections are square metres and demands use each system's unit; callbacks check finite scalar ranges while the node validator checks references and vocabulary.
 * @evidence contracts/development/design.md#minimal-and-owned-surface validateServiceNetwork supplies shared system/space/element indexes, first port paths and seen ids, then uses the accumulated paths to report unconnected ports.
 */
export namespace IAutoMovieAppendServiceNetworkNodes {
  /**
   * Node and port admission context with mutable indexes for later connectivity diagnostics.
   *
   * @evidence contracts/development/design.md#principled-representation Node and port coordinates are world metres, port sections are square metres and demands use each system's unit; callbacks check finite scalar ranges while the node validator checks references and vocabulary.
   * @evidence contracts/development/design.md#minimal-and-owned-surface validateServiceNetwork supplies shared system/space/element indexes, first port paths and seen ids, then uses the accumulated paths to report unconnected ports.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Callbacks run synchronously, are not retained and may propagate exceptions; borrowed records are not repaired, and the indexes are updated even for defective port declarations.
   * @evidence contracts/development/common.md#meaningful-documentation Node and port admission context with mutable indexes for later connectivity diagnostics. Node and port coordinates are world metres, port sections are square metres and demands use each system's unit; callbacks check finite scalar ranges while the node validator checks references and vocabulary.
   */
  export type IProps = {
    /** Borrowed graph whose nodes and ports are visited in declaration order. */
    network: IAutoMovieServiceNetwork;

    /** Borrowed served building in the same world-metre frame as node and port positions. */
    environment: IAutoMovieBuiltEnvironment;

    /** Borrowed building space ids used for reference checks before containment. */
    spaceIds: ReadonlySet<string>;

    /** Borrowed building element ids used to resolve optional node element references. */
    elementIds: ReadonlySet<string>;

    /** Borrowed system-id index supplying the medium and demand unit each port must repeat. */
    systems: ReadonlyMap<string, IAutoMovieServiceSystem>;

    /** Caller-owned port-id to diagnostic-path map; only the first path is inserted, preserving the port selected by portRecords. */
    portPaths: Map<string, string>;

    /** Caller-owned set accumulated across all ports, including defective declarations, for network-wide duplicate detection. */
    seenPorts: Set<string>;

    /** Diagnostic prefix before .nodes[index], normally $input. */
    root: string;

    /** Caller-owned synchronous diagnostic sink; findings may retain borrowed authored values. */
    out: IAutoMovieViolationCollector;

    /**
     * Finite-positive scalar gate for non-null port sections in square metres. Receives value, exact path, label and out and appends findings. Called synchronously and not retained by the validator; exceptions propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Finite-positive scalar gate for non-null port sections in square metres. Receives value, exact path, label and out and appends findings. Called synchronously and not retained by the validator; exceptions propagate. Member documentation states the supplied records, units and absence meanings used by appendServiceNetworkNodes.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes owns callback captures and their release; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes provides the callback body and its numerical method; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure positive declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes owns the callback body and its decomposition; the invocation and result obligations remain on this member.
     */
    positive: (
      value: number,
      path: string,
      label: string,
      out: IAutoMovieViolationCollector,
    ) => void;

    /**
     * Synchronous finite-nonnegative scalar gate for port demand in its system unit. Receives value, exact path, label and out; errors are appended and callback exceptions propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Synchronous finite-nonnegative scalar gate for port demand in its system unit. Receives value, exact path, label and out; errors are appended and callback exceptions propagate. Member documentation states the supplied records, units and absence meanings used by appendServiceNetworkNodes.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts nonNegative declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms nonNegative declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work nonNegative declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources nonNegative declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes owns callback captures and their release; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation nonNegative declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes provides the callback body and its numerical method; the invocation and result obligations remain on this member.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure nonNegative declares a callable signature with no body. The implementation supplied to or returned by appendServiceNetworkNodes owns the callback body and its decomposition; the invocation and result obligations remain on this member.
     */
    nonNegative: (
      value: number,
      path: string,
      label: string,
      out: IAutoMovieViolationCollector,
    ) => void;
  };
}
