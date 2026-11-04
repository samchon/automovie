import { Quaternion } from "@automovie/engine";
import {
  AutoMovieHumanClinicalIk,
  AutoMovieHumanLegIk,
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ActionClock } from "../core/ActionClock";
import { ActionVariation } from "../core/ActionVariation";
import type { MotionAction } from "../core/MotionAction";
import { MotionRecovery } from "../core/MotionRecovery";
import { MotionSupportChannels } from "../core/MotionSupportChannels";
import type { DefenseContinuation } from "./DefenseContinuation";

/**
 * Reusable supported defenses with explicit bone-bound interception requests.
 *
 * @evidence contracts/common.md#implementation-and-ownership IBA pp.57/58/62/67, England Boxing p.85 and the retained Chan 13.2s check inform coordination. Numerical articulation, displacement and phase durations remain authored inputs rather than image measurements. Public Human blending preserves complete clinical controls; the real host owns FK, target fitting and contact queries.
 * @evidence contracts/common.md#authoring-interface Every placement names independent participants, side, local phases and bounded variation. Measured glove/receiving witnesses and actor-local targets are supplied explicitly. No First15 timeline, paired route, implicit opponent identity, force simulation or contact exemption is included.
 */
export namespace DefenseMotion {
  /**
   * Defensive actions with distinct interception or evasion mechanics.
   *
   * @evidence contracts/common.md#implementation-and-ownership The closed union distinguishes an arm interception, supported evasion and a shin check; each branch samples the same independent participant and local phase contract.
   * @evidence contracts/common.md#authoring-interface Guard sustains the supplied hand targets; cover/catch/parry/check require a receiving patch, and slip/weave require explicit root displacement. These labels prescribe requests rather than collision outcomes.
   */
  export type Kind =
    | "guard"
    | "cover"
    | "catch"
    | "parry"
    | "slip"
    | "weave"
    | "check";
  /**
   * One real bone-bound protective point and its requested actor-local destination.
   *
   * @evidence contracts/common.md#implementation-and-ownership Identity and radius come from the actual displayed equipment or limb. A proxy records its real extent and never replaces whole-mesh clearance checks.
   * @evidence contracts/common.md#authoring-interface Target and localPoint use metres in actor and named-bone frames respectively; radius is a positive metre extent. Missing localPoint means the joint centre.
   */
  export interface Patch {
    /** Canonical public Human bone that carries the point. */ bone: MotionAction.Effector["bone"];
    /** Retained actual point in that bone's local metres. */ localPoint?: MotionAction.Vec3;
    /** Requested actor-local protective/intercept position, metres. */ target: MotionAction.Vec3;
    /** Actual declared proxy extent, metres. */ radius: number;
  }
  /**
   * Per-placement geometry and deliberate, bounded defensive intent.
   *
   * @evidence contracts/common.md#implementation-and-ownership Guard targets stay with real hand bones. A separate receiving patch lets a forearm or shin intercept without inventing a detached glove. Evasion and support shifts are authored metres; contact recovery is triggered only by an actual matched incoming event.
   * @evidence contracts/common.md#authoring-interface guardBinding declares clinical shape or independent task at authoring; omission retains task compatibility. Clinical guard targets identify the actual baseline bone/local point within one micrometre of coordinate agreement. Receiving overrides a coincident guard and remains an independent hard interception through contact dwell. receivingReturn separately declares withdrawal authority after release, without changing the original threat/task/event. contactElapsed is host-observed age; event.time belongs to the attacker's clock.
   */
  export interface Config {
    /** Both hand-bound guard points, retained during unrelated defense. */ guard: Record<
      MotionAction.Side,
      Patch
    >;
    /** Original authoring authority: clinical follows its actual pose-bound baseline point; omission/task retains independent supplied targets. */ guardBinding?:
      | "clinical"
      | "task";
    /** Acting-side receiving point; required by cover/catch/parry/check. */ receiving?: Patch & {
      /** Same point's baseline actor-local position. */ restTarget: MotionAction.Vec3;
    };
    /** Authority after contact dwell: clinical withdraws the limb from the actual stop; omission/task retains an independent Cartesian return. Interception remains external before release. */ receivingReturn?:
      | "clinical"
      | "task";
    /** Actor-local parry displacement after interception; metres. */ parryDisplacement?: MotionAction.Vec3;
    /** Low hand catch or actual forearm/elbow brace; the other hand retains its head guard. */ bodyGuard?:
      | "glove"
      | "forearm";
    /** Positive world-vertical root drop for slip/weave, metres. */ rootDropMetres?: number;
    /** Signed own-left root excursion for slip/weave, metres. */ lateralMetres?: number;
    /** Authored horizontal pelvis displacement, actor-local metres; supportShift() aligns the stationary hip with its ankle. Neither an ankle position nor a floor witness is itself a pelvis destination or COM measurement. */ supportShift?: MotionAction.Vec3;
    /** Actual incoming contact age, seconds; resolved timing.contact holds the stopped state before return. Omission keeps anticipated defense. */ contactElapsed?: number;
  }

  /**
   * External placement tasks and separate authored clinical observations.
   * @evidence contracts/common.md#implementation-and-ownership Clinical guards and anatomical guides are observations of the declared pose, outside both hard and soft world tasks. The host-owned same-problem support planner retains its original targets, numerical outcome and cost separately from final displayed admission.
   * @evidence contracts/common.md#authoring-interface Consumers fit only effectors/support and inspect clinicalWitnesses against the actual applied pose. The host records preparation cost and original WORLD support goals independently; achieved coordinates never replace fitting goals.
   */
  export interface Sample extends MotionAction.Sample {
    /** Internal pose-bound references; never independent hard/soft world tasks. */ clinicalWitnesses?: MotionAction.Effector[];
    /** Original arm-only external receiving fit; final contact/floor admission remains independent. */ receivingFit?: {
      error: number;
      iterations: number;
      milliseconds: number;
      clamped: AutoMovieHumanSkeleton.IOutput["clamped"];
    };
  }

