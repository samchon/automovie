import { admitPhysicalBody as admitPhysicalBodyImplementation } from "./internal/admitPhysicalBody";
import { admitPhysicalTargets as admitPhysicalTargetsImplementation } from "./internal/admitPhysicalTargets";
import { fitPhysicalWholeBodyTarget as fitPhysicalWholeBodyTargetImplementation } from "./internal/fitPhysicalWholeBodyTarget";
import { hasPhysicalHandoff as hasPhysicalHandoffImplementation } from "./internal/hasPhysicalHandoff";
import { isPhysicalActuatorChain as isPhysicalActuatorChainImplementation } from "./internal/isPhysicalActuatorChain";
import { preparePhysicalTargetSampler as preparePhysicalTargetSamplerImplementation } from "./internal/preparePhysicalTargetSampler";
import { projectPhysicalTargets as projectPhysicalTargetsImplementation } from "./internal/projectPhysicalTargets";
import { readPhysicalScene as readPhysicalSceneImplementation } from "./internal/readPhysicalScene";
import { resolvePhysicalPerformanceMode as resolvePhysicalPerformanceModeImplementation } from "./internal/resolvePhysicalPerformanceMode";
import { samplePhysicalAuthoredTargets as samplePhysicalAuthoredTargetsImplementation } from "./internal/samplePhysicalAuthoredTargets";
import { samplePhysicalOwnership as samplePhysicalOwnershipImplementation } from "./internal/samplePhysicalOwnership";
import { samplePhysicalTarget as samplePhysicalTargetImplementation } from "./internal/samplePhysicalTarget";
import { seedPhysicalChainTarget as seedPhysicalChainTargetImplementation } from "./internal/seedPhysicalChainTarget";

import { type IAutoMovieAuditPhysicalOutcomes, type IAutoMovieContactReceipt, type IAutoMoviePhysicalCoupledTargetFit, type IAutoMoviePhysicalSimulation, type IAutoMoviePhysicalSimulationInput, type IAutoMoviePhysicsCache, type IAutoMovieRigidTransform, type IAutoMovieFitPhysicalWholeBodyTarget, type IAutoMoviePhysicalHandoff, type IAutoMoviePhysicalProfile, type IAutoMovieSamplePhysicalTarget, type IAutoMovieProjectPhysicalTargets, type IAutoMoviePhysicalFrame, type IAutoMoviePerformanceMode, type IAutoMoviePhysicalOwnershipEvent, type IAutoMovieSeedPhysicalChainTarget, type IAutoMoviePhysicalRecoveryState } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import type { IPhysicalCoupledTargetRun } from "./internal/IPhysicalCoupledTargetRun";
import type { IPhysicalCoupledTargetSchedule } from "./internal/IPhysicalCoupledTargetSchedule";
import { admitPhysicalSimulation } from "./internal/admitPhysicalSimulation";
import { admitPhysicalOutcomes } from "./admitPhysicalOutcomes";
import { auditPhysicalOutcomes } from "./auditPhysicalOutcomes";
import { assertPhysicalReturnPath } from "./internal/assertPhysicalReturnPath";
import { bindPhysicalWorld } from "./internal/bindPhysicalWorld";
import { capturePhysicalSimulationCheckpoint } from "./capturePhysicalSimulationCheckpoint";
import { checkpointPhysicalSimulation } from "./internal/checkpointPhysicalSimulation";
import { collectPhysicalContacts } from "./internal/collectPhysicalContacts";
import { computePhysicalKinematicFrames } from "./computePhysicalKinematicFrames";
import { inPhysicalFloorBounds } from "./inPhysicalFloorBounds";
import { physicalInputDigest } from "./internal/physicalInputDigest";
import { planPhysicalSimulationSteps } from "./planPhysicalSimulationSteps";
import { preparePhysicalContactHooks } from "./internal/preparePhysicalContactHooks";
import { preparePhysicalCoupledTargetSchedule } from "./internal/preparePhysicalCoupledTargetSchedule";
import { preparePhysicalGeometry } from "./preparePhysicalGeometry";
import { readPhysicalFrame } from "./internal/readPhysicalFrame";
import { recordPhysicalContact } from "./internal/recordPhysicalContact";
import { recordPhysicalSpanContacts } from "./recordPhysicalSpanContacts";
import { restorePhysicalSimulationCheckpoint } from "./internal/restorePhysicalSimulationCheckpoint";
import { samplePhysicalTracking } from "./internal/samplePhysicalTracking";
import { samplePhysicalTrackingTarget } from "./internal/samplePhysicalTrackingTarget";
import { solvePhysicalCompliantContacts as solveCompliance } from "./internal/solvePhysicalCompliantContacts";
import { solveXpbdArticulation } from "./solveXpbdArticulation";
import type { solveXpbdContacts } from "./solveXpbdContacts";
import { trackPhysicalWorld } from "./internal/trackPhysicalWorld";
import { yieldPhysicalSimulation } from "./internal/yieldPhysicalSimulation";

