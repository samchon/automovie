import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanLongTool,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { LongToolStroke } from "./LongToolStroke";

/**
 * Seconds the hands take to bring the tool from where it is held to the
 * stroke's start, and back after: provisional.
 */
const REACH: number = 0.6;

/**
 * The farthest a trailing hand's grip reaches from its shoulder at a stroke's
 * contact, over the arm's length to the grip: provisional, a straight arm with
 * the shoulder drawn forward.
 */
const REACH_LIMIT: number = 1.05;

/** The deepest a trunk bows toward a low work point, degrees: provisional. */
const BOW: number = 45;

/**
 * How far the pelvis sinks for work at the ground, over stature: provisional, a
 * wide working stance.
 */
const SINK: number = 0.06;

/**
 * Work with a long tool in two hands, standing, in cycles at a work point
 * (`IAutoMovieMotionHumanLongTool`): the trailing hand holds the tool rigid
 * near the shaft's end, so the face is a fixed offset in that hand's frame
 * (`AutoMovieMotionHumanHeld`), and each instant of the stroke
 * (`LongToolStroke`) gives the tool's line, its face's facing and the trailing
 * grip in the world, the hand turned the least that lays the held tool on them;
 * the lead hand closes on the tool's line at the stroke's slide from the
 * trailing grip, palm toward it from the body's side. The trunk bows and the
 * pelvis sinks with the work point's height below the hips; the feet stay
 * planted where they entered. Both arms are laid as one course on the one tool
 * (`courseArmGoal`, `grasp`). A contact the trailing arm cannot reach from
 * where the performer stands is refused with the distance.
 *
 * Events: `ready`, per stroke `contact<k>` (and for a dig `drive<k>`,
 * `lever<k>`, `throw<k>`; for a rake `pull<k>`), and `recover`.
 *
 * Not yet: the foot that drives a shovel's blade, the thrown load as a prop,
 * stepping between rake strokes, kneeling work and the one-hand pull that frees
 * a stuck head.
 */
export namespace longTool {
  /** The action's key. */
  export const name: AutoMovieMotionHumanActionKey = "longTool";

