import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanLeadHorse,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRideHands } from "./HumanRideHands";

/**
 * Fit and verify the displayed hand against one actual moving lead.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the arm-only overlay, held material point, authored phase and typed refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Sample the original carrier and world rope frame, then acquire and release by minimum jerk. During the held phase the realized arm must place the actual hand effector at the declared material point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the carrier, timing and physical grip, reuse current grip geometry and measure the actual held point after fitting the displayed arm.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each hand keeps the base steps. A projected hand that cannot reach refuses instead of marking a false contact.
 * @evidence contracts/development/implementation.md#efficient-algorithms Read one carrier and one grip per sample. One selected-hand pose observation checks the fully held interval.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing carrier reader, tack grip and finger closure and selected-bone FK supply the actual hand motion.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the admitted carrier, grip closure and selected arm for this action. Actual query frames and postures remain local.
 */
function planHumanLeadHorse(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLeadHorse>,
): IAutoMovieMotionHumanActionPlan {
  const {
    on,
    hand: side,
    point = "lead",
    duration: seconds,
    transition,
  } = context.params;
  if (
    ![seconds, transition].every(Number.isFinite) ||
    !(transition > 0 && 2 * transition < seconds)
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "transition",
      value: transition,
      feasible: null,
      reason: "a lead needs positive acquire, hold and release intervals",
      fix: "Give a transition shorter than half the total seconds.",
    });
  if (context.carrier === undefined)
    throw new HumanRefusal({
      kind: "base",
      axis: "carrier",
      value: context.entry.base.kind,
      feasible: null,
      reason: "the lead overlay needs a carrier that owns the handler's steps",
      fix: "Put leadHorse over an authored walk that yields the requested arm and hand.",
    });
  const support: IAutoMovieMotionHumanPropReader = context.prop(on);
  const rope: IAutoMovieAffordance | undefined = support.prop.affordances?.find(
    (contact: IAutoMovieAffordance): boolean => contact.id === point,
  );
  if (
    rope?.kind !== "rein" ||
    rope.symmetry !== "round" ||
    !(rope.aperture! > 0)
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "point",
      value: point,
      feasible: null,
      reason: `${on}.${point} does not describe a round lead with an actual aperture`,
      fix: "Name the horse's actual lead affordance.",
    });
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    seconds,
  );
  const first: IAutoMovieRigidTransform = support.frame(context.start);
  const { gripsAt, closures }: HumanRideHands.IHands = HumanRideHands.of(
    {
      ...context,
      params: { on, duration: seconds, hands: { [side]: point } },
    },
    on,
    support,
    base.posture(0),
    first,
    transition,
  );
  const channels = [`${side}Arm`, `${side}Hand`] as const;
  const wrist: AutoMovieHumanoidBone = `${side}Hand`;
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([wrist]);
  const onShare: number = transition / seconds;
  const offShare: number = 1 - onShare;
  // The law's goal: the hand on the lead where the horse has it at every
  // second, the fingers closing and opening over the transitions.
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration: seconds,
    channels,
    enteredChannels: channels,
    hands: [side],
    events: [
      { name: "leadOn", share: onShare },
      { name: "leadOff", share: offShare },
    ],
    contacts: [
      {
        part: `${side}Hand`,
        kind: "grip",
        from: onShare,
        to: offShare,
        support: { kind: "prop", subject: on },
      },
    ],
    posture(
      at,
      _channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture {
      const time: number = Math.max(0, Math.min(seconds, at));
      const torso: IAutoMovieMotionHumanPosture = base.posture(
        time,
        undefined,
        resolution,
        projection,
      );
      const share: number = minimumJerk.share(
        Math.min(1, time / transition, (seconds - time) / transition),
      );
      const film: number = context.start + time;
      const grip: HumanRideHands.IMaterialGrip = gripsAt(
        film,
        support.frame(film),
      )[side]!;
      const hand: ReturnType<typeof HumanMountRider.hold> =
        HumanMountRider.hold(
          context.body,
          side,
          torso,
          grip,
          1,
          closures[side] ?? {},
          resolution,
          projection,
        );
      const fingers: IAutoMovieMotionHumanPosture["joints"] = {};
      for (const [bone, closed] of Object.entries(hand.fingers)) {
        if (closed === undefined) continue;
        const open: readonly [number, number, number] = torso.joints[
          bone as AutoMovieHumanoidBone
        ] ?? [0, 0, 0];
        fingers[bone as AutoMovieHumanoidBone] = [
          open[0] + (closed[0] - open[0]) * share,
          open[1] + (closed[1] - open[1]) * share,
          open[2] + (closed[2] - open[2]) * share,
        ];
      }
      const shown: IAutoMovieMotionHumanPosture = {
        ...torso,
        limbs: { ...torso.limbs, [`${side}Arm`]: hand.arm },
        joints: { ...torso.joints, ...fingers },
      };
      if (share === 1) {
        const read: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(resolution);
        const pose: ReturnType<typeof resolveHumanPosture.seeded> =
          resolveHumanPosture.seeded(
            context.body,
            shown,
            undefined,
            undefined,
            read,
            prepareHumanPoseResolution.isNativeSource(resolution)
              ? requested
              : undefined,
            projection,
          );
        const actual: IAutoMovieResolvedBone = poseBones(
          context.body,
          pose.pose,
          read(),
          requested,
        ).get(wrist)!;
        const effector: IAutoMovieVector3 =
          hand.arm.contact === undefined
            ? actual.worldPosition
            : Vector3.add(
                actual.worldPosition,
                Quaternion.rotateVector(actual.worldRotation, hand.arm.contact),
              );
        const skin: IAutoMovieVector3 = Vector3.addScaled(
          grip.point,
          grip.normal,
          grip.radius ?? 0,
        );
        const distance: number = Vector3.distance(effector, skin);
        if (!(distance <= 0.01))
          throw new HumanRefusal({
            kind: "affordance",
            axis: "leadReach",
            value: distance,
            feasible: {
              kind: "range",
              minimum: 0,
              maximum: 0.01,
              unit: "m",
            },
            reason: `the displayed ${side} hand misses ${on}.${point} by ${distance} m at film second ${film}`,
            fix: "Stage the handler's path within reach of the lead frame.",
          });
      }
      return shown;
    },
  };

  // The arm reaches, holds and lets go on one planned course, following
  // the lead as the horse moves it without changing branch.
  return courseArmGoal({
    context,
    plan: goals,
    side,
    span: {
      start: 0,
      ready: transition,
      relax: seconds - transition,
      end: seconds,
    },
  });
}

/**
 * Keep one handler's hand on the horse's actual moving lead frame.
 *
 * The base action owns steps and the lead remains on the posed horse. The
 * overlay acquires the rope and releases it over equal authored intervals.
 */
export const HumanLeadHorse: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLeadHorse> =
  {
    name: "leadHorse",
    overlay: true,
    interrupts: {},
    plan: planHumanLeadHorse,
  };