  /**
   * Author the pelvis displacement that aligns the stationary hip above its ankle.
   *
   * @evidence contracts/common.md#implementation-and-ownership Subtracts the same baseline UpperLeg origin from its own Foot origin in the actual body's evaluator frame. The anatomical hip offset therefore remains distinct from the actor root, ankle destination and minimum floor witness. No fitting, achieved-target replacement or balance claim participates.
   * @evidence contracts/common.md#authoring-interface Call once at initial check authoring with the acting side and same-body evaluator. Returns an owned horizontal metre displacement for Config.supportShift; both original foot WORLD tasks and the independent receiving/threat declarations remain unchanged. Actual native-ROM, load and full-foot admission are still required.
   */
  export function supportShift(
    context: MotionAction.Context,
    actingSide: MotionAction.Side,
  ): MotionAction.Vec3 {
    if (
      !context.evaluatePose ||
      (actingSide !== "left" && actingSide !== "right")
    )
      throw new Error(
        "Check pelvis staging requires an anatomical acting side and its actual baseline evaluator",
      );
    const side: MotionAction.Side = actingSide === "left" ? "right" : "left";
    const baseline: AutoMovieHumanSkeleton.IOutput = context.evaluatePose(
      context.basePose,
    );
    const hip: MotionAction.Vec3 = point(
      baseline,
      AutoMovieHumanRigControls.joint(`${side}UpperLeg`),
    );
    const ankle: MotionAction.Vec3 = point(
      baseline,
      AutoMovieHumanRigControls.joint(`${side}Foot`),
    );
    return [ankle[0] - hip[0], 0, ankle[2] - hip[2]];
  }

