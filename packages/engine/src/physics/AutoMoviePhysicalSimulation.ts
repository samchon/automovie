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

  /** Query every joint's authored-relative error and the last completed step's cap forecasts. */
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

  /** Independently admit and identify current sampled input without initializing a solver or trusting a cache manifest. */
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

  /** Run or resume a complete film; synchronous progress observes completed intervals only, and cancellation exposes no partial successful result. */
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

/** Public input and diagnostic aliases keep their established simulation owner. */
export namespace AutoMoviePhysicalSimulation {
  /** Sampled authored segment goals and tracking strengths. */ export type ITarget =
    AutoMoviePhysicalSimulationInput.ITarget;
  /** One provider body and its bounded controller policy. */ export type IBody =
    AutoMoviePhysicalSimulationInput.IBody;
  /** Complete finite simulation work and input description. */ export type IInput =
    AutoMoviePhysicalSimulationInput.IInput;
  /** Pre-solve actuator-cap forecast at a completed cached step. */ export type IDiagnostic =
    AutoMoviePhysicalSimulationInput.IDiagnostic;
}
