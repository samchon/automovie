import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalControllerCheckpoint,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalOwnershipEvent,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegmentState,
  IAutoMoviePhysicalSupportWrench,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { samplePhysicalOwnership } from "./samplePhysicalOwnership";

/**
 * Owned fixed-step replay data. Readers never advance a solver. Checkpoints
 * contain complete WASM state; frames contain only display/audit quantities.
 * Simulation producers bound storage by admitted step and segment budgets;
 * this mutable container does not enforce those budgets on direct writes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes native restart snapshots from sampled replay records, describes producer-enforced retention bounds and makes the mutable ownership boundary explicit. Frame clocks use film seconds and physical records use their interface-defined SI units.
 * @evidence contracts/development/design.md#principled-representation Stores completed fixed-step frames beside native, controller and balance checkpoints because resumption requires all three state owners. The constructor records identity, rate and duration; admission belongs to simulation or archive decoding, and at rejects invalid time or incomplete frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine owns the mutable cache populated by simulation and read by playback, tracking and archive encoding; interface owns the shared records. Separate support predictions and measured contact receipts preserve their different meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Body and segment identifiers address runtime data without fixing a particular skeleton. Readonly properties retain mutable arrays and maps intentionally for producers; direct writes can violate frame or checkpoint consistency and are not an admission API.
 */
export class AutoMoviePhysicsCache {
  /** Native controller, target-fitting and ownership policy epoch, included in content identity. */
  public static readonly protocol: string = "automovie.physical-cache.v26";
  /** Stored with replay data so incompatible checkpoints never resume. */
  public readonly protocol: string = AutoMoviePhysicsCache.protocol;
  /** Frame zero followed by every completed fixed step. */
  public readonly frames: IAutoMoviePhysicalFrame[] = [];
  /** Complete world snapshots addressed by step index. */
  public readonly checkpoints: Map<number, Uint8Array> = new Map();
  /** Contact episodes and compliance state are part of a restart checkpoint too. */
  public readonly controllerCheckpoints: Map<
    number,
    IAutoMoviePhysicalControllerCheckpoint
  > = new Map();
  /** Causal native ownership changes; return explicitly uses position-based kinematic authority. */
  public readonly ownership: IAutoMoviePhysicalOwnershipEvent[] = [];
  /** Requested/allocated virtual support wrenches at cache instants. These are motor-demand diagnostics; only native contact receipts measure achieved floor force. */
  public readonly supportWrenches: IAutoMoviePhysicalSupportWrench[] = [];
  /** Recovery planner state is restored together with native and contact state. */
  public readonly balanceCheckpoints: Map<
    number,
    Record<string, IAutoMoviePhysicalRecoveryState>
  > = new Map();
  /** Actual recovery requests, exposed to the authored support-plan consumer. */
  public readonly recovery: Record<string, IAutoMoviePhysicalRecoveryState> =
    Object.create(null);
  /** Contact episodes, in start-time order. */
  public readonly contacts: IAutoMovieContactReceipt[] = [];

  /** Identity includes solver version, profiles, settings and all sampled targets. */
  public constructor(
    /** SHA-256 of solver build and complete sampled inputs. */
    public readonly identity: string,
    /** Fixed steps per second. */
    public readonly rate: number,
    /** Complete film seconds. */
    public readonly duration: number,
  ) {}

  /**
   * Interpolate completed world-space cache frames at local film seconds.
   *
   * Rejects nonfinite/out-of-film time, an empty cache or missing bracketing
   * frames. Every frame must retain the same body/segment schema; direct cache
   * writes do not validate that invariant. Returns fresh poses and velocities.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents time/frame failures, the cross-frame schema premise and ownership of the interpolated result.
   * @evidence contracts/development/implementation.md#principled-implementation Selects floor/ceil sample frames, linearly interpolates position and linear/angular velocities, and uses Quaternion.slerp for shortest-arc unit rotations. Simulation producers supply complete SI records with a common schema.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cache addressing stays here while Vector3 and Quaternion own interpolation; no native solver participates in a read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The two asserted next-frame lookups rely on producer-maintained body/segment coverage. The public mutable container does not admit arbitrary direct writes, so a manually corrupted schema can still fail during lookup.
   * @evidence contracts/development/implementation.md#efficient-algorithms For s cached segments, one traversal emits O(s) segment records in O(s) time and space. The scalar time selects two frames; it is not the input dimension driving traversal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses completed frames without advancing physics or copying the full film. Each query emits a fresh interpolated frame and does not retain a time-indexed result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The containing cache retains the complete film and checkpoints until its owner releases it. This read retains no additional state; its O(s) returned frame belongs to the caller.
   */
  public at(seconds: number): IAutoMoviePhysicalFrame {
    if (
      !Number.isFinite(seconds) ||
      seconds < 0 ||
      seconds > this.duration ||
      this.frames.length === 0
    )
      throw new Error("Physics cache read outside completed film");
    const step: number = seconds * this.rate;
    const low: number = Math.floor(step);
    const a: IAutoMoviePhysicalFrame | undefined = this.frames[low];
    const b: IAutoMoviePhysicalFrame | undefined = this.frames[Math.ceil(step)];
    if (!a || !b) throw new Error("Physics cache is incomplete");
    const t: number = step - low;
    return {
      seconds,
      bodies: Object.fromEntries(
        Object.entries(a.bodies).map(
          ([id, segments]: [
            string,
            Record<string, IAutoMoviePhysicalSegmentState>,
          ]): [string, Record<string, IAutoMoviePhysicalSegmentState>] => [
            id,
            Object.fromEntries(
              Object.entries(segments).map(
                ([bone, state]: [string, IAutoMoviePhysicalSegmentState]): [
                  string,
                  IAutoMoviePhysicalSegmentState,
                ] => {
                  const next: IAutoMoviePhysicalSegmentState =
                    b.bodies[id]![bone]!;
                  return [
                    bone,
                    {
                      position: Vector3.add(
                        state.position,
                        Vector3.scale(
                          Vector3.subtract(next.position, state.position),
                          t,
                        ),
                      ),
                      rotation: Quaternion.slerp(
                        state.rotation,
                        next.rotation,
                        t,
                      ),
                      velocity: Vector3.add(
                        state.velocity,
                        Vector3.scale(
                          Vector3.subtract(next.velocity, state.velocity),
                          t,
                        ),
                      ),
                      angularVelocity: Vector3.add(
                        state.angularVelocity,
                        Vector3.scale(
                          Vector3.subtract(
                            next.angularVelocity,
                            state.angularVelocity,
                          ),
                          t,
                        ),
                      ),
                    },
                  ];
                },
              ),
            ),
          ],
        ),
      ),
    };
  }

  /**
   * Resolve recorded native ownership at a local film second.
   *
   * Uses actual substep transitions, including contact-triggered activation.
   * Rejects invalid time or a body/bone with no preceding ownership event.
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
      this.ownership,
      this.duration,
      body,
      bone,
      seconds,
    );
  }
}