  /**
   * Sample one defense independently, optionally recovering its actual stopped state.
   *
   * @evidence contracts/common.md#implementation-and-ownership Check/slip/weave retain original emitted plantar goals and the explicit planted hip/knee/ankle/subtalar policy; midfoot/toes stay authored. On each exact-input cache miss, the host's same-problem support planner permits at most16 native updates and records its actual CPU/outcome. Its realized pose and root travel together into the final sample. Check can request current and peak placements; its maximum is two preparations/32 updates before the separate final host fit. The evaluator-keyed cache retains two detached pose/root endpoints. Clinical observations stay outside WORLD tasks and stopped recovery retains actual anchors/locks through landing.
   * @evidence contracts/common.md#authoring-interface Check needs same-body FK/neutral/world frame; moving slip needs FK and original WORLD plantar frames. Clinical guards/withdrawal need FK. A check authors its pelvis displacement separately from fixed foot anchors; slip retains requested torso/drop/lateral intent without an unrelated absolute leg preset. External interception/dwell retain the original receiving declaration, followed by separately authored clinical withdrawal or literal task return. Loaded support is not remeasured at release. Actual full-foot landing precedes load acceptance. Native ROM, shape, joins, floor and first contact still require independent admission.
   */
  export function sample(
    kind: Kind,
    request: MotionAction.Request,
    context: MotionAction.Context,
    seconds: number,
    config: Config,
    continuation?: DefenseContinuation,
  ): Sample {
    const variation: ActionVariation.Result = ActionVariation.create(request);
    validate(kind, request, config);
    if (
      continuation &&
      continuation.windowSeconds >
        variation.timing.preparation + variation.timing.delivery
    )
      throw new Error(
        "Defense entry correction must finish by the original receiving endpoint",
      );
    if (kind === "check" && (!context.evaluatePose || !context.neutral))
      throw new Error(
        "An anatomical check requires the actual body's public evaluator and neutral output",
      );
    if (config.receivingReturn === "clinical" && !context.evaluatePose)
      throw new Error(
        "Clinical receiving-limb withdrawal requires the actual body's public evaluator",
      );
    const clock: ActionClock.State = ActionClock.sample(
      variation.timing,
      seconds,
    );
    if (config.contactElapsed !== undefined)
      return incoming(
        kind,
        request,
        context,
        seconds,
        config,
        variation.timing,
      );
    const sign: number = request.side === "left" ? 1 : -1;
    const weight: number = kind === "guard" ? 0 : clock.weight;
    let sourcePose: IAutoMovieHumanPose = context.basePose;
    let shaped: IAutoMovieHumanPose = structuredClone(sourcePose);
    shaped.arms ??= { left: {}, right: {} };
    shaped.legs ??= { left: {}, right: {} };
    const rootOffset: MotionAction.Vec3 = [0, 0, 0];
    let support: MotionAction.Support = { left: 0.5, right: 0.5 };
    let blendWeight: number = weight;

    // A small parry starts in the admitted guard; its external palm path supplies the deflection.
    if (kind === "cover" || kind === "catch") {
      shaped.arms[request.side] = {
        ...shaped.arms[request.side],
        shoulder: {
          flexion: kind === "cover" ? 65 : 60,
          abduction: 4,
          rotation: -15,
        },
        elbow: { flexion: kind === "cover" ? 140 : 110 },
        forearm: { pronation: 25 },
      };
      shaped.spine = {
        ...shaped.spine,
        thoracic: { ...shaped.spine?.thoracic, rotation: -sign * 6 },
      };

      // These bounded clinical staging seeds distinguish a low catch from a folded forearm brace; the original surface task and actual host decide the achieved guard.
      if (config.bodyGuard)
        shaped.arms[request.side] = {
          ...shaped.arms[request.side],
          shoulder: {
            flexion: config.bodyGuard === "forearm" ? 15 : 25,
            abduction: 10,
            rotation: -15,
          },
          elbow: { flexion: config.bodyGuard === "forearm" ? 105 : 100 },
          forearm: { pronation: 25 },
        };
    }
    if (kind === "slip" || kind === "weave") {
      const cycle: number = Math.max(
        0,
        Math.min(
          1,
          (seconds - variation.timing.preparation) /
            (variation.timing.delivery +
              variation.timing.contact +
              variation.timing.retraction),
        ),
      );
      const path: number = ActionClock.ease(cycle);
      const envelope: number =
        kind === "weave" ? Math.sin(Math.PI * path) ** 2 : weight;
      blendWeight = envelope;
      rootOffset[1] = -config.rootDropMetres! * envelope * variation.amplitude;
      rootOffset[2] =
        config.lateralMetres! *
        (kind === "weave" ? Math.sin(2 * Math.PI * path) : weight) *
        variation.amplitude;
      shaped.spine = {
        thoracic: {
          flexion: kind === "weave" ? 14 : 7,
          lateralFlexion: Math.sign(config.lateralMetres!) * 10,
          rotation: -sign * 8,
        },
        lumbar: {
          flexion: 8,
          lateralFlexion: Math.sign(config.lateralMetres!) * 5,
        },
      };
      {
        const placement: LoadedPoseEntry = [
          "idle",
          "complete",
          "recovery",
        ].includes(clock.phase)
          ? {
              key: "baseline",
              pose: structuredClone(context.basePose),
              rootOffset: [...rootOffset],
            }
          : loadedPose(context, rootOffset);
        sourcePose = placement.pose;
        rootOffset.splice(0, 3, ...placement.rootOffset);
        shaped.legs = structuredClone(sourcePose.legs);
      }
    }
    if (kind === "check") {
      const load: number =
        clock.phase === "idle" || clock.phase === "complete"
          ? 0
          : clock.phase === "preparation"
            ? ActionClock.ease(clock.progress)
            : clock.phase === "recovery"
              ? 1 - ActionClock.ease(clock.progress)
              : 1;
      support =
        request.side === "left"
          ? { left: 0.5 * (1 - load), right: 0.5 + 0.5 * load }
          : { left: 0.5 + 0.5 * load, right: 0.5 * (1 - load) };
      const translation: number =
        clock.phase === "retraction"
          ? weight
          : clock.phase === "recovery"
            ? 0
            : load;
      for (const axis of [0, 1, 2] as const)
        rootOffset[axis] = config.supportShift![axis] * translation;
      rootOffset[1] = supportDrop(context, rootOffset);
      const placement: LoadedPoseEntry = [
        "idle",
        "complete",
        "recovery",
      ].includes(clock.phase)
        ? {
            key: "baseline",
            pose: structuredClone(context.basePose),
            rootOffset: [...rootOffset],
          }
        : loadedPose(context, rootOffset);
      sourcePose = placement.pose;
      rootOffset.splice(0, 3, ...placement.rootOffset);
      shaped = checkShape(sourcePose, request.side);
    }
    let pose: IAutoMovieHumanPose = AutoMovieHumanRigControls.blend(
      sourcePose,
      shaped,
      Math.min(1, Math.max(0, blendWeight * variation.amplitude)),
    );
    let receivingFit: Sample["receivingFit"];
    if (config.bodyGuard) {
      if (!context.evaluatePose || !config.receiving)
        throw new Error(
          "A body guard requires its actual pose evaluator and receiving point",
        );
      const started: number = performance.now();
      const target: MotionAction.Vec3 = config.receiving.restTarget.map(
        (value: number, axis: number): number =>
          value +
          (config.receiving!.target[axis] + variation.aimOffset[axis] - value) *
            weight,
      ) as MotionAction.Vec3;
      const result: AutoMovieHumanClinicalIk.IResult =
        AutoMovieHumanClinicalIk.solve(context.evaluatePose, pose, {
          chain: { region: "arm", side: request.side },
          targets: [
            {
              bone: config.receiving.bone,
              localPoint: config.receiving.localPoint,
              position: target,
            },
          ],
          iterations: 16,
          tolerance: 0.00025,
        });
      pose = result.pose;
      receivingFit = {
        error: result.error,
        iterations: result.iterations,
        milliseconds: performance.now() - started,
        clamped: structuredClone(result.output.clamped),
      };
    }
    if (config.guardBinding === "clinical" && !context.evaluatePose)
      throw new Error(
        "A clinical guard requires the actual body's public evaluator",
      );
    const current: AutoMovieHumanSkeleton.IOutput | undefined =
      kind === "check" || config.guardBinding === "clinical"
        ? context.evaluatePose!(pose)
        : undefined;
    const guardBaseline: AutoMovieHumanSkeleton.IOutput | undefined =
      config.guardBinding === "clinical"
        ? context.evaluatePose!(context.basePose)
        : undefined;
    const effectors: MotionAction.Effector[] = (["left", "right"] as const).map(
      (side: MotionAction.Side): MotionAction.Effector => {
        const guard: Patch = config.guard[side];
        if (
          guardBaseline &&
          Math.hypot(
            ...point(guardBaseline, guard.bone, guard.localPoint).map(
              (value: number, axis: number): number =>
                value - guard.target[axis],
            ),
          ) > 0.000001
        )
          throw new Error(
            "A clinical guard target must identify its actual baseline point; external targets require task binding",
          );
        return effector(
          guard,
          config.guardBinding === "clinical"
            ? point(current!, guard.bone, guard.localPoint)
            : guard.target,
        );
      },
    );
    if (
      config.receiving &&
      kind !== "guard" &&
      kind !== "slip" &&
      kind !== "weave"
    ) {
      const patch: NonNullable<Config["receiving"]> = config.receiving;
      const target: MotionAction.Vec3 = [...patch.restTarget];
      if (kind === "check") {
        const currentPoint: MotionAction.Vec3 = point(
          current!,
          patch.bone,
          patch.localPoint,
        );
        for (const axis of [0, 1, 2] as const)
          target[axis] = currentPoint[axis];
        if (weight > 0) {
          const peakOffset: MotionAction.Vec3 = [...config.supportShift!];
          peakOffset[1] = supportDrop(context, peakOffset);
          const peakPlacement: LoadedPoseEntry = loadedPose(
            context,
            peakOffset,
          );
          peakOffset.splice(0, 3, ...peakPlacement.rootOffset);
          const loaded: IAutoMovieHumanPose = peakPlacement.pose;
          const peak: AutoMovieHumanSkeleton.IOutput = context.evaluatePose!(
            AutoMovieHumanRigControls.blend(
              loaded,
              checkShape(loaded, request.side),
              Math.min(1, variation.amplitude),
            ),
          );
          const peakPoint: MotionAction.Vec3 = point(
            peak,
            patch.bone,
            patch.localPoint,
          );
          for (const axis of [0, 1, 2] as const)
            target[axis] +=
              (patch.target[axis] -
                peakPoint[axis] +
                variation.aimOffset[axis]) *
              weight;
        }
      } else
        for (const axis of [0, 1, 2] as const)
          target[axis] +=
            (patch.target[axis] +
              variation.aimOffset[axis] -
              patch.restTarget[axis]) *
              weight +
            (kind === "parry"
              ? (config.parryDisplacement?.[axis] ?? 0) * weight
              : 0);
      const existing: number = effectors.findIndex(
        (point: MotionAction.Effector): boolean =>
          point.bone === patch.bone &&
          samePoint(point.localPoint, patch.localPoint),
      );
      if (existing >= 0) effectors[existing] = effector(patch, target);
      else effectors.push(effector(patch, target));
    }
    if (kind === "check")
      for (const part of ["LowerLeg", "Foot"] as const) {
        const bone: MotionAction.Effector["bone"] =
          AutoMovieHumanRigControls.joint(`${request.side}${part}`);
        effectors.push({
          bone,
          target: point(current!, bone),
          role: "guide",
          radius: 0,
        });
      }
    const released: boolean =
      kind === "check" &&
      ["delivery", "contact", "retraction"].includes(clock.phase);
    support.patches = supportPatches(
      context,
      pose,
      rootOffset,
      released ? request.side : undefined,
      sourcePose,
      kind === "check" || kind === "slip" || kind === "weave",
    );
    const preservedChannels: AutoMovieHumanRigControls.DegreeChannel[] = (
      ["left", "right"] as const
    ).flatMap(
      (side: MotionAction.Side): AutoMovieHumanRigControls.DegreeChannel[] =>
        MotionSupportChannels.select(
          side,
          released && side === request.side ? "authored" : "planted",
        ).preserved,
    );
    if (kind === "check")
      preservedChannels.push(
        AutoMovieHumanRigControls.channel(`legs.${request.side}.knee.flexion`),
        AutoMovieHumanRigControls.channel(
          `legs.${request.side}.ankle.dorsiflexion`,
        ),
      );
    const clinicalWitnesses: MotionAction.Effector[] = effectors.filter(
      (target: MotionAction.Effector): boolean =>
        target.role === "guide" ||
        (config.guardBinding === "clinical" &&
          !isReceiving(kind, config, target)),
    );
    const planned: Sample = {
      pose,
      rootOffset,
      support,
      effectors: effectors.filter(
        (target: MotionAction.Effector): boolean =>
          !clinicalWitnesses.includes(target),
      ),
      clinicalWitnesses,
      receivingFit,
      preservedChannels,
      phase: clock.phase,
      elapsed: seconds,
      progress: clock.progress,
    };
    if (continuation && !context.evaluatePose)
      throw new Error(
        "Defense continuation requires its actual same-body evaluator",
      );
    return continuation
      ? continuation.apply(planned, seconds, context.evaluatePose!)
      : planned;
  }
}

