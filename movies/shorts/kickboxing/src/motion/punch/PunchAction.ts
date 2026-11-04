import { Quaternion } from "@automovie/engine";
import {
  AutoMovieHumanRigControls,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import { ActionClock } from "../core/ActionClock";
import { ActionVariation } from "../core/ActionVariation";
import type { MotionAction } from "../core/MotionAction";
import { MotionRecovery } from "../core/MotionRecovery";
import { PunchArm } from "./PunchArm";
import { PunchContinuation } from "./PunchContinuation";
import { PunchShape } from "./PunchShape";
import { PunchSupport } from "./PunchSupport";

/**
 * Reusable local-time punches with geometry-dependent reach and contact return.
 *
 * @evidence contracts/common.md#implementation-and-ownership IBA34/42/43/47/52 informs one clinical path. Body planning is realized before arm authoring; the same actual origin supplies distance, shape and the independent pad task. Source and host share shoulder3+elbow adaptation with authored girdle/forearm/wrist paths retained. Normal coupled shoulder lift remains active, and actual geometry plus raw native error/shape admission remain diagnostic. Original sole tasks and actual contact return keep their authority; no failed task is replaced by achieved FK.
 * @evidence contracts/common.md#authoring-interface Actor-local metres and seconds follow MotionAction. Create fixes bounded seeded variation once; sample is order independent and accepts an actual constrained first-contact sample. Jab uses the lead side and cross the rear; hook/uppercut admit either side. Turning punches explicitly approach, roll and replant the actual supplied forefoot frame. Hand goals are FK-local to the requested root, preserving the actor-frame path when that root moves.
 */
export namespace PunchAction {
  /**
   * A narrow actual entry bridge for this action's owned arm.
   * @evidence contracts/common.md#implementation-and-ownership Reuses the owner-local continuation's immutable arm, complete active rates and independent WORLD endpoint tasks; no global EntryState or new body policy is introduced.
   * @evidence contracts/common.md#authoring-interface Degrees/second and WORLD metres/second retain actual sampling provenance. Unknown active rates refuse; the original action clock and another action's contact lifetime are never restarted.
   */
  export type Continuation = PunchContinuation.Input;
  /**
   * A staged punch request with its source-arm realization receipt.
   * @evidence contracts/common.md#implementation-and-ownership Extends the common request only at its technique owner. The optional receipt records source clinical feasibility without granting admission or changing the original external pad task.
   * @evidence contracts/common.md#authoring-interface Source delivery requests carry owned metre residuals and public clamp rows. Guard and contact-conditioned clinical return have no new seed solve; whole-body admission remains the actual consumer's responsibility.
   */
  export interface Sample extends MotionAction.Sample {
    /** Same-source clinical seed outcome, absent when no new arm solve occurs. */
    armFit?: PunchArm.Fit;
  }
  /**
   * Geometric outer bound, not a full articulated reachability certificate.
   *
   * @evidence contracts/common.md#implementation-and-ownership Exposes the actual upper-arm and collinear forearm/pad lever bound with the family's authored elbow margin. This guard-state diagnostic is separate from the current posed-shoulder bound used at every moving sample.
   * @evidence contracts/common.md#authoring-interface Distances use actor-local metres. A true reachable flag only passes an instantaneous nominal stroke-envelope check. It is not a coupled-FK reach, shape, support or full-body feasibility certificate.
   */
  export interface Reach {
    /** Shoulder-to-requested-target distance after bounded aim variation, metres. */
    distance: number;
    /** Instantaneous nominal triangle span with the authored bend margin, metres. */
    maximum: number;
    /** False gives an explicit out-of-range trajectory ending at the outer bound. */
    reachable: boolean;
  }

  /**
   * One immutable placement of a reusable technique definition.
   *
   * @evidence contracts/common.md#implementation-and-ownership An instance retains one cloned request with its direction, timing and optional variation frozen, plus separately frozen resolved timing. Actual interaction state is supplied explicitly by the host; external mutation cannot alter sampling or stale the duration.
   * @evidence contracts/common.md#authoring-interface Public snapshots have recursively readonly types and runtime-frozen nested values. Sample uses action-local seconds and returns owned kinematic intent; geometry and contact come from the actual actor.
   */
  export interface Instance {
    /** Technique family; independent of actor identity. */
    readonly kind: PunchShape.Kind;
    /** Owned admitted request, recursively readonly and runtime frozen. */
    readonly request: MotionAction.Immutable<MotionAction.Request>;
    /** Fixed once at construction, including seeded duration variation. */
    readonly timing: MotionAction.Immutable<MotionAction.Timing>;
    /** Fixed actor-frame metre aim delta sampled once with this request's variation. */
    readonly aimOffset: MotionAction.Immutable<MotionAction.Vec3>;
    /** Nominal local seconds, shortened only by observed contact feedback. */
    readonly duration: number;
    /** Exact source/host eligible own-arm channels; all time-varying entry rates are separate. */
    readonly armChannels: readonly AutoMovieHumanRigControls.DegreeChannel[];
    /** Owned immutable actual entry, when this action continues an existing pose/rate. */
    readonly continuation?: MotionAction.Immutable<Continuation>;
    /**
     * Sample one local time using host-owned target, geometry and optional contact.
     *
     * @evidence contracts/common.md#implementation-and-ownership Uses fixed phase/variation and retained contact state. An explicit actual body placement supplies the one current shoulder origin before arm IK; the host then fits only the same eligible arm channels without moving body/root. Each call returns owned intent and any seed receipt, retaining no seek history.
     * @evidence contracts/common.md#authoring-interface Elapsed is local seconds. bodyResponse is an explicitly authored actor-local metre displacement from the observed contact, identical to planBody's input. originalTaskFrame retains the original WORLD-terminal validation frame when a released arm consumes a different body frame; it does not rebind current return geometry. Placement never moves the opponent aim. Contact dwell retains the stopped WORLD task; after release the declared clinical arm return follows the single realized body. Standalone body checks preserve its original support, fixed trunk and horizontal root while the host owns admitted leg/rootY fitting. Shared authority belongs to an explicitly composed body path.
     */
    sample(
      elapsed: number,
      context: MotionAction.Context,
      placement?: MotionAction.BodyPlacement,
      bodyAuthority?: "shared",
      bodyResponse?: Readonly<MotionAction.Vec3>,
      originalTaskFrame?: MotionAction.Context["frame"],
    ): Sample;
    /**
     * Plan body and original support before first authoring the arm task.
     * @evidence contracts/common.md#implementation-and-ownership Evaluates the same phase/body/support policy without arm IK. The host realizes this owned body request first, then supplies the actual placement to sample so arm distance, origin and pad frame cannot use a stale body.
     * @evidence contracts/common.md#authoring-interface Returns pose, actor-local root and original WORLD support. Optional bodyResponse is actor-local metres converted once by the host from observed contact compliance; the same vector must reach sample. It is composed before fitting and never shifts original foot anchors. A plan is not admission; actual consumers must prepareBody, sample and perform final independent admission.
     */
    planBody(
      elapsed: number,
      context: MotionAction.Context,
      bodyResponse?: Readonly<MotionAction.Vec3>,
    ): MotionAction.BodyPlacement;
    /**
     * Expose target distance and the geometry-derived outer reach bound.
     *
     * @evidence contracts/common.md#implementation-and-ownership Evaluates this actor's guard-state shoulder and actual bind lengths for an instantaneous nominal cosine-rule stroke envelope. Sampling separately recomputes the moving body/shoulder so torso/scapula changes cannot silently inherit the baseline bound.
     * @evidence contracts/common.md#authoring-interface Context must supply finite actual shoulder and hand geometry plus positive arm/pad extents. Returned distances are metres; false reachability denotes the explicit clamped outer-bound miss path.
     */
    inspect(context: MotionAction.Context): Reach;
  }

  /**
   * Place a technique without evaluating or retaining a scene or rig.
   *
   * @evidence contracts/common.md#implementation-and-ownership Common admission fixes variation once. planBody requests support before the actual placement supplies arm authoring's origin. The real coupled family path retains authored girdle/forearm/wrist and admits shoulder3+elbow in source and host, while the literal pad remains independent hard. Seed failures retain their receipt. Actual stop/clinical guard use the common return resolver; no new origin or second retarget replaces them. Original sole tasks and anchors remain unchanged.
   * @evidence contracts/common.md#authoring-interface Real hand-pad/shoulder geometry and positive arm/pad extents are required. External entry bridges end at the original varied delivery boundary with zero WORLD terminal velocity; earlier joins refuse. Every sample validates that unchanged original terminal independently of seek order. Turning punches require actual plantar alternatives and positive setup/settling. Clinical defaults are authored choices, not measurements. Raw goals, actual floor and same-pose shape remain independently inspectable.
   */
  export function create(
    kind: PunchShape.Kind,
    source: MotionAction.Request,
    entry?: Continuation,
  ): Instance {
    if (!["jab", "cross", "hook", "uppercut"].includes(kind))
      throw new Error("Unknown punch technique");
    const request: MotionAction.Request = structuredClone(source);
    const variation: ActionVariation.Result = ActionVariation.create(request);
    variation.aimOffset = [...variation.aimOffset];
    Object.freeze(variation.aimOffset);
    if (kind === "jab" && request.side !== request.leadSide)
      throw new Error("A jab uses the stance lead hand");
    if (kind === "cross" && request.side === request.leadSide)
      throw new Error("A cross uses the stance rear hand");
    const timing: MotionAction.Timing = variation.timing;
    const continuation: MotionAction.Immutable<Continuation> | undefined =
      entry && PunchContinuation.create(entry, request.side);
    if (
      continuation &&
      (continuation.endSeconds !== timing.preparation + timing.delivery ||
        continuation.terminal.velocityWorld.some(
          (value: number): boolean => value !== 0,
        ))
    )
      throw new Error(
        "Continuation must join the original delivery boundary with zero terminal WORLD velocity",
      );
    const armChannels: readonly AutoMovieHumanRigControls.DegreeChannel[] =
      Object.freeze(PunchArm.armChannels(request.side));
    Object.freeze(request.direction);
    Object.freeze(request.timing);
    if (request.variation) Object.freeze(request.variation);
    Object.freeze(request);
    Object.freeze(timing);
    const directionLength: number = Math.hypot(...request.direction);
    const direction: MotionAction.Vec3 = request.direction.map(
      (value: number): number => value / directionLength,
    ) as MotionAction.Vec3;
    const lateralLength: number = Math.hypot(direction[0], direction[2]);
    const lateral: MotionAction.Vec3 =
      lateralLength > 1e-9
        ? [-direction[2] / lateralLength, 0, direction[0] / lateralLength]
        : [0, 0, 1];
    const sideSign: number = request.side === "left" ? 1 : -1;
    const inspect: (context: MotionAction.Context) => Reach = (
      context: MotionAction.Context,
    ): Reach => {
      admit(context);
      const aim: MotionAction.Vec3 = add(context.target, variation.aimOffset);
      const { distance, maximum }: ReturnType<typeof PunchArm.bound> =
        PunchArm.bound(context, context.basePose, request.side, aim, kind);
      return { distance, maximum, reachable: distance <= maximum };
    };
    const sample: Instance["sample"] = (
      elapsed: number,
      context: MotionAction.Context,
      placement?: MotionAction.BodyPlacement,
      bodyAuthority?: "shared",
      bodyResponse?: Readonly<MotionAction.Vec3>,
      originalTaskFrame?: MotionAction.Context["frame"],
    ): Sample =>
      evaluate(
        elapsed,
        context,
        placement,
        false,
        bodyAuthority,
        bodyResponse,
        originalTaskFrame,
      );
    const planBody: Instance["planBody"] = (
      elapsed: number,
      context: MotionAction.Context,
      bodyResponse?: Readonly<MotionAction.Vec3>,
    ): MotionAction.BodyPlacement => {
      const planned: Sample = evaluate(
        elapsed,
        context,
        undefined,
        true,
        undefined,
        bodyResponse,
      );
      return {
        pose: planned.pose,
        rootOffset: planned.rootOffset,
        support: planned.support,
        ...(planned.rootRotation ? { rootRotation: planned.rootRotation } : {}),
        ...(planned.preservedChannels
          ? { preservedChannels: planned.preservedChannels }
          : {}),
      };
    };

    /** Body planning and arm authoring share one phase policy, without a second support application. */
    function evaluate(
      elapsed: number,
      context: MotionAction.Context,
      placement: MotionAction.BodyPlacement | undefined,
      bodyOnly: boolean,
      bodyAuthority?: "shared",
      bodyResponse: Readonly<MotionAction.Vec3> = [0, 0, 0],
      originalTaskFrame: MotionAction.Context["frame"] = context.frame,
    ): Sample {
      const geometry: RequiredGeometry = admit(context);
      if (continuation) validateTerminal(context, originalTaskFrame);
      const aim: MotionAction.Vec3 = add(context.target, variation.aimOffset);
      const contact: MotionAction.ContactState | undefined = context.contact;
      if (
        contact &&
        (contact.event.actionId !== request.id ||
          contact.event.actorId !== request.actorId ||
          contact.event.targetId !== request.targetId)
      )
        throw new Error(
          "Punch contact must name this action and its participants",
        );
      if (contact) footSupport(contact.sample.support);
      if (
        bodyResponse.length !== 3 ||
        !bodyResponse.every(Number.isFinite) ||
        (bodyResponse.some((value: number): boolean => value !== 0) &&
          (!contact || elapsed < contact.event.time))
      )
        throw new Error(
          "Punch body response requires finite actor-local displacement and its observed contact branch",
        );
      const actual: ActionClock.State = ActionClock.sample(
        timing,
        elapsed,
        contact?.event.time,
      );
      const nominal: ActionClock.State = ActionClock.sample(timing, elapsed);
      const state: ActionClock.State =
        contact && elapsed >= contact.event.time ? actual : nominal;
      if (
        geometry.shoulder[1] - context.target[1] > 0.12 &&
        timing.preparation === 0
      )
        throw new Error(
          "A lowered body punch requires explicit supported preparation",
        );
      const guard: Sample = configuration(
        context.basePose,
        geometry.hand,
        0,
        0,
        "complete",
        elapsed,
        1,
        context,
        0,
        undefined,
        true,
      );
      if (contact && elapsed >= contact.event.time) {
        const release: number = contact.event.time + timing.contact;
        const planted: MotionAction.FootSupport = structuredClone(
          footSupport(guard.support),
        );
        guard.support = PunchSupport.retractionGoal(
          contact.sample.support,
          context,
        );
        guard.preservedChannels = contact.sample.preservedChannels
          ? [...contact.sample.preservedChannels]
          : guard.preservedChannels;
        if (
          kind !== "jab" &&
          context.supportPatches?.some(
            (patch: MotionAction.SupportPatch): boolean =>
              patch.side === request.side &&
              patch.mode === "pivot" &&
              patch.frameRotation !== undefined,
          )
        )
          guard.pose = toeRoll(guard.pose, context.basePose, request.side, 1);
        if (contact.sample.effectors[0])
          guard.effectors[0]!.role = contact.sample.effectors[0]!.role;
        const kinematics: MotionRecovery.Kinematics = {
          evaluatePose: context.evaluatePose!,
          effectors: guard.effectors,
        };
        const recovered: MotionAction.Sample = MotionRecovery.sample(
          contact,
          guard,
          elapsed,
          timing.retraction,
          release,
          kinematics,
        );
        if (state.phase === "recovery" || state.phase === "complete") {
          if (kind === "jab") {
            const load: number =
              state.phase === "complete" ? 1 : ActionClock.ease(state.progress);
            recovered.support = {
              ...planted,
              left:
                contact.sample.support.left +
                (planted.left - contact.sample.support.left) * load,
              right:
                contact.sample.support.right +
                (planted.right - contact.sample.support.right) * load,
            };
          } else {
            const retainedDrive: number =
              context.supportFrame && state.phase === "recovery"
                ? ActionClock.sample(timing, contact.event.time).weight *
                  (1 - ActionClock.ease((state.progress - 0.3) / 0.5))
                : 0;
            const feet: PunchSupport.State = PunchSupport.sample(
              request,
              timing,
              context,
              state.phase,
              state.progress,
              retainedDrive,
              contact.sample.support,
            );
            recovered.support = measuredSupport(
              context,
              feet,
              retainedDrive,
              recovered.rootOffset,
            );
            recovered.pose = toeRoll(
              context.basePose,
              context.basePose,
              request.side,
              feet.roll,
            );
          }
        }
        if (state.phase === "recovery" || state.phase === "complete")
          recovered.effectors = recovered.effectors.map(
            (effector: MotionAction.Effector): MotionAction.Effector => ({
              ...effector,
              role: "guard",
            }),
          );
        const returned: Sample = {
          ...recovered,
          elapsed,
          phase: state.phase,
          progress: state.progress,
        };

        // Normal compliance is part of the original requested body, before support fitting.
        const originalRoot: MotionAction.Vec3 = [...returned.rootOffset];
        returned.rootOffset = add(returned.rootOffset, [...bodyResponse]);
        if (elapsed <= release)
          returned.effectors = returned.effectors.map(
            (effector: MotionAction.Effector): MotionAction.Effector => ({
              ...effector,
              target: effector.target.map(
                (value: number, index: number): number =>
                  value - bodyResponse[index]!,
              ) as MotionAction.Vec3,
            }),
          );
        if (placement && !bodyOnly) {
          if (bodyAuthority !== "shared")
            requireReturnPlacement(returned, placement);
          const owned: NonNullable<IAutoMovieHumanPose["arms"]>["left"] =
            structuredClone(returned.pose.arms![request.side]);
          returned.pose = structuredClone(
            placement.pose,
          ) as IAutoMovieHumanPose;
          returned.pose.arms ??= { left: {}, right: {} };
          returned.pose.arms[request.side] = owned;
          returned.rootOffset = [...placement.rootOffset];
          returned.rootRotation = placement.rootRotation
            ? [...placement.rootRotation]
            : undefined;
          returned.support = structuredClone(
            placement.support,
          ) as MotionAction.Support;
          returned.effectors =
            elapsed <= release
              ? recovered.effectors.map(
                  (effector: MotionAction.Effector): MotionAction.Effector => ({
                    ...effector,
                    target: effector.target.map(
                      (value: number, index: number): number =>
                        value +
                        originalRoot[index]! -
                        returned.rootOffset[index]!,
                    ) as MotionAction.Vec3,
                  }),
                )
              : PunchArm.frame(context, returned.pose, request.side, false);
        }
        return returned;
      }
      const peak: number = timing.preparation + timing.delivery;
      const returning: boolean =
        state.phase === "retraction" ||
        state.phase === "recovery" ||
        state.phase === "complete";
      const progress: number =
        state.phase === "delivery"
          ? ActionClock.ease(state.progress)
          : state.phase === "contact"
            ? 1
            : returning
              ? 1 -
                ActionClock.ease(
                  Math.max(
                    0,
                    Math.min(
                      1,
                      (elapsed - peak - timing.contact) / timing.retraction,
                    ),
                  ),
                )
              : 0;
      const preparing: number =
        timing.preparation === 0
          ? 0
          : state.phase === "preparation"
            ? ActionClock.ease(state.progress)
            : state.phase === "delivery"
              ? 1 - state.weight
              : 0;
      const originalShape: IAutoMovieHumanPose = PunchShape.sample(
        kind,
        request.side,
        request.leadSide,
        context.basePose,
        preparing,
        state.weight,
        variation.amplitude,
      );
      const shaped: IAutoMovieHumanPose = continuation
        ? PunchContinuation.arm(
            continuation,
            elapsed,
            request.side,
            originalShape,
            context.basePose,
          )
        : originalShape;
      const lowered: { pose: IAutoMovieHumanPose; drop: number } = bodyLevel(
        shaped,
        context,
        state.phase,
        state.progress,
      );
      const pose: IAutoMovieHumanPose = placement
        ? (structuredClone(placement.pose) as IAutoMovieHumanPose)
        : lowered.pose;
      if (placement) {
        pose.arms ??= { left: {}, right: {} };
        pose.arms[request.side] = structuredClone(shaped.arms![request.side]);
      }
      const offset: MotionAction.Vec3 = placement
        ? [...placement.rootOffset]
        : [
            direction[0] * 0.015 * state.weight,
            -(kind === "uppercut" ? 0.035 : 0.008) *
              preparing *
              variation.amplitude -
              lowered.drop,
            direction[2] * 0.015 * state.weight,
          ];
      const bounded: ReturnType<typeof PunchArm.bound> = PunchArm.bound(
        context,
        pose,
        request.side,
        [aim[0] - offset[0], aim[1] - offset[1], aim[2] - offset[2]],
        kind,
      );
      const endpoint: MotionAction.Vec3 = add(bounded.point, offset);
      const originalPoint: MotionAction.Vec3 = path(
        geometry.hand,
        endpoint,
        progress,
        returning,
      );
      const continued: MotionAction.Vec3 | undefined =
        continuation &&
        PunchContinuation.point(continuation, elapsed, context.frame);
      const point: MotionAction.Vec3 = continued ?? originalPoint;
      return configuration(
        pose,
        point,
        state.weight,
        preparing,
        state.phase,
        elapsed,
        state.progress,
        context,
        lowered.drop,
        placement,
        bodyOnly,
        bodyAuthority,
      );
    }

    /** Validate the immutable original peak task before any requested sample, without fitting or reading achieved geometry. */
    function validateTerminal(
      context: MotionAction.Context,
      originalTaskFrame: MotionAction.Context["frame"],
    ): void {
      const shape: IAutoMovieHumanPose = PunchShape.sample(
        kind,
        request.side,
        request.leadSide,
        context.basePose,
        0,
        1,
        variation.amplitude,
      );
      const lowered: { pose: IAutoMovieHumanPose; drop: number } = bodyLevel(
        shape,
        context,
        "contact",
        0,
      );
      const offset: MotionAction.Vec3 = [
        direction[0] * 0.015,
        -lowered.drop,
        direction[2] * 0.015,
      ];
      const aim: MotionAction.Vec3 = add(context.target, variation.aimOffset);
      const bounded: ReturnType<typeof PunchArm.bound> = PunchArm.bound(
        context,
        lowered.pose,
        request.side,
        aim.map(
          (value: number, index: number): number => value - offset[index]!,
        ) as MotionAction.Vec3,
        kind,
      );
      const original: MotionAction.Vec3 = add(bounded.point, offset);
      const terminal: MotionAction.Vec3 = PunchContinuation.point(
        continuation!,
        continuation!.endSeconds,
        originalTaskFrame,
      )!;
      if (
        Math.hypot(
          ...terminal.map(
            (value: number, index: number): number => value - original[index]!,
          ),
        ) > 1e-10
      )
        throw new Error(
          "Continuation terminal must equal the unchanged original WORLD task",
        );
    }

    /** Bent-arm hook approaches laterally; uppercut rises from a compact dip. */
    function path(
      start: MotionAction.Vec3,
      end: MotionAction.Vec3,
      progress: number,
      returning: boolean,
    ): MotionAction.Vec3 {
      const point: MotionAction.Vec3 = mix(start, end, progress);
      const arc: number = Math.sin(Math.PI * progress) * variation.amplitude;
      if (kind === "hook") {
        const width: number = Math.min(
          0.18,
          Math.hypot(end[0] - start[0], end[2] - start[2]) * 0.35,
        );
        return add(
          point,
          lateral.map(
            (value: number): number =>
              value * width * arc * sideSign * (returning ? 0.35 : 1),
          ) as MotionAction.Vec3,
        );
      }
      if (kind === "uppercut")
        point[1] -=
          Math.min(
            0.16,
            Math.hypot(end[0] - start[0], end[1] - start[1]) * 0.35,
          ) * arc;
      return point;
    }

    /** Support shares describe authored load transfer, never measured forces. */
    function configuration(
      pose: IAutoMovieHumanPose,
      point: MotionAction.Vec3,
      drive: number,
      preparation: number,
      phase: MotionAction.Phase,
      elapsed: number,
      progress: number,
      context: MotionAction.Context,
      drop: number,
      placement?: MotionAction.BodyPlacement,
      bodyOnly: boolean = false,
      bodyAuthority?: "shared",
    ): Sample {
      const lead: number = 0.5 + drive * 0.12;
      const active: boolean = phase === "delivery" || phase === "contact";
      const patches: MotionAction.SupportPatch[] | undefined =
        context.supportPatches &&
        (["left", "right"] as const).map(
          (side: MotionAction.Side): MotionAction.SupportPatch => {
            const found: MotionAction.SupportPatch | undefined =
              context.supportPatches!.find(
                (patch: MotionAction.SupportPatch): boolean =>
                  patch.side === side && patch.mode === "planted",
              );
            if (!found)
              throw new Error(
                `Punch requires the actual ${side} planted support witness`,
              );
            return structuredClone(found);
          },
        );
      const feet: PunchSupport.State =
        kind === "jab"
          ? {
              support: {
                left: request.leadSide === "left" ? lead : 1 - lead,
                right: request.leadSide === "right" ? lead : 1 - lead,
                ...(patches ? { patches } : {}),
              },
              roll: 0,
            }
          : PunchSupport.sample(
              request,
              timing,
              context,
              phase,
              progress,
              drive,
            );
      const rootOffset: MotionAction.Vec3 = placement
        ? [...placement.rootOffset]
        : [
            direction[0] * 0.015 * drive,
            -(kind === "uppercut" ? 0.035 : 0.008) *
              preparation *
              variation.amplitude -
              drop,
            direction[2] * 0.015 * drive,
          ];
      const clinical: IAutoMovieHumanPose = placement
        ? (structuredClone(placement.pose) as IAutoMovieHumanPose)
        : toeRoll(pose, context.basePose, request.side, feet.roll);
      if (placement) {
        clinical.arms ??= { left: {}, right: {} };
        clinical.arms[request.side] = structuredClone(pose.arms![request.side]);
      }
      const internalReturn: boolean =
        bodyAuthority === "shared" &&
        (phase === "retraction" || phase === "recovery");
      const arm: Pick<PunchArm.Result, "pose" | "effectors"> &
        Partial<Pick<PunchArm.Result, "fit">> =
        bodyOnly || internalReturn || phase === "idle" || phase === "complete"
          ? {
              pose: clinical,
              effectors: PunchArm.frame(context, clinical, request.side, false),
            }
          : PunchArm.compose(
              context,
              clinical,
              request.side,
              [
                point[0] - rootOffset[0],
                point[1] - rootOffset[1],
                point[2] - rootOffset[2],
              ],
              active,
              kind,
              drive,
            );
      return {
        pose: arm.pose,
        rootOffset,
        ...(placement?.rootRotation
          ? { rootRotation: [...placement.rootRotation] }
          : {}),
        support: placement
          ? (structuredClone(placement.support) as MotionAction.Support)
          : measuredSupport(context, feet, drive, rootOffset),
        effectors: arm.effectors,
        preservedChannels: [
          `arms.${request.side}.shoulderGirdle.elevation`,
          `arms.${request.side}.shoulderGirdle.upwardRotation`,
          `arms.${request.side}.shoulderGirdle.protraction`,
          `arms.${request.side}.forearm.pronation`,
          `arms.${request.side}.wrist.flexion`,
          `arms.${request.side}.wrist.radialDeviation`,
        ],
        ...(arm.fit ? { armFit: arm.fit } : {}),
        phase,
        elapsed,
        progress,
      };
    }

    /** Keep both sole frames explicit and minimum-point objectives continuous while their ground roles change. */
    function measuredSupport(
      context: MotionAction.Context,
      feet: PunchSupport.State,
      drive: number,
      rootOffset: MotionAction.Vec3,
    ): MotionAction.Support {
      if (!context.supportFrame) return feet.support;
      const plantar: IAutoMovieHumanPose = toeRoll(
        context.basePose,
        context.basePose,
        request.side,
        feet.roll,
      );
      const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        (request.side === "left" ? 1 : -1) * 18 * drive,
      );
      const patches: MotionAction.SupportPatch[] = (
        feet.support.patches ?? []
      ).flatMap(
        (patch: MotionAction.SupportPatch): MotionAction.SupportPatch[] => {
          if (
            !patch.frameRotation &&
            (kind === "jab" || patch.side === request.side)
          )
            return [patch];
          const reference: MotionAction.SupportPatch = patch.frameRotation
            ? patch
            : {
                ...patch,
                mode: "free",
                constraint: "hard",
                frameRotation: [0, 0, 0, 1],
              };
          const measured: MotionAction.SupportMeasurement =
            context.supportFrame!(plantar, rootOffset, reference);
          const frame: MotionAction.SupportPatch = measured.frame;
          const contact: MotionAction.SupportPatch = measured.contact;
          const yaw: IAutoMovieQuaternion =
            patch.side === request.side ? rotation : Quaternion.identity();
          const value: [number, number, number, number] = frame.frameRotation!;
          const turned: IAutoMovieQuaternion = Quaternion.multiply(yaw, {
            x: value[0],
            y: value[1],
            z: value[2],
            w: value[3],
          });
          frame.frameRotation = [turned.x, turned.y, turned.z, turned.w];
          const delta: { x: number; y: number; z: number } =
            Quaternion.rotateVector(yaw, {
              x: contact.world[0] - frame.world[0],
              y: contact.world[1] - frame.world[1],
              z: contact.world[2] - frame.world[2],
            });
          contact.world = [
            frame.world[0] + delta.x,
            contact.world[1],
            frame.world[2] + delta.z,
          ];
          contact.mode =
            patch.mode === "pivot" || patch.side !== request.side
              ? "planted"
              : "free";
          return [frame, contact];
        },
      );
      return { ...feet.support, patches };
    }
    return Object.freeze({
      kind,
      request,
      timing,
      aimOffset: variation.aimOffset,
      duration: ActionClock.duration(timing),
      sample,
      planBody,
      inspect,
      armChannels,
      continuation,
    });
  }
}

