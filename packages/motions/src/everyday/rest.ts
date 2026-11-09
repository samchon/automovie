import { type IAutoMovieResolvedBone, Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import { poseBones } from "./poseBones";

/**
 * Standing with the hands at rest places: in the front pockets, on the hips,
 * arms crossed, clasped in front or behind, behind the head, or the chin on
 * a fist, each hand moved there and held.
 *
 * Every rest place is an effector goal on the body's own surface: a hand
 * surface is laid on a region with the palm facing into it; the palm and
 * fist sockets lie on the hand's own collider surface, so a laid hand touches
 * the region rather than sinking into it ({@link HumanHand}). The places, with the surface and region each uses:
 *
 * - `side`: no goal; the arm hangs relaxed as the stand law holds it.
 * - `pocket`: the palm on the front pocket region of the same side's thigh,
 *   fingers down, as a hand slipped into a front pocket shows from outside.
 * - `hip`: the palm on the side of the pelvis midway between the hip
 *   region and the waist, fingers forward and down, elbow out (akimbo).
 * - `crossed`: each palm on the other arm's upper arm. The other arm's pose
 *   depends on its own goal, so the goals are found by two rounds of
 *   solving at the start of the action, each placing every palm on the other
 *   arm as the previous round solved it.
 * - `claspedFront`: the left palm faces the body ahead of the groin, fingers
 *   toward the right, and the right palm lies on the back of the left hand.
 * - `claspedBehind`: the same behind the lower back, palms facing back.
 * - `behindHead`: each palm on the back of the head beside the midline,
 *   elbows wide.
 * - `chinRest`: the fist under the chin, the elbow low (for a seated
 *   performer the elbow would rest on a knee or a table).
 *
 * Each hand travels from where the entry left it to its place on a
 * minimum-jerk path over `0.25 + 0.5 D` seconds for `D` metres (provisional,
 * as the gesture preparation) and holds there; the place follows the body,
 * so breathing and sway carry the hands with it. A hand at `side` is not
 * moved.
 */
export namespace rest {
  /** The action's name. */
  export const name: HumanActionName = "rest";

  /** A rest place. */
  export type Place = "side" | "pocket" | "hip" | "crossed" | "claspedFront" | "claspedBehind" | "behindHead" | "chinRest";

  /** Cancel table: holding a rest place has no stroke, so it can be cut anywhere. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    look: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    gesture: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    rest: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** Parameters. */
  export interface IParams {
    /** The left hand's place; `side` when absent. */
    left?: Place;

    /** The right hand's place; `side` when absent. */
    right?: Place;

    /** How long, seconds; 2 when absent. */
    seconds?: number;
  }

  /** Places that hold both hands together, so both hands must name them. */
  export const PAIRED: readonly Place[] = ["crossed", "claspedFront", "claspedBehind", "behindHead"];

  /**
   * Plan a rest.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When a paired place names one hand only, or the time is not positive.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const places: Record<HumanHand.Side, Place> = { left: context.params.left ?? "side", right: context.params.right ?? "side" };
    for (const place of PAIRED)
      if ((places.left === place) !== (places.right === place)) throw new Error(`${context.subject}: ${place} holds both hands; name it for both`);
    const duration: number = context.params.seconds ?? 2;
    if (!(duration > 0)) throw new Error("A rest lasts a positive time");
    const base: IHumanActionPlan = stand.plan({ ...context, params: { seconds: duration } });
    const at0: IHumanPosture = base.posture(0);
    const frame0: HumanFrame.IFrame = { origin: at0.root, yaw: at0.yaw };

    // Goals, solved once in the performer's frame and carried by the body.
    const goals: Partial<Record<HumanHand.Side, IGoal>> = rest.goals(body, at0, places);
    const entry: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, context.entry.pose);
    const begin: Partial<Record<HumanHand.Side, { point: IAutoMovieVector3; rotation: IAutoMovieQuaternion; travel: number }>> = {};
    for (const side of ["left", "right"] as const) {
      const goal: IGoal | undefined = goals[side];
      if (goal === undefined) continue;
      const from: IAutoMovieVector3 = HumanHand.frame(body, entry, side, goal.surface).point;
      begin[side] = {
        point: HumanFrame.local(frame0, from),
        rotation: Quaternion.multiply(HumanFrame.turn(-frame0.yaw), entry.get(`${side}Hand`)!.worldRotation),
        travel: Math.min(duration, 0.25 + 0.5 * Vector3.length(Vector3.subtract(from, goal.point))),
      };
    }
    const local: Partial<Record<HumanHand.Side, IGoal>> = {};
    for (const side of ["left", "right"] as const) {
      const goal: IGoal | undefined = goals[side];
      if (goal !== undefined) local[side] = { ...goal, point: HumanFrame.local(frame0, goal.point), rotation: Quaternion.multiply(HumanFrame.turn(-frame0.yaw), goal.rotation) };
    }
    const arrive: number = Math.max(0, ...Object.values(begin).map((b) => b!.travel));

    return {
      duration,
      events: [{ name: "placed", share: arrive / duration }],
      contacts: base.contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IHumanPosture = base.posture(t);
        const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
        const turn: IAutoMovieQuaternion = HumanFrame.turn(frame.yaw);
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        for (const side of ["left", "right"] as const) {
          const goal: IGoal | undefined = local[side];
          const from = begin[side];
          if (goal === undefined || from === undefined) continue;
          const s: number = minimumJerk(t / from.travel).s;
          const point: IAutoMovieVector3 = HumanFrame.point(frame, Vector3.lerp(from.point, goal.point, s));
          const rotation: IAutoMovieQuaternion = Quaternion.multiply(turn, Quaternion.slerp(from.rotation, goal.rotation, s));
          const wrist: HumanHand.IWrist = HumanHand.place(body, side, goal.surface, point, rotation, goal.shape);
          limbs[side === "left" ? "leftArm" : "rightArm"] = { point: wrist.point, rotation: wrist.rotation, bend: HumanHand.elbow(body, posture, side, goal.out) };
          Object.assign(joints, HumanHand.shape(side, goal.shape));
        }
        return { ...posture, joints, limbs };
      },
    };
  }

  /** A hand's rest goal in world metres. */
  export interface IGoal {
    /** The surface laid on the place. */
    surface: HumanHand.Surface;

    /** The hand shape. */
    shape: HumanHand.Shape;

    /** Where the surface goes, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from rest. */
    rotation: IAutoMovieQuaternion;

    /** Extra outward elbow share. */
    out: number;
  }

  /**
   * Both hands' rest goals on a posture.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param places Each hand's place.
   * @returns The goals of the hands that move.
   */
  export function goals(body: IHumanBody, posture: IHumanPosture, places: Record<HumanHand.Side, Place>): Partial<Record<HumanHand.Side, IGoal>> {
    const out: Partial<Record<HumanHand.Side, IGoal>> = {};
    const region = (name: AutoMovieHumanoidRegion): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => HumanTrunk.region(body, posture, name);
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
    const dir = (x: number, y: number, z: number): IAutoMovieVector3 => HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw }, { x, y, z });
    const lay = (side: HumanHand.Side, surface: HumanHand.Surface, shape: HumanHand.Shape, at: { point: IAutoMovieVector3; normal: IAutoMovieVector3 }, fingers: IAutoMovieVector3, wide: number): IGoal => ({
      surface,
      shape,
      point: at.point,
      rotation: HumanHand.rotation(side, { fingers, palm: Vector3.scale(at.normal, -1) }),
      out: wide,
    });
    for (const side of ["left", "right"] as const) {
      const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
      const sign: number = side === "left" ? 1 : -1;
      switch (places[side]) {
        case "side":
          break;
        case "pocket":
          out[side] = lay(side, "palm", "relaxed", region(`pocketFront${Side}`), dir(0.2 * sign, -1, 0.3), 0.1);
          break;
        case "hip": {
          const hip = region(`hip${Side}`);
          const up: number = 0.5 * (body.measure.waistHeight - body.measure.hipHeight);
          out[side] = lay(side, "palm", "flat", { point: Vector3.add(hip.point, { x: 0, y: up, z: 0 }), normal: hip.normal }, dir(0, -0.6, 0.8), 0.7);
          break;
        }
        case "claspedFront":
        case "claspedBehind": {
          if (side === "right") break;
          const front: boolean = places[side] === "claspedFront";
          const groin = region(front ? "groin" : "lowerBack");
          const ahead: IAutoMovieVector3 = dir(0, 0, front ? 1 : -1);
          const centre: IAutoMovieVector3 = Vector3.add({ ...groin.point, y: groin.point.y + 0.03 * body.measure.stature }, Vector3.scale(ahead, 0.04 * body.measure.stature));
          const left: IGoal = lay("left", "palm", "relaxed", { point: centre, normal: ahead }, dir(-1, -0.3, 0), 0.1);
          out.left = left;
          const wrist: HumanHand.IWrist = HumanHand.place(body, "left", "palm", left.point, left.rotation, "relaxed");
          const back = HumanHand.offset(body, "left", "handBack");
          const top = { point: Vector3.add(wrist.point, Quaternion.rotateVector(wrist.rotation, back.point)), normal: Quaternion.rotateVector(wrist.rotation, back.normal) };
          out.right = lay("right", "palm", "relaxed", top, dir(1, -0.3, 0), 0.1);
          break;
        }
        case "behindHead": {
          const head = region("headBack");
          const beside: IAutoMovieVector3 = Vector3.add(head.point, Vector3.scale(dir(1, 0, 0), sign * 0.25 * body.measure.headRadius));
          out[side] = lay(side, "palm", "flat", { point: beside, normal: head.normal }, dir(-sign, 0.6, 0), 1.0);
          break;
        }
        case "chinRest": {
          const chin = region("chin");
          out[side] = { surface: "fist", shape: "fist", point: chin.point, rotation: HumanHand.rotation(side, { fingers: dir(-sign, 0.3, 0), palm: dir(0, 0, -1) }), out: -0.2 };
          break;
        }
        case "crossed":
          break;
      }
    }
    if (places.left === "crossed") Object.assign(out, crossed(body, posture));
    return out;
  }
}