/** Hold the exact observed configuration before constructing its connected return. */
function incoming(
  kind: DefenseMotion.Kind,
  request: MotionAction.Request,
  context: MotionAction.Context,
  seconds: number,
  config: DefenseMotion.Config,
  timing: MotionAction.Timing,
): DefenseMotion.Sample {
  const state: MotionAction.ContactState | undefined = context.contact;
  const contactAge: number = config.contactElapsed!;
  if (
    !state ||
    state.event.targetId !== request.actorId ||
    state.event.actorId !== request.targetId ||
    !Number.isFinite(contactAge) ||
    contactAge < 0
  )
    throw new Error(
      "Defense recovery requires a matched incoming contact and its nonnegative host-mapped age",
    );
  if (contactAge <= timing.contact)
    return {
      ...structuredClone(state.sample),
      phase: "contact",
      elapsed: seconds,
      progress: timing.contact > 0 ? contactAge / timing.contact : 1,
    };
  const landing: DefenseMotion.Sample = DefenseMotion.sample(
    kind,
    request,
    {
      ...context,
      contact: undefined,
      supportPatches: undefined,
      supportFrame: undefined,
    },
    ActionClock.duration(timing),
    { ...config, contactElapsed: undefined },
  );
  const goal: MotionAction.Sample = {
    ...landing,
    support: structuredClone(state.sample.support),
    preservedChannels: structuredClone(state.sample.preservedChannels),
  };
  if (config.receivingReturn === "clinical") {
    const output: AutoMovieHumanSkeleton.IOutput = context.evaluatePose!(
      goal.pose,
    );
    for (const target of goal.effectors)
      if (isReceiving(kind, config, target))
        target.target = point(output, target.bone, target.localPoint);
  }
  const internal: MotionAction.Effector[] = goal.effectors.filter(
    (target: MotionAction.Effector): boolean =>
      config.receivingReturn === "clinical" &&
      isReceiving(kind, config, target),
  );
  const kinematics: MotionRecovery.Kinematics | undefined = internal.length
    ? { evaluatePose: context.evaluatePose!, effectors: internal }
    : undefined;
  const recovered: DefenseMotion.Sample = MotionRecovery.local(
    state.sample,
    goal,
    state.sample.elapsed + contactAge,
    timing.retraction,
    state.sample.elapsed + timing.contact,
    kinematics,
  );
  const references: MotionAction.Effector[] = [
    ...(landing.clinicalWitnesses ?? []),
    ...internal,
  ];
  if (references.length) {
    const output: AutoMovieHumanSkeleton.IOutput = context.evaluatePose!(
      recovered.pose,
    );
    recovered.clinicalWitnesses = references.map(
      (target: MotionAction.Effector): MotionAction.Effector => ({
        ...structuredClone(target),
        target: point(output, target.bone, target.localPoint),
      }),
    );
  }
  recovered.effectors = recovered.effectors.filter(
    (target: MotionAction.Effector): boolean =>
      !(
        config.receivingReturn === "clinical" &&
        isReceiving(kind, config, target)
      ),
  );
  const age: number = contactAge - timing.contact;
  recovered.support.patches = returningPatches(
    context,
    state.sample,
    recovered,
    age >= timing.retraction,
  );
  if (kind === "check" && age >= timing.retraction) {
    const progress: number =
      timing.recovery > 0
        ? Math.min(1, (age - timing.retraction) / timing.recovery)
        : 1;
    const weight: number = ActionClock.ease(progress);
    recovered.support.left =
      state.sample.support.left +
      (landing.support.left - state.sample.support.left) * weight;
    recovered.support.right =
      state.sample.support.right +
      (landing.support.right - state.sample.support.right) * weight;
    recovered.phase = progress < 1 ? "recovery" : "complete";
    recovered.progress = progress;
  }
  recovered.elapsed = seconds;
  return recovered;
}

