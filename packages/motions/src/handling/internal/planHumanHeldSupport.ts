import {
  Quaternion,
  Vector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanEffectorPointLimit,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieJointPose,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHeldUse,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanAuditTangle } from "../../audit/AutoMovieMotionHumanAuditTangle";
import { AutoMovieMotionHumanAuditTangleModel } from "../../audit/AutoMovieMotionHumanAuditTangleModel";
import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { HumanLimbFit } from "../../posture/HumanLimbFit";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanGrasp } from "../HumanGrasp";
import { HumanGraspHand } from "../HumanGraspHand";
import { HumanGraspTarget } from "../HumanGraspTarget";
import { HumanGrip } from "../HumanGrip";
import { heldSupportGrip } from "./heldSupportGrip";

/** The record of `IPlanHumanHeldSupportSelected`'s site. */
type IPlanHumanHeldSupportSelected = {
  wrist: IAutoMovieMotionHumanHand.IWrist;
  reference: IAutoMovieHumanLimbReference;
  miss: number;
  station: number;
  reserve: number;
  digits: IAutoMovieMotionHumanPosture["joints"];
};

/** The alternatives of `PlanHumanHeldSupportLimb`'s site. */
type PlanHumanHeldSupportLimb = "leftArm" | "rightArm";

/** The record of `IPlanHumanHeldSupportProps`'s site. */
type IPlanHumanHeldSupportProps = {
  context: IAutoMovieMotionHumanActionContext;
  lead: IAutoMovieMotionHumanActionPlan;
  span: IAutoMovieMotionHumanArmPlanned.ISpan;
};

/** The alternatives of `PlanHumanHeldSupportProps`'s site. */
type PlanHumanHeldSupportProps = "context" | "key" | "goal" | "weight";

/**
 * Plan the support grip while the primary arm holds a tool at its use.
 *
 * The lead arm is already solved and its displayed wrist carries the tool. The
 * support fits the authored handle on that real pose, closes the digits on the
 * tool and ranks the clear poses by their contact clearance. Its selected grip
 * rides the tool while the support approaches and returns on its own span, with
 * the lead arm included in the support's arm clearance.
 *
 * @param props The held tool, support handle, action clock, solved lead and the
 *   support interval.
 * @returns The support arm and fingers, with the actual contact window on the
 *   arm.
 * @throws {HumanRefusal} When the tool is not held, the handle is absent, or
 *   its support cannot be fitted or moved there within the physical bounds.
 */
