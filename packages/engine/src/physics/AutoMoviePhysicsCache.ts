import type {
  IAutoMovieAdvancePhysicalBalance,
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalControllerCheckpoint,
  IAutoMoviePhysicsCache,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
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
  public readonly frames: IAutoMoviePhysicsCache.IFrame[] = [];
  /** Complete world snapshots addressed by step index. */
  public readonly checkpoints: Map<number, Uint8Array> = new Map();
  /** Contact episodes and compliance state are part of a restart checkpoint too. */
  public readonly controllerCheckpoints: Map<
    number,
    IAutoMoviePhysicalControllerCheckpoint
  > = new Map();
  /** Causal native ownership changes; return explicitly uses position-based kinematic authority. */
  public readonly ownership: IAutoMoviePhysicsCache.IOwnership[] = [];
  /** Requested/allocated virtual support wrenches at cache instants. These are motor-demand diagnostics; only native contact receipts measure achieved floor force. */
  public readonly supportWrenches: IAutoMoviePhysicsCache.ISupportWrench[] = [];
  /** Recovery planner state is restored together with native and contact state. */
  public readonly balanceCheckpoints: Map<
    number,
    Record<string, IAutoMovieAdvancePhysicalBalance.IState>
  > = new Map();
  /** Actual recovery requests, exposed to the authored support-plan consumer. */
  public readonly recovery: Record<
    string,
    IAutoMovieAdvancePhysicalBalance.IState
  > = Object.create(null);
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
  public at(seconds: number): IAutoMoviePhysicsCache.IFrame {
    if (
      !Number.isFinite(seconds) ||
      seconds < 0 ||
      seconds > this.duration ||
      this.frames.length === 0
    )
      throw new Error("Physics cache read outside completed film");
    const step: number = seconds * this.rate;
    const low: number = Math.floor(step);
    const a: IAutoMoviePhysicsCache.IFrame | undefined = this.frames[low];
    const b: IAutoMoviePhysicsCache.IFrame | undefined =
      this.frames[Math.ceil(step)];
    if (!a || !b) throw new Error("Physics cache is incomplete");
    const t: number = step - low;
    return {
      seconds,
      bodies: Object.fromEntries(
        Object.entries(a.bodies).map(
          ([id, segments]: [
            string,
            Record<string, IAutoMoviePhysicsCache.ISegment>,
          ]): [string, Record<string, IAutoMoviePhysicsCache.ISegment>] => [
            id,
            Object.fromEntries(
              Object.entries(segments).map(
                ([bone, state]: [string, IAutoMoviePhysicsCache.ISegment]): [
                  string,
                  IAutoMoviePhysicsCache.ISegment,
                ] => {
                  const next: IAutoMoviePhysicsCache.ISegment =
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
  ): IAutoMoviePhysicsCache.IOwnership["kind"] {
    return samplePhysicalOwnership(
      this.ownership,
      this.duration,
      body,
      bone,
      seconds,
    );
  }
}