/** The two rounds of the crossed-arms goals: each palm on the other upper arm as last solved. */
function crossed(body: IHumanBody, posture: IHumanPosture): Record<HumanHand.Side, rest.IGoal> {
  let solved: IHumanPosture = posture;
  let goals: Record<HumanHand.Side, rest.IGoal> | undefined;
  for (let round: number = 0; round < 2; round++) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, resolveHumanPosture(body, solved));
    const on = (side: HumanHand.Side): rest.IGoal => {
      const other: "Left" | "Right" = side === "left" ? "Right" : "Left";
      const frame = body.surfaces.regions[`upperArm${other}` as AutoMovieHumanoidRegion];
      const bone: IAutoMovieResolvedBone = bones.get(frame.bone)!;
      const point: IAutoMovieVector3 = Vector3.add(bone.worldPosition, Quaternion.rotateVector(bone.worldRotation, frame.point));

      // The palm wraps the outside of the other arm: its normal points from the arm's axis to the arm's outer side.
      const axis: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(bones.get(`${other === "Left" ? "left" : "right"}LowerArm`)!.worldPosition, bone.worldPosition));
      const lateral: IAutoMovieVector3 = HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, { x: other === "Left" ? 1 : -1, y: 0, z: 0.3 });
      const normal: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(lateral, Vector3.scale(axis, Vector3.dot(lateral, axis))));
      const surfacePoint: IAutoMovieVector3 = Vector3.add(Vector3.add(bone.worldPosition, Vector3.scale(axis, Vector3.dot(Vector3.subtract(point, bone.worldPosition), axis))), Vector3.scale(normal, body.measure.upperArmRadius));
      return {
        surface: "palm",
        shape: "relaxed",
        point: surfacePoint,
        rotation: HumanHand.rotation(side, { fingers: Vector3.scale(axis, -1), palm: Vector3.scale(normal, -1) }),
        out: 0,
      };
    };
    goals = { left: on("left"), right: on("right") };
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const) {
      const wrist: HumanHand.IWrist = HumanHand.place(body, side, "palm", goals[side].point, goals[side].rotation, "relaxed");
      limbs[side === "left" ? "leftArm" : "rightArm"] = { point: wrist.point, rotation: wrist.rotation, bend: HumanHand.elbow(body, posture, side) };
    }
    solved = { ...posture, limbs };
  }
  return goals!;
}