/**
 * Precompute fixed-step physics, then replay by time. Inputs are sampled bytes,
 * not callbacks hidden behind a cache key. The run steps its own in-house
 * extended position-based dynamics world, which lives only for the run. A late
 * edit reuses a checkpoint only after every earlier input matches; changed
 * geometry, solver settings or modes require a complete restart.
 */
export class AutoMoviePhysicalSimulation {
  /**
   * Admit one body's declared controller policy independently of its sampled
   * target population.
   */
  public static admitBody(input: IAutoMoviePhysicalSimulationInput.IInput, body: IAutoMoviePhysicalSimulationInput.IBody): void {
    admitPhysicalBodyImplementation(input, body);
  }

  /**
   * Admit complete populations, floor dimensions and work budgets before identity
   * or world allocation.
   */
  public static admit(input: IAutoMoviePhysicalSimulationInput.IInput): void {
    admitPhysicalSimulation(input);
  }

  /**
   * Admit every sampled ownership, effort and world pose before target fitting or
   * native allocation.
   */
  public static admitTargets(input: IAutoMoviePhysicalSimulationInput.IInput, body: IAutoMoviePhysicalSimulationInput.IBody): void {
    admitPhysicalTargetsImplementation(input, body);
  }

  /**
   * Reject an obstructed C1 return before advancing native bodies. This checks
   * the complete next kinematic articulation against current dynamic receivers,
   * the floor, admitted self pairs and fixed pivots. It is a discrete path
   * admission, not a continuous collision or dynamically feasible control
   * certificate.
   */
  public static assertReturnPath(input: IAutoMoviePhysicalSimulationInput.IInput, bound: Bound, tick: number, phase: "before" | "after"): void {
    assertPhysicalReturnPath(input, bound, tick, phase);
  }

  /**
   * Create the world's bodies, colliders and joints for every admitted body, or
   * reconnect a restored world's in creation order. A segment is dynamic when its
   * first target selects it, kinematic otherwise; it carries the profile's mass
   * properties. A compliant material's shape is a sensor with a solid inner core
   * eroded by its maximum compression. The floor is a stationary kinematic box
   * with friction 0.7.
   */
  public static bindWorld(world: AutoMovieXpbdWorld, input: IAutoMoviePhysicalSimulationInput.IInput, restored: boolean): Bound {
    return bindPhysicalWorld(world, input, restored);
  }

  /**
   * An unchanged prefix is established from actual data, never from an edit-time
   * assertion.
   */
  public static checkpoint(input: IAutoMoviePhysicalSimulationInput.IInput, previous?: IAutoMoviePhysicalSimulation): number {
    return checkpointPhysicalSimulation(input, previous);
  }

  /**
   * Fit a whole articulated body to one endpoint goal while a support segment
   * stays held, turning only about its contact.
   *
   * The tree is held from the support ({@link rerootPhysicalProfile}), and a
   * virtual base hinges onto it at the contact point about the contact normal
   * within the declared turn, so the old root (a pelvis) rotates, tilts and
   * translates through the support chain's own joints while the reaching chain
   * reaches. Every coordinate stays inside its own declared ROM, the contact
   * point never moves, and the bounded articulation solver
   * ({@link solvePhysicalArticulationTargets}) accepts only residual decreases.
   * The residual is the goal point's world error in metres and, when an approach
   * is declared, the weighted difference between the endpoint's local direction
   * carried to world and the approach direction.
   *
   * @returns World poses of every original segment, and the residual report.
   */
  public static fitWholeBodyTarget(input: IAutoMovieFitPhysicalWholeBodyTarget.IInput): IAutoMovieFitPhysicalWholeBodyTarget.IResult {
    return fitPhysicalWholeBodyTargetImplementation(input);
  }