/** Identify the independently authored intercept before selecting internal guard shape. */
function isReceiving(
  kind: DefenseMotion.Kind,
  config: DefenseMotion.Config,
  target: MotionAction.Effector,
): boolean {
  return (
    !["guard", "slip", "weave"].includes(kind) &&
    !!config.receiving &&
    target.bone === config.receiving.bone &&
    samePoint(target.localPoint, config.receiving.localPoint)
  );
}

/** Preserve stopped loaded anchors; only the unloaded foot follows its clinical FK delta. */
function returningPatches(
  context: MotionAction.Context,
  start: MotionAction.Sample,
  current: MotionAction.Sample,
  landed: boolean,
): MotionAction.SupportPatch[] | undefined {
  const patches: MotionAction.SupportPatch[] | undefined =
    start.support.patches;
  if (!patches) return undefined;
  const airborne: MotionAction.Side[] = (["left", "right"] as const).filter(
    (side: MotionAction.Side): boolean =>
      patches.some(
        (patch: MotionAction.SupportPatch): boolean => patch.side === side,
      ) &&
      !patches.some(
        (patch: MotionAction.SupportPatch): boolean =>
          patch.side === side && patch.mode !== "free",
      ),
  );
  if (!airborne.length) return structuredClone(patches);
  const initial: AutoMovieHumanSkeleton.IOutput = context.evaluatePose!(
    start.pose,
  );
  const output: AutoMovieHumanSkeleton.IOutput = context.evaluatePose!(
    current.pose,
  );
  return patches.flatMap(
    (patch: MotionAction.SupportPatch): MotionAction.SupportPatch[] => {
      if (!airborne.includes(patch.side)) return [structuredClone(patch)];
      const from: MotionAction.Vec3 = worldPoint(
        context,
        point(initial, patch.bone, patch.localPoint),
        start.rootOffset,
      );
      const to: MotionAction.Vec3 = worldPoint(
        context,
        point(output, patch.bone, patch.localPoint),
        current.rootOffset,
      );
      const moved: MotionAction.SupportPatch = {
        ...structuredClone(patch),
        world: [
          patch.world[0] + to[0] - from[0],
          patch.world[1] + to[1] - from[1],
          patch.world[2] + to[2] - from[2],
        ],
      };
      if (patch.frameRotation)
        moved.frameRotation = returnRotation(context, initial, output, patch);
      if (!landed) return [moved];
      if (!context.supportFrame)
        throw new Error(
          "A returning airborne foot requires its actual full-foot landing measurement",
        );
      const measurement: MotionAction.SupportMeasurement = context.supportFrame(
        current.pose,
        current.rootOffset,
        moved,
      );
      return [measurement.frame, measurement.contact];
    },
  );
}

