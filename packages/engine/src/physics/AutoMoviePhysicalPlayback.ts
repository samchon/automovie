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
  /** Sample the authoritative dynamic, C1 kinematic return, or authored phase at local time. */
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

  /** Pack complete cached poses and causal metadata on the build machine. */
  public static async encode(
    cache: Cache,
    maximumBytes: number,
  ): Promise<Uint8Array<ArrayBuffer>> {
    return encodePhysicalPlayback(cache, maximumBytes);
  }

  /** Admit owned archive bytes against the complete current authored input. */
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
  /** Sample in any order using the same interpolation law as live cached simulation. */
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

/** Versioned metadata is stored ahead of the binary frame records. */
export namespace AutoMoviePhysicalPlayback {
  /** Solver-free playback data; native checkpoints are deliberately producer-owned. */
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
