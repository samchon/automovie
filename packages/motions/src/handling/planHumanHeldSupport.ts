import {
  Quaternion,
  Vector3,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanEffectorPointLimit,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieJointPose,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHeldUse,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspHand } from "./HumanGraspHand";
import { HumanGraspTarget } from "./HumanGraspTarget";
import { HumanGraspUse } from "./HumanGraspUse";
import { HumanGrip } from "./HumanGrip";
import { prepareHumanShapeBlend } from "./prepareHumanShapeBlend";

/**
 * Plan the support grip while the primary arm holds a tool at its use.
 *
 * The lead arm is already solved and its displayed wrist carries the tool.
 * The support fits the authored handle on that real pose, closes the digits
 * on the tool and ranks the clear poses by their contact clearance. Its
 * selected grip rides the tool while the support approaches and returns
 * on its own span, with the lead arm included in the support's arm clearance.
 *
 * @param props The held tool, support handle, action clock, solved lead and the support interval.
 * @returns The support arm and fingers, with the actual contact window on the arm.
 * @throws {HumanRefusal} When the tool is not held, the handle is absent, or its support cannot be fitted or moved there within the physical bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged arm inputs, exact held frame, contact selection and returned write windows.
 * @evidence contracts/development/implementation.md#principled-implementation Fits each candidate about the declared handle on the actual lead posture. Finger closure, exact opposing hand material and the existing whole-arm audit admit each grasp. The least remaining material margin ranks admitted grasps, and the selected one stays relative to the camera through its staged support plan.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the lead, admit the grip, then prepare one support arm trajectory and its finger blend.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The actual lead is a clearance obstacle throughout. Its grip and prop ownership are kept, the grasp and colliders belong to the prop and body, and no body, prop kind or fixed film second enters the search.
 * @evidence contracts/development/implementation.md#efficient-algorithms One bounded turn-by-tilt set uses the existing posture and grip closure owners. Only candidates improving a valid reserve pay the full-body audit. One support trajectory is prepared from the actual lead.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the rigid held frame, rig's FK, physical grasp closure and arm planner. The final composer consumes the already prepared support and lead trajectories.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The candidate search holds one best pose. Only the selected relative grip, finger blend, contacts and ordinary arm plan survive into the primitive.
 */