/** Standing punches retain the foot-support branch rather than inventing shares for whole-body contact or flight. */
function footSupport(support: MotionAction.Support): MotionAction.FootSupport {
  if (support.kind === "contacts" || support.kind === "airborne")
    throw new Error("Standing punch recovery requires foot support");
  return support;
}

/** Preserve authored return authority while the native support owner fits legs and rootY. */
function requireReturnPlacement(
  sample: MotionAction.Sample,
  placement: MotionAction.BodyPlacement,
): void {
  const fixed: (pose: IAutoMovieHumanPose) => object = (
    pose: IAutoMovieHumanPose,
  ): object => {
    const result: IAutoMovieHumanPose = structuredClone(pose);
    delete result.arms;
    delete result.legs;
    return result;
  };
  const requested: readonly number[] = sample.rootRotation ?? [0, 0, 0, 1];
  const actual: readonly number[] = placement.rootRotation ?? [0, 0, 0, 1];
  const rootError: number = Math.hypot(
    sample.rootOffset[0] - placement.rootOffset[0],
    sample.rootOffset[2] - placement.rootOffset[2],
  );
  const rotationError: number =
    1 -
    Math.abs(
      requested.reduce(
        (sum: number, value: number, index: number): number =>
          sum + value * actual[index]!,
        0,
      ),
    );
  if (
    rootError > 1e-10 ||
    rotationError > 1e-10 ||
    JSON.stringify(fixed(sample.pose)) !==
      JSON.stringify(fixed(placement.pose)) ||
    JSON.stringify(sample.support) !== JSON.stringify(placement.support)
  )
    throw new Error(
      "Clinical return placement changes its authored root heading, horizontal response, trunk or original support",
      {
        cause: structuredClone({
          phase: sample.phase,
          elapsed: sample.elapsed,
          requested: {
            pose: sample.pose,
            rootOffset: sample.rootOffset,
            rootRotation: sample.rootRotation,
            support: sample.support,
          },
          actual: placement,
          rootError,
          rotationError,
          permittedNativeFit:
            "leg controls and vertical root only; actual full-floor/load admission remains required",
        }),
      },
    );
}

