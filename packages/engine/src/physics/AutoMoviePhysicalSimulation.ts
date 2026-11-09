import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import RAPIER, {
  type PhysicsHooks,
  type RigidBody,
  type World,
} from "@dimforge/rapier3d-compat";

import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulationInput } from "./AutoMoviePhysicalSimulationInput";
import { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { admitPhysicalSimulation } from "./admitPhysicalSimulation";
import { assertPhysicalReturnPath } from "./assertPhysicalReturnPath";
import { bindPhysicalWorld } from "./bindPhysicalWorld";
import { checkpointPhysicalSimulation } from "./checkpointPhysicalSimulation";
import { collectPhysicalContacts } from "./collectPhysicalContacts";
import { computePhysicalKinematicFrames } from "./computePhysicalKinematicFrames";
import { freezePhysicalRecord } from "./freezePhysicalRecord";
import { inPhysicalFloorBounds } from "./inPhysicalFloorBounds";
import { isPhysicalPairExcluded } from "./isPhysicalPairExcluded";
import { physicalInputDigest } from "./physicalInputDigest";
import { physicalNativeVector } from "./physicalNativeVector";
import { preparePhysicalGeometry } from "./preparePhysicalGeometry";
import { readPhysicalFrame } from "./readPhysicalFrame";
import { recordPhysicalContact } from "./recordPhysicalContact";
import { restorePhysicalSimulationCheckpoint } from "./restorePhysicalSimulationCheckpoint";
import { samplePhysicalTracking } from "./samplePhysicalTracking";
import { samplePhysicalTrackingTarget } from "./samplePhysicalTrackingTarget";
import { solvePhysicalCompliantContacts as solveCompliance } from "./solvePhysicalCompliantContacts";
import { trackPhysicalWorld } from "./trackPhysicalWorld";
import { yieldPhysicalSimulation } from "./yieldPhysicalSimulation";

/**
 * Precompute fixed-step physics, then replay by time. Inputs are sampled bytes,
 * not callbacks hidden behind a cache key. One WASM World is freed on every
 * exit. A late edit reuses a checkpoint only after every earlier input matches;
 * changed geometry, solver settings or modes require a complete restart.
 */
export class AutoMoviePhysicalSimulation {
  /** Share the one asynchronous WASM initialization, including concurrent callers. */
  private static initialization: Promise<void> | undefined;
  /** Own the immutable input snapshot needed to verify checkpoint equivalence. */
  private constructor(
    /** Owned sampled inputs establishing checkpoint equivalence. */
    public readonly input: AutoMoviePhysicalSimulation.IInput,
    /** Complete replay state. */
    public readonly cache: Cache,
    /** Native fixed steps performed by this run. */
    public readonly recomputedSteps: number,
    /** Pre-solve PD demands exceeding the native enforced motor torque cap. */
    public readonly tracking: AutoMoviePhysicalSimulation.IDiagnostic[],
  ) {}

  /**
   * Query every joint's authored-relative error and the last completed step's cap forecasts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Query every joint's authored-relative error and the last completed step's cap forecasts.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Query every joint's authored-relative error and the last completed step's cap forecasts) directly over its typed inputs (`seconds`) as a fixed number of statements with no loop or recursion in the body, delegating to `samplePhysicalTracking`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 8 lines and 1 top-level statements that reuses `samplePhysicalTracking` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `seconds`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  public trackingAt(
    seconds: number,
  ): AutoMoviePhysicalSimulation.IDiagnostic[] {
    return samplePhysicalTracking(
      this.input,
      this.cache,
      this.tracking,
      seconds,
    );
  }

  /**
   * Independently admit and identify current sampled input without initializing a solver or trusting a cache manifest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Independently admit and identify current sampled input without initializing a solver or trusting a cache manifest.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Independently admit and identify current sampled input without initializing a solver or trusting a cache manifest) directly over its typed inputs (`input`) as a fixed number of statements with no loop or recursion in the body, delegating to `physicalInputDigest`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 3 lines and 1 top-level statements that reuses `physicalInputDigest` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  public static identity(input: AutoMoviePhysicalSimulation.IInput): string {
    return physicalInputDigest(this.admitted(input));
  }

  /** All identity callers and actual runs use exactly the same owned defaults and admission. */
  private static admitted(
    input: AutoMoviePhysicalSimulation.IInput,
  ): AutoMoviePhysicalSimulation.IInput {
    const owned: AutoMoviePhysicalSimulation.IInput = structuredClone(input);
    if (owned.substeps === undefined) owned.substeps = 16;
    if (owned.internalIterations === undefined) owned.internalIterations = 1;
    if (owned.contactTolerance === undefined) owned.contactTolerance = 0.0001;
    if (owned.contactFrequency === undefined) owned.contactFrequency = 240;
    for (const body of owned.bodies) {
      if (body.maximumBindings === undefined) body.maximumBindings = 16;
      if (body.handoffSeconds === undefined) body.handoffSeconds = 0.2;
      if (body.handoffLimits === undefined)
        body.handoffLimits = {
          maximumLinearError: owned.contactTolerance,
          maximumJointViolation: 64 * 2 ** -23,
        };
    }
    admitPhysicalSimulation(owned);
    freezePhysicalRecord(owned);
    return owned;
  }

  /**
   * Run or resume a complete film; synchronous progress observes completed intervals only, and cancellation exposes no partial successful result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Run or resume a complete film; synchronous progress observes completed intervals only, and cancellation exposes no partial successful result.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Run or resume a complete film; synchronous progress observes completed intervals only, and cancellation exposes no partial successful result) directly over its typed inputs (`input`, `previous`, `signal`, `progress`) as nested iteration of depth 5 (every over owned.bodies; for-of over Object.entries( previous!.cach; for-of over previous!.cache.controllerCheckpoints.ge), delegating to `signal?.throwIfAborted`, `physicalInputDigest`, `progress`, `Math.round`, `computePhysicalKinematicFrames`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 350 lines and 14 top-level statements that reuses `signal?.throwIfAborted`, `physicalInputDigest`, `progress`, `Math.round`, `computePhysicalKinematicFrames` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 35 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `previous`, `signal`, `progress`; the dominant cost is nested iteration of depth 5 (every over owned.bodies; for-of over Object.entries( previous!.cach; for-of over previous!.cache.controllerCheckpoints.ge), performed once per call with 31 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 5 calls per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
   */
  public static async compute(
    input: AutoMoviePhysicalSimulation.IInput,
    previous?: AutoMoviePhysicalSimulation,
    signal?: AbortSignal,
    progress?: (completed: number, total: number) => void,
  ): Promise<AutoMoviePhysicalSimulation> {
    signal?.throwIfAborted();
    const owned: AutoMoviePhysicalSimulation.IInput = this.admitted(input);
    const identity: string = physicalInputDigest(owned);
    if (previous?.cache.identity === identity) {
      progress?.(
        Math.round(owned.duration * owned.rate),
        Math.round(owned.duration * owned.rate),
      );
      signal?.throwIfAborted();
      return previous;
    }
    const cache: Cache = new Cache(identity, owned.rate, owned.duration);
    const count: number = Math.round(owned.duration * owned.rate);
    const diagnostics: AutoMoviePhysicalSimulation.IDiagnostic[] = [];

    // A fully kinematic film constructs no dynamics world and takes no native steps.
    if (
      owned.bodies.every(
        (body: (typeof owned.bodies)[number]): boolean =>
          body.mode.kind === "kinematic",
      )
    ) {
      await computePhysicalKinematicFrames(owned, cache, signal, progress);
      freezePhysicalRecord(cache);
      return new AutoMoviePhysicalSimulation(owned, cache, 0, diagnostics);
    }
    this.initialization ??= RAPIER.init();
    await this.initialization;
    signal?.throwIfAborted();
    let world: World | undefined;
    // Rapier 0.21 dispatches PhysicsHooks only through stepWithEvents.
    // Auto-drain prevents event accumulation even if future colliders enable it.
    const events: RAPIER.EventQueue = new RAPIER.EventQueue(true);
    try {
      const start: number = checkpointPhysicalSimulation(owned, previous);
      world = restorePhysicalSimulationCheckpoint(
        owned,
        previous,
        cache,
        start,
        diagnostics,
      );
      const bound: Bound = bindPhysicalWorld(world, owned, start > 0);
      if (start === 0) cache.ownership.push(...bound.ownership);
      bound.ownership = cache.ownership;
      bound.supportWrenches = cache.supportWrenches;
      if (start > 0)
        for (const [id, state] of Object.entries(
          previous!.cache.controllerCheckpoints.get(start)!.handoffs ?? {},
        ))
          bound.handoffs.set(id, structuredClone(state));
      if (start > 0)
        for (const id of previous!.cache.controllerCheckpoints.get(start)!
          .released ?? [])
          bound.released.add(id);
      if (start > 0)
        for (const [id, planned] of Object.entries(
          previous!.cache.controllerCheckpoints.get(start)!.contactTargets ??
            {},
        ))
          bound.contactTargets.set(id, structuredClone(planned));
      if (start > 0)
        for (const [id, planned] of Object.entries(
          previous!.cache.controllerCheckpoints.get(start)!.balanceTargets ??
            {},
        ))
          bound.planned.set(id, structuredClone(planned));
      if (start > 0)
        for (const [id, planned] of Object.entries(
          previous!.cache.controllerCheckpoints.get(start)!.supportTargets ??
            {},
        ))
          bound.supportPlanned.set(id, structuredClone(planned));
      if (
        owned.bodies.some(
          (body: AutoMoviePhysicalSimulation.IBody): boolean =>
            !!body.selfAvoidance ||
            body.targets.some(
              (target: AutoMoviePhysicalSimulation.ITarget): boolean =>
                !!target.bindings?.length ||
                !!target.pointBounds?.length ||
                target.dynamicSegments !== undefined,
            ),
        )
      )
        bound.geometry = await preparePhysicalGeometry();
      if (start > 0)
        for (const id of previous!.cache.controllerCheckpoints.get(start)!
          .contactReleased ?? [])
          bound.contactReleased.add(id);
      await yieldPhysicalSimulation(
        start,
        count,
        owned.yieldEvery,
        signal,
        progress,
      );
      if (start > 0)
        for (const body of owned.bodies) {
          const target: AutoMoviePhysicalSimulation.ITarget =
            samplePhysicalTrackingTarget(
              body,
              body.targets[start]!,
              cache.contacts,
              start / owned.rate,
              bound.contactReleased,
            );
          if (
            body.mode.kind !== "kinematic" &&
            bound.dynamic.get(body.id)!.size > 0 &&
            body.releasedQuality?.duringReflex &&
            (target.strength === 0 ||
              [...bound.segments.get(body.id)!.values()].some(
                (rigid: RigidBody): boolean =>
                  rigid.additionalSolverIterations() > 0 ||
                  rigid.additionalPgsIterations() > 0,
              ))
          )
            bound.reflexQuality.add(body.id);
          // The snapshot already owns the cleared forces and passive motors.
          // Reconfiguring them invalidates an articulation's native warm start.
          if (
            body.mode.kind !== "kinematic" &&
            bound.dynamic.get(body.id)!.size > 0 &&
            target.strength === 0 &&
            !Object.values(target.jointStrength ?? {}).some(
              (strength: number): boolean => strength > 0,
            )
          )
            bound.released.add(body.id);
        }
      world.timestep = 1 / (owned.rate * owned.substeps!);
      world.numSolverIterations = owned.iterations;
      world.numInternalPgsIterations = owned.internalIterations!;
      // Contact receipts require touching surfaces. Predictive contacts can
      // otherwise stop a slow approach while its measured gap is still positive.
      world.integrationParameters.normalizedPredictionDistance = 0;
      world.integrationParameters.normalizedAllowedLinearError =
        owned.contactTolerance!;
      world.integrationParameters.contact_natural_frequency =
        owned.contactFrequency!;
      if (start === 0) {
        cache.frames.push(readPhysicalFrame(bound, 0));
        cache.checkpoints.set(0, world.takeSnapshot());
      }
      const active: Map<string, IAutoMovieContactReceipt> = new Map();
      const softened: Map<string, number> = new Map();
      const hooks: PhysicsHooks = {
        filterContactPair: (a: number, b: number): RAPIER.SolverFlags | null =>
          isPhysicalPairExcluded(owned, bound, a, b)
            ? null
            : RAPIER.SolverFlags.COMPUTE_IMPULSE,
        filterIntersectionPair: (a: number, b: number): boolean =>
          !isPhysicalPairExcluded(owned, bound, a, b),
      };
      if (start > 0) {
        const state: NonNullable<
          ReturnType<typeof cache.controllerCheckpoints.get>
        > = cache.controllerCheckpoints.get(start)!;
        for (const [key, id] of state.active)
          active.set(
            key,
            cache.contacts.find(
              (receipt: (typeof cache.contacts)[number]): boolean =>
                receipt.id === id,
            )!,
          );
        for (const [key, until] of state.softened) softened.set(key, until);
      }
      for (let step: number = start + 1; step <= count; step++) {
        signal?.throwIfAborted();
        const seconds: number = step / owned.rate;
        const found: Set<string> = new Set();
        for (let substep: number = 1; substep <= owned.substeps!; substep++) {
          const tick: number = (step - 1) * owned.substeps! + substep;
          const instant: number = tick / (owned.rate * owned.substeps!);
          trackPhysicalWorld(
            world,
            owned,
            bound,
            step,
            softened,
            diagnostics,
            cache.recovery,
            cache.contacts,
            instant,
          );
          assertPhysicalReturnPath(owned, bound, tick, "before");
          for (const impulse of owned.impulses)
            if (impulse.step === step && substep === 1) {
              const body: AutoMoviePhysicalSimulation.IBody = owned.bodies.find(
                (candidate: (typeof owned.bodies)[number]): boolean =>
                  candidate.id === impulse.body,
              )!;
              bound.bodies
                .get(`${impulse.body}/${impulse.bone}`)!
                .applyImpulseAtPoint(
                  physicalNativeVector(
                    Vector3.scale(
                      impulse.impulse,
                      body.mode.kind === "exaggerated" ? body.mode.impulse : 1,
                    ),
                  ),
                  physicalNativeVector(impulse.point),
                  true,
                );
              if (Vector3.length(impulse.impulse) > 0)
                softened.set(
                  `${impulse.body}/${impulse.bone}`,
                  instant + body.complianceSeconds,
                );
            }
          bound.floor!.setNextKinematicTranslation({
            x: (owned.floorBounds.min.x + owned.floorBounds.max.x) / 2,
            y: owned.floor - owned.floorBounds.thickness / 2,
            z: (owned.floorBounds.min.z + owned.floorBounds.max.z) / 2,
          });
          bound.floor!.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
          world.step(events, hooks);
          assertPhysicalReturnPath(owned, bound, tick, "after");
          for (const body of owned.bodies)
            for (const segment of body.profile.segments) {
              const rigid: RigidBody = bound.bodies.get(
                `${body.id}/${segment.bone}`,
              )!;
              if (rigid.isSleeping()) continue;
              const pose: P.ITransform = {
                position: rigid.translation(),
                rotation: rigid.rotation(),
              };
              if (
                segment.shapes.some(
                  (shape: (typeof segment.shapes)[number]): boolean =>
                    !inPhysicalFloorBounds(pose, shape, owned.floorBounds),
                )
              )
                throw new Error(
                  `Physical floor domain exceeded: ${body.id}/${segment.bone} at ${instant}`,
                );
            }
          for (const measured of solveCompliance(
            world,
            bound.surfaces,
            instant,
            world.timestep,
          )) {
            recordPhysicalContact({
              ...measured,
              seconds,
              a: bound.colliders.get(measured.handle)!,
              b: bound.colliders.get(measured.other)!,
              dt: 1 / owned.rate,
              contacts: cache.contacts,
              active,
              found,
            });
          }
          collectPhysicalContacts(
            world,
            owned,
            bound,
            seconds,
            cache.contacts,
            active,
            found,
          );
          for (const key of found) {
            const receipt: IAutoMovieContactReceipt = active.get(key)!;
            if (receipt.a.body === "floor" || receipt.b.body === "floor")
              continue;
            for (const side of [receipt.a, receipt.b]) {
              const body: AutoMoviePhysicalSimulation.IBody = owned.bodies.find(
                (candidate: (typeof owned.bodies)[number]): boolean =>
                  candidate.id === side.body,
              )!;
              softened.set(
                `${side.body}/${side.bone}`,
                instant + body.complianceSeconds,
              );
            }
          }
        }
        for (const key of active.keys())
          if (!found.has(key)) active.delete(key);
        cache.frames.push(readPhysicalFrame(bound, seconds));
        if (step % owned.checkpointEvery === 0) {
          cache.checkpoints.set(step, world.takeSnapshot());
          cache.controllerCheckpoints.set(step, {
            contactCount: cache.contacts.length,
            episodes: [...active.values()].map(
              (
                value: IAutoMovieContactReceipt,
              ): {
                receipt: Omit<IAutoMovieContactReceipt, "samples">;
                sampleCount: number;
              } => {
                const { samples, ...receipt }: IAutoMovieContactReceipt = value;
                return {
                  receipt: structuredClone(receipt),
                  sampleCount: samples!.length,
                };
              },
            ),
            active: [...active].map(
              ([key, receipt]: [string, IAutoMovieContactReceipt]): [
                string,
                string,
              ] => [key, receipt.id],
            ),
            softened: [...softened],
            released: [...bound.released],
            contactReleased: [...bound.contactReleased],
            balanceTargets: structuredClone(Object.fromEntries(bound.planned)),
            supportTargets: structuredClone(
              Object.fromEntries(bound.supportPlanned),
            ),
            contactTargets: structuredClone(
              Object.fromEntries(bound.contactTargets),
            ),
            handoffs: structuredClone(Object.fromEntries(bound.handoffs)),
            ownershipCount: cache.ownership.length,
          });
          cache.balanceCheckpoints.set(step, structuredClone(cache.recovery));
        }
        if (step % owned.yieldEvery === 0 || step === count)
          await yieldPhysicalSimulation(
            step,
            count,
            owned.yieldEvery,
            signal,
            progress,
          );
      }
      freezePhysicalRecord(cache);
      freezePhysicalRecord(diagnostics);
      return new AutoMoviePhysicalSimulation(
        owned,
        cache,
        count - start,
        diagnostics,
      );
    } finally {
      try {
        world?.free();
      } finally {
        events.free();
      }
    }
  }
}

/**
 * Public input and diagnostic aliases keep their established simulation owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Public input and diagnostic aliases keep their established simulation owner) and documents 4 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Public input and diagnostic aliases keep their established simulation owner: companion namespace of 4 members (`ITarget`, `IBody`, `IInput`, `IDiagnostic`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMoviePhysicalSimulation` in packages/engine/src/physics/AutoMoviePhysicalSimulation.ts; its surface is the 4 members listed and the text shows 76 other files naming it, mostly test (39), packages/engine (34), movies (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMoviePhysicalSimulation {
  /**
   * Sampled authored segment goals and tracking strengths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Sampled authored segment goals and tracking strengths) as stated in this comment.
   * @evidence contracts/development/design.md#principled-representation Represents Sampled authored segment goals and tracking strengths: type alias of 0 members (). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `ITarget` in packages/engine/src/physics/AutoMoviePhysicalSimulation.ts; its surface is the 0 members listed and the text shows 48 other files naming it, mostly packages/engine (18), packages/human (11), movies (10), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */ export type ITarget = AutoMoviePhysicalSimulationInput.ITarget;
  /**
   * One provider body and its bounded controller policy.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (One provider body and its bounded controller policy) as stated in this comment.
   * @evidence contracts/development/design.md#principled-representation Represents One provider body and its bounded controller policy: type alias of 0 members (). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IBody` in packages/engine/src/physics/AutoMoviePhysicalSimulation.ts; its surface is the 0 members listed and the text shows 97 other files naming it, mostly packages/engine (42), test (42), packages/human (12), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */ export type IBody = AutoMoviePhysicalSimulationInput.IBody;
  /**
   * Complete finite simulation work and input description.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Complete finite simulation work and input description) as stated in this comment.
   * @evidence contracts/development/design.md#principled-representation Represents Complete finite simulation work and input description: type alias of 0 members (). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IInput` in packages/engine/src/physics/AutoMoviePhysicalSimulation.ts; its surface is the 0 members listed and the text shows 227 other files naming it, mostly packages/human (131), test (44), packages/engine (42), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */ export type IInput = AutoMoviePhysicalSimulationInput.IInput;
  /**
   * Pre-solve actuator-cap forecast at a completed cached step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Pre-solve actuator-cap forecast at a completed cached step) as stated in this comment.
   * @evidence contracts/development/design.md#principled-representation Represents Pre-solve actuator-cap forecast at a completed cached step: type alias of 0 members (). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IDiagnostic` in packages/engine/src/physics/AutoMoviePhysicalSimulation.ts; its surface is the 0 members listed and the text shows 79 other files naming it, mostly packages/human (53), packages/engine (15), test (11), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */ export type IDiagnostic = AutoMoviePhysicalSimulationInput.IDiagnostic;
}