export function planHumanHeldSupport(
  props: Omit<
    IAutoMovieMotionHumanHeldUse.ISecondProps,
    PlanHumanHeldSupportProps
  > &
    IPlanHumanHeldSupportProps,
): IAutoMovieMotionHumanPrimitive[] {
  const { context, clock, lead, span } = props;
  const body: IAutoMovieMotionHumanBody = context.body;
  const other: AutoMovieHumanSide = props.side === "right" ? "left" : "right";
  const leadBone: AutoMovieHumanoidBone = `${props.side}Hand`;
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([leadBone]);
  const readLead: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    props.side,
    props.prop,
  );
  const socket: IAutoMovieVector3 = HumanHand.offset(
    body,
    props.side,
    "grip",
  ).point;
  const prop: ReturnType<typeof context.prop>["prop"] = context.prop(
    props.prop,
  ).prop;
  const target: ReturnType<typeof HumanGraspTarget> = HumanGraspTarget(
    prop,
    props.handle,
  );
  const length: number =
    prop.affordances?.find(
      ({ id }: IAutoMovieAffordance): boolean => id === props.handle,
    )?.length ?? 0;
  const placed: ReturnType<typeof HumanGraspHand.prepare> =
    HumanGraspHand.prepare(body, other);
  const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
    body,
    other,
    "palm",
    "flat",
  );
  const limits: IAutoMovieHumanEffectorPointLimit[] = [
    { x: 0, y: 0, z: 0 },
    Vector3.add(
      palm.point,
      Vector3.scale(palm.forward, Vector3.length(palm.point)),
    ),
  ].map(
    (contact: IAutoMovieVector3): IAutoMovieHumanEffectorPointLimit => ({
      contact,
      bound: AutoMovieMotionHumanAuditSkin.BUILT,
    }),
  );
  const tool = (hand: IAutoMovieResolvedBone): IAutoMovieRigidTransform => ({
    position: Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        Vector3.add(socket, held.frame.position),
      ),
    ),
    rotation: Quaternion.normalize(
      Quaternion.multiply(hand.worldRotation, held.frame.rotation),
    ),
  });
  const at: IAutoMovieMotionHumanPosture = lead.posture(span.ready);
  const presented: IAutoMoviePose = resolveHumanPosture(body, at);
  const visible: ReturnType<typeof poseBones> = poseBones(body, presented);
  const wrist: IAutoMovieResolvedBone = visible.get(leadBone)!;
  const presentedTool: IAutoMovieRigidTransform = tool(wrist);
  const used: IAutoMovieMotionHumanGrasp.ITarget = target.at(presentedTool);
  const holding: heldSupportGrip.IMaterial[] = heldSupportGrip.handMaterial(
    body,
    visible,
    leadBone,
  );

  // Reach each candidate on the actual presented posture. Close and admit
  // only what the fitted wrist does with this handle and the leading hand.
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    at,
    other,
  );
  const goal: (
    used: IAutoMovieMotionHumanGrasp.ITarget,
    turn: number,
    tilt: number,
  ) => IAutoMovieMotionHumanHand.IWrist = (
    used: IAutoMovieMotionHumanGrasp.ITarget,
    turn: number,
    tilt: number,
  ): IAutoMovieMotionHumanHand.IWrist =>
    placed(HumanGrasp.around(used, turn), tilt);
  const limb: PlanHumanHeldSupportLimb = `${other}Arm`;
  const supportBone: AutoMovieHumanoidBone = `${other}Hand`;
  const supportArm: ReadonlySet<string> = new Set([
    supportBone,
    `${other}UpperArm`,
    `${other}LowerArm`,
  ]);
  const demand: ReadonlySet<AutoMovieHumanoidBone> = new Set([supportBone]);
  const supportFit: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    demand,
  );
  const palmPoint = (
    hand: IAutoMovieMotionHumanHand.IWrist,
  ): IAutoMovieVector3 =>
    Vector3.add(hand.point, Quaternion.rotateVector(hand.rotation, palm.point));
  let selected: IPlanHumanHeldSupportSelected | undefined;
  for (const { grip, station, tilt, turns } of heldSupportGrip.stations(
    used,
    length,
  )) {
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
      const gap: number = Vector3.distance(
        palmPoint(reached),
        palmPoint(target),
      );
      if (gap > AutoMovieMotionHumanAuditSkin.BUILT) continue;
      const miss: number =
        Vector3.distance(reached.point, target.point) +
        ((Quaternion.angle(reached.rotation, target.rotation) * Math.PI) /
          180) *
          body.measure.hand;

      const closed: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.close(
        body,
        other,
        grip.grip,
        reached,
        grip.colliders,
      ).joints;
      const posed: IAutoMoviePose = {
        skeleton: body.skeleton.id,
        root: null,
        joints: Object.entries(closed).map(
          ([bone, angle]): IAutoMovieJointPose => ({
            bone: bone as AutoMovieHumanoidBone,
            flexion: angle[0],
            abduction: angle[1],
            twist: angle[2],
          }),
        ),
      };
      const support: heldSupportGrip.IMaterial[] = heldSupportGrip.material(
        body,
        posed,
        other,
      )(reached);
      const separation: number = Math.min(
        ...support.flatMap((a: heldSupportGrip.IMaterial): number[] =>
          holding.map((b: heldSupportGrip.IMaterial): number =>
            AutoMovieEnginePhysics.physicalShapePairDistance(a.pose, a.shape, b.pose, b.shape),
          ),
        ),
      );
      const toolGap: number = Math.min(
        ...support.flatMap((a: heldSupportGrip.IMaterial): number[] =>
          used.colliders.map((b): number =>
            AutoMovieEnginePhysics.physicalShapePairDistance(a.pose, a.shape, b.frame, b.shape),
          ),
        ),
      );
      const reserve: number = Math.min(
        separation,
        AutoMovieMotionHumanAuditSkin.BUILT - Math.abs(toolGap),
      );
      if (
        reserve < 0 ||
        (selected !== undefined &&
          (reserve < selected.reserve ||
            (reserve === selected.reserve && miss >= selected.miss)))
      )
        continue;

      // The placed candidate's arm also has to clear the available trunk,
      // head and opposite arm; clearance of the two grips alone is too local.
      const closedPose: IAutoMoviePose = {
        ...pose,
        joints: [
          ...pose.joints.filter(
            (joint: IAutoMovieJointPose): boolean =>
              joint.bone === supportBone ||
              AutoMovieMotionHumanAuditTangleModel.group(joint.bone) !==
                supportBone,
          ),
          ...posed.joints,
        ],
      };
      const issues = AutoMovieMotionHumanAuditTangle.pose(
        body,
        poseBones(body, closedPose),
      ).filter(
        (pair) =>
          supportArm.has(AutoMovieMotionHumanAuditTangleModel.group(pair.a)) ||
          supportArm.has(AutoMovieMotionHumanAuditTangleModel.group(pair.b)),
      );
      if (
        issues.some(
          (pair): boolean => pair.depth > AutoMovieMotionHumanAuditSkin.BUILT,
        )
      )
        continue;
      selected = {
        wrist: reached,
        reference: HumanLimbFit.reference(pose, limb),
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
      reason:
        "the supporting hand cannot grip this handle with the holding hand clear",
      fix: "choose a support handle that leaves room for both hands",
    });

  // The admitted grip rides the camera from the actual wrist where its
  // fingers closed. No other wrist attitude is solved during the hold.
  const chosen = selected;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(
    presentedTool.rotation,
  );
  const relative: IAutoMovieMotionHumanHand.IWrist = {
    point: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(chosen.wrist.point, presentedTool.position),
    ),
    rotation: Quaternion.multiply(inverse, chosen.wrist.rotation),
  };
  const fingers: ReturnType<typeof prepareHumanShapeBlend> =
    prepareHumanShapeBlend(
      HumanGrip.fingers(context.entry.pose, other),
      selected.digits,
    );
  const hint: IAutoMovieVector3 = HumanFrame.local(
    { origin: at.root, yaw: at.yaw },
    bend,
  );
  const gesture: IAutoMovieMotionClock = AutoMovieMotionClock(clock.duration, [
    { name: "supportStart", seconds: span.start },
    { name: "supportReady", seconds: span.ready },
    { name: "supportRelax", seconds: span.relax },
    { name: "supportEnd", seconds: span.end },
  ]);
  const weight = (seconds: number): number =>
    gesture.envelope(
      ["supportStart", "supportReady"],
      ["supportRelax", "supportEnd"],
      seconds,
    );
  const digits: IAutoMovieMotionHumanPrimitive = {
    channels: [`${other}Hand`],
    reads: [`${other}Hand`],
    from: span.start,
    to: span.end,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      time: number,
    ): IAutoMovieMotionHumanPosture => ({
      ...posture,
      joints: { ...posture.joints, ...fingers(weight(time)) },
    }),
  };
  const group: IAutoMovieMotionHumanArmPlanned.ITogether =
    AutoMovieMotionHumanArmPlanned.together(
      context.handover,
      true,
      context.tempo,
    );
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body,
    side: other,
    from: span.start,
    to: span.end,
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, other),
    weight,
    span,
    together: group,
    goal: (
      posture,
      _seconds,
      resolution,
      projection,
    ): IAutoMovieHumanLimbGoal => {
      const shown: IAutoMoviePose = resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        resolution,
        undefined,
        projection,
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
        point: Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, relative.point),
        ),
        rotation: Quaternion.multiply(frame.rotation, relative.rotation),
        contact: palm.point,
        limits,
        bend: HumanFrame.point(
          { origin: posture.root, yaw: posture.yaw },
          hint,
        ),
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
      contacts: [
        {
          part: `${other}Hand`,
          kind: "grip",
          from: span.ready / clock.duration,
          to: span.relax / clock.duration,
          support: { kind: "prop", subject: props.prop },
        },
      ],
    },
  ];
}