/** Measurements required by every punch; actor geometry stays with the host. */
interface RequiredGeometry {
  /** Actor-local shoulder centre, metres. */
  shoulder: MotionAction.Vec3;
  /** Initial actor-local glove-pad centre, metres. */
  hand: MotionAction.Vec3;
  /** Actual pad witness in Hand bone coordinates, metres. */
  handLocalPoint: MotionAction.Vec3;
  /** Actual shoulder-to-elbow length, metres. */
  upperArmMetres: number;
  /** Actual elbow-to-wrist length, metres. */
  forearmMetres: number;
  /** Actual wrist-to-pad extent, metres. */
  gloveOffsetMetres: number;
  /** Explicit enclosing interaction proxy, metres. */
  gloveRadiusMetres: number;
}

/** Refuse absent/nonfinite geometry rather than inventing a standard body. */
function admit(context: MotionAction.Context): RequiredGeometry {
  const geometry: MotionAction.Geometry = context.geometry;
  if (
    ![
      geometry.shoulder,
      geometry.hand,
      geometry.handLocalPoint,
      context.target,
    ].every(
      (point: MotionAction.Vec3 | undefined): boolean =>
        Array.isArray(point) &&
        point.length === 3 &&
        point.every(Number.isFinite),
    )
  )
    throw new Error(
      "Punch requires real shoulder, guard pad, Hand witness and target coordinates",
    );
  if (
    ![
      geometry.upperArmMetres,
      geometry.forearmMetres,
      geometry.gloveOffsetMetres,
      geometry.gloveRadiusMetres,
    ].every(
      (value: number | undefined): boolean =>
        value !== undefined && Number.isFinite(value) && value > 0,
    )
  )
    throw new Error(
      "Punch requires positive actual arm lengths and glove extents",
    );
  return geometry as RequiredGeometry;
}

