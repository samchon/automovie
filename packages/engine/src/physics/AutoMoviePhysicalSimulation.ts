import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalCoupledTargetFit,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicsCache,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import RAPIER, {
  type PhysicsHooks,
  type RigidBody,
  type World,
} from "@dimforge/rapier3d-compat";

import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { admitPhysicalSimulation } from "./admitPhysicalSimulation";
import { assertPhysicalReturnPath } from "./assertPhysicalReturnPath";
import { bindPhysicalWorld } from "./bindPhysicalWorld";
import { checkpointPhysicalSimulation } from "./checkpointPhysicalSimulation";
import { collectPhysicalContacts } from "./collectPhysicalContacts";
import { computePhysicalKinematicFrames } from "./computePhysicalKinematicFrames";
import type { IPhysicalCoupledTargetRun } from "./fitPhysicalCoupledTargetGroup";
import { freezePhysicalRecord } from "./freezePhysicalRecord";
import { inPhysicalFloorBounds } from "./inPhysicalFloorBounds";
import { isPhysicalPairExcluded } from "./isPhysicalPairExcluded";
import { physicalInputDigest } from "./physicalInputDigest";
import { physicalNativeVector } from "./physicalNativeVector";
import { preparePhysicalGeometry } from "./preparePhysicalGeometry";
import {
  type IPhysicalCoupledTargetSchedule,
  preparePhysicalCoupledTargetSchedule,
} from "./preparePhysicalSimulationInput";
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
 * not callbacks hidden behind a cache key. The run frees its assigned WASM
 * World and event queue on exit; restoration allocates before that transfer.
 * A late edit reuses a checkpoint only after every earlier input matches;
 * changed geometry, solver settings or modes require a complete restart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents sampled-input ownership, checkpoint reuse conditions and native-world release; public results retain replay data, recomputed-step counts and tracking diagnostics for the completed run.
 * @evidence contracts/development/design.md#principled-representation Represents a completed fixed-step simulation over film seconds and SI physical inputs. The private constructor follows admission and execution; the run path validates and owns the input snapshot before allocating native state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine owns simulation and checkpoint admission while interface owns input, diagnostic and replay contracts. Retained input and step counts support equivalence checks and incremental-run accounting.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Sampled body and profile data carry variation instead of scene-specific members. Public readonly fields prevent reassignment, not mutation of every nested record; callers must preserve the admitted snapshot when requesting checkpoint reuse.
 */
export class AutoMoviePhysicalSimulation {
  /** Share the one asynchronous WASM initialization, including concurrent callers. */
  private static initialization: Promise<void> | undefined;
  /** Own the immutable input snapshot needed to verify checkpoint equivalence. */
  private constructor(
    /** Owned sampled inputs establishing checkpoint equivalence. */
    public readonly input: IAutoMoviePhysicalSimulationInput.IInput,
    /** Complete replay state. */
    public readonly cache: IAutoMoviePhysicsCache,
    /** Native fixed steps performed by this run. */
    public readonly recomputedSteps: number,
    /** Pre-solve PD demands exceeding the native enforced motor torque cap. */
    public readonly tracking: IAutoMoviePhysicalSimulationInput.IDiagnostic[],
    /** Converged coupled-group target fits by output step and group id; omitted when no target declares a group. */
    public readonly coupledTargetFits?: IAutoMoviePhysicalCoupledTargetFit.ISeries,
  ) {}