export function planHumanHeldSupport(
  props: Omit<IAutoMovieMotionHumanHeldUse.ISecondProps, "context" | "key" | "goal" | "weight"> & {
    context: IAutoMovieMotionHumanActionContext;
    lead: IAutoMovieMotionHumanActionPlan;
    span: IAutoMovieMotionHumanArmPlanned.ISpan;
  },
): IAutoMovieMotionHumanPrimitive[] {
  const { context, clock, lead, span } = props;
  const body: IAutoMovieMotionHumanBody = context.body;
  const other: AutoMovieHumanSide = props.side === "right" ? "left" : "right";
  const leadBone: AutoMovieHumanoidBone = `${props.side}Hand`;
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([leadBone]);
  const readLead: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(context, props.side, props.prop);
  const socket: IAutoMovieVector3 = HumanHand.offset(body, props.side, "grip").point;
  const prop: ReturnType<typeof context.prop>["prop"] = context.prop(props.prop).prop;
  const target: ReturnType<typeof HumanGraspTarget> = HumanGraspTarget(prop, props.handle);
  const length: number = prop.affordances?.find(({ id }) => id === props.handle)?.length ?? 0;
  const placed: ReturnType<typeof HumanGraspHand.prepare> = HumanGraspHand.prepare(body, other);
  const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(body, other, "palm", "flat");
  const limits: IAutoMovieHumanEffectorPointLimit[] = [
    { x: 0, y: 0, z: 0 },
    Vector3.add(palm.point, Vector3.scale(palm.forward, Vector3.length(palm.point))),
  ].map((contact: IAutoMovieVector3): IAutoMovieHumanEffectorPointLimit => ({
    contact,
    bound: AutoMovieMotionHumanAuditSkin.BUILT,
  }));
  const tool = (hand: IAutoMovieResolvedBone): IAutoMovieRigidTransform => ({
    position: Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, Vector3.add(socket, held.frame.position)),
    ),
    rotation: Quaternion.normalize(Quaternion.multiply(hand.worldRotation, held.frame.rotation)),
  });
  const at: IAutoMovieMotionHumanPosture = lead.posture(span.ready);
  const presented: IAutoMoviePose = resolveHumanPosture(body, at);
  const visible: ReturnType<typeof poseBones> = poseBones(body, presented);
  const wrist: IAutoMovieResolvedBone = visible.get(leadBone)!;
  const presentedTool: IAutoMovieRigidTransform = tool(wrist);
  const used: IAutoMovieMotionHumanGrasp.ITarget = target.at(presentedTool);
  const holding: IMaterial[] = handMaterial(body, visible, leadBone);

  // Reach each candidate on the actual presented posture. Close and admit
  // only what the fitted wrist does with this handle and the leading hand.
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(body, at, other);
  const goal = (used: IAutoMovieMotionHumanGrasp.ITarget, turn: number, tilt: number): IAutoMovieMotionHumanHand.IWrist =>
    placed(HumanGrasp.around(used, turn), tilt);
  const limb: "leftArm" | "rightArm" = `${other}Arm`;
  const supportBone: AutoMovieHumanoidBone = `${other}Hand`;
  const supportArm: ReadonlySet<string> = new Set([
    supportBone, `${other}UpperArm`, `${other}LowerArm`,
  ]);
  const demand: ReadonlySet<AutoMovieHumanoidBone> = new Set([supportBone]);
  const supportFit: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, demand);
  const palmPoint = (hand: IAutoMovieMotionHumanHand.IWrist): IAutoMovieVector3 =>
    Vector3.add(hand.point, Quaternion.rotateVector(hand.rotation, palm.point));
  let selected: {
    wrist: IAutoMovieMotionHumanHand.IWrist;
    reference: IAutoMovieHumanLimbReference;
    miss: number;
    station: number;
    reserve: number;
    digits: IAutoMovieMotionHumanPosture["joints"];
  } | undefined;
  for (const { grip, station, tilt, turns } of supportGripStations(used, length)) {
    if (selected !== undefined && selected.station !== station) break;
    for (const turn of turns) {
      const target: IAutoMovieMotionHumanHand.IWrist = goal(grip, turn, tilt);
      const pose: IAutoMoviePose = resolveHumanPosture(body, {
        ...at,
        limbs: {
          ...at.limbs,
          [limb]: { ...target, bend, contact: palm.point, elbow: "strain" },
        },
      });
      const shown: IAutoMovieResolvedBone = supportFit(pose).get(supportBone)!;
      const reached: IAutoMovieMotionHumanHand.IWrist = {
        point: shown.worldPosition,
        rotation: shown.worldRotation,
      };
      const gap: number = Vector3.distance(palmPoint(reached), palmPoint(target));
      if (gap > AutoMovieMotionHumanAuditSkin.BUILT) continue;
      const miss: number =
        Vector3.distance(reached.point, target.point) +
        (Quaternion.angle(reached.rotation, target.rotation) * Math.PI / 180) * body.measure.hand;

      const closed: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.close(
        body, other, grip.grip, reached, grip.colliders,
      ).joints;
      const posed: IAutoMoviePose = {
        skeleton: body.skeleton.id,
        root: null,
        joints: Object.entries(closed).map(([bone, angle]): IAutoMovieJointPose => ({
          bone: bone as AutoMovieHumanoidBone,
          flexion: angle[0],
          abduction: angle[1],
          twist: angle[2],
        })),
      };
      const support: IMaterial[] = material(body, posed, other)(reached);
      const separation: number = Math.min(...support.flatMap((a: IMaterial): number[] =>
        holding.map((b: IMaterial): number =>
          physicalShapePairDistance(a.pose, a.shape, b.pose, b.shape),
        ),
      ));
      const toolGap: number = Math.min(...support.flatMap((a: IMaterial): number[] =>
        used.colliders.map((b): number =>
          physicalShapePairDistance(a.pose, a.shape, b.frame, b.shape),
        ),
      ));
      const reserve: number = Math.min(
        separation,
        AutoMovieMotionHumanAuditSkin.BUILT - Math.abs(toolGap),
      );
      if (
        reserve < 0 ||
        (selected !== undefined &&
          (reserve < selected.reserve ||
            (reserve === selected.reserve && miss >= selected.miss)))
      ) continue;

      // The placed candidate's arm also has to clear the available trunk,
      // head and opposite arm; clearance of the two grips alone is too local.
      const closedPose: IAutoMoviePose = {
        ...pose,
        joints: [
          ...pose.joints.filter((joint: IAutoMovieJointPose): boolean =>
            joint.bone === supportBone ||
            AutoMovieMotionHumanAuditTangleModel.group(joint.bone) !== supportBone,
          ),
          ...posed.joints,
        ],
      };
      const issues = AutoMovieMotionHumanAuditTangle.pose(body, poseBones(body, closedPose))
        .filter((pair) =>
          supportArm.has(AutoMovieMotionHumanAuditTangleModel.group(pair.a)) ||
          supportArm.has(AutoMovieMotionHumanAuditTangleModel.group(pair.b)),
        );
      if (issues.some((pair): boolean => pair.depth > AutoMovieMotionHumanAuditSkin.BUILT))
        continue;
      selected = {
        wrist: reached,
        reference: resolveHumanPosture.reference(pose, limb),
        miss,
        station,
        reserve,
        digits: closed,
      };
    }
  }
  if (selected === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "handle",
      value: props.handle,
      reason: "the supporting hand cannot grip this handle with the holding hand clear",
      fix: "choose a support handle that leaves room for both hands",
    });

  // The admitted grip rides the camera from the actual wrist where its
  // fingers closed. No other wrist attitude is solved during the hold.
  const chosen = selected;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(presentedTool.rotation);
  const relative: IAutoMovieMotionHumanHand.IWrist = {
    point: Quaternion.rotateVector(inverse, Vector3.subtract(chosen.wrist.point, presentedTool.position)),
    rotation: Quaternion.multiply(inverse, chosen.wrist.rotation),
  };
  const fingers: ReturnType<typeof prepareHumanShapeBlend> = prepareHumanShapeBlend(
    HumanGrip.fingers(context.entry.pose, other),
    selected.digits,
  );
  const hint: IAutoMovieVector3 = HumanFrame.local(
    { origin: at.root, yaw: at.yaw },
    bend,
  );
  const gesture: IAutoMovieMotionClock = AutoMovieMotionClock.of(clock.duration, [
    { name: "supportStart", seconds: span.start },
    { name: "supportReady", seconds: span.ready },
    { name: "supportRelax", seconds: span.relax },
    { name: "supportEnd", seconds: span.end },
  ]);
  const weight = (seconds: number): number =>
    gesture.envelope(["supportStart", "supportReady"], ["supportRelax", "supportEnd"], seconds);
  const digits: IAutoMovieMotionHumanPrimitive = {
    channels: [`${other}Hand`],
    reads: [`${other}Hand`],
    from: span.start,
    to: span.end,
    write: (posture: IAutoMovieMotionHumanPosture, time: number): IAutoMovieMotionHumanPosture => ({
      ...posture,
      joints: { ...posture.joints, ...fingers(weight(time)) },
    }),
  };
  const group: IAutoMovieMotionHumanArmPlanned.ITogether =
    AutoMovieMotionHumanArmPlanned.together(context.handover, true, context.tempo);
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body,
    side: other,
    from: span.start,
    to: span.end,
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, other),
    weight,
    span,
    together: group,
    goal: (posture, _seconds, resolution, projection): IAutoMovieHumanLimbGoal => {
      const shown: IAutoMoviePose = resolveHumanPosture.seeded(
        body, posture, undefined, undefined, resolution, undefined, projection,
      ).pose;
      const frame: IAutoMovieRigidTransform = tool(
        readLead(
          shown,
          resolution === undefined
            ? undefined
            : prepareHumanPoseResolution.read(resolution),
        ).get(leadBone)!,
      );
      return {
        point: Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, relative.point)),
        rotation: Quaternion.multiply(frame.rotation, relative.rotation),
        contact: palm.point,
        limits,
        bend: HumanFrame.point({ origin: posture.root, yaw: posture.yaw }, hint),
        elbow: "strain",
        reference: chosen.reference,
      };
    },
  });
  group.solved = AutoMovieMotionHumanArmPlanned.planned(
    body,
    span,
    group.carries,
    (seconds: number): IAutoMovieMotionHumanPosture =>
      digits.write(lead.posture(seconds), seconds),
    group,
  );
  return [
    digits,
    {
      ...arm,
      contacts: [{
        part: `${other}Hand`,
        kind: "grip",
        from: span.ready / clock.duration,
        to: span.relax / clock.duration,
        support: { kind: "prop", subject: props.prop },
      }],
    },
  ];
}

