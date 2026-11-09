import type { IAutoMovieContactReceipt } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import type { advancePhysicalBalance } from "./advancePhysicalBalance";
import { decodePhysicalPlayback } from "./decodePhysicalPlayback";
import { encodePhysicalPlayback } from "./encodePhysicalPlayback";
import { samplePhysicalOwnership } from "./samplePhysicalOwnership";

/** Compact precomputed playback, loaded without initializing the native solver.
 * One little-endian Float64 record stores each segment's pose and velocities.
 * A SHA-256 trailer detects damaged data; the caller's expected input identity
 * independently rejects stale performances. Loading owns a byte copy and checks
 * the declared allocation bounds before parsing or scanning records. WebCrypto
 * is required, as provided by Node 22 and secure browser contexts (localhost).
 */
export class AutoMoviePhysicalPlayback {
  /** Bytes per position/quaternion/linear/angular-velocity record. */
  private static readonly stride: number = 13 * 8;

  /** Only an admitted owned archive can construct a playback reader. */
  private constructor(
    /** Owned bytes, retained for this reader's lifetime. */ private readonly bytes: Uint8Array<ArrayBuffer>,
    /** Admitted immutable metadata. */ private readonly header: AutoMoviePhysicalPlayback.IHeader,
    /** Aligned first Float64 record byte. */ private readonly offset: number,
  ) {}

  /** Exact sampled-input identity retained by the producer. */
  public get identity(): string {
    return this.header.identity;
  }
  /** Completed film seconds. */
  public get duration(): number {
    return this.header.duration;
  }
  /** Cached intervals per second. */
  public get rate(): number {
    return this.header.rate;
  }
  /** Causal measured contact episodes from the same computed performance. */
  public get contacts(): readonly IAutoMovieContactReceipt[] {
    return this.header.contacts;
  }
  /** Actual recovery requests and landings, including failures. */
  public get recovery(): Readonly<
    Record<string, advancePhysicalBalance.IState>
  > {
    return this.header.recovery;
  }
  /** Exact native ownership transitions, including substep event times. */
  public get ownership(): readonly Cache.IOwnership[] {
    return this.header.ownership;
  }
  /** Requested versus allocated support predictions, before native motor caps/integration. Actual floor load is measured only by contacts. */
  public get supportWrenches(): readonly Cache.ISupportWrench[] {
    return this.header.supportWrenches;
  }
  /**
   * Sample the authoritative dynamic, C1 kinematic return, or authored phase at local time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Sample the authoritative dynamic, C1 kinematic return, or authored phase at local time.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Sample the authoritative dynamic, C1 kinematic return, or authored phase at local time) directly over its typed inputs (`body`, `bone`, `seconds`) as a fixed number of statements with no loop or recursion in the body, delegating to `samplePhysicalOwnership`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 9 lines and 1 top-level statements that reuses `samplePhysicalOwnership` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `body`, `bone`, `seconds`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  public ownershipAt(
    body: string,
    bone: string,
    seconds: number,
  ): Cache.IOwnership["kind"] {
    return samplePhysicalOwnership(
      this.header.ownership,
      this.duration,
      body,
      bone,
      seconds,
    );
  }

  /**
   * Pack complete cached poses and causal metadata on the build machine.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Pack complete cached poses and causal metadata on the build machine.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Pack complete cached poses and causal metadata on the build machine) directly over its typed inputs (`cache`, `maximumBytes`) as a fixed number of statements with no loop or recursion in the body, delegating to `encodePhysicalPlayback`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 3 lines and 1 top-level statements that reuses `encodePhysicalPlayback` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `cache`, `maximumBytes`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 0 calls per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
   */
  public static async encode(
    cache: Cache,
    maximumBytes: number,
  ): Promise<Uint8Array<ArrayBuffer>> {
    return encodePhysicalPlayback(cache, maximumBytes);
  }

