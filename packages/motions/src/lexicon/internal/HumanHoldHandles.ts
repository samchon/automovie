import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHoldHandles,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRideHands } from "./HumanRideHands";
import { humanRideGripTiming } from "./humanRideGripTiming";
import { HumanHoldHandlesData } from "./HumanHoldHandlesData";

/*
 * Keep both of a walker's hands on a moving implement's two handles, as a
 * ploughman holds a walking plough.
 *
 * The base walk owns the steps and the handles stay on the posed implement. The
 * overlay acquires both handles and releases them over equal authored
 * intervals, each hand's goal on its handle's actual moving frame by the shared
 * rider hold (`HumanMountRider.hold`, `HumanRideHands`), the same fit the lead
 * and the driving lines use, and both arms laid on one planned course
 * (`courseArmGoal`) so neither changes branch as the handles move.
 *
 * The author gives the total `seconds`; the hands take the handles and let go
 * in `transition` seconds each, together less than `seconds`; no natural value
 * is defined (provisional).
 */
export const HumanHoldHandles: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHoldHandles> =
  {
    name: "holdHandles",
    overlay: true,
    interrupts: {},
    plan: planHumanHoldHandles,
  };

/*
 * Fit and verify both displayed hands against two actual moving handles.
 */
function planHumanHoldHandles(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHoldHandles>,
): IAutoMovieMotionHumanActionPlan {
  const {
    on,
    left = "leftHandle",
    right = "rightHandle",
    duration: seconds,
    transition,
  } = context.params;
  if (!(transition > 0 && 2 * transition < seconds))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "transition",
      value: transition,
      feasible: null,
      reason: "a hold needs positive acquire, hold and release intervals",
      fix: "Give a transition shorter than half the total seconds.",
    });
  if (context.carrier === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "base",
      axis: "carrier",
      value: context.entry.base.kind,
      feasible: null,
      reason: "the handle overlay needs a carrier that owns the walker's steps",
      fix: "Put holdHandles over an authored walk.",
    });
  const support: IAutoMovieMotionHumanPropReader = context.prop(on);
  const ids: Readonly<Record<AutoMovieHumanSide, string>> = { left, right };
  for (const side of HumanHoldHandlesData.SIDES) {
    const handle: IAutoMovieAffordance | undefined =
      support.prop.affordances?.find(
        (contact: IAutoMovieAffordance): boolean => contact.id === ids[side],
      );
    if (handle === undefined || !(handle.aperture! > 0))
      throw new AutoMovieMotionHumanRefusal({
        kind: "affordance",
        axis: side,
        value: ids[side],
        feasible: null,
        reason: `${on}.${ids[side]} does not describe a handle with an actual aperture`,
        fix: "Name the implement's actual handles.",
      });
  }
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    seconds,
  );
  const first: IAutoMovieRigidTransform = support.frame(context.start);
  const { gripsAt, closures }: HumanRideHands.IHands = HumanRideHands(
    { ...context, params: { on, duration: seconds, hands: ids } },
    on,
    support,
    base.posture(0),
    first,
    transition,
  );
  const channels = ["leftArm", "leftHand", "rightArm", "rightHand"] as const;
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(
      HumanHoldHandlesData.SIDES.flatMap((side: AutoMovieHumanSide): AutoMovieHumanoidBone[] => [
        `${side}Hand`,
        ...HumanHand.frameBones(context.body, side, "palm"),
      ]),
    );
  const timing: humanRideGripTiming.ITiming = humanRideGripTiming(
    transition,
    seconds,
  );
  const onShare: number = timing.on;
  const offShare: number = timing.off;
  // The law's goals: each hand on its handle where the implement has it at
  // every second, the fingers closing and opening over the transitions.
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration: seconds,
    channels,
    enteredChannels: channels,
    hands: [...HumanHoldHandlesData.SIDES],
    events: [
      { name: "handlesOn", share: onShare },
      { name: "handlesOff", share: offShare },
    ],
    contacts: HumanHoldHandlesData.SIDES.map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Hand`,
        kind: "grip",
        from: onShare,
        to: offShare,
        support: { kind: "prop", subject: on },
      }),
    ),
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
      const share: number = timing.closure(time);
      const film: number = context.start + time;
      const grips: ReturnType<typeof gripsAt> = gripsAt(
        film,
        support.frame(film),
      );
      let shown: IAutoMovieMotionHumanPosture = torso;
      const held: Partial<
        Record<AutoMovieHumanSide, ReturnType<typeof HumanMountRider.hold>>
      > = {};
      for (const side of HumanHoldHandlesData.SIDES) {
        const hand: ReturnType<typeof HumanMountRider.hold> =
          HumanMountRider.hold(
            context.body,
            side,
            torso,
            grips[side]!,
            1,
            closures[side] ?? {},
            resolution,
            projection,
          );
        held[side] = hand;
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
        shown = {
          ...shown,
          limbs: { ...shown.limbs, [`${side}Arm`]: hand.arm },
          joints: { ...shown.joints, ...fingers },
        };
      }
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
            requested,
            projection,
          );
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          poseBones(context.body, pose.pose, read(), requested);
        for (const side of HumanHoldHandlesData.SIDES) {
          const actual: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
          const contact: IAutoMovieVector3 | undefined =
            held[side]!.arm.contact;
          // A round handle seats the grip across the palm's middle, so its palm frame is the effector; a rein names its own palm contact.
          const effector: IAutoMovieVector3 =
            contact === undefined
              ? HumanHand.frame(context.body, bones, side, "palm").point
              : AutoMovieEngineVector3.add(
                  actual.worldPosition,
                  AutoMovieEngineQuaternion.rotateVector(actual.worldRotation, contact),
                );
          const grip: HumanRideHands.IMaterialGrip = grips[side]!;
          // A wrapped round handle puts the palm on its surface anywhere round its axis; a rein's palm contact sits on its skin along the outward normal.
          const distance: number =
            contact === undefined
              ? Math.abs(
                  AutoMovieEngineVector3.distance(effector, grip.point) - (grip.radius ?? 0),
                )
              : AutoMovieEngineVector3.distance(
                  effector,
                  AutoMovieEngineVector3.addScaled(grip.point, grip.normal, grip.radius ?? 0),
                );
          if (!(distance <= HumanHoldHandlesData.REACH))
            throw new AutoMovieMotionHumanRefusal({
              kind: "affordance",
              axis: "handleReach",
              value: distance,
              feasible: {
                kind: "range",
                minimum: 0,
                maximum: HumanHoldHandlesData.REACH,
                unit: "m",
              },
              reason: `the displayed ${side} hand misses ${on}.${ids[side]} by ${distance} m at film second ${film}`,
              fix: "Stage the walker's path within reach of the handles.",
            });
        }
      }
      return shown;
    },
  };

  // Both arms reach, hold and let go on one planned course, so each
  // keeps its branch from the walk's arm onto its moving handle.
  return courseArmGoal({
    context,
    plan: goals,
    side: "left",
    span: {
      start: 0,
      ready: transition,
      relax: seconds - transition,
      end: seconds,
    },
    with: [
      {
        side: "right",
      },
    ],
  });
}
