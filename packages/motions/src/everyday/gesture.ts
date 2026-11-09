import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMovieMotionTarget, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

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
import { HumanBalance } from "./HumanBalance";
import { HumanEffort } from "./HumanEffort";
import { gestureStroke } from "./gestureStroke";
import { poseBones } from "./poseBones";

/**
 * A communicative gesture while standing: the hand, head or trunk moves
 * through Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind):
 * preparation from rest to the stroke's start, the stroke that carries the
 * meaning, an optional post-stroke hold, and retraction to rest.
 *
 * The feet stay planted and the body stands as the stand law places it.
 * Each moving hand is an effector goal ({@link gestureStroke}): in the
 * preparation its surface travels from where the entry left it to the
 * stroke's first goal on a minimum-jerk path while the hand turns by
 * spherical interpolation and the fingers take the gesture's shape; in the
 * stroke it follows the stroke's goals; in the retraction it returns to
 * where the relaxed hanging arm holds it. The arm is solved by inverse
 * kinematics with a natural elbow hint widened by the gesture and the
 * Effort. Head, shoulder and trunk gestures add their joint angles under an
 * envelope that rises in the preparation and falls in the retraction; a bow
 * pitches the whole trunk about the hips by its depth (15, 30 or 45 degrees
 * are the conventional light, ordinary and deep bows) while the hips move
 * back to keep the body balanced over the feet ({@link HumanBalance}).
 *
 * Transport time follows the distance moved, `0.25 + 0.5 D` seconds for `D`
 * metres (provisional; a gesture's preparation lasts a few tenths of a
 * second, and reaching time grows with distance as Fitts 1954 describes),
 * 0.3 s for head and shoulder gestures and one second per 30 degrees of a
 * bow (provisional). The Effort's tempo scales every phase, its extent the
 * gesture's size and its elbow term the arm's width ({@link HumanEffort}).
 *
 * Events: `prepare`, `strokeStart`, `strokeEnd`, `retract`. A gesture may be
 * cut into another during its retraction, making a gesture unit, and into
 * standing or moving before its stroke or after it; its stroke is never cut,
 * since a cut stroke loses the gesture's meaning.
 */