/** Apply the same actual clinical rotation delta to the retained WORLD frame. */
function returnRotation(
  context: MotionAction.Context,
  initial: AutoMovieHumanSkeleton.IOutput,
  output: AutoMovieHumanSkeleton.IOutput,
  patch: MotionAction.SupportPatch,
): AutoMovieHumanRigControls.Rotation {
  const from: AutoMovieHumanSkeleton.IPlacement = initial.posed.find(
    (placement: AutoMovieHumanSkeleton.IPlacement): boolean =>
      placement.bone === patch.bone,
  )!;
  const to: AutoMovieHumanSkeleton.IPlacement = output.posed.find(
    (placement: AutoMovieHumanSkeleton.IPlacement): boolean =>
      placement.bone === patch.bone,
  )!;
  const heading: IAutoMovieQuaternion = {
    x: 0,
    y: Math.sin(context.frame!.yawRadians / 2),
    z: 0,
    w: Math.cos(context.frame!.yawRadians / 2),
  };
  const inverseHeading: IAutoMovieQuaternion = {
    x: -heading.x,
    y: -heading.y,
    z: -heading.z,
    w: heading.w,
  };
  const delta: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.multiply(
      Quaternion.multiply(heading, {
        x: to.rotation[0],
        y: to.rotation[1],
        z: to.rotation[2],
        w: to.rotation[3],
      }),
      {
        x: -from.rotation[0],
        y: -from.rotation[1],
        z: -from.rotation[2],
        w: from.rotation[3],
      },
    ),
    inverseHeading,
  );
  const retained: AutoMovieHumanRigControls.Rotation = patch.frameRotation!;
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(delta, {
    x: retained[0],
    y: retained[1],
    z: retained[2],
    w: retained[3],
  });
  return [rotation.x, rotation.y, rotation.z, rotation.w];
}

/** Retain original check plants and start lift from that same frame with zero FK delta. */
function supportPatches(
  context: MotionAction.Context,
  pose: IAutoMovieHumanPose,
  rootOffset: MotionAction.Vec3,
  airborne: MotionAction.Side | undefined,
  sourcePose: IAutoMovieHumanPose,
  retainStance: boolean,
): MotionAction.SupportPatch[] | undefined {
  return context.supportPatches
    ?.filter(
      (patch: MotionAction.SupportPatch): boolean => patch.mode === "planted",
    )
    .flatMap(
      (patch: MotionAction.SupportPatch): MotionAction.SupportPatch[] => {
        const free: boolean = patch.side === airborne;
        const requested: MotionAction.SupportPatch = {
          ...structuredClone(patch),
          mode: free ? "free" : "planted",
          constraint: "hard",
        };
        const measured: MotionAction.SupportMeasurement | undefined =
          context.supportFrame?.(
            retainStance ? context.basePose : free ? sourcePose : pose,
            retainStance ? [0, 0, 0] : rootOffset,
            requested,
          );
        if (free) {
          const output: AutoMovieHumanSkeleton.IOutput =
            context.evaluatePose!(pose);
          const initial: AutoMovieHumanSkeleton.IOutput =
            context.evaluatePose!(sourcePose);
          const from: MotionAction.Vec3 = worldPoint(
            context,
            point(initial, patch.bone, patch.localPoint),
            rootOffset,
          );
          const to: MotionAction.Vec3 = worldPoint(
            context,
            point(output, patch.bone, patch.localPoint),
            rootOffset,
          );
          const frame: MotionAction.SupportPatch = structuredClone(
            measured?.frame ?? requested,
          );
          frame.world = [
            frame.world[0] + to[0] - from[0],
            frame.world[1] + to[1] - from[1],
            frame.world[2] + to[2] - from[2],
          ];
          if (frame.frameRotation)
            frame.frameRotation = returnRotation(
              context,
              initial,
              output,
              frame,
            );
          return [{ ...frame, mode: "free", constraint: "hard" }];
        }
        return measured ? [measured.frame, measured.contact] : [requested];
      },
    );
}

/** Validate real-boundary geometry and technique-required intent before sampling. */
function validate(
  kind: DefenseMotion.Kind,
  request: MotionAction.Request,
  config: DefenseMotion.Config,
): void {
  if (
    !["guard", "cover", "catch", "parry", "slip", "weave", "check"].includes(
      kind,
    )
  )
    throw new Error("Unknown defensive technique");
  if (
    config.guardBinding !== undefined &&
    config.guardBinding !== "clinical" &&
    config.guardBinding !== "task"
  )
    throw new Error(
      "Guard binding must be an originally authored clinical shape or independent task",
    );
  if (
    config.receivingReturn !== undefined &&
    config.receivingReturn !== "clinical" &&
    config.receivingReturn !== "task"
  )
    throw new Error(
      "Receiving return must declare clinical withdrawal or an independent Cartesian task",
    );
  if (
    config.bodyGuard !== undefined &&
    ((config.bodyGuard !== "glove" && config.bodyGuard !== "forearm") ||
      !["cover", "catch"].includes(kind) ||
      config.receiving?.bone !==
        `${request.side}${config.bodyGuard === "forearm" ? "LowerArm" : "Hand"}`)
  )
    throw new Error(
      "Body guard must bind its declared actual hand or forearm in a cover or catch",
    );
  for (const side of ["left", "right"] as const) {
    if (config.guard[side].bone !== `${side}Hand`)
      throw new Error(
        "Guard witnesses must remain bound to their own actual Hand bone",
      );
    validatePatch(config.guard[side]);
  }
  if (["cover", "catch", "parry", "check"].includes(kind)) {
    const point: DefenseMotion.Config["receiving"] = config.receiving;
    if (
      !point ||
      !point.bone.startsWith(request.side) ||
      !finitePoint(point.restTarget)
    )
      throw new Error(
        "Defense requires an acting-side receiving point and finite resting target",
      );
    validatePatch(point);
    const validReceiver: boolean =
      kind === "check"
        ? point.bone === `${request.side}LowerLeg`
        : ["Hand", "LowerArm", "UpperArm"].some(
            (part: string): boolean => point.bone === `${request.side}${part}`,
          );
    if (!validReceiver)
      throw new Error(
        "A check receives on its actual shin; arm defenses receive on their actual arm",
      );
  }
  if (
    (kind === "slip" || kind === "weave") &&
    (!Number.isFinite(config.rootDropMetres) ||
      config.rootDropMetres! <= 0 ||
      !Number.isFinite(config.lateralMetres) ||
      config.lateralMetres === 0)
  )
    throw new Error(
      "Evasion requires explicit positive root drop and signed lateral displacement",
    );
  if (
    kind === "check" &&
    (!finitePoint(config.supportShift) || config.supportShift[1] !== 0)
  )
    throw new Error(
      "Check requires an explicit horizontal shift toward its stationary support foot",
    );
  if (
    config.parryDisplacement !== undefined &&
    !finitePoint(config.parryDisplacement)
  )
    throw new Error("Parry displacement requires finite actor-local metres");
}

