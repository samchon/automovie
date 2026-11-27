import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCollapse,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFirefight,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { collapse } from "./collapse";
import { stopDropRollTimeline } from "./stopDropRollTimeline";

/**
 * Stop, drop and roll (`IAutoMovieMotionHumanFirefight.IStopDropRoll`): the
 * NFPA's steps to safety for burning clothes (NFPA, Steps to Safety,
 * https://www.saskatoon.ca/sites/default/files/STEPSTOSAFETY__1-pager_FIRES.pdf):
 * stop, drop gently, cover the face with the hands, and roll back and forth.
 *
 * The drop is the protective forward collapse (`collapse`) into the prone lie,
 * the hands brought over the face as the body goes down. The rolls then turn
 * the lying body about its long axis, a half turn onto one side and back,
 * alternating sides, each on a half sine. The body is a lying cross-section
 * half as deep as the chest and as wide as the shoulders: its long axis rides
 * at the height that cross-section rests at when turned, and travels sideways
 * by the arc it rolls, so the body rolls on the floor rather than about a fixed
 * line. The hands stay on the face, carried by the head, throughout.
 */
export namespace stopDropRoll {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "stopDropRoll";

  /** Cancel table: none; the drill rolls to its end. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** How long the body stands stopped before it drops, seconds: authored. */
  export const STOP: number = stopDropRollTimeline.STOP;

  /** How long one roll onto a side and back takes, seconds: authored. */
  export const ROLL: number = stopDropRollTimeline.ROLL;

  /** How far each roll turns the body, degrees: onto its side. */
  export const TURN: number = 90;

  /** How long the hands take to come over the face, seconds: authored. */
  export const COVER: number = 0.4;

  /**
   * Plan stop, drop and roll.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `rolls` when not a positive whole number.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IStopDropRoll>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;

    // The drop: the protective forward collapse into the prone lie.
    const params: IAutoMovieMotionHumanCollapse.IParams = {
      direction: "forward",
      tone: "protective",
      hold: 0,
    };
    const drop: IAutoMovieMotionHumanActionPlan = collapse.plan({
      ...context,
      params,
    });
    const down: number = drop.duration;
    const timeline: stopDropRollTimeline.ITimeline = stopDropRollTimeline(
      context.params.rolls,
      down,
    );
    const rolls: number = timeline.rolls;
    const duration: number = timeline.duration;
    const lying: IAutoMovieMotionHumanPosture = drop.posture(down);

    // The lying cross-section and the side the body rolls toward.
    const deep: number = body.measure.chestDepth / 2;
    const wide: number = body.measure.shoulderHalfWidth;
    const heading: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      lying.yaw,
    );
    const along: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
      x: 0,
      y: 0,
      z: 1,
    });
    const right: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
      x: -1,
      y: 0,
      z: 0,
    });
    const rest: (theta: number) => number = (theta: number): number =>
      Math.sqrt(
        deep * deep * Math.cos(theta) ** 2 + wide * wide * Math.sin(theta) ** 2,
      );

    // Each roll onto a side and back, the sides alternating.
    const angle: (seconds: number) => number = (seconds: number): number => {
      const into: number = seconds - STOP - down;
      if (into <= 0) return 0;
      const k: number = Math.min(rolls - 1, Math.floor(into / ROLL));
      const u: number = Math.min(1, (into - k * ROLL) / ROLL);
      return (k % 2 === 0 ? 1 : -1) * TURN * Math.sin(Math.PI * u);
    };
    const rolled: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const degrees: number = angle(seconds);
      const theta: number = (degrees * Math.PI) / 180;
      // The long axis rises to the turned cross-section's rest and travels
      // sideways by the arc the body rolls along the floor.
      const lift: number = rest(theta) - deep;
      const arc: number = theta * ((deep + wide) / 2);
      const moved: IAutoMovieVector3 = Vector3.add(
        { x: 0, y: lift, z: 0 },
        Vector3.scale(right, arc),
      );
      return {
        ...lying,
        root: Vector3.add(lying.root, moved),
        // The turn about the body's long axis, a line along the heading
        // through the lying cross-section's centre, which the roll has
        // carried up and sideways with the root: the turn is about where
        // the axis now lies, so the root keeps its place on it (a pivot
        // left behind would swing the body about a line it no longer lies
        // on, down through the floor).
        rotation: {
          about: Vector3.add(
            { x: lying.root.x, y: deep, z: lying.root.z },
            moved,
          ),
          turn: Quaternion.fromAxisAngle(along, degrees),
        },
      };
    };

    // The hands over the face, carried by the head: each arm moves in the
    // head's frame from where it hung at the entry to the face, so its goal
    // never mixes two frames.
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([
        "head",
        "leftHand",
        "rightHand",
        "leftLowerArm",
        "rightLowerArm",
      ]),
    );
    const head: IAutoMovieResolvedBone = bones.get("head")!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      head.worldRotation,
    );
    const local: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(bones.get(bone)!.worldPosition, head.worldPosition),
      );
    const hung: Readonly<Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal>> =
      {
        left: {
          point: local("leftHand"),
          bend: local("leftLowerArm"),
          on: "head",
        },
        right: {
          point: local("rightHand"),
          bend: local("rightLowerArm"),
          on: "head",
        },
      };
    const cover: (
      posture: IAutoMovieMotionHumanPosture,
      weight: number,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      weight: number,
    ): IAutoMovieMotionHumanPosture => {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      const w: number = AutoMovieEngineMotionSampling.minimumJerkShare(weight);
      for (const side of ["left", "right"] as const) {
        const to: IAutoMovieHumanLimbGoal = face(body, side);
        limbs[`${side}Arm`] = {
          point: Vector3.lerp(hung[side].point, to.point, w),
          bend: Vector3.lerp(hung[side].bend, to.bend, w),
          on: "head",
        };
      }
      return { ...posture, limbs };
    };
    const events: IAutoMovieMotionEvent[] = timeline.events;

    return {
      duration,
      events,
      // The drop's contacts on the drop's clock; a foot still planted when
      // the body lies down bears on the floor through the rolls, dragged
      // with the rolling body, rather than staying planted.
      contacts: drop.contacts.flatMap(
        (
          c: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow[] => {
          const from: number = (STOP + c.from * down) / duration;
          const lain: number = (STOP + down) / duration;
          const foot: boolean = c.part === "leftFoot" || c.part === "rightFoot";
          if (c.to < 1)
            return [{ ...c, from, to: (STOP + c.to * down) / duration }];
          if (!foot || c.kind !== "plant") return [{ ...c, from, to: 1 }];
          return [
            { ...c, from, to: lain },
            { ...c, kind: "bear", from: lain, to: 1 },
          ];
        },
      ),
      physicalWindow: null,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const covered: number = Math.min(1, Math.max(0, (t - STOP) / COVER));
        if (t <= STOP) return context.entry.posture;
        if (t <= STOP + down) return cover(drop.posture(t - STOP), covered);
        return cover(rolled(t), 1);
      },
    };
  }
}

/**
 * A hand over the face, in the head's frame: the wrist below the cheek and the
 * elbow tucked in front of the chest, below the chin, so a roll onto the side
 * lies on the arm's flank rather than its point; the hand's attitude left to
 * the fit.
 */
function face(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): IAutoMovieHumanLimbGoal {
  const out: number = side === "left" ? 1 : -1;
  const head: number = body.measure.headRadius;
  return {
    point: { x: out * 0.6 * head, y: -1.1 * head, z: 1.1 * head },
    bend: { x: out * 1.2 * head, y: -3 * head, z: 2.5 * head },
    on: "head",
  };
}