/**
 * Try the authored station before extending the search along its measured
 * material span. The caller admits each station with the same material and
 * whole-arm bounds and keeps the first station with a clear grip.
 */
function* supportGripStations(
  middle: IAutoMovieMotionHumanGrasp.ITarget,
  length: number,
): Iterable<{
  grip: IAutoMovieMotionHumanGrasp.ITarget;
  station: number;
  tilt: number;
  turns: readonly number[];
}> {
  for (const tilt of HumanGraspUse.OBLIQUE)
    yield { grip: middle, station: 0, tilt, turns: HumanGrasp.TURNS };
  if (!(length > 0)) return;

  const turns = HumanGrasp.TURNS.flatMap((turn, index) =>
    index === 0 ? [turn] : [(HumanGrasp.TURNS[index - 1]! + turn) / 2, turn],
  );
  for (const station of [-0.25, 0.25, -0.5, 0.5]) {
    const grip: IAutoMovieMotionHumanGrasp.ITarget = {
      ...middle,
      point: Vector3.add(
        middle.point,
        Vector3.scale(middle.axis, station * length),
      ),
    };
    for (const tilt of HumanGraspUse.OBLIQUE)
      yield { grip, station, tilt, turns };
  }
}

/** A physical shape and the frame of its carrying bone. */
interface IMaterial {
  /** The carried shape in bone-local metres. */
  shape: IAutoMoviePhysicalShape;
  /** The bone's rigid frame in wrist-local or world metres. */
  pose: IAutoMovieRigidTransform;
}