  /**
   * Inspect run-owned transitions without allocating a key array on each native
   * tick.
   */
  public static hasHandoff(transitions: Readonly<Record<string, IAutoMoviePhysicalHandoff>> | undefined): boolean {
    return hasPhysicalHandoffImplementation(transitions);
  }

  /**
   * Relationship fitting must own a real contiguous path with at least one
   * articulated joint.
   */
  public static isActuatorChain(profile: IAutoMoviePhysicalProfile, chain: readonly string[], source: string): boolean {
    return isPhysicalActuatorChainImplementation(profile, chain, source);
  }

  /**
   * Hash every admitted sampled value without retaining one film-sized JSON
   * string.
   */
  public static inputDigest(input: IAutoMoviePhysicalSimulationInput.IInput): string {
    return physicalInputDigest(input);
  }

  /**
   * Compile one interval's motion coefficients. Scalar checks retain direct
   * callers' mutable-transform semantics; returned vectors are independently
   * owned.
   */
  public static prepareTargetSampler(before: IAutoMovieRigidTransform, after: IAutoMovieRigidTransform, rate: number): (fraction: number) => IAutoMovieSamplePhysicalTarget.IResult {
    return preparePhysicalTargetSamplerImplementation(before, after, rate);
  }

  /**
   * Convert authored placements into the declared fixed-pivot physical tree.
   * Preserve root placement and requested parent-relative rotations, project
   * every native angular coordinate, then reconstruct coincident anchors in
   * parent order. Report the largest translation and angular adjustment so an
   * author can detect a physical approximation that changes the intended pose.
   * This operates on motor goals only, never on a simulated or displayed frame.
   */
  public static projectTargets(profile: IAutoMoviePhysicalProfile, authored: Readonly<Record<string, IAutoMovieRigidTransform>>): IAutoMovieProjectPhysicalTargets.IResult {
    return projectPhysicalTargetsImplementation(profile, authored);
  }

  /** Copy display state without retaining solver bodies or changing solver order. */
  public static readFrame(bound: Bound, seconds: number): IAutoMoviePhysicalFrame {
    return readPhysicalFrame(bound, seconds);
  }

  /**
   * Own one simultaneous native scene per controller tick. A later ownership
   * write refreshes only its body's changed transforms, preserving snapshots
   * already retained by fitted plans.
   */
  public static readScene(bound: Bound, previous?: Readonly<
    Record<string, Readonly<Record<string, IAutoMovieRigidTransform>>>
  >, body?: string): Record<string, Record<string, IAutoMovieRigidTransform>> {
    return readPhysicalSceneImplementation(bound, previous, body);
  }

  /**
   * Resolve an explicit scene policy and optional body override without
   * content-name defaults.
   */
  public static resolvePerformanceMode(scene: IAutoMoviePerformanceMode, body?: IAutoMoviePerformanceMode): IAutoMoviePerformanceMode {
    return resolvePhysicalPerformanceModeImplementation(scene, body);
  }

  /**
   * Restore the complete solver and causal prefix selected by sampled-input
   * equivalence.
   *
   * The caller selects an equivalent completed cached interval and supplies empty
   * destination collections. Frames and completed receipts remain borrowed;
   * snapshot bytes, controller state and diagnostics are copied. A copy failure
   * leaves a partial destination that the failed run must discard, but builds no
   * world. A successful return hands the caller its world.
   */
  public static restoreCheckpoint(input: IAutoMoviePhysicalSimulationInput.IInput, previous: IAutoMoviePhysicalSimulation | undefined, cache: IAutoMoviePhysicsCache, start: number, diagnostics: IAutoMoviePhysicalSimulationInput.IDiagnostic[]): AutoMovieXpbdWorld {
    return restorePhysicalSimulationCheckpoint(input, previous, cache, start, diagnostics);
  }

