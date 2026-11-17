import type { IAutoMovieAdvancePhysicalBalance } from "./IAutoMovieAdvancePhysicalBalance";
import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";
import type { IAutoMoviePhysicsCache } from "./IAutoMoviePhysicsCache";

/**
 * Solver-free random-access playback of an admitted complete physical performance.
 *
 * duration is local film seconds and rate cached intervals/s; poses and velocities retain the world-space SI meaning of PhysicsCache frames. AutoMoviePhysicalPlayback retains an owned archive byte copy and recursively frozen metadata for its lifetime. Sampling allocates detached frames and never advances or initializes a native solver. Archive decoding rejects incompatible identity, protocol, corruption or allocation limits. This reader contains no restart checkpoints; callers need the producer cache to resume native simulation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Solver-free random-access playback of an admitted complete physical performance.
 * @evidence contracts/development/design.md#principled-representation duration is local film seconds and rate cached intervals/s; poses and velocities retain the world-space SI meaning of PhysicsCache frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMoviePhysicalPlayback retains an owned archive byte copy and recursively frozen metadata for its lifetime. Sampling allocates detached frames and never advances or initializes a native solver.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Archive decoding rejects incompatible identity, protocol, corruption or allocation limits. This reader contains no restart checkpoints; callers need the producer cache to resume native simulation.
 */
export interface IAutoMoviePhysicalPlayback {
  /** Exact sampled-input identity retained by the producer. */
  readonly identity: string;

  /** Completed film seconds. */
  readonly duration: number;

  /** Cached intervals per second. */
  readonly rate: number;

  /** Borrowed recursively frozen contact episodes from the admitted archive, including native substep sample times. */
  readonly contacts: readonly IAutoMovieContactReceipt[];

  /** Borrowed recursively frozen recovery requests, accepted landings and failures keyed by scene body. */
  readonly recovery: Readonly<
    Record<string, IAutoMovieAdvancePhysicalBalance.IState>
  >;

  /** Borrowed frozen native authority transitions, retaining substep event times independently of cache rounding. */
  readonly ownership: readonly IAutoMoviePhysicsCache.IOwnership[];

  /** Borrowed frozen requested/allocated support predictions before motor caps and integration; these do not measure achieved floor load. */
  readonly supportWrenches: readonly IAutoMoviePhysicsCache.ISupportWrench[];

  /** Return the latest actual ownership event for body/bone at or before finite local seconds in [0,duration]. Throws for invalid time or no preceding event; does not reconstruct ownership from authored policy.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the ownershipAt callback or sampling contract, including its clock and ownership obligations.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   */
  ownershipAt(
    body: string,
    bone: string,
    seconds: number,
  ): IAutoMoviePhysicsCache.IOwnership["kind"];

  /** Sample finite local seconds in [0,duration] in any order. Linearly interpolate positions and velocities and shortest-arc interpolate rotations between stored frames. Returns a detached mutable frame; out-of-domain time throws.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the at callback or sampling contract, including its clock and ownership obligations.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This is a callable contract with no implementation body; its producer owns algorithmic work and resource retention under the documented sampling and lifetime obligations.
   */
  at(seconds: number): IAutoMoviePhysicsCache.IFrame;
}

/** Binary archive metadata retained by a solver-free physical playback reader. */
export namespace IAutoMoviePhysicalPlayback {
  /**
   * Validated archive metadata accompanying a fixed-order sequence of binary segment records.
   *
   * format is the literal binary layout version; duration times integer rate plus one gives the frame count, and segments lists unique [body,bone] keys in record order. encodePhysicalPlayback writes metadata from a complete cache; decodePhysicalPlayback validates and freezes it before a reader exposes its arrays and records. The header preserves actual ownership/contact/recovery history and requested support predictions separately. It contains no native checkpoint bytes and cannot resume simulation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Validated archive metadata accompanying a fixed-order sequence of binary segment records.
   * @evidence contracts/development/design.md#principled-representation format is the literal binary layout version; duration times integer rate plus one gives the frame count, and segments lists unique [body,bone] keys in record order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface encodePhysicalPlayback writes metadata from a complete cache; decodePhysicalPlayback validates and freezes it before a reader exposes its arrays and records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The header preserves actual ownership/contact/recovery history and requested support predictions separately. It contains no native checkpoint bytes and cannot resume simulation.
   */
  export interface IHeader {
    /** Literal archive record layout version 1, admitted before record scanning. */
    format: 1;

    /** Simulation/controller compatibility epoch that must match the current physics-cache protocol. */
    protocol: string;

    /** Exact sha256:<64 lowercase hex digits> identity of complete sampled simulation inputs, matched to the caller's expected identity. */
    identity: string;

    /** Positive finite local film duration in seconds; duration times rate must be a safe integer. */
    duration: number;

    /** Positive safe-integer cached intervals per second. */
    rate: number;

    /** Nonempty unique [scene body id, bone id] pairs in binary record order; each name must be nonblank. */
    segments: [string, string][];

    /** Causal native/geometric contact measurements. */
    contacts: IAutoMovieContactReceipt[];

    /** Actual recovery controller outcome. */
    recovery: Record<string, IAutoMovieAdvancePhysicalBalance.IState>;

    /** Actual native authority, preserved independently of rounded cache frame time. */
    ownership: IAutoMoviePhysicsCache.IOwnership[];

    /** Virtual support predictions, not achieved native contact force. */
    supportWrenches: IAutoMoviePhysicsCache.ISupportWrench[];
  }
}