/** The actual palm and phalanx colliders in their posed world frames. */
function handMaterial(
  body: IAutoMovieMotionHumanBody,
  bones: ReturnType<typeof poseBones>,
  hand: AutoMovieHumanoidBone,
): IMaterial[] {
  return HumanColliders.placed(body, bones)
    .filter((segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
      AutoMovieMotionHumanAuditTangleModel.group(segment.bone) === hand,
    )
    .flatMap((segment: IAutoMovieMotionHumanColliders.IPlaced): IMaterial[] =>
      segment.shapes.map((shape: IAutoMoviePhysicalShape): IMaterial => ({
        shape,
        pose: segment.pose,
      })),
    );
}

/** Retain a solved palm and fingers' wrist-local materials for one grip search. */
function material(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
): (wrist: IAutoMovieMotionHumanHand.IWrist) => IMaterial[] {
  const hand: AutoMovieHumanoidBone = `${side}Hand`;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, pose);
  const reference: IAutoMovieResolvedBone = bones.get(hand)!;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(reference.worldRotation);
  const local: IMaterial[] = handMaterial(body, bones, hand)
    .map((segment: IMaterial): IMaterial => {
      const pose: IAutoMovieRigidTransform = {
        position: Quaternion.rotateVector(inverse, Vector3.subtract(segment.pose.position, reference.worldPosition)),
        rotation: Quaternion.multiply(inverse, segment.pose.rotation),
      };
      return { shape: segment.shape, pose };
    });
  return (wrist: IAutoMovieMotionHumanHand.IWrist): IMaterial[] =>
    local.map((part: IMaterial): IMaterial => ({
      shape: part.shape,
      pose: {
        position: Vector3.add(wrist.point, Quaternion.rotateVector(wrist.rotation, part.pose.position)),
        rotation: Quaternion.multiply(wrist.rotation, part.pose.rotation),
      },
    }));
}