  /**
   * Reuse admitted interval coefficients while retaining the original authored
   * interpolation clock and rate arithmetic. Mutable direct callers are checked
   * by the scalar-aware bone samplers.
   */
  public static sampleAuthoredTargets(body: IAutoMoviePhysicalSimulationInput.IBody, target: IAutoMoviePhysicalSimulationInput.ITarget, bound: Bound, step: number, seconds: number, rate: number): Record<string, IAutoMovieSamplePhysicalTarget.IResult> {
    return samplePhysicalAuthoredTargetsImplementation(body, target, bound, step, seconds, rate);
  }

  /**
   * Resolve the last causal native authority change for one segment. Live caches
   * and solver-free archives share this exact arbitrary-time selection; no
   * authored clock reconstructs contact activation or return completion.
   */
  public static sampleOwnership(events: readonly IAutoMoviePhysicalOwnershipEvent[], duration: number, body: string, bone: string, seconds: number): IAutoMoviePhysicalOwnershipEvent["kind"] {
    return samplePhysicalOwnershipImplementation(events, duration, body, bone, seconds);
  }

  /**
   * Interpolate sampled goals and derive world velocities from the same shortest
   * arc.
   */
  public static sampleTarget(before: IAutoMovieRigidTransform, after: IAutoMovieRigidTransform, fraction: number, rate: number): IAutoMovieSamplePhysicalTarget.IResult {
    return samplePhysicalTargetImplementation(before, after, fraction, rate);
  }

  /**
   * Seed a straight-chain singularity with the shared triangle solver, through
   * bounded coordinates only.
   */
  public static seedChainTarget(input: IAutoMovieSeedPhysicalChainTarget.IInput): void {
    seedPhysicalChainTargetImplementation(input);
  }

  /**
   * Apply bounded PD forces and equal-opposite joint torques before the fixed
   * step.
   */
  public static trackWorld(world: AutoMovieXpbdWorld, input: IAutoMoviePhysicalSimulationInput.IInput, bound: Bound, step: number, softened: Map<string, number>, diagnostics: IAutoMoviePhysicalSimulationInput.IDiagnostic[], recovery: Record<string, IAutoMoviePhysicalRecoveryState>, contacts: readonly IAutoMovieContactReceipt[], seconds: number): void {
    trackPhysicalWorld(world, input, bound, step, softened, diagnostics, recovery, contacts, seconds);
  }

  /**
   * Observe completed work and cooperatively release the host at the declared
   * interval.
   */
  public static yield(step: number, total: number, yieldEvery: number, signal?: AbortSignal, progress?: (completed: number, count: number) => void): Promise<void> {
    return yieldPhysicalSimulation(step, total, yieldEvery, signal, progress);
  }

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

  /** Admit authored contact and fall promises before evaluating outcome promises. */
  public static admitOutcomes(
    input: IAutoMovieAuditPhysicalOutcomes.IInput,
  ): void {
    admitPhysicalOutcomes(input);
  }

  /** Audit authored outcomes against supplied contact and fall observations. */
  public static auditOutcomes(
    input: IAutoMovieAuditPhysicalOutcomes.IInput,
  ): IAutoMovieAuditPhysicalOutcomes.IFinding[] {
    return auditPhysicalOutcomes(input);
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
              // The blow acts through the struck body's whole articulation
              // (`solveXpbdArticulation.impulse`).
              solveXpbdArticulation.impulse(
                world.joints,
                bound.bodies.get(`${impulse.body}/${impulse.bone}`)!,
                impulse.point,
                Vector3.scale(
                  impulse.impulse,
                  body.mode.kind === "exaggerated" ? body.mode.impulse : 1,
                ),
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
        if (snapshots.has(step))
          capturePhysicalSimulationCheckpoint({
            cache,
            world,
            bound,
            active,
            softened,
            step,
          });
        if (step % owned.yieldEvery === 0 || step === count)
          await yieldPhysicalSimulation(
            step,
            count,
            owned.yieldEvery,
            signal,
            progress,
          );
      }
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
