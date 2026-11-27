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
import { samplePhysicalOwnership } from "./internal/samplePhysicalOwnership";

/**
 * Owned fixed-step replay data. Readers never advance a solver. Checkpoints
 * contain complete WASM state; frames contain only display/audit quantities.
 * Simulation producers bound storage by admitted step and segment budgets; this
 * mutable container does not enforce those budgets on direct writes.
 */
export class AutoMoviePhysicsCache {
  /**
   * Native controller, target-fitting and ownership policy epoch, included in
   * content identity.
   */
  public static readonly protocol: string = "automovie.physical-cache.v27";
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
  /**
   * Causal native ownership changes; return explicitly uses position-based
   * kinematic authority.
   */
  public readonly ownership: IAutoMoviePhysicalOwnershipEvent[] = [];
  /**
   * Requested/allocated virtual support wrenches at cache instants. These are
   * motor-demand diagnostics; only native contact receipts measure achieved
   * floor force.
   */
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

  /**
   * Identity includes solver version, profiles, settings and all sampled
   * targets.
   */
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
   */
  public at(seconds: number): IAutoMoviePhysicalFrame {
    if (seconds < 0 || seconds > this.duration || this.frames.length === 0)
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
