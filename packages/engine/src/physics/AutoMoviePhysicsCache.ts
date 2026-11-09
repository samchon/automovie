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
  public static readonly protocol: string = "automovie.physical-cache.v25";
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

  /**
   * Linear positions and shortest-arc quaternion interpolation between cached steps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Linear positions and shortest-arc quaternion interpolation between cached steps.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Linear positions and shortest-arc quaternion interpolation between cached steps) directly over its typed inputs (`seconds`) as nested iteration of depth 2 (map over Object.entries(a.bodies); map over Object.entries(segments)), delegating to `Number.isFinite`, `Math.floor`, `Math.ceil`, `Object.fromEntries`, `Object.entries(a.bodies).map`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 74 lines and 8 top-level statements that reuses `Number.isFinite`, `Math.floor`, `Math.ceil`, `Object.fromEntries`, `Object.entries(a.bodies).map` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `seconds`; the dominant cost is nested iteration of depth 2 (map over Object.entries(a.bodies); map over Object.entries(segments)), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
   */
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

  /**
   * Resolve actual native ownership at an arbitrary local second, including substep transitions and irreversible contact-triggered activation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Resolve actual native ownership at an arbitrary local second, including substep transitions and irreversible contact-triggered activation.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Resolve actual native ownership at an arbitrary local second, including substep transitions and irreversible contact-triggered activation) directly over its typed inputs (`body`, `bone`, `seconds`) as a fixed number of statements with no loop or recursion in the body, delegating to `samplePhysicalOwnership`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
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

/**
 * Cached SI state, independent of solver handles or provider species.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Cached SI state, independent of solver handles or provider species) and documents 5 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Cached SI state, independent of solver handles or provider species: companion namespace of 5 members (`IWrench`, `ISupportWrench`, `IOwnership`, `ISegment`, `IFrame`); units and frames named in its text: world, frame, newtons, newton, metres. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMoviePhysicsCache` in packages/engine/src/physics/AutoMoviePhysicsCache.ts; its surface is the 5 members listed and the text shows 31 other files naming it, mostly packages/engine (19), test (8), movies (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMoviePhysicsCache {
  /**
   * World-frame virtual force and moment about the associated diagnostic origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: World-frame virtual force and moment about the associated diagnostic origin.
   * @evidence contracts/development/design.md#principled-representation Represents World-frame virtual force and moment about the associated diagnostic origin: interface of 2 members (`force`, `torque`); units and frames named in its text: world, newtons, newton, metres. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IWrench` in packages/engine/src/physics/AutoMoviePhysicsCache.ts; its surface is the 2 members listed and the text shows 0 other files naming it, so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IWrench {
    /** World newtons. */
    force: IAutoMovieVector3;
    /** World newton metres about the recorded root COM. */
    torque: IAutoMovieVector3;
  }
  /**
   * One bounded support allocation prediction, distinct from actual native contact impulses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: One bounded support allocation prediction, distinct from actual native contact impulses.
   * @evidence contracts/development/design.md#principled-representation Represents One bounded support allocation prediction, distinct from actual native contact impulses: interface of 7 members (`body`, `seconds`, `origin`, `requested`, `allocated`, `residual`, ...); units and frames named in its text: local, seconds, world, metres. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `ISupportWrench` in packages/engine/src/physics/AutoMoviePhysicsCache.ts; its surface is the 7 members listed and the text shows 5 other files naming it, mostly packages/engine (4), test (1), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
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
  /**
   * The instant native authority changes, independent of rendered frame rounding.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: The instant native authority changes, independent of rendered frame rounding.
   * @evidence contracts/development/design.md#principled-representation Represents The instant native authority changes, independent of rendered frame rounding: interface of 4 members (`body`, `bone`, `seconds`, `kind`); units and frames named in its text: local, seconds. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IOwnership` in packages/engine/src/physics/AutoMoviePhysicsCache.ts; its surface is the 4 members listed and the text shows 4 other files naming it, mostly packages/engine (4), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
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
  /**
   * Pose and velocities of a segment's bone origin in world space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Pose and velocities of a segment's bone origin in world space.
   * @evidence contracts/development/design.md#principled-representation Represents Pose and velocities of a segment's bone origin in world space: interface of 2 members (`velocity`, `angularVelocity`); units and frames named in its text: world. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `ISegment` in packages/engine/src/physics/AutoMoviePhysicsCache.ts; its surface is the 2 members listed and the text shows 124 other files naming it, mostly packages/engine (53), test (43), packages/human (18), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface ISegment extends P.ITransform {
    /** World linear velocity, m/s. */ velocity: IAutoMovieVector3;
    /** World angular velocity, rad/s. */ angularVelocity: IAutoMovieVector3;
  }
  /**
   * One completed step, with body ids then bone ids.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: One completed step, with body ids then bone ids.
   * @evidence contracts/development/design.md#principled-representation Represents One completed step, with body ids then bone ids: interface of 2 members (`seconds`, `bodies`); units and frames named in its text: second, seconds. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IFrame` in packages/engine/src/physics/AutoMoviePhysicsCache.ts; its surface is the 2 members listed and the text shows 181 other files naming it, mostly packages/human (118), packages/engine (30), test (28), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IFrame {
    /** Film second, zero based. */ seconds: number;
    /** Every admitted segment. */ bodies: Record<
      string,
      Record<string, ISegment>
    >;
  }
}
