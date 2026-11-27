import { admitPhysicalPlaybackMetadata as admitPhysicalPlaybackMetadataImplementation } from "./internal/admitPhysicalPlaybackMetadata";

import type {
  IAutoMovieContactReceipt,
  IAutoMovieDecodePhysicalPlayback,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalOwnershipEvent,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegmentState,
  IAutoMoviePhysicalSupportWrench,
  IAutoMoviePhysicsCache,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { decodePhysicalPlayback } from "./internal/playback/decodePhysicalPlayback";
import { encodePhysicalPlayback } from "./internal/encodePhysicalPlayback";
import { samplePhysicalOwnership } from "./internal/samplePhysicalOwnership";

/**
 * Compact precomputed playback, loaded without initializing the native solver.
 * One little-endian Float64 record stores each segment's pose and velocities. A
 * SHA-256 trailer detects damaged data; the caller's expected input identity
 * independently rejects stale performances. Loading checks the byte budget
 * before copying, then admits frame/segment counts before scanning records.
 * WebCrypto is required, as provided by Node 22 and secure browser contexts
 * (localhost).
 */
export class AutoMoviePhysicalPlayback {
  /**
   * Refuse inconsistent causal metadata even when an archive has a valid
   * integrity trailer: budgets, references, clocks, orderings, unit normals and
   * allocation residuals. Contact episodes must fit the archive's film duration
   * and name known segments or the floor. Invalid metadata throws.
   */
  public static admitMetadata(header: IAutoMoviePhysicalPlayback.IHeader): void {
    admitPhysicalPlaybackMetadataImplementation(header);
  }

  /*
   * Bytes per position/quaternion/linear/angular-velocity record.
   */
  private static readonly stride: number = 13 * 8;

  /*
   * Only an admitted owned archive can construct a playback reader.
   */
  private constructor(
    /*
     * Owned bytes, retained for this reader's lifetime.
     */ private readonly bytes: Uint8Array<ArrayBuffer>,
    /*
     * Admitted immutable metadata.
     */ private readonly header: IAutoMoviePhysicalPlayback.IHeader,
    /*
     * Aligned first Float64 record byte.
     */ private readonly offset: number,
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
    Record<string, IAutoMoviePhysicalRecoveryState>
  > {
    return this.header.recovery;
  }
  /** Exact native ownership transitions, including substep event times. */
  public get ownership(): readonly IAutoMoviePhysicalOwnershipEvent[] {
    return this.header.ownership;
  }
  /**
   * Requested versus allocated support predictions, before native motor
   * caps/integration. Actual floor load is measured only by contacts.
   */
  public get supportWrenches(): readonly IAutoMoviePhysicalSupportWrench[] {
    return this.header.supportWrenches;
  }
  /**
   * Read the segment's last recorded authority change at local film seconds.
   *
   * Rejects nonfinite/out-of-film time and a body/bone without a preceding
   * ownership event. Substep transitions retain their actual event times.
   */
  public ownershipAt(
    body: string,
    bone: string,
    seconds: number,
  ): IAutoMoviePhysicalOwnershipEvent["kind"] {
    return samplePhysicalOwnership(
      this.header.ownership,
      this.duration,
      body,
      bone,
      seconds,
    );
  }

  /**
   * Pack completed cached poses and causal metadata into an owned archive.
   *
   * MaximumBytes caps the final archive, not the metadata serialization's
   * transient memory. Native/controller checkpoints remain in the live cache.
   * The encoder rejects incomplete frames and nonfinite pose/velocity fields;
   * WebCrypto supplies the integrity digest.
   */
  public static async encode(
    cache: IAutoMoviePhysicsCache,
    maximumBytes: number,
  ): Promise<Uint8Array<ArrayBuffer>> {
    return encodePhysicalPlayback(cache, maximumBytes);
  }

  /**
   * Load an archive against the expected identity of the current sampled input.
   *
   * The decoder copies source bytes before its asynchronous integrity check.
   * Positive safe-integer byte/frame/segment budgets bound admission. Invalid
   * format, identity, record data or causal metadata reject the promise; no
   * solver is initialized and no partially admitted reader is returned.
   */
  public static async decode(
    source: Uint8Array,
    expectedIdentity: string,
    budget: {
      maximumBytes: number;
      maximumFrames: number;
      maximumSegments: number;
    },
  ): Promise<IAutoMoviePhysicalPlayback> {
    const decoded: Awaited<IAutoMovieDecodePhysicalPlayback.IResult> =
      await AutoMoviePhysicalPlayback.decodeResult(
        source,
        expectedIdentity,
        budget,
      );
    return new AutoMoviePhysicalPlayback(
      decoded.bytes,
      decoded.header,
      decoded.offset,
    );
  }

  /**
   * Decode admitted archive metadata without constructing a playback reader.
   */
  public static decodeResult(
    source: Uint8Array,
    expectedIdentity: string,
    budget: IAutoMovieDecodePhysicalPlayback.IBudget,
  ): Promise<IAutoMovieDecodePhysicalPlayback.IResult> {
    return decodePhysicalPlayback(source, expectedIdentity, budget);
  }

  /**
   * Sample stored world-space poses and velocities at local film seconds.
   *
   * Rejects nonfinite time or time outside [0,duration]. Positions and linear/
   * angular velocities interpolate linearly; rotations take the shortest
   * quaternion arc. Returns a fresh frame without advancing a solver.
   */
  public at(seconds: number): IAutoMoviePhysicalFrame {
    if (seconds < 0 || seconds > this.duration)
      throw new Error("Physical playback seek outside completed film");
    const step: number = seconds * this.rate;
    const low: number = Math.floor(step);
    const high: number = Math.ceil(step);
    const fraction: number = step - low;
    const view: DataView = new DataView(this.bytes.buffer);
    const read: (
      frame: number,
      index: number,
    ) => IAutoMoviePhysicalSegmentState = (
      frame: number,
      index: number,
    ): IAutoMoviePhysicalSegmentState => {
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
    const bodies: IAutoMoviePhysicalFrame["bodies"] = Object.create(null);
    for (const [index, [body, bone]] of this.header.segments.entries()) {
      const a: IAutoMoviePhysicalSegmentState = read(low, index);
      const b: IAutoMoviePhysicalSegmentState = read(high, index);
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
