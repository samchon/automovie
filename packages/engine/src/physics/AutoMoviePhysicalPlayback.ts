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
import { decodePhysicalPlayback } from "./decodePhysicalPlayback";
import { encodePhysicalPlayback } from "./encodePhysicalPlayback";
import { samplePhysicalOwnership } from "./samplePhysicalOwnership";

/** Compact precomputed playback, loaded without initializing the native solver.
 * One little-endian Float64 record stores each segment's pose and velocities.
 * A SHA-256 trailer detects damaged data; the caller's expected input identity
 * independently rejects stale performances. Loading checks the byte budget
 * before copying, then admits frame/segment counts before scanning records. WebCrypto
 * is required, as provided by Node 22 and secure browser contexts (localhost).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents owned archive bytes, integrity versus sampled-input identity, allocation admission and the WebCrypto dependency; sampling uses film seconds and world-space SI pose and velocity quantities.
 * @evidence contracts/development/design.md#principled-representation A private constructor confines readers to decoded archives; the interface-owned header and fixed-stride records describe completed fixed-step playback rather than a live solver. Decode admission checks the binary representation before reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine owns binary loading and interpolation; playback consumers receive identity, timing, receipts and sampled records through the shared contracts, without access to native solver handles.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The binary stride describes the actual position, quaternion and velocity record, not a scene-specific layout. Readonly collection views restrict writes through this API but do not promise deep freezing of returned records.
 */
export class AutoMoviePhysicalPlayback {
  /** Bytes per position/quaternion/linear/angular-velocity record. */
  private static readonly stride: number = 13 * 8;

  /** Only an admitted owned archive can construct a playback reader. */
  private constructor(
    /** Owned bytes, retained for this reader's lifetime. */ private readonly bytes: Uint8Array<ArrayBuffer>,
    /** Admitted immutable metadata. */ private readonly header: IAutoMoviePhysicalPlayback.IHeader,
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
    Record<string, IAutoMoviePhysicalRecoveryState>
  > {
    return this.header.recovery;
  }
  /** Exact native ownership transitions, including substep event times. */
  public get ownership(): readonly IAutoMoviePhysicalOwnershipEvent[] {
    return this.header.ownership;
  }
  /** Requested versus allocated support predictions, before native motor caps/integration. Actual floor load is measured only by contacts. */
  public get supportWrenches(): readonly IAutoMoviePhysicalSupportWrench[] {
    return this.header.supportWrenches;
  }
  /**
   * Read the segment's last recorded authority change at local film seconds.
   *
   * Rejects nonfinite/out-of-film time and a body/bone without a preceding
   * ownership event. Substep transitions retain their actual event times.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines local film seconds, last applicable authority transition, invalid-time rejection and the missing-segment failure.
   * @evidence contracts/development/implementation.md#principled-implementation samplePhysicalOwnership validates finite time in [0,duration] and scans backward for the matching body/bone transition at or before that instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Live and archived readers delegate to the same transition selector, so substep authority changes have one interpretation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads recorded native transitions instead of reconstructing contact activation or return completion from an authored clock.
   * @evidence contracts/development/implementation.md#efficient-algorithms For e retained ownership events the backward scan is O(e) worst-case and O(1) additional space; it stops at the first applicable matching event.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the retained event history without advancing physics or caching a second event index.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The lookup retains no new state; the containing cache or playback reader owns the event history for its lifetime.
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
   * maximumBytes caps the final archive, not the metadata serialization's
   * transient memory. Native/controller checkpoints remain in the live cache.
   * The encoder rejects incomplete frames and nonfinite pose/velocity fields;
   * WebCrypto supplies the integrity digest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States archive ownership, retained checkpoint exclusion, export failures, WebCrypto and the final-byte-budget boundary.
   * @evidence contracts/development/implementation.md#principled-implementation encodePhysicalPlayback writes the fixed 13-Float64 little-endian segment layout, aligned JSON metadata and SHA-256 trailer from the completed cache.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The class delegates binary layout and export admission to encodePhysicalPlayback, leaving replay sampling in this reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exports actual completed samples and causal metadata; the digest protects bytes rather than certifying simulation correctness or a matching current input.
   * @evidence contracts/development/implementation.md#efficient-algorithms For f frames and s segments, record packing is O(f*s); JSON serialization and hashing additionally traverse metadata/archive bytes. Storage includes metadata text/bytes, the final archive and digest work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the already-computed frames instead of rerunning physics. Each export creates its own byte array and digest; no export promise or archive is globally cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The promise retains the source cache and output buffer until digest completion; the caller then owns the returned bytes. Failure releases call-local references, and no native solver handle is acquired.
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
   * format, identity, record data or causal metadata reject the promise;
   * no solver is initialized and no partially admitted reader is returned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents copied-byte ownership, expected-input identity, budget meanings and rejected-load behavior.
   * @evidence contracts/development/implementation.md#principled-implementation decodePhysicalPlayback checks the byte budget before copying, verifies SHA-256, admits timing/segment counts and finite unit-rotation records, then validates causal metadata and freezes the parsed header.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The decoder owns binary and metadata admission; only an admitted byte/header/offset triple reaches the private reader constructor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Integrity and current-input identity are checked separately. No stale or malformed archive is accepted as an empty or substitute performance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies and hashes all b source bytes, parses metadata and scans f*s records. Metadata admission also traverses retained events, receipts and recovery data; the supplied budgets bound the archive and record population, not an O(1) wrapper cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Owns one defensive byte copy and retains the admitted header for all later seeks. It neither shares an in-flight load nor trusts a previously supplied manifest.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader owns the copied archive and parsed header until released by its caller. Rejection leaves no published reader, native handle or background simulation.
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
      await decodePhysicalPlayback(source, expectedIdentity, budget);
    return new AutoMoviePhysicalPlayback(
      decoded.bytes,
      decoded.header,
      decoded.offset,
    );
  }
  /**
   * Sample stored world-space poses and velocities at local film seconds.
   *
   * Rejects nonfinite time or time outside [0,duration]. Positions and linear/
   * angular velocities interpolate linearly; rotations take the shortest
   * quaternion arc. Returns a fresh frame without advancing a solver.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States time admission, world-space interpolation, SI quantities and fresh result ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Computes floor/ceil fixed-step indices and reads both records for each admitted segment; decode has already checked complete layout and unit quaternions. Vector3 interpolation and Quaternion.slerp match live cache sampling.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The fixed-stride reader interprets the archive once per segment; shared math owners supply the interpolation rules.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the archive's actual samples and recorded segment identities, with no seek-order state, extrapolation or scene-specific pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms For s segments, each seek reads two fixed-size records and emits one segment result, taking O(s) time and O(s) result space. DataView borrows the existing buffer rather than copying the archive.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All seeks reuse the same admitted bytes/header. Interpolated frames are fresh and are not memoized by time.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the archive independently of any seek. Each call's temporary records and returned frame contain O(s) data, and no seek result or native handle is retained by the reader.
   */
  public at(seconds: number): IAutoMoviePhysicalFrame {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > this.duration)
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