  /**
   * Measure authored-relative joint errors at local film seconds.
   *
   * Errors are shortest relative-rotation distances in radians. Saturation
   * lists are the last completed step's pre-solve torque-cap forecasts, not
   * measured native motor impulses. Invalid time is rejected by cache.at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes radian joint error from cap forecasts and records the cached-time failure boundary.
   * @evidence contracts/development/implementation.md#principled-implementation samplePhysicalTracking samples the cached pose and authored targets, compares joint-frame relative rotations and selects forecasts from floor(seconds*rate)/rate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates target interpolation, cached-pose sampling and quaternion operations to their existing owners; the simulation supplies its admitted inputs and retained diagnostics.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Recovery may intentionally depart from authored goals; reported error is not hidden by replacing the authored reference, and forecasts are not relabeled as measured torque.
   * @evidence contracts/development/implementation.md#efficient-algorithms For s segments, j joints and d retained diagnostics, cache/target sampling and comparison take O(s+j+d) work plus copied saturation entries, with transient maps and an O(j) result.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the completed cache and recorded forecasts without rerunning the solver. Dense arbitrary-time errors are computed on demand rather than retained for every film sample.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The simulation owns inputs/cache/forecast history; the query returns new diagnostic records and copies saturation lists, retaining no query result or native resource.
   */
  public trackingAt(
    seconds: number,
  ): IAutoMoviePhysicalSimulationInput.IDiagnostic[] {
    return samplePhysicalTracking(
      this.input,
      this.cache,
      this.tracking,
      seconds,
    );
  }

  /**
   * Admit an owned snapshot and identify its complete sampled input.
   *
   * Clones the input, supplies the same defaults as compute and rejects invalid
   * physical settings/targets before hashing. The digest includes cache policy
   * and solver-version identity; this path initializes no native solver.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States defensive ownership, shared defaults/admission, digest scope and the solver-free boundary.
   * @evidence contracts/development/implementation.md#principled-implementation admitted clones, defaults, validates and freezes the physical input; physicalInputDigest canonicalizes all admitted data and hashes it with the protocol and pinned solver version.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Identity and compute call the same admitted boundary and digest owner, so omitted defaults do not create a different runtime interpretation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The key derives from actual profiles, settings, impulses and sampled targets, not an edit timestamp or caller-asserted manifest.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work includes cloning/freezing the input, full physical admission, target canonicalization/hashing and final metadata hashing; sizes of sampled targets, profiles and impulses drive cost. Canonicalization sorts object keys and admission may scan referenced populations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The digest owner hashes each identical target object once within the cloned graph using a call-local Map; distinct equal objects are still hashed separately. No digest is cached across independently mutable input arguments.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owned snapshot, canonical strings and target-digest Map live only for this synchronous call; only the digest string escapes, with no native solver allocation.
   */
  public static identity(
    input: IAutoMoviePhysicalSimulationInput.IInput,
  ): string {
    return physicalInputDigest(this.admitted(input).owned);
  }

  /**
   * All identity callers and actual runs use exactly the same owned defaults
   * and admission, including the coupled-group schedule.
   */
  private static admitted(input: IAutoMoviePhysicalSimulationInput.IInput): {
    owned: IAutoMoviePhysicalSimulationInput.IInput;
    schedule: IPhysicalCoupledTargetSchedule | undefined;
  } {
    const owned: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
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
    return { owned, schedule: preparePhysicalCoupledTargetSchedule(owned) };
  }