  /** Work stops at the recovery. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["recover", 1], kind: "inertialize", entry: 0 }],
  };

  /** Plan the strokes. */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLongTool.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const cycles: number = params.count ?? 3;
    HumanBound.whole("count", cycles);
    const trail: AutoMovieHumanSide =
      params.hand ??
      (entry.holds.left === params.prop && entry.holds.right !== params.prop
        ? "left"
        : "right");
    const lead: AutoMovieHumanSide = trail === "left" ? "right" : "left";
    const yaw: number = entry.posture.yaw;
    const axes: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
      v: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, v);

    // The held tool: its face and line in the trailing hand's frame.
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
      context,
      trail,
      params.prop,
    );
    const face: IAutoMovieMotionHumanHeld.IPointResult =
      AutoMovieMotionHumanHeld.point(held, "face");
    const length: number = Vector3.length(face.point);
    const line: IAutoMovieVector3 = Vector3.scale(face.point, 1 / length);
    const align: ReturnType<typeof HumanHand.prepareAlignment> =
      HumanHand.prepareAlignment({ normal: line, forward: face.direction });

    // The body where it stands.
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([
        "hips",
        "chest",
        "leftUpperArm",
        "rightUpperArm",
      ]),
    );
    const hips: IAutoMovieVector3 = bones.get("hips")!.worldPosition;
    const shoulder: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 => bones.get(`${side}UpperArm`)!.worldPosition;
    const stroke: LongToolStroke.IStroke = LongToolStroke({
      stroke: params.stroke,
      at: params.at,
      to: params.to,
      length,
      forward: axes({ x: 0, y: 0, z: 1 }),
      leadward: axes({ x: lead === "left" ? 1 : -1, y: 0, z: 0 }),
      chest: bones.get("chest")!.worldPosition,
      hips,
      trail: shoulder(trail),
      lead: shoulder(lead),
    });
    // The shoulder to the closed hand's grip: the arm and half the hand.
    const arm: number =
      body.measure.upperArm + body.measure.forearm + body.measure.hand / 2;
    // The trunk bows toward a low work point about the hips, which brings
    // the shoulder forward and down: the contact is reached from there.
    const down: number = Math.max(
      0,
      Math.min(1, (hips.y - params.at.y) / body.measure.hipHeight),
    );
    const bowed: IAutoMovieVector3 = Vector3.add(
      hips,
      Quaternion.rotateVector(
        Quaternion.fromAxisAngle(
          Vector3.normalize(
            Vector3.cross({ x: 0, y: 1, z: 0 }, axes({ x: 0, y: 0, z: 1 })),
          ),
          BOW * down,
        ),
        Vector3.subtract(shoulder(trail), hips),
      ),
    );
    const far: number = Vector3.distance(stroke.contact, bowed);
    if (far > REACH_LIMIT * arm)
      throw new HumanRefusal({
        kind: "reach",
        axis: "at",
        value: far,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: REACH_LIMIT * arm,
          unit: "m",
        },
        reason: `the ${params.prop}'s grip at contact lies ${far.toFixed(2)} m from the trailing shoulder, beyond the ${(REACH_LIMIT * arm).toFixed(2)} m the arm reaches`,
        fix: "stand the performer nearer the work point",
      });

    const period: number = stroke.period;
    const duration: number = REACH + cycles * period + REACH;
    const share: (seconds: number) => number = (seconds: number): number =>
      seconds / duration;
    const events: IAutoMovieMotionEvent[] = [
      { name: "ready", share: share(REACH) },
    ];
    for (let k: number = 1; k <= cycles; k++)
      for (const mark of stroke.marks)
        events.push({
          name: `${mark.name}${k}`,
          share: share(REACH + (k - 1 + mark.share) * period),
        });
    events.push({ name: "recover", share: share(REACH + cycles * period) });

    // The stroke at an action second: held at its start before the first
    // and after the last stroke.
    const at: (seconds: number) => LongToolStroke.IPose = (
      seconds: number,
    ): LongToolStroke.IPose =>
      stroke.pose(
        seconds <= REACH || seconds >= REACH + cycles * period
          ? 0
          : ((seconds - REACH) / period) % 1,
      );
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Foot`,
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        }),
      ),
      {
        part: `${lead}Hand`,
        kind: "grip",
        from: share(REACH),
        to: share(REACH + cycles * period),
        support: { kind: "prop", subject: params.prop, carries: false },
      },
    ];
    const posture: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const pose: LongToolStroke.IPose = at(seconds);
      const bow: number = BOW * down * pose.reach;
      const shaped: IAutoMovieMotionHumanPosture = {
        ...entry.posture,
        root: {
          ...entry.posture.root,
          y: entry.posture.root.y - SINK * body.measure.stature * down,
        },
        pitch: entry.posture.pitch + bow,
        limbs: { ...entry.posture.limbs },
      };
      for (const side of ["left", "right"] as const)
        shaped.limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
          body,
          shaped,
          side,
          entry.feet[side],
          true,
        );
      // The trailing hand holds the tool laid on the stroke's line.
      const rotation: IAutoMovieQuaternion = align({
        normal: pose.line,
        forward: pose.facing,
      });
      const gripFrame: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
        body,
        trail,
        "grip",
      );
      shaped.limbs[`${trail}Arm`] = {
        point: Vector3.subtract(
          pose.grip,
          Quaternion.rotateVector(rotation, gripFrame.point),
        ),
        rotation,
        contact: gripFrame.point,
        bend: elbow(pose.grip, shoulder(trail), stroke.leadward),
      };
      // The lead hand closes on the line at its slide, from the body's side.
      shaped.limbs[`${lead}Arm`] = closed(
        body,
        lead,
        Vector3.add(pose.grip, Vector3.scale(pose.line, pose.slide)),
        pose.line,
        stroke.chest,
      );
      return shaped;
    };
    const plan: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts,
      posture,
    };
    return courseArmGoal({
      context,
      plan,
      side: trail,
      rest: AutoMovieMotionHumanArm.angles(entry.pose, trail),
      grasp: ["hand"],
      with: [
        {
          side: lead,
          rest: AutoMovieMotionHumanArm.angles(entry.pose, lead),
          grasp: ["hand"],
        },
      ],
      span: { start: 0, ready: REACH, relax: duration - REACH, end: duration },
    });
  }

  /**
   * A hand closed round a line at a point, the palm toward it from the chest's
   * side.
   */
  function closed(
    body: IAutoMovieMotionHumanActionContext["body"],
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
    line: IAutoMovieVector3,
    chest: IAutoMovieVector3,
  ): IAutoMovieHumanLimbGoal {
    const toward: IAutoMovieVector3 = Vector3.subtract(point, chest);
    const normal: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(toward, Vector3.scale(line, Vector3.dot(toward, line))),
    );
    const frame: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
      body,
      side,
      "grip",
    );
    const rotation: IAutoMovieQuaternion = HumanHand.align(frame, {
      normal,
      forward: line,
    });
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      point,
      Quaternion.rotateVector(rotation, frame.point),
    );
    return {
      point: wrist,
      rotation,
      contact: frame.point,
      bend: Vector3.add(
        wrist,
        Vector3.add(Vector3.scale(normal, -0.2), { x: 0, y: -0.15, z: 0 }),
      ),
    };
  }

  /**
   * The trailing elbow's hint: below the middle of the arm, out toward its own
   * side.
   */
  function elbow(
    grip: IAutoMovieVector3,
    shoulder: IAutoMovieVector3,
    leadward: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const mid: IAutoMovieVector3 = Vector3.lerp(grip, shoulder, 0.5);
    return Vector3.add(
      mid,
      Vector3.add(Vector3.scale(leadward, -0.15), {
        x: 0,
        y: -0.15,
        z: 0,
      }),
    );
  }
}