/** Owned vector addition in the same explicitly actor-local metre frame. */
function add(a: MotionAction.Vec3, b: MotionAction.Vec3): MotionAction.Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Owned affine interpolation, used only with finite geometry and unit progress. */
function mix(
  a: MotionAction.Vec3,
  b: MotionAction.Vec3,
  weight: number,
): MotionAction.Vec3 {
  return [
    a[0] + (b[0] - a[0]) * weight,
    a[1] + (b[1] - a[1]) * weight,
    a[2] + (b[2] - a[2]) * weight,
  ];
}

/** Authored ankle plantar flexion and negative MTP extension match the host's measured roll construction. */
function toeRoll(
  pose: IAutoMovieHumanPose,
  base: IAutoMovieHumanPose,
  side: MotionAction.Side,
  weight: number,
): IAutoMovieHumanPose {
  const result: IAutoMovieHumanPose = structuredClone(pose);
  if (weight === 0) return result;
  result.legs ??= { left: {}, right: {} };
  const ankle: { minimum: number; maximum: number } =
    AutoMovieHumanRigControls.bounds(`legs.${side}.ankle.dorsiflexion`);
  result.legs[side].ankle = {
    ...result.legs[side].ankle,
    dorsiflexion: Math.max(
      ankle.minimum,
      Math.min(
        ankle.maximum,
        (base.legs?.[side].ankle?.dorsiflexion ?? 0) - 12 * weight,
      ),
    ),
  };
  result.legs[side].foot ??= {};
  for (const digit of [
    "hallux",
    "second",
    "third",
    "fourth",
    "fifth",
  ] as const) {
    const bounds: { minimum: number; maximum: number } =
      AutoMovieHumanRigControls.bounds(`legs.${side}.foot.${digit}.mtpFlexion`);
    result.legs[side].foot![digit] = {
      ...result.legs[side].foot![digit],
      mtpFlexion: Math.max(
        bounds.minimum,
        Math.min(
          bounds.maximum,
          (base.legs?.[side].foot?.[digit]?.mtpFlexion ?? 0) - 20 * weight,
        ),
      ),
    };
  }
  return result;
}

