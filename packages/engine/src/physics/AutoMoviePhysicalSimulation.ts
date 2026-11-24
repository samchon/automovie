import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalCoupledTargetFit,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicsCache,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import type { IPhysicalCoupledTargetRun } from "./IPhysicalCoupledTargetRun";
import type { IPhysicalCoupledTargetSchedule } from "./IPhysicalCoupledTargetSchedule";
import { admitPhysicalSimulation } from "./admitPhysicalSimulation";
import { assertPhysicalReturnPath } from "./assertPhysicalReturnPath";
import { bindPhysicalWorld } from "./bindPhysicalWorld";
import { checkpointPhysicalSimulation } from "./checkpointPhysicalSimulation";
import { collectPhysicalContacts } from "./collectPhysicalContacts";
import { computePhysicalKinematicFrames } from "./computePhysicalKinematicFrames";
import { freezePhysicalRecord } from "./freezePhysicalRecord";
import { inPhysicalFloorBounds } from "./inPhysicalFloorBounds";
import { physicalInputDigest } from "./physicalInputDigest";
import { planPhysicalSimulationSteps } from "./planPhysicalSimulationSteps";
import { preparePhysicalContactHooks } from "./preparePhysicalContactHooks";
import { preparePhysicalCoupledTargetSchedule } from "./preparePhysicalCoupledTargetSchedule";
import { preparePhysicalGeometry } from "./preparePhysicalGeometry";
import { readPhysicalFrame } from "./readPhysicalFrame";
import { recordPhysicalContact } from "./recordPhysicalContact";
import { recordPhysicalSpanContacts } from "./recordPhysicalSpanContacts";
import { restorePhysicalSimulationCheckpoint } from "./restorePhysicalSimulationCheckpoint";
import { samplePhysicalTracking } from "./samplePhysicalTracking";
import { samplePhysicalTrackingTarget } from "./samplePhysicalTrackingTarget";
import { solvePhysicalCompliantContacts as solveCompliance } from "./solvePhysicalCompliantContacts";
import type { solveXpbdContacts } from "./solveXpbdContacts";
import { trackPhysicalWorld } from "./trackPhysicalWorld";
import { yieldPhysicalSimulation } from "./yieldPhysicalSimulation";

/**
 * Precompute fixed-step physics, then replay by time. Inputs are sampled bytes,
 * not callbacks hidden behind a cache key. The run steps its own in-house
 * extended position-based dynamics world, which lives only for the run. A late
 * edit reuses a checkpoint only after every earlier input matches; changed
 * geometry, solver settings or modes require a complete restart.
 */
export class AutoMoviePhysicalSimulation {
  /** Own the immutable input snapshot needed to verify checkpoint equivalence. */
  private constructor(
    /** Owned sampled inputs establishing checkpoint equivalence. */
    public readonly input: IAutoMoviePhysicalSimulationInput.IInput,
    /** Complete replay state. */
    public readonly cache: IAutoMoviePhysicsCache,
    /** Fixed steps performed by this run. */
    public readonly recomputedSteps: number,
    /** Pre-solve PD demands exceeding the enforced motor torque cap. */
    public readonly tracking: IAutoMoviePhysicalSimulationInput.IDiagnostic[],
    /**
     * Converged coupled-group target fits by output step and group id; omitted
     * when no target declares a group.
     */
    public readonly coupledTargetFits?: IAutoMoviePhysicalCoupledTargetFit.ISeries,
  ) {}

  /**
   * Measure authored-relative joint errors at local film seconds.
   *
   * Errors are shortest relative-rotation distances in radians. Saturation
   * lists are the last completed step's pre-solve torque-cap forecasts, not
   * measured motor impulses. Invalid time is rejected by cache.at.
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
   * and solver-version identity; this path builds no solver world.
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

    if (owned.contactTolerance === undefined) owned.contactTolerance = 0.0001;
    if (owned.contactFrequency === undefined) owned.contactFrequency = 240;
    for (const body of owned.bodies) {
      if (body.maximumBindings === undefined) body.maximumBindings = 16;
      if (body.handoffSeconds === undefined) body.handoffSeconds = 0.2;
      if (body.handoffLimits === undefined)
        body.handoffLimits = {
          maximumLinearError: owned.contactTolerance,
          // Post-stabilization at return entry projects each joint exactly,
          // leaving the float64 rounding of its composed rotations: 64 ulps.
          maximumJointViolation: 64 * Number.EPSILON,
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
   * unchanged prefix can resume from a solver/controller/balance checkpoint;
   * fully kinematic inputs generate frames without a dynamics world. Progress
   * reports completed intervals synchronously. Cancellation or an error rejects
   * rather than returning a partial successful performance. Each declared
   * coupled group fits its members against one snapshot. The result keeps every
   * converged report, and a resumed run keeps the reports of its reused prefix.
   * A failed group throws its typed error.
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

    // A fully kinematic film constructs no dynamics world and takes no solver steps.
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
    {
      const start: number = checkpointPhysicalSimulation(owned, previous);
      const plan: planPhysicalSimulationSteps.IResult =
        planPhysicalSimulationSteps(start, count, owned.checkpointEvery);
      const snapshots: ReadonlySet<number> = new Set(plan.snapshots);
      const world: AutoMovieXpbdWorld = restorePhysicalSimulationCheckpoint(
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

          // The snapshot already owns the cleared forces and passive motors.
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

      world.allowedError = owned.contactTolerance!;
      world.contactFrequency = owned.contactFrequency!;
      if (start === 0) {
        cache.frames.push(readPhysicalFrame(bound, 0));
        cache.checkpoints.set(0, world.takeSnapshot());
      }
      const active: Map<string, IAutoMovieContactReceipt> = new Map();
      const softened: Map<string, number> = new Map();
      const filter: solveXpbdContacts.Filter = preparePhysicalContactHooks(
        owned,
        bound,
      );
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
                  Vector3.scale(
                    impulse.impulse,
                    body.mode.kind === "exaggerated" ? body.mode.impulse : 1,
                  ),
                  impulse.point,
                );
              if (Vector3.length(impulse.impulse) > 0)
                softened.set(
                  `${impulse.body}/${impulse.bone}`,
                  instant + body.complianceSeconds,
                );
            }
          world.step(filter);
          assertPhysicalReturnPath(owned, bound, tick, "after");
          for (const body of owned.bodies)
            for (const segment of body.profile.segments) {
              const rigid: AutoMovieXpbdBody = bound.bodies.get(
                `${body.id}/${segment.bone}`,
              )!;

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
          recordPhysicalSpanContacts({
            settings: owned,
            bound,
            recovery: cache.recovery,
            instant,
            seconds,
            step,
            contacts: cache.contacts,
            active,
            found,
          });
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
        if (snapshots.has(step)) {
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
        plan.steps,
        diagnostics,
        fits,
      );
    }
  }
}
