import type {
  IAutoMovieContactReceipt,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMoviePhysicalBinding } from "./IAutoMoviePhysicalBinding";
import type { IAutoMoviePhysicalHandoff } from "./IAutoMoviePhysicalHandoff";
import type { advancePhysicalBalance } from "./advancePhysicalBalance";
import { samplePhysicalOwnership } from "./samplePhysicalOwnership";

/**
 * Owned fixed-step replay data. Readers never advance a solver. Checkpoints
 * contain complete WASM state; frames contain only display/audit quantities.
 * Memory is bounded by the film's declared step and segment budgets.
 */
export class AutoMoviePhysicsCache {
  /** Native controller, target-fitting and ownership policy epoch, included in content identity. */
  public static readonly protocol: string = "automovie.physical-cache.v23";
  /** Stored with replay data so incompatible checkpoints never resume. */
  public readonly protocol: string = AutoMoviePhysicsCache.protocol;
  /** Frame zero followed by every completed fixed step. */
  public readonly frames: AutoMoviePhysicsCache.IFrame[] = [];
  /** Complete world snapshots addressed by step index. */
  public readonly checkpoints: Map<number, Uint8Array> = new Map();
  /** Contact episodes and compliance state are part of a restart checkpoint too. */
  public readonly controllerCheckpoints: Map<
    number,
    {
      contactCount: number;
      episodes: {
        receipt: Omit<IAutoMovieContactReceipt, "samples">;
        sampleCount: number;
      }[];
      active: [string, string][];
      softened: [string, number][];
      released?: string[];
      contactReleased?: string[];
      balanceTargets?: Record<
        string,
        IAutoMoviePhysicalBinding["planned"] extends Map<string, infer Value>
          ? Value
          : never
      >;
      supportTargets?: Record<
        string,
        IAutoMoviePhysicalBinding["supportPlanned"] extends Map<
          string,
          infer Value
        >
          ? Value
          : never
      >;
      contactTargets?: Record<
        string,
        IAutoMoviePhysicalBinding["contactTargets"] extends Map<
          string,
          infer Value
        >
          ? Value
          : never
      >;
      handoffs?: Record<string, Record<string, IAutoMoviePhysicalHandoff>>;
      ownershipCount?: number;
    }
  > = new Map();
  /** Causal native ownership changes; return explicitly uses position-based kinematic authority. */
  public readonly ownership: AutoMoviePhysicsCache.IOwnership[] = [];
  /** Requested/allocated virtual support wrenches at cache instants. These are motor-demand diagnostics; only native contact receipts measure achieved floor force. */
  public readonly supportWrenches: AutoMoviePhysicsCache.ISupportWrench[] = [];
  /** Recovery planner state is restored together with native and contact state. */
  public readonly balanceCheckpoints: Map<
    number,
    Record<string, advancePhysicalBalance.IState>
  > = new Map();
  /** Actual recovery requests, exposed to the authored support-plan consumer. */
  public readonly recovery: Record<string, advancePhysicalBalance.IState> =
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

  /** Linear positions and shortest-arc quaternion interpolation between cached steps. */
  public at(seconds: number): AutoMoviePhysicsCache.IFrame {
    if (
      !Number.isFinite(seconds) ||
      seconds < 0 ||
      seconds > this.duration ||
      this.frames.length === 0
    )
      throw new Error("Physics cache read outside completed film");
    const step: number = seconds * this.rate;
    const low: number = Math.floor(step);
    const a: AutoMoviePhysicsCache.IFrame | undefined = this.frames[low];
    const b: AutoMoviePhysicsCache.IFrame | undefined =
      this.frames[Math.ceil(step)];
    if (!a || !b) throw new Error("Physics cache is incomplete");
    const t: number = step - low;
    return {
      seconds,
      bodies: Object.fromEntries(
        Object.entries(a.bodies).map(
          ([id, segments]: [
            string,
            Record<string, AutoMoviePhysicsCache.ISegment>,
          ]): [string, Record<string, AutoMoviePhysicsCache.ISegment>] => [
            id,
            Object.fromEntries(
              Object.entries(segments).map(
                ([bone, state]: [string, AutoMoviePhysicsCache.ISegment]): [
                  string,
                  AutoMoviePhysicsCache.ISegment,
                ] => {
                  const next: AutoMoviePhysicsCache.ISegment =
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

  /** Resolve actual native ownership at an arbitrary local second, including substep transitions and irreversible contact-triggered activation. */
  public ownershipAt(
    body: string,
    bone: string,
    seconds: number,
  ): AutoMoviePhysicsCache.IOwnership["kind"] {
    return samplePhysicalOwnership(
      this.ownership,
      this.duration,
      body,
      bone,
      seconds,
    );
  }
}

/** Cached SI state, independent of solver handles or provider species. */
export namespace AutoMoviePhysicsCache {
  /** World-frame virtual force and moment about the associated diagnostic origin. */
  export interface IWrench {
    /** World newtons. */
    force: IAutoMovieVector3;
    /** World newton metres about the recorded root COM. */
    torque: IAutoMovieVector3;
  }
  /** One bounded support allocation prediction, distinct from actual native contact impulses. */
  export interface ISupportWrench {
    /** Scene body requesting the root wrench. */
    body: string;
    /** Local completed-cache instant, seconds. */
    seconds: number;
    /** Actual root COM used as the allocation's moment origin, world metres before integration. */
    origin: IAutoMovieVector3;
    /** Requested root force in N and moment in N m. */
    requested: IWrench;
    /** Geometrically feasible force allocation before native motor caps and integration. */
    allocated: IWrench;
    /** Requested minus allocated, in the same SI units; zero is not a measured physical success. */
    residual: IWrench;
    /** Number of actual floor witnesses participating in this allocation, 0..1024. */
    pointCount: number;
  }
  /** The instant native authority changes, independent of rendered frame rounding. */
  export interface IOwnership {
    /** Provider identity. */
    body: string;
    /** Segment identity. */
    bone: string;
    /** Local seconds, including native substeps. */
    seconds: number;
    /** Return is a C1 kinematic reconciliation, not a dynamic force response. */
    kind: "dynamic" | "return" | "authored";
  }
  /** Pose and velocities of a segment's bone origin in world space. */
  export interface ISegment extends P.ITransform {
    /** World linear velocity, m/s. */ velocity: IAutoMovieVector3;
    /** World angular velocity, rad/s. */ angularVelocity: IAutoMovieVector3;
  }
  /** One completed step, with body ids then bone ids. */
  export interface IFrame {
    /** Film second, zero based. */ seconds: number;
    /** Every admitted segment. */ bodies: Record<
      string,
      Record<string, ISegment>
    >;
  }
}
