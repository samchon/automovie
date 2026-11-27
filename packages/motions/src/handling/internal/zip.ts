import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanZip,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { operateDrive } from "../../affordance/internal/operateDrive";
import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanHand } from "../../posture/internal/HumanHand";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { poseBones } from "../../posture/internal/poseBones";
import { manipulateFacing } from "./manipulateFacing";
import { manipulateShape } from "./manipulateShape";
import { prepareZipperPinch } from "./prepareZipperPinch";
import { zipSites } from "./zipSites";

/**
 * Brace a supported pouch and pinch its slider tab through a straight stroke.
 *
 * YKK's usage guidance calls for a straight pull along the zipper chain and
 * bringing opposing elements together for a bag closure
 * (https://lyncs.ykkfastening.com/shop/pages/about_products_09.aspx). The flat
 * modeled brace anchors the casing. The model's coupled lips, the working
 * fingertips and the retained travel follow one authored stroke.
 */
export const zip: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanZip> = {
  name: "zip",
  interrupts: {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  },
  plan,
};

/** The alternatives of `DigitGoalDigit`'s site. */
type DigitGoalDigit = "thumb" | "index";

/** A sampled fingertip contact within one planned hand shape. */
interface IDigitGoal {
  digit: DigitGoalDigit;
  at: (seconds: number) => IAutoMovieMotionHumanOperateDrive.IPlace;
}

/**
 * Admit a single independent slider carrying the two opposing tab faces.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanZip>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanZip = context.params;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(p.pouch);
  const model: IAutoMovieMotionHumanPropReader["prop"] = reader.prop;
  const { thumb, index, brace, slider }: zipSites.ISites = zipSites(p, model);
  if (
    p.travel === 0 ||
    !(p.duration > 0)
  )
    throw zipSites.refusal(
      p.pouch,
      "the zipper needs a nonzero finite travel and a positive finite stroke duration",
    );

  const frame: IAutoMovieRigidTransform = reader.frame(context.start);
  const top: IAutoMovieMotionHumanOperateDrive.IPlace = place(frame, thumb);
  const bottom: IAutoMovieMotionHumanOperateDrive.IPlace = place(frame, index);
  const support: IAutoMovieMotionHumanOperateDrive.IPlace = place(frame, brace);
  const gap: IAutoMovieVector3 = Vector3.subtract(top.point, bottom.point);
  const gapLength: number = Vector3.length(gap);
  if (
    !(gapLength > 0) ||
    Vector3.dot(gap, top.normal) < 0.99 * gapLength ||
    Vector3.dot(gap, bottom.normal) > -0.99 * gapLength
  )
    throw zipSites.refusal(
      p.pouch,
      "the tab's thumb and index sites must face out from opposite sides",
    );

  const tab: IAutoMovieMotionHumanOperateDrive.IPart | undefined =
    operateDrive.part(
      context,
      { kind: "prop", subject: p.pouch, point: p.thumb },
      p.travel,
      "slider",
    );
  if (tab === undefined)
    throw zipSites.refusal(p.pouch, "the thumb site does not ride the tab slider");
  zipSites.admitStop(p.pouch, slider, tab.base + tab.amount);
  const first: IAutoMovieMotionHumanOperateDrive.IPlace = tab.place(0);
  const last: IAutoMovieMotionHumanOperateDrive.IPlace = tab.place(1);

  const side: AutoMovieHumanSide = p.hand ?? "right";
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
  const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
  const bones: ReturnType<typeof poseBones> = poseBones(
    context.body,
    context.entry.pose,
  );
  const motion: number = Math.max(
    Vector3.length(
      Vector3.subtract(first.point, bones.get(`${side}Hand`)!.worldPosition),
    ),
    Vector3.length(
      Vector3.subtract(last.point, bones.get(`${side}Hand`)!.worldPosition),
    ),
    Vector3.length(
      Vector3.subtract(support.point, bones.get(`${other}Hand`)!.worldPosition),
    ),
  );
  const tempo: number = context.tempo ?? 1;
  const transport: number =
    tempo * AutoMovieMotionHumanTiming.transport(motion);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: transport,
    attack: tempo * p.duration,
    retract: transport,
  });

  // The index contact maintains its authored offset on a purely translating tab.
  const working = (seconds: number): IAutoMovieMotionHumanOperateDrive.IPlace =>
    tab.place(clock.progress("strokeStart", "strokeEnd", seconds));
  const opposing = (
    seconds: number,
  ): IAutoMovieMotionHumanOperateDrive.IPlace => ({
    point: Vector3.subtract(working(seconds).point, gap),
    normal: bottom.normal,
  });
  const pinch: ReturnType<typeof prepareZipperPinch> = prepareZipperPinch(
    context.body,
    side,
    gapLength,
  );
  const shoulder: IAutoMovieVector3 = bones.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const hand = (seconds: number): IAutoMovieQuaternion =>
    pinchRotation(
      side,
      pinch.normal,
      gap,
      Vector3.subtract(working(seconds).point, shoulder),
    );
  const braceTurn: IAutoMovieQuaternion = manipulateFacing(
    posture,
    [{ side: other, site: support.point, normal: support.normal }],
    other,
  );
  const arms: IAutoMovieMotionHumanArmPlanned.ITogether =
    AutoMovieMotionHumanArm.together(context.handover, true, tempo);
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives: [
        ...fingers(
          context,
          clock,
          side,
          hand,
          [
            { digit: "thumb", at: working },
            { digit: "index", at: opposing },
          ],
          shoulder,
          arms,
          pinch,
        ),
        ...fingers(
          context,
          clock,
          other,
          () => braceTurn,
          [{ digit: "index", at: () => support }],
          bones.get(`${other}UpperArm`)!.worldPosition,
          arms,
        ),
      ],
      contact: "strokeEnd",
    });
  return {
    ...composed,
    hands: [side, other],
    drives: [operateDrive.drive(tab, clock)],
    contacts: [
      ...composed.contacts,
      {
        part: `${other}Hand`,
        kind: "bear",
        region: other === "left" ? "indexTipLeft" : "indexTipRight",
        load: 0,
        from: clock.at("strokeStart") / clock.duration,
        to: clock.at("strokeEnd") / clock.duration,
        support: { kind: "prop", subject: p.pouch },
      },
    ],
  };
}

/**
 * Align the fitted opposition axis with the tab, aiming along the current
 * shoulder reach.
 */