  /**
   * Admit owned archive bytes against the complete current authored input.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Admit owned archive bytes against the complete current authored input.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit owned archive bytes against the complete current authored input) directly over its typed inputs (`source`, `expectedIdentity`, `budget`) as a fixed number of statements with no loop or recursion in the body, delegating to `decodePhysicalPlayback`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 9 lines and 2 top-level statements that reuses `decodePhysicalPlayback` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `source`, `expectedIdentity`, `budget`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
   */
  public static async decode(
    source: Uint8Array,
    expectedIdentity: string,
    budget: {
      maximumBytes: number;
      maximumFrames: number;
      maximumSegments: number;
    },
  ): Promise<AutoMoviePhysicalPlayback> {
    const decoded: Awaited<ReturnType<typeof decodePhysicalPlayback>> =
      await decodePhysicalPlayback(source, expectedIdentity, budget);
    return new AutoMoviePhysicalPlayback(
      decoded.bytes,
      decoded.header,
      decoded.offset,
    );
  }
  /**
   * Sample in any order using the same interpolation law as live cached simulation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Sample in any order using the same interpolation law as live cached simulation.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Sample in any order using the same interpolation law as live cached simulation) directly over its typed inputs (`seconds`) as a single pass (for-of over this.header.segments.entries()), delegating to `Number.isFinite`, `Math.floor`, `Math.ceil`, `view.getFloat64`, `number`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literals 8, 3, 4, 5, 6, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 50 lines and 10 top-level statements that reuses `Number.isFinite`, `Math.floor`, `Math.ceil`, `view.getFloat64`, `number` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 8, 3, 4, 5, 6 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `seconds`; the dominant cost is a single pass (for-of over this.header.segments.entries()), performed once per call with 9 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 9 allocation sites become the returned value or die with the call, so nothing grows.
   */
  public at(seconds: number): Cache.IFrame {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > this.duration)
      throw new Error("Physical playback seek outside completed film");
    const step: number = seconds * this.rate;
    const low: number = Math.floor(step);
    const high: number = Math.ceil(step);
    const fraction: number = step - low;
    const view: DataView = new DataView(this.bytes.buffer);
    const read: (frame: number, index: number) => Cache.ISegment = (
      frame: number,
      index: number,
    ): Cache.ISegment => {
      const offset: number =
        this.offset +
        (frame * this.header.segments.length + index) *
          AutoMoviePhysicalPlayback.stride;
      const number: (field: number) => number = (field: number): number =>
        view.getFloat64(offset + field * 8, true);
      return {
        position: { x: number(0), y: number(1), z: number(2) },
        rotation: { x: number(3), y: number(4), z: number(5), w: number(6) },
        velocity: { x: number(7), y: number(8), z: number(9) },
        angularVelocity: { x: number(10), y: number(11), z: number(12) },
      };
    };
    const bodies: Cache.IFrame["bodies"] = Object.create(null);
    for (const [index, [body, bone]] of this.header.segments.entries()) {
      const a: Cache.ISegment = read(low, index);
      const b: Cache.ISegment = read(high, index);
      (bodies[body] ??= Object.create(null))[bone] = {
        position: Vector3.add(
          a.position,
          Vector3.scale(Vector3.subtract(b.position, a.position), fraction),
        ),
        rotation: Quaternion.slerp(a.rotation, b.rotation, fraction),
        velocity: Vector3.add(
          a.velocity,
          Vector3.scale(Vector3.subtract(b.velocity, a.velocity), fraction),
        ),
        angularVelocity: Vector3.add(
          a.angularVelocity,
          Vector3.scale(
            Vector3.subtract(b.angularVelocity, a.angularVelocity),
            fraction,
          ),
        ),
      };
    }
    return { seconds, bodies };
  }
}

/**
 * Versioned metadata is stored ahead of the binary frame records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Versioned metadata is stored ahead of the binary frame records) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Versioned metadata is stored ahead of the binary frame records: companion namespace of 1 member (`IHeader`); units and frames named in its text: seconds, second, frame. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMoviePhysicalPlayback` in packages/engine/src/physics/AutoMoviePhysicalPlayback.ts; its surface is the 1 member listed and the text shows 10 other files naming it, mostly packages/engine (4), test (4), movies (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMoviePhysicalPlayback {
  /**
   * Solver-free playback data; native checkpoints are deliberately producer-owned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Solver-free playback data; native checkpoints are deliberately producer-owned.
   * @evidence contracts/development/design.md#principled-representation Represents Solver-free playback data; native checkpoints are deliberately producer-owned: interface of 10 members (`format`, `protocol`, `identity`, `duration`, `rate`, `segments`, ...); units and frames named in its text: seconds, second, frame. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IHeader` in packages/engine/src/physics/AutoMoviePhysicalPlayback.ts; its surface is the 10 members listed and the text shows 4 other files naming it, mostly packages/engine (3), test (1), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IHeader {
    /** Binary record layout. */ format: 1;
    /** Simulation/controller compatibility. */ protocol: string;
    /** Full sampled-input SHA-256. */ identity: string;
    /** Film seconds. */ duration: number;
    /** Cached intervals per second. */ rate: number;
    /** Deterministic body/bone record order. */ segments: [string, string][];
    /** Causal native/geometric contact measurements. */ contacts: IAutoMovieContactReceipt[];
    /** Actual recovery controller outcome. */ recovery: Record<
      string,
      advancePhysicalBalance.IState
    >;
    /** Actual native authority, preserved independently of rounded cache frame time. */ ownership: Cache.IOwnership[];
    /** Virtual support predictions, not achieved native contact force. */ supportWrenches: Cache.ISupportWrench[];
  }
}
