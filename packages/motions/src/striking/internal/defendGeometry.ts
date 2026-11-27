import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDefend,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { StrikingBody } from "../StrikingBody";
import { StrikingGuardBones } from "../StrikingGuardBones";
import { StrikingQuality } from "../StrikingQuality";
import { StrikingStance } from "../StrikingStance";
import { StrikingTarget } from "../StrikingTarget";
import type { defendFootwork } from "./defendFootwork";
import { defendGoals } from "./defendGoals";

/** The alternatives of `WindowsTiming`'s site. */
type WindowsTiming = "begin" | "duration";

/**
 * A built defence: what the defender sees at its read second turned into a
 * posture per second.
 *
 * The defender sees the attacker's moving limb (the hand, foot or shin whose
 * velocity over the last 1/24 s points most toward the struck region) and the
 * line from it to the region on its own body. Whole-body evasions move the head
 * off that line through the trunk's lean and the root's dip and shift: a `slip`
 * leans the head 0.7 of the clearance (the head's radius, the fist's and a 4 cm
 * margin) outside the weapon and shifts the root 0.3 of it, 2 % of stature
 * down; a `roll` drops the root two head radii with a 15 degree forward lean; a
 * `sway` leans back until the head clears. The arms and the checking leg go to
 * goals on the defender's own body ({@link defendGoals}), reached from the guard
 * with the movement's minimum-jerk share and left again over the recovery. A
 * check stands over the supporting foot, the root moved 0.6 of the way to its
 * ankle. The shares are provisional.
 */
export namespace defendGeometry {
  /**
   * How far into its movement a defence is at a second: in on a minimum-jerk
   * share over the movement from the start, out over the recovery from the
   * hold.
   *
   * @param timing The defence's start, movement, hold and recovery, seconds.
   * @param seconds The defence's seconds.
   * @returns 0 to 1.
   */
  export function weight(
    timing: Pick<ITiming, "begin" | "movement" | "hold" | "recovery">,
    seconds: number,
  ): number {
    return (
      minimumJerk.share((seconds - timing.begin) / timing.movement) -
      minimumJerk.share((seconds - timing.hold) / timing.recovery)
    );
  }

  /**
   * The trunk's tilt that carries the head a lateral distance: its arcsine over
   * the trunk's length.
   *
   * @param lateral The head's displacement, metres.
   * @param trunk The trunk's length, eyes to hips, metres.
   * @returns Degrees.
   * @throws {Error} When the displacement reaches the trunk's length.
   */
  export function tilt(lateral: number, trunk: number): number {
    if (!(lateral < trunk))
      throw new Error(
        `A defence's head displacement of ${lateral.toFixed(3)} m exceeds the trunk's ${trunk.toFixed(3)} m`,
      );
    return (Math.asin(lateral / trunk) * 180) / Math.PI;
  }

  /** A defence's timing, seconds from its start unless stated. */
  export interface ITiming {
    /** The struck region. */
    region: AutoMovieHumanoidRegion;

    /** The strike. */
    attack: IAutoMovieMotionHumanPlacedAction;

    /** The movement's start. */
    begin: number;

    /** The movement's duration. */
    movement: number;

    /** When the return starts. */
    hold: number;

    /** The return's duration. */
    recovery: number;

    /** The whole defence. */
    duration: number;

    /** Film second the defender reads the strike. */
    read: number;
  }

  /** A built defence. */
  export interface IGeometry {
    /**
     * The complete posture at action-relative seconds, borrowing only this
     * synchronous body's optional FK/ROM sources.
     */
    posture: IAutoMovieMotionHumanActionPlan["posture"];

    /** The feet's contact windows. */
    contacts: IAutoMovieMotionHumanContactWindow[];
  }

  /**
   * Build a defence's geometry from what the defender sees at its read second.
   *
   * @param context The action's context.
   * @param timing The defence's timing.
   * @param footwork Any pending touchdown inherited by this defence.
   * @returns The geometry.
   */
  export function build(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDefend.IParams>,
    timing: ITiming,
    footwork?: defendFootwork.ISupport,
  ): IGeometry {
    const p: IAutoMovieMotionHumanDefend.IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...entry.joints,
      ...StrikingStance.joints(entry.joints),
    };
    const lead: AutoMovieHumanSide = StrikingTarget.lead(context.entry);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = StrikingTarget.feet(context.entry);

    // What the defender sees: the attacker's limb moving most toward the
    // struck region, and the line from it to the region.
    const own = StrikingBody.trunk(
      body,
      entry,
      undefined,
      new Set<AutoMovieHumanoidBone>([
        body.surfaces.regions[timing.region].bone,
      ]),
    );
    // The point within the region is the strike's own, so the defence goes
    // where the strike is aimed.
    const aimed = timing.attack.plan.aimed;
    const frame: IAutoMovieHumanoidSurfaces.IFrame = StrikingBody.frame(
      body,
      timing.region,
      aimed,
    );
    const regionAt: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
      resolveAutoMovieHumanoidSurfaces.place(frame, own.get(frame.bone)!);
    const attacker: IAutoMovieMotionHumanPerformerReader = context.performer(
      timing.attack.subject,
    );

