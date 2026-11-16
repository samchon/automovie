import {
  type IAutoMovieResolvedBone,
  Vector3,
  clampPose,
  integrateAirborneRotation,
  physicalInertiaTensor,
  physicalPrincipalAxes,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionManner,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanPosture,
  jump,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { performance } from "node:perf_hooks";

import { motionHumanFrame } from "./motionHumanFrame";
import { qunit } from "./qunit";

/** One explicitly named stage of the control's ordinary pose resolution. */
interface IStage {
  /** Resolution, final range clamp or the final planted-goal refit. */
  stage: "resolved" | "clamped" | "planted";

  /** Actual canonical pose at this stage, with its world root retained. */
  pose: IAutoMoviePose;

  /** Selected leg/hip records from actual FK with an identity root. */
  bones: IAutoMovieResolvedBone[];

  /** Whole-body centre in that root frame, metres. */
  centre: IAutoMovieVector3;

  /** Segment centres in the logged model order, root-frame metres. */
  segmentCentres: IAutoMovieVector3[];

  /** Composite tensor in the root frame, kg m squared. */
  tensor: number[][];

  /** Principal moments and their rotation in the same root frame. */
  principal: ReturnType<typeof physicalPrincipalAxes>;
}

/** A control endpoint with the raw intent kept separate from actual stages. */
interface IPhase {
  /** Which side or finite-difference endpoint was read. */
  label: string;

  /** World clock of the stand-only control, seconds. */
  seconds: number;

  /** The direct native jump plan's local clock, seconds. */
  localSeconds: number;

  /** Original raw planner output, including actual planted/contact fields. */
  raw: IHumanPosture;

  /** Separately observed canonical stages; no stage is an expected answer. */
  stages: IStage[];
}

/** The three canonical stages that the control reads without a transition. */
interface IResolved {
  /** Raw native planner intent before any resolution. */
  raw: IHumanPosture;

  /** Ordinary cold public posture resolution. */
  resolved: IAutoMoviePose;

  /** Its final canonical range clamp. */
  clamped: IAutoMoviePose;

  /** A public refit of exactly the raw goals marked planted. */
  planted: IAutoMoviePose;
}

/**
 * Observe one takeoff boundary through a stand-only public context and the
 * original native jump planner, after the original representative stops.
 *
 * The same canonical body, outer seed, placement, skill and jump parameters
 * are retained. Two quiet stand actions provide a real entry at the end of
 * the original 0.3-second stand. The second stand's public context is lent
 * to jump.plan with only params replaced. This is a separate control, not
 * the failed performance's exact action id, random stream or full context.
 * No law is overridden and no flight pass is run on the control jump.
 *
 * Raw output, public resolve, final clamp and final planted-goal refit are
 * logged separately. The last stage repeats the displayed evaluator's
 * public refit of goals with planted===true, without layers, carry, stops,
 * transition offsets or near continuations. It cannot establish equivalence
 * to an arbitrary performance. Root-identity FK supplies shape, segment
 * centres and principal tensors. The unchanged 1 ms interval reads shape
 * velocities and history on both adjacent representable sides of its first
 * stencil switch; this observes a possible jump without moving its clock.
 * Entry clinical-rate and joint-spin maps are logged as ordered entries so
 * JSON retains their actual numeric contents rather than empty objects.
 *
 * @param body The original representative's canonical body.
 * @param input Its unchanged outer seed and performer input.
 * @param params Its unchanged native jump parameters, including rotation.
 * @returns Nothing; one bounded structured control record is logged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States control provenance and context differences, raw versus resolved/clamped/planted stages, root/world clocks, SI quantities, the unchanged difference interval and observation-only failure handling.
 * @evidence contracts/development/implementation.md#principled-implementation Position continuity and the same actual root-frame mass reductions distinguish a phase-value jump from its derivative and a principal-frame sign change. A real stand context and public native planner/resolver/FK avoid a substitute body or solver.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build one stand-only context, resolve five boundary endpoints through each actual stage, reduce the original-DELTA left/right intervals, and query the same public history around its first stencil switch.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains original jump parameters and bound values, admits each observed frame, and logs unavailable observations explicitly. Does not override a law, patch a method, alter an original acceptance result or claim the control is the original failed instance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Five endpoints each retain three linear FK/mass reductions after actual limb solves; three history reads perform their ordinary finite stencil work. Work is separately timed, bounded to this one control and not claimed as playback performance.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses each endpoint's actual final posed mass state for both adjacent interval momenta and centre velocities. The destructive principal-axis owner receives copied rows so the observed root-frame tensor retains its physical values. History alone owns its exact-time reuse; no original performance or solver result supplies an expected pose.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Control poses and reductions live only until this single log returns; history is cleared in finally. The ordinary performance owner retains its existing two-input memo policy. No host, process, global observer or external handle is created.
 */
export function motionHumanTakeoffDiagnostic(
  body: IHumanBody,
  input: HumanPerformance.IInput,
  params: Parameters<typeof jump.plan>[0]["params"],
): void {
  const started: number = performance.now();
  const cpu: NodeJS.CpuUsage = process.cpuUsage();
  const problems: string[] = [];
  if (input.performers.length !== 1 || input.performers[0]?.body !== body)
    throw new Error("Takeoff control needs the original single canonical performer");
  const control: HumanPerformance = new HumanPerformance({
    seed: input.seed,
    performers: input.performers,
    composition: HumanChain.subject("a").stand({ seconds: 0.3 }).stand({ seconds: 0.1 }).node,
  });
  const segment: HumanSegment.ISegment | undefined = control.segments("a")[1];
  if (segment === undefined) throw new Error("Takeoff control has no public entered stand context");
  const context: Parameters<typeof jump.plan>[0] = { ...segment.context, params };
  const plan: ReturnType<typeof jump.plan> = jump.plan(context);
  if (plan.flight === undefined) throw new Error("Original turn request has no flight declaration");
  const p: number = jump.PUSH * AutoMovieMotionManner.of(context, params.manner).tempo;
  const off: number = context.start + p;
  const delta: number = integrateAirborneRotation.DELTA;
  const span: { from: number; to: number } = {
    from: context.start + plan.flight.from * plan.duration,
    to: context.start + plan.flight.to * plan.duration,
  };
  const model: resolveAutoMovieCenterOfMass.IModel = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const phases: IPhase[] = [];
  const masses: Map<number, resolveAutoMovieMomentum.IPosed> = new Map();
  const selected: readonly AutoMovieHumanoidBone[] = [
    "hips", "leftUpperLeg", "leftLowerLeg", "leftFoot", "leftToes",
    "rightUpperLeg", "rightLowerLeg", "rightFoot", "rightToes",
  ];

  /** The neighboring IEEE-754 value of this positive, finite control clock. */
  function adjacent(seconds: number, direction: -1 | 1): number {
    if (!(Number.isFinite(seconds) && seconds > 0)) throw new Error("Control clock is not positive and finite");
    const view: DataView = new DataView(new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT));
    view.setFloat64(0, seconds);
    view.setBigUint64(0, view.getBigUint64(0) + BigInt(direction));
    return view.getFloat64(0);
  }

  /** Cold public resolution followed by the actual final planted-goal stage. */
  function resolveAt(seconds: number): IResolved {
    const raw: IHumanPosture = plan.posture(seconds - context.start);
    if (raw.rotation !== undefined) throw new Error("The control jump unexpectedly received a flight rotation");
    const resolved: IAutoMoviePose = resolveHumanPosture(body, raw);
    const clamped: IAutoMoviePose = clampPose(resolved, body.skeleton);
    const plants: IHumanPosture["limbs"] = Object.fromEntries(Object.entries(raw.limbs).filter(
      ([, goal]: [string, IHumanPosture.IGoal]): boolean => goal.planted === true,
    ));
    resolveHumanPosture.order(plants);
    const planted: IAutoMoviePose = resolveHumanPosture.refit(body, clamped, plants).pose;
    return { raw, resolved, clamped, planted };
  }

  for (const [label, seconds] of [
    ["before-delta", off - delta], ["before-ulp", adjacent(off, -1)],
    ["takeoff", off], ["after-ulp", adjacent(off, 1)], ["after-delta", off + delta],
  ] as const) {
    try {
      const read: IResolved = resolveAt(seconds);
      const phase: IPhase = { label, seconds, localSeconds: seconds - context.start, raw: structuredClone(read.raw), stages: [] };
      for (const stage of ["resolved", "clamped", "planted"] as const) {
        const pose: IAutoMoviePose = read[stage];
        if (pose.root === null || !qunit(pose.root.rotation) ||
          ![pose.root.translation.x, pose.root.translation.y, pose.root.translation.z].every(Number.isFinite))
          throw new Error(`${label} ${stage}: invalid world root`);
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, { ...pose, root: null });
        motionHumanFrame(bones, `${label} ${stage} root-identity FK`);
        const mass: resolveAutoMovieMomentum.IPosed = resolveAutoMovieMomentum.pose(model, bones);
        const tensor: number[][] = physicalInertiaTensor(mass.parts, mass.centre);
        phase.stages.push({
          stage, pose: structuredClone(pose),
          bones: selected.map((bone: AutoMovieHumanoidBone): IAutoMovieResolvedBone => {
            const value: IAutoMovieResolvedBone | undefined = bones.get(bone);
            if (value === undefined) throw new Error(`${label} ${stage}: missing ${bone}`);
            return structuredClone(value);
          }),
          centre: { ...mass.centre },
          segmentCentres: mass.parts.map((part: (typeof mass.parts)[number]): IAutoMovieVector3 => ({ ...part.centerOfMass })),
          tensor,
          principal: physicalPrincipalAxes(tensor.map(
            (row: number[]): number[] => [...row],
          )),
        });
        if (stage === "planted") masses.set(seconds, mass);
      }
      phases.push(phase);
    } catch (error) {
      problems.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  let velocities: {
    /** Left one-sided root-frame linear and angular momenta. */
    left: ReturnType<typeof resolveAutoMovieMomentum.between>;

    /** Right one-sided momenta over the unchanged difference interval. */
    right: ReturnType<typeof resolveAutoMovieMomentum.between>;

    /** Left root-local centre velocity, metres per second. */
    centreLeft: IAutoMovieVector3;

    /** Right root-local centre velocity, metres per second. */
    centreRight: IAutoMovieVector3;
  } | null = null;
  const before: resolveAutoMovieMomentum.IPosed | undefined = masses.get(off - delta);
  const at: resolveAutoMovieMomentum.IPosed | undefined = masses.get(off);
  const after: resolveAutoMovieMomentum.IPosed | undefined = masses.get(off + delta);
  try {
    if (before === undefined || at === undefined || after === undefined)
      problems.push("A final planted endpoint is unavailable for the unchanged-DELTA velocity read");
    else velocities = {
      left: resolveAutoMovieMomentum.between(model, before, at, delta),
      right: resolveAutoMovieMomentum.between(model, at, after, delta),
      centreLeft: Vector3.scale(Vector3.subtract(at.centre, before.centre), 1 / delta),
      centreRight: Vector3.scale(Vector3.subtract(after.centre, at.centre), 1 / delta),
    };
  } catch (error) {
    problems.push(`velocities: ${error instanceof Error ? error.message : String(error)}`);
  }
  const velocitiesFinite: boolean = velocities !== null && [
    velocities.left.linear, velocities.left.angular,
    velocities.right.linear, velocities.right.angular,
    velocities.centreLeft, velocities.centreRight,
  ].every((value: IAutoMovieVector3): boolean =>
    [value.x, value.y, value.z].every(Number.isFinite));
  if (velocities !== null && !velocitiesFinite)
    problems.push("One-sided momentum or centre velocity is nonfinite");
  const history: ReturnType<typeof integrateAirborneRotation.history> = integrateAirborneRotation.history(
    model,
    (seconds: number): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      poseBones(body, { ...resolveAt(seconds).planted, root: null }),
    span,
  );
  const switchAt: number = span.from + delta;
  const historyRows: { seconds: number; instant: integrateAirborneRotation.IInstant }[] = [];
  try {
    for (const seconds of [adjacent(switchAt, -1), switchAt, adjacent(switchAt, 1)]) {
      try {
        historyRows.push({ seconds, instant: structuredClone(history(seconds)) });
      } catch (error) {
        problems.push(`history ${seconds}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    history.clear();
  }
  console.log(JSON.stringify({
    sample: "jump-takeoff-control", scope: "stand-only public context; not the original failed instance",
    seed: input.seed, params, contextStart: context.start, entrySeconds: context.entry.seconds,
    contextTempo: context.tempo,
    entry: {
      pose: context.entry.pose, posture: context.entry.posture,
      feet: context.entry.feet,
      velocity: {
        linear: context.entry.velocity.linear,
        angular: context.entry.velocity.angular,
        joints: [...context.entry.velocity.joints],
        spins: [...context.entry.velocity.spins],
      },
      acceleration: context.entry.acceleration, supports: context.entry.supports,
      base: context.entry.base,
    },
    p, off, span, delta, switchAt,
    segmentOrder: model.segments.map((segment: resolveAutoMovieCenterOfMass.ISegment): AutoMovieHumanoidBone => segment.bone),
    phases, velocities, velocitiesFinite, historyRows, problems,
    wallMs: performance.now() - started, cpuUs: process.cpuUsage(cpu),
  }));
}
