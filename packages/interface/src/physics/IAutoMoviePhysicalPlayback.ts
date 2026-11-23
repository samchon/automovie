import type { IAutoMovieContactReceipt } from "./IAutoMovieContactReceipt";
import type { IAutoMoviePhysicalFrame } from "./IAutoMoviePhysicalFrame";
import type { IAutoMoviePhysicalOwnershipEvent } from "./IAutoMoviePhysicalOwnershipEvent";
import type { IAutoMoviePhysicalRecoveryState } from "./IAutoMoviePhysicalRecoveryState";
import type { IAutoMoviePhysicalSupportWrench } from "./IAutoMoviePhysicalSupportWrench";

/**
 * Solver-free random-access playback of an admitted complete physical
 * performance.
 *
 * Duration is local film seconds and rate cached intervals/s; poses and
 * velocities retain the world-space SI meaning of PhysicsCache frames.
 * AutoMoviePhysicalPlayback retains an owned archive byte copy and recursively
 * frozen metadata for its lifetime. Sampling allocates detached frames and
 * never advances or initializes a native solver. Archive decoding rejects
 * incompatible identity, protocol, corruption or allocation limits. This reader
 * contains no restart checkpoints; callers need the producer cache to resume
 * native simulation.
 */
export interface IAutoMoviePhysicalPlayback {
  /** Exact sampled-input identity retained by the producer. */
  readonly identity: string;

  /** Completed film seconds. */
  readonly duration: number;

  /** Cached intervals per second. */
  readonly rate: number;

  /**
   * Borrowed recursively frozen contact episodes from the admitted archive,
   * including native substep sample times.
   */
  readonly contacts: readonly IAutoMovieContactReceipt[];

  /**
   * Borrowed recursively frozen recovery requests, accepted landings and
   * failures keyed by scene body.
   */
  readonly recovery: Readonly<Record<string, IAutoMoviePhysicalRecoveryState>>;

  /**
   * Borrowed frozen native authority transitions, retaining substep event times
   * independently of cache rounding.
   */
  readonly ownership: readonly IAutoMoviePhysicalOwnershipEvent[];

  /**
   * Borrowed frozen requested/allocated support predictions before motor caps
   * and integration; these do not measure achieved floor load.
   */
  readonly supportWrenches: readonly IAutoMoviePhysicalSupportWrench[];

  /**
   * Return the latest actual ownership event for body/bone at or before finite
   * local seconds in [0,duration]. Throws for invalid time or no preceding
   * event; does not reconstruct ownership from authored policy.
   */
  ownershipAt(
    body: string,
    bone: string,
    seconds: number,
  ): IAutoMoviePhysicalOwnershipEvent["kind"];

  /**
   * Sample finite local seconds in [0,duration] in any order. Linearly
   * interpolate positions and velocities and shortest-arc interpolate rotations
   * between stored frames. Returns a detached mutable frame; out-of-domain time
   * throws.
   */
  at(seconds: number): IAutoMoviePhysicalFrame;
}

/** Binary archive metadata retained by a solver-free physical playback reader. */
export namespace IAutoMoviePhysicalPlayback {
  /**
   * Validated archive metadata accompanying a fixed-order sequence of binary
   * segment records.
   *
   * Format is the literal binary layout version; duration times integer rate
   * plus one gives the frame count, and segments lists unique [body,bone] keys
   * in record order. encodePhysicalPlayback writes metadata from a complete
   * cache; decodePhysicalPlayback validates and freezes it before a reader
   * exposes its arrays and records. The header preserves actual
   * ownership/contact/recovery history and requested support predictions
   * separately. It contains no native checkpoint bytes and cannot resume
   * simulation.
   */
  export interface IHeader {
    /** Literal archive record layout version 1, admitted before record scanning. */
    format: 1;

    /**
     * Simulation/controller compatibility epoch that must match the current
     * physics-cache protocol.
     */
    protocol: string;

    /**
     * Exact sha256:<64 lowercase hex digits> identity of complete sampled
     * simulation inputs, matched to the caller's expected identity.
     */
    identity: string;

    /**
     * Positive finite local film duration in seconds; duration times rate must
     * be a safe integer.
     */
    duration: number;

    /** Positive safe-integer cached intervals per second. */
    rate: number;

    /**
     * Nonempty unique [scene body id, bone id] pairs in binary record order;
     * each name must be nonblank.
     */
    segments: [string, string][];

    /** Causal native/geometric contact measurements. */
    contacts: IAutoMovieContactReceipt[];

    /** Actual recovery controller outcome. */
    recovery: Record<string, IAutoMoviePhysicalRecoveryState>;

    /**
     * Actual native authority, preserved independently of rounded cache frame
     * time.
     */
    ownership: IAutoMoviePhysicalOwnershipEvent[];

    /** Virtual support predictions, not achieved native contact force. */
    supportWrenches: IAutoMoviePhysicalSupportWrench[];
  }
}