export namespace gesture {
  /** The action's name. */
  export const name: HumanActionName = "gesture";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: [0, "strokeStart"], kind: "inertialize", entry: 0 },
      { window: ["strokeEnd", 1], kind: "inertialize", entry: 0 },
    ],
    walk: [
      { window: [0, "strokeStart"], kind: "inertialize", entry: 0, blend: 0.3 },
      { window: ["strokeEnd", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    look: [{ window: ["strokeEnd", 1], kind: "inertialize", entry: 0 }],
    gesture: [{ window: ["retract", 1], kind: "inertialize", entry: 0 }],
  };

  /** Parameters. */
  export interface IParams {
    /** The gesture. */
    kind: gestureStroke.Kind;

    /** The hand of a one-hand gesture; `right` when absent. */
    side?: HumanHand.Side;

    /** What to point at; required by `point`. */
    target?: AutoMovieMotionTarget;

    /** The face region a `touchFace` reaches; `forehead` when absent. */
    region?: gestureStroke.FaceRegion;

    /** Stroke repetitions (waves, nods, claps); the gesture's own count when absent. */
    count?: number;

    /** Post-stroke hold, seconds; 0 when absent. */
    hold?: number;

    /** A bow's depth, degrees in (0, 60]; 30 when absent. */
    depth?: number;

    /** Movement quality. */
    effort?: HumanEffort.IEffort;
  }

  /**
   * Plan a gesture.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} On a missing pointing target, a non-positive count or hold, or a bow outside (0, 60] degrees.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const p: IParams = context.params;
    const body: IHumanBody = context.body;
    const mods: HumanEffort.IModifiers = HumanEffort.modifiers(p.effort);
    const rhythm = gestureStroke.RHYTHM[p.kind];
    const cycles: number = p.count ?? rhythm.cycles;
    if (!(Number.isInteger(cycles) && cycles > 0)) throw new Error("A gesture's count is a positive whole number");
    const hold: number = p.hold ?? 0;
    if (!(hold >= 0)) throw new Error("A gesture's hold is not negative");
    const depth: number = p.depth ?? 30;
    if (p.kind === "bow" && !(depth > 0 && depth <= 60)) throw new Error("A bow's depth lies in (0, 60] degrees");
    if (p.kind === "point" && p.target === undefined) throw new Error("Pointing needs a target");

    const sides: HumanHand.Side[] = ((): HumanHand.Side[] => {
      const which = gestureStroke.HANDS[p.kind];
      return which === "both" ? ["left", "right"] : which === "one" ? [p.side ?? "right"] : [];
    })();
    const target = (seconds: number): IAutoMovieVector3 | undefined =>
      p.target === undefined ? undefined : context.aim(p.target, context.start + seconds).point;
    const input = (base: IHumanPosture, seconds: number, side: HumanHand.Side): gestureStroke.IInput => ({
      body,
      base,
      side,
      region: p.region ?? "forehead",
      extent: mods.extent,
      ...(target(seconds) === undefined ? {} : { target: target(seconds)! }),
    });

    // Where each hand starts (the entry) and rests (the relaxed hanging arm), in the performer's frame.
    const probe: IHumanActionPlan = stand.plan({ ...context, params: { seconds: 1 } });
    const at0: IHumanPosture = probe.posture(0);
    const frame0: HumanFrame.IFrame = { origin: at0.root, yaw: at0.yaw };
    const entryBones = poseBones(body, context.entry.pose);
    const restBones = poseBones(body, resolveHumanPosture(body, at0));
    const begin: Partial<Record<HumanHand.Side, ILocal>> = {};
    const rest: Partial<Record<HumanHand.Side, ILocal>> = {};
    let transport: number = 0;
    for (const side of sides) {
      const goal: gestureStroke.IHand = gestureStroke.hand(p.kind, side, 0, cycles, input(at0, 0, side));
      begin[side] = local(frame0, HumanHand.frame(body, entryBones, side, goal.surface, "relaxed").point, entryBones.get(`${side}Hand`)!.worldRotation);
      rest[side] = local(frame0, HumanHand.frame(body, restBones, side, goal.surface, "relaxed").point, restBones.get(`${side}Hand`)!.worldRotation);
      transport = Math.max(transport, Vector3.length(Vector3.subtract(goal.point, HumanFrame.point(frame0, begin[side]!.point))));
    }

    const T: number = mods.tempo;
    const prepare: number = T * (p.kind === "bow" ? depth / 30 : sides.length === 0 ? 0.3 : 0.25 + 0.5 * transport);
    const retract: number = prepare;
    const stroke: number = T * cycles * rhythm.period;
    const strokeEnd: number = prepare + stroke;
    const retractAt: number = strokeEnd + hold;
    const duration: number = retractAt + retract;
    const base: IHumanActionPlan = stand.plan({ ...context, params: { seconds: duration } });

    return {
      duration,
      events: [
        { name: "prepare", share: 0 },
        { name: "strokeStart", share: prepare / duration },
        { name: "strokeEnd", share: strokeEnd / duration },
        { name: "retract", share: retractAt / duration },
      ],
      contacts: base.contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const envelope: number = t < prepare ? minimumJerk(t / prepare).s : t <= retractAt ? 1 : 1 - minimumJerk((t - retractAt) / retract).s;
        const u: number = Math.min(1, Math.max(0, (t - prepare) / stroke));
        let posture: IHumanPosture = base.posture(t);
        if (p.kind === "bow") posture = bow(body, posture, depth * mods.extent * envelope);

        // Head, shoulder and trunk angles, added to what the stand holds.
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        for (const [bone, add] of Object.entries(gestureStroke.joints(p.kind, u, cycles, envelope, mods.extent)) as [AutoMovieHumanoidBone, readonly [number, number, number]][]) {
          const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
          joints[bone] = [was[0] + add[0], was[1] + add[1], was[2] + add[2]];
        }

        // Hands: transported to the stroke, through it, and back to rest.
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
        for (const side of sides) {
          const goal: gestureStroke.IHand = gestureStroke.hand(p.kind, side, u, cycles, input(posture, t, side));
          let point: IAutoMovieVector3 = goal.point;
          let rotation: IAutoMovieQuaternion = goal.rotation;
          const from: ILocal | undefined = t < prepare ? begin[side] : t > retractAt ? rest[side] : undefined;
          if (from !== undefined) {
            const s: number = t < prepare ? minimumJerk(t / prepare).s : 1 - minimumJerk((t - retractAt) / retract).s;
            point = Vector3.lerp(HumanFrame.point(frame, from.point), goal.point, s);
            rotation = Quaternion.slerp(Quaternion.multiply(HumanFrame.turn(frame.yaw), from.rotation), goal.rotation, s);
          }
          const wrist: HumanHand.IWrist = HumanHand.place(body, side, goal.surface, point, rotation, goal.shape);
          limbs[side === "left" ? "leftArm" : "rightArm"] = {
            point: wrist.point,
            rotation: wrist.rotation,
            bend: HumanHand.elbow(body, posture, side, goal.out + mods.elbow),
          };
          const shape = HumanHand.shape(side, goal.shape);
          const relaxed = HumanHand.shape(side, "relaxed");
          for (const bone of Object.keys(shape) as AutoMovieHumanoidBone[]) {
            const a: readonly [number, number, number] = shape[bone]!;
            const r: readonly [number, number, number] = relaxed[bone]!;
            const curl: number = bone.includes("Thumb") ? 0 : (goal.curl ?? 0);
            joints[bone] = [r[0] + (a[0] + curl - r[0]) * envelope, 0, 0];
          }
        }
        return { ...posture, joints, limbs };
      },
    };
  }

  /**
   * A standing posture bowed by a trunk pitch: the whole body above the feet
   * tips about the hips, the hips move back by the balance shift, and the
   * planted legs are re-solved by their unchanged goals.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param pitch Forward pitch, degrees.
   * @returns The bowed posture.
   */
  export function bow(body: IHumanBody, posture: IHumanPosture, pitch: number): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
    const target: IAutoMovieVector3 = HumanFrame.point(frame, { x: hips.x, y: hips.y, z: hips.z - HumanBalance.hipShift(body.measure, pitch) });
    const tipped: IHumanPosture = { ...posture, pitch: posture.pitch + pitch };
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(resolveHumanPosture.heading(tipped), hips);
    return { ...tipped, root: Vector3.subtract(target, offset) };
  }
}

/** A hand's surface point and rotation in the performer's frame. */
interface ILocal {
  /** Point, performer frame. */
  point: IAutoMovieVector3;

  /** Hand rotation relative to the heading. */
  rotation: IAutoMovieQuaternion;
}

/** A world surface point and hand rotation in a performer frame. */
function local(frame: HumanFrame.IFrame, point: IAutoMovieVector3, rotation: IAutoMovieQuaternion): ILocal {
  return { point: HumanFrame.local(frame, point), rotation: Quaternion.multiply(HumanFrame.turn(-frame.yaw), rotation) };
}