/** Body-height delivery lowers a supported pelvis through hips/knees before the arm drives. */
function bodyLevel(
  pose: IAutoMovieHumanPose,
  context: MotionAction.Context,
  phase: MotionAction.Phase,
  progress: number,
): { pose: IAutoMovieHumanPose; drop: number } {
  const maximum: number = Math.max(
    0,
    Math.min(0.14, context.geometry.shoulder![1] - context.target[1] - 0.12),
  );
  const weight: number =
    phase === "preparation"
      ? ActionClock.ease(progress)
      : phase === "delivery" || phase === "contact"
        ? 1
        : phase === "retraction"
          ? 1 - ActionClock.ease(progress)
          : 0;
  const drop: number = maximum * weight;
  const result: IAutoMovieHumanPose = structuredClone(pose);
  if (drop === 0) return { pose: result, drop };
  result.legs ??= { left: {}, right: {} };
  for (const side of ["left", "right"] as const) {
    result.legs[side].hip = {
      ...result.legs[side].hip,
      flexion: (result.legs[side].hip?.flexion ?? 0) + drop * 110,
    };
    result.legs[side].knee = {
      ...result.legs[side].knee,
      flexion: (result.legs[side].knee?.flexion ?? 0) + drop * 200,
    };
  }
  return { pose: result, drop };
}