function pinchRotation(
  side: AutoMovieHumanSide,
  normal: IAutoMovieVector3,
  gap: IAutoMovieVector3,
  reach: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const forward: IAutoMovieVector3 =
    Vector3.length(Vector3.cross(gap, reach)) > 1e-8
      ? reach
      : Vector3.length(Vector3.cross(gap, { x: 0, y: 0, z: 1 })) > 1e-8
        ? { x: 0, y: 0, z: 1 }
        : { x: 1, y: 0, z: 0 };
  const along: IAutoMovieVector3 = { x: side === "left" ? 1 : -1, y: 0, z: 0 };
  if (Vector3.length(Vector3.cross(normal, along)) < 1e-8)
    return HumanHand.rotation(side, {
      fingers: forward,
      palm: Vector3.scale(gap, -1),
    });
  return HumanHand.align({ normal, forward: along }, { normal: gap, forward });
}

/** Give one hand a wrist trajectory and the sampled fingertip goals it serves. */
function fingers(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanZip>,
  clock: IAutoMovieMotionClock,
  side: AutoMovieHumanSide,
  rotationAt: (seconds: number) => IAutoMovieQuaternion,
  goals: readonly IDigitGoal[],
  shoulder: IAutoMovieVector3,
  arms: IAutoMovieMotionHumanArmPlanned.ITogether,
  pinch?: ReturnType<typeof prepareZipperPinch>,
): readonly IAutoMovieMotionHumanPrimitive[] {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const contact: IAutoMovieVector3 =
    pinch?.contact ?? HumanHand.offset(body, side, "indexTip", "relaxed").point;
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    context.entry.posture,
    side,
    0.1,
  );
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  const handAt = (seconds: number): IAutoMovieHumanLimbGoal => {
    const first: IAutoMovieVector3 = goals[0]!.at(seconds).point;
    const middle: IAutoMovieVector3 =
      pinch !== undefined
        ? Vector3.lerp(first, goals[1]!.at(seconds).point, 0.5)
        : first;
    const rotation: IAutoMovieQuaternion = rotationAt(seconds);
    return {
      point: Vector3.subtract(
        middle,
        Quaternion.rotateVector(rotation, contact),
      ),
      rotation,
      contact,
      bend,
    };
  };
  // Check the endpoint reaches before the shared arm planner checks the path.
  for (const seconds of [ready, done])
    if (
      Vector3.length(Vector3.subtract(handAt(seconds).point, shoulder)) >
      body.measure.upperArm + body.measure.forearm
    )
      throw zipSites.refusal(
        context.params.pouch,
        "the tab stroke or brace is beyond the arm's reach",
      );
  const weight = (seconds: number): number =>
    clock.envelope(["start", "ready"], ["relax", "end"], seconds);
  const first: IAutoMovieMotionHumanOperateDrive.IPlace = goals[0]!.at(ready);
  const brace: ReturnType<typeof manipulateShape> | undefined =
    pinch !== undefined
      ? undefined
      : manipulateShape(
          body,
          side,
          "index",
          handAt(ready).point,
          rotationAt(ready),
          first.point,
          first.normal,
        );
  const shape: IAutoMovieMotionHumanPosture["joints"] =
    pinch?.joints ?? brace!.joints;
  return [
    AutoMovieMotionHumanArm.carried({
      body,
      side,
      together: arms,
      from: 0,
      to: clock.duration,
      span: { start: 0, ready, relax: done, end: clock.duration },
      rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
      disc: 0.004,
      weight,
      goal: (
        _posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieHumanLimbGoal => handAt(seconds),
    }),
    {
      from: 0,
      to: clock.duration,
      channels: [`${side}Hand`],
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...posture.joints,
        };
        const share: number = weight(seconds);
        for (const bone of Object.keys(shape) as AutoMovieHumanoidBone[])
          joints[bone] = blendHumanJoint(
            body,
            bone,
            joints[bone] ?? [0, 0, 0],
            shape[bone]!,
            share,
          );
        if (seconds < ready || seconds > done) return { ...posture, joints };

        const digits: NonNullable<IAutoMovieMotionHumanPosture["digits"]> = {
          ...posture.digits,
          ...brace?.avoid,
        };
        for (const goal of goals) {
          const key: AutoMovieHumanDigit = `${side}${goal.digit === "thumb" ? "Thumb" : "Index"}`;
          const sample: IAutoMovieMotionHumanOperateDrive.IPlace =
            goal.at(seconds);
          digits[key] = {
            point: sample.point,
            // The opposed points already set the orientation of the pinch.
            // Its fingertip fit corrects positions without forcing each tip's
            // anatomical axis perpendicular to the tab.
            ...(pinch === undefined ? { normal: sample.normal } : {}),
            surface: "tip",
            contact: true,
          };
        }
        return { ...posture, joints, digits };
      },
    },
  ];
}

/** Convert a stationary affordance into a fingertip point and outward normal. */
function place(
  frame: IAutoMovieRigidTransform,
  affordance: IAutoMovieAffordance,
): IAutoMovieMotionHumanOperateDrive.IPlace {
  return {
    point: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, affordance.frame.translation),
    ),
    normal: Quaternion.rotateVector(
      Quaternion.multiply(frame.rotation, affordance.frame.rotation),
      { x: 0, y: 1, z: 0 },
    ),
  };
}