  /**
   * Compute or resume a complete film from an admitted input snapshot.
   *
   * An equal full identity returns previous unchanged. Otherwise a compatible
   * unchanged prefix can resume from a native/controller/balance checkpoint;
   * fully kinematic inputs generate frames without a native dynamics world.
   * Progress reports completed intervals synchronously. Cancellation or an
   * error rejects rather than returning a partial successful performance.
   * Each declared coupled group fits its members against one snapshot. The
   * result keeps every converged report, and a resumed run keeps the reports
   * of its reused prefix. A failed group throws its typed error.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents owned admission, exact-result reuse, compatible-prefix resumption, kinematic execution and progress/cancellation behavior.
   * @evidence contracts/development/implementation.md#principled-implementation Integrates admitted SI inputs at 1/(rate*substeps) seconds, applies interval policy and first-substep impulses, and records completed cache frames and causal contacts. Prefix equivalence is established from actual settings/targets/impulses before restoration.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission/digest, prefix selection/restoration, world binding, tracking/contact owners and replay storage have separate responsibilities; this method coordinates their fixed-step order and native cleanup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Kinematic and exaggerated modes are explicit authored policy. Admitted body/segment/target populations and selected checkpoints justify internal lookups; valid previous results must retain their original input/checkpoint consistency. Missing geometry or exceeded floor bounds remain errors.
   * @evidence contracts/development/implementation.md#efficient-algorithms For r recomputed steps and u substeps, native solves and tracking/contact work dominate, with segment/shape and active-contact populations as dimensions. Each substep also scans all impulses, and prefix selection serializes prior samples while scanning impulses per candidate step; replay storage grows with total steps*segments plus checkpoint and contact data.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal complete identity returns the prior object; compatible prefixes reuse prior frames/receipts and coupled reports up to the resume step and restore copied native/controller/balance state. A static promise shares concurrent WASM initialization. Changed solver/profile/settings force restart; separate effectful compute calls are otherwise not merged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Restoration copies the causal prefix before allocating its World and transfers native ownership immediately on return; nested finally blocks then free the World and EventQueue on success, error or cancellation. Returned inputs, frames, receipts and checkpoint bytes remain caller-owned; step/segment admission bounds their populations but there is no total retained-byte budget. The initialization promise persists process-wide.
   */
  public static async compute(
    input: IAutoMoviePhysicalSimulationInput.IInput,
    previous?: IAutoMoviePhysicalSimulation,
    signal?: AbortSignal,
    progress?: (completed: number, total: number) => void,
  ): Promise<IAutoMoviePhysicalSimulation> {
    signal?.throwIfAborted();
    const {
      owned,
      schedule,
    }: ReturnType<typeof AutoMoviePhysicalSimulation.admitted> =
      this.admitted(input);
    const identity: string = physicalInputDigest(owned);
    if (previous?.cache.identity === identity) {
      progress?.(
        Math.round(owned.duration * owned.rate),
        Math.round(owned.duration * owned.rate),
      );
      signal?.throwIfAborted();
      return previous;
    }
    const cache: IAutoMoviePhysicsCache = new Cache(
      identity,
      owned.rate,
      owned.duration,
    );
    const count: number = Math.round(owned.duration * owned.rate);
    const diagnostics: IAutoMoviePhysicalSimulationInput.IDiagnostic[] = [];

    // A refit later in the same step replaces that step's report.
    const fits:
      | Record<
          number,
          Record<string, IAutoMoviePhysicalCoupledTargetFit.IConverged>
        >
      | undefined = schedule && Object.create(null);
    const coupling: IPhysicalCoupledTargetRun | undefined = schedule && {
      schedule,
      record: (
        reports: readonly IAutoMoviePhysicalCoupledTargetFit.IConverged[],
      ): void => {
        for (const report of reports)
          (fits![report.step] ??= Object.create(null))[report.group] = report;
      },
    };

    // A fully kinematic film constructs no dynamics world and takes no native steps.
    if (
      owned.bodies.every(
        (body: (typeof owned.bodies)[number]): boolean =>
          body.mode.kind === "kinematic",
      )
    ) {
      await computePhysicalKinematicFrames(
        owned,
        cache,
        signal,
        progress,
        coupling,
      );
      freezePhysicalRecord(cache);
      if (fits) freezePhysicalRecord(fits);
      return new AutoMoviePhysicalSimulation(
        owned,
        cache,
        0,
        diagnostics,
        fits,
      );
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
      bound.coupling = coupling;

      // The equal prefix keeps the reports of its completed steps.
      if (fits && start > 0)
        for (const [step, groups] of Object.entries(
          previous!.coupledTargetFits ?? {},
        ))
          if (Number(step) <= start && groups)
            for (const report of Object.values(groups))
              if (report) coupling!.record([report]);
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
          (body: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
            !!body.selfAvoidance ||
            body.targets.some(
              (target: IAutoMoviePhysicalSimulationInput.ITarget): boolean =>
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
          const target: IAutoMoviePhysicalSimulationInput.ITarget =
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
              const body: IAutoMoviePhysicalSimulationInput.IBody =
                owned.bodies.find(
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
              const pose: IAutoMovieRigidTransform = {
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
              const body: IAutoMoviePhysicalSimulationInput.IBody =
                owned.bodies.find(
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
      if (fits) freezePhysicalRecord(fits);
      return new AutoMoviePhysicalSimulation(
        owned,
        cache,
        count - start,
        diagnostics,
        fits,
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