/** Admit finite metre targets and an honest positive proxy extent. */
function validatePatch(point: DefenseMotion.Patch): void {
  if (
    !AutoMovieHumanRigControls.isJoint(point.bone) ||
    !finitePoint(point.target) ||
    (point.localPoint !== undefined && !finitePoint(point.localPoint)) ||
    !Number.isFinite(point.radius) ||
    point.radius <= 0
  )
    throw new Error(
      "Receiving patches require real bones, finite metre points and positive radius",
    );
}

/** Indexed admission visits all three metre coordinates, including array holes. */
function finitePoint(value: unknown): value is MotionAction.Vec3 {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    [0, 1, 2].every((axis: number): boolean => Number.isFinite(value[axis]))
  );
}

/** Return an owned named-bone protective target without retaining caller arrays. */
function effector(
  point: DefenseMotion.Patch,
  target: MotionAction.Vec3,
): MotionAction.Effector {
  return {
    bone: point.bone,
    ...(point.localPoint ? { localPoint: [...point.localPoint] } : {}),
    target: [...target],
    radius: point.radius,
    role: "guard",
  };
}

/** Transform a real bone-bound point through the same current clinical FK. */
function point(
  output: AutoMovieHumanSkeleton.IOutput,
  bone: MotionAction.Effector["bone"],
  local: MotionAction.Vec3 = [0, 0, 0],
): MotionAction.Vec3 {
  const placement: AutoMovieHumanSkeleton.IPlacement | undefined =
    output.posed.find(
      (row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === bone,
    );
  if (!placement) throw new Error(`Missing actual check guide bone ${bone}`);
  const rotated: IAutoMovieVector3 = Quaternion.rotateVector(
    {
      x: placement.rotation[0],
      y: placement.rotation[1],
      z: placement.rotation[2],
      w: placement.rotation[3],
    },
    { x: local[0], y: local[1], z: local[2] },
  );
  return [
    placement.position[0] + rotated.x,
    placement.position[1] + rotated.y,
    placement.position[2] + rotated.z,
  ];
}

/** Map one actual local witness through the requested fixed-yaw actor root once. */
function worldPoint(
  context: MotionAction.Context,
  local: MotionAction.Vec3,
  offset: MotionAction.Vec3,
): MotionAction.Vec3 {
  if (!context.frame)
    throw new Error(
      "A checking foot trajectory requires its actual actor world frame",
    );
  const cosine: number = Math.cos(context.frame.yawRadians);
  const sine: number = Math.sin(context.frame.yawRadians);
  const x: number = local[0] + offset[0];
  const z: number = local[2] + offset[2];
  return [
    context.frame.origin[0] + cosine * x + sine * z,
    context.frame.origin[1] + local[1] + offset[1],
    context.frame.origin[2] - sine * x + cosine * z,
  ];
}

/**
 * Lower the loaded root by the loss in its existing two-leg height envelope.
 * Both envelopes use the same measured ankle centres and clinical knee intent;
 * their difference retains the admitted starting height without inventing rest
 * offsets or lifting the actor. This remains a request, not sole admission.
 */
function supportDrop(
  context: MotionAction.Context,
  offset: MotionAction.Vec3,
): number {
  const baseline: AutoMovieHumanSkeleton.IOutput = context.evaluatePose!(
    context.basePose,
  );
  const supports: AutoMovieHumanLegIk.ISupport[] = (
    ["left", "right"] as const
  ).map(
    (side: MotionAction.Side): AutoMovieHumanLegIk.ISupport => ({
      side,
      position: point(baseline, AutoMovieHumanRigControls.joint(`${side}Foot`)),
      kneeFlexion: context.basePose.legs?.[side].knee?.flexion ?? 0,
    }),
  );
  const initial: ReturnType<typeof AutoMovieHumanLegIk.supportHeight> =
    AutoMovieHumanLegIk.supportHeight(
      baseline,
      context.neutral!,
      { translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
      supports,
    );
  const shifted: ReturnType<typeof AutoMovieHumanLegIk.supportHeight> =
    AutoMovieHumanLegIk.supportHeight(
      baseline,
      context.neutral!,
      { translation: [offset[0], 0, offset[2]], rotation: [0, 0, 0, 1] },
      supports,
    );
  if (!initial.feasible || !shifted.feasible)
    throw new Error(
      "Check load transfer exceeds the actual held ankles' horizontal reach",
    );
  return Math.min(0, shifted.height - initial.height);
}

/**
 * Fit the original emitted plantar frame, shared with the final consumer.
 * WORLD goals enter the requested evaluator frame once, retaining carrier/local
 * identity. The host's one whole-foot planner retains original targets, native
 * termination, full-floor result and actual work separately from final admission.
 */
function loadedPose(
  context: MotionAction.Context,
  rootOffset: MotionAction.Vec3,
): LoadedPoseEntry {
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = context.evaluatePose!;
  if (
    !evaluate ||
    !context.frame ||
    !context.supportTargets ||
    !context.supportPatches ||
    !context.prepareSupport
  )
    throw new Error(
      "Supported defense loading requires its actual evaluator, original WORLD plantar frames and same-problem support planner",
    );
  const worldTargets: AutoMovieHumanClinicalIk.ITarget[] =
    context.supportPatches
      .filter(
        (patch: MotionAction.SupportPatch): boolean => patch.mode === "planted",
      )
      .flatMap(
        (
          patch: MotionAction.SupportPatch,
        ): AutoMovieHumanClinicalIk.ITarget[] =>
          context.supportTargets!({
            ...patch,
            mode: "free",
            constraint: "hard",
            ...(patch.frameRotation || patch.yawDegrees !== undefined
              ? {}
              : {
                  frameRotation: [
                    0, 0, 0, 1,
                  ] as AutoMovieHumanRigControls.Rotation,
                }),
          }).map(
            (
              target: MotionAction.Immutable<AutoMovieHumanClinicalIk.ITarget>,
            ): AutoMovieHumanClinicalIk.ITarget => ({
              bone: target.bone,
              position: [...target.position],
              ...(target.localPoint
                ? { localPoint: [...target.localPoint] }
                : {}),
            }),
          ),
      );
  const key: string = JSON.stringify(
    {
      pose: context.basePose,
      offset: rootOffset,
      frame: context.frame,
      worldTargets,
    },
    (_name: string, value: unknown): unknown => {
      if (typeof value === "number" && !Number.isFinite(value))
        throw new Error(
          "Load-transfer cache inputs require finite clinical values and metre offsets",
        );
      return value;
    },
  );
  const entries: LoadedPoseEntry[] = LOADED_POSES.get(evaluate) ?? [];
  const index: number = entries.findIndex(
    (entry: LoadedPoseEntry): boolean => entry.key === key,
  );
  if (index >= 0) {
    const entry: LoadedPoseEntry = entries.splice(index, 1)[0]!;
    entries.push(entry);
    return structuredClone(entry);
  }
  const patches: MotionAction.SupportPatch[] = context.supportPatches
    .filter(
      (patch: MotionAction.SupportPatch): boolean => patch.mode === "planted",
    )
    .map(
      (patch: MotionAction.SupportPatch): MotionAction.SupportPatch => ({
        ...structuredClone(patch),
        frameRotation: patch.frameRotation ?? [0, 0, 0, 1],
        constraint: "hard",
      }),
    );
  const preservedChannels: AutoMovieHumanRigControls.DegreeChannel[] = (
    ["left", "right"] as const
  ).flatMap(
    (side: MotionAction.Side): AutoMovieHumanRigControls.DegreeChannel[] =>
      MotionSupportChannels.select(side, "planted").preserved,
  );
  const realized: MotionAction.BodyPlacement = context.prepareSupport({
    pose: context.basePose,
    rootOffset,
    support: { left: 0.5, right: 0.5, patches },
    preservedChannels,
  });
  const pose: IAutoMovieHumanPose = structuredClone(realized.pose);
  const entry: LoadedPoseEntry = {
    key,
    pose,
    rootOffset: [...realized.rootOffset],
  };
  entries.push(structuredClone(entry));
  if (entries.length > 2) entries.shift();
  LOADED_POSES.set(evaluate, entries);
  return entry;
}

/** One exact fixed-body/frame endpoint, without live actor, event or clock references. */
interface LoadedPoseEntry {
  /** Exact finite clinical pose and local metre-offset input serialization. */ key: string;
  /** Owned pose never exposed directly to callers. */ pose: IAutoMovieHumanPose;
  /** Same native result's actor-local root translation, metres. */ rootOffset: MotionAction.Vec3;
}

/** Two LRU endpoints per live evaluator; retiring the evaluator releases this body cache. */
const LOADED_POSES: WeakMap<
  AutoMovieHumanSkeleton.PoseEvaluator,
  LoadedPoseEntry[]
> = new WeakMap();

/**
 * Authored compact check: a 125-degree knee requests a fold behind the shield.
 * This is a staging choice within canonical limits, not a measured optimum;
 * actual foot/shin projection and first-contact tests can still reject it.
 */
function checkShape(
  source: IAutoMovieHumanPose,
  side: MotionAction.Side,
): IAutoMovieHumanPose {
  const pose: IAutoMovieHumanPose = structuredClone(source);
  pose.legs ??= { left: {}, right: {} };
  pose.legs[side] = {
    ...pose.legs[side],
    hip: { flexion: 88, abduction: 28, rotation: 25 },
    knee: { flexion: 125 },
    ankle: { dorsiflexion: 12 },
  };
  return pose;
}

/** Compare exact local witness identity rather than proximity between different points. */
function samePoint(
  a: MotionAction.Vec3 | undefined,
  b: MotionAction.Vec3 | undefined,
): boolean {
  return a === undefined
    ? b === undefined
    : b !== undefined &&
        a.every((value: number, axis: number): boolean => value === b[axis]);
}