    const limbs: AutoMovieHumanoidBone[] =
      timing.attack.family === "punch"
        ? ["leftHand", "rightHand"]
        : timing.attack.family === "kick"
          ? ["leftFoot", "rightFoot"]
          : ["leftLowerLeg", "rightLowerLeg"];
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(limbs);
    const now: ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]> =
      attacker.bones(timing.read, requested);
    const before: ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]> =
      attacker.bones(timing.read - 1 / 24, requested);
    let weapon: IAutoMovieVector3 = now.get(limbs[0]!)!.worldPosition;
    let best: number = -Infinity;
    for (const bone of limbs) {
      const at: IAutoMovieVector3 = now.get(bone)!.worldPosition;
      const velocity: IAutoMovieVector3 = Vector3.subtract(
        at,
        before.get(bone)!.worldPosition,
      );
      const toward: number = Vector3.dot(
        velocity,
        Vector3.normalize(Vector3.subtract(regionAt.point, at)),
      );
      if (toward > best) {
        best = toward;
        weapon = at;
      }
    }
    const incoming: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(regionAt.point, weapon),
    );
    const across: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(up, incoming),
    );
    const outside: number =
      Vector3.dot(Vector3.subtract(weapon, regionAt.point), across) > 0
        ? -1
        : 1;
    const attackedSide: AutoMovieHumanSide = attacked(timing.region, lead);
    const sight: defendGoals.ISight = {
      incoming,
      across,
      outside,
      attackedSide,
    };
    const fist: number = StrikingQuality.fist(m.hand);

    // The movement's share in, and out again after the strike has passed.
    const w = (t: number): number => defendGeometry.weight(timing, t);

    // Whole-body evasions: the head's displacement in the trunk's lean and
    // the root's dip and shift.
    const trunkLength: number = m.eyeHeight - m.hipHeight;
    const clear: number = m.headRadius + fist + 0.04;
    // The lean that moves the eyes `lateral` off the hips' vertical; a
    // displacement past the trunk's own length is no lean at all.
    const tilt = (lateral: number): number =>
      defendGeometry.tilt(lateral, trunkLength);
    let shift: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let roll: number = 0;
    let pitch: number = 0;
    if (p.kind === "slip") {
      shift = Vector3.add(Vector3.scale(across, outside * 0.3 * clear), {
        x: 0,
        y: -0.02 * m.stature,
        z: 0,
      });
      roll =
        sideRoll(entry.yaw, Vector3.scale(across, outside)) * tilt(0.7 * clear);
    } else if (p.kind === "roll") {
      shift = Vector3.add(Vector3.scale(across, outside * 0.3 * clear), {
        x: 0,
        y: -2 * m.headRadius,
        z: 0,
      });
      pitch = 15;
      roll =
        sideRoll(entry.yaw, Vector3.scale(across, outside)) * tilt(0.5 * clear);
    } else if (p.kind === "sway") {
      shift = Vector3.scale(
        { x: incoming.x, y: 0, z: incoming.z },
        0.3 * clear,
      );
      pitch = -tilt(0.7 * clear * 1.5);
    }

    // The stance legs, with the checking leg's foot leaving the floor.
    const checking: AutoMovieHumanSide | undefined =
      p.kind === "check" ? attackedSide : undefined;
    const support: IAutoMovieVector3 | undefined =
      checking === undefined
        ? undefined
        : feet[checking === "left" ? "right" : "left"].ankle;
    const over: IAutoMovieVector3 =
      support === undefined
        ? { x: 0, y: 0, z: 0 }
        : Vector3.scale(
            { x: support.x - entry.root.x, y: 0, z: support.z - entry.root.z },
            0.6,
          );
    const movement: IAutoMovieVector3 = Vector3.add(shift, over);
    const shownBones: Set<AutoMovieHumanoidBone> = new Set(
      StrikingGuardBones(body),
    );
    shownBones.add(frame.bone);

    if (p.kind === "highBlock")
      shownBones.add(
        body.surfaces.regions[
          attackedSide === "left" ? "templeLeft" : "templeRight"
        ].bone,
      );
    if (p.kind === "check") shownBones.add(`${attackedSide}UpperLeg`);
    const trunk: ReturnType<typeof StrikingBody.prepareTrunk> =
      StrikingBody.prepareTrunk(body, shownBones);
    const legs: ReturnType<typeof StrikingStance.prepareLegs> =
      StrikingStance.prepareLegs(body, feet, {
        left: checking !== "left",
        right: checking !== "right",
      });
    const base: (k: number, seconds: number) => IAutoMovieMotionHumanPosture = (
      k: number,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      return {
        root: Vector3.add(entry.root, Vector3.scale(movement, k)),
        yaw: entry.yaw,
        pitch: entry.pitch + pitch * k,
        roll: entry.roll + roll * k,
        joints: { ...joints },
        limbs: footwork?.legs(seconds) ?? legs(),
      };
    };
    return {
      contacts: windows(checking, timing, footwork),
      posture: (
        t: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const k: number = w(t);
        const posture: IAutoMovieMotionHumanPosture = base(k, t);
        const bones: ReturnType<typeof StrikingBody.trunk> = trunk(
          posture,
          resolution,
          projection,
        );
        const guard: ReturnType<typeof StrikingStance.guard> =
          StrikingStance.guard(body, posture, { lead }, {}, bones);

        // Arms and the checking leg as goals on the defender's own body.
        const target: Partial<IAutoMovieMotionHumanPosture["limbs"]> =
          defendGoals.at({
            body,
            posture,
            kind: p.kind,
            region: timing.region,
            aimed,
            sight,
            bones,
            frame,
          });
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
          ...guard,
        };
        for (const limb of [
          "leftArm",
          "rightArm",
          "leftLeg",
          "rightLeg",
        ] as const) {
          const goal: IAutoMovieHumanLimbGoal | undefined = target[limb];
          const from: IAutoMovieHumanLimbGoal | undefined = limbs[limb];
          if (goal === undefined || from === undefined) continue;
          const share: number =
            limb.endsWith("Leg") &&
            footwork !== undefined &&
            footwork.release > timing.begin
              ? minimumJerk.share(
                  (t - footwork.release) /
                    (timing.begin + timing.movement - footwork.release),
                ) - minimumJerk.share((t - timing.hold) / timing.recovery)
              : k;
          limbs[limb] = {
            point: Vector3.lerp(from.point, goal.point, share),
            bend: Vector3.lerp(from.bend, goal.bend, share),
            ...(from.rotation !== undefined && goal.rotation !== undefined
              ? {
                  rotation: Quaternion.slerp(
                    from.rotation,
                    goal.rotation,
                    share,
                  ),
                }
              : {}),
            ...(share <= 1e-9 && from.planted === true
              ? {
                  planted: true,
                  ...(from.contact === undefined
                    ? {}
                    : { contact: from.contact }),
                }
              : {}),
          };
        }
        return { ...posture, limbs };
      },
    };
  }

  /**
   * The defender's side a region lies on: its own side, or the lead side for a
   * central region.
   *
   * @param region The struck region.
   * @param lead The stance's lead side.
   * @returns The side.
   */
  export function attacked(
    region: AutoMovieHumanoidRegion,
    lead: AutoMovieHumanSide,
  ): AutoMovieHumanSide {
    return /Left$/.test(region)
      ? "left"
      : /Right$/.test(region)
        ? "right"
        : lead;
  }

  /**
   * The feet's windows: both planted, except a checking leg off the floor from
   * its read to its end.
   *
   * @param checking The checking leg's side, undefined when both feet stay.
   * @param timing The movement's start and the whole duration, seconds.
   * @param support The inherited touchdown and release times, when present.
   * @returns The windows.
   */
  export function windows(
    checking: AutoMovieHumanSide | undefined,
    timing: Pick<ITiming, WindowsTiming>,
    support?: defendFootwork.ISupport,
  ): IAutoMovieMotionHumanContactWindow[] {
    return (["left", "right"] as const).flatMap(
      (side): IAutoMovieMotionHumanContactWindow[] => {
        const from: number = (support?.touchdown[side] ?? 0) / timing.duration;
        const to: number =
          side === checking
            ? (support?.release ?? timing.begin) / timing.duration
            : 1;
        const plant = (
          from: number,
          to: number,
        ): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Foot`,
          kind: "plant",
          from,
          to,
          support: { kind: "ground" },
        });
        return [
          ...(from <= to ? [plant(from, to)] : []),
          ...(side === checking ? [plant(1, 1)] : []),
        ];
      },
    );
  }

  /**
   * Which way a side roll rolls the body: away from the incoming direction's
   * side, -1 when it comes from the left of the heading, 1 otherwise.
   *
   * @param yaw The heading, degrees.
   * @param direction The incoming direction.
   * @returns -1 or 1.
   */
  export function sideRoll(yaw: number, direction: IAutoMovieVector3): number {
    const r: number = (yaw * Math.PI) / 180;
    const left: IAutoMovieVector3 = { x: Math.cos(r), y: 0, z: -Math.sin(r) };
    return Vector3.dot(direction, left) > 0 ? -1 : 1;
  }
}
