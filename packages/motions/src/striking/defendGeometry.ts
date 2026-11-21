import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
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

import { StrikingBody } from "./StrikingBody";
import { StrikingGuardBones } from "./StrikingGuardBones";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import type { defendFootwork } from "./defendFootwork";
import { defendGoals } from "./defendGoals";

/**
 * A built defence: what the defender sees at its read second turned into a
 * posture per second.
 *
 * The defender sees the attacker's moving limb (the hand, foot or shin whose
 * velocity over the last 1/24 s points most toward the struck region) and the
 * line from it to the region on its own body. Whole-body evasions move the
 * head off that line through the trunk's lean and the root's dip and shift:
 * a `slip` leans the head 0.7 of the clearance (the head's radius, the fist's
 * and a 4 cm margin) outside the weapon and shifts the root 0.3 of it, 2 % of
 * stature down; a `roll` drops the root two head radii with a 15 degree
 * forward lean; a `sway` leans back until the head clears. The arms and the
 * checking leg go to goals on the defender's own body ({@link defendGoals}),
 * reached from the guard with the movement's minimum-jerk share and left
 * again over the recovery. A check stands over the supporting foot, the root
 * moved 0.6 of the way to its ankle. The shares are provisional.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the defender sees, each evasion's displacement and that the shares are provisional.
 * @evidence contracts/development/design.md#principled-representation One geometry per read, as postures in world metres and seconds and contact windows as shares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the timing the plan decides, the built geometry, its builder and the two helpers the plan shares with it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, contact window and placed-action types; contact is left to the strike.
 */
export namespace defendGeometry {
  /**
   * A defence's timing, seconds from its start unless stated.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The struck region, the placed strike and durations in seconds, decided once by the plan.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the geometry and the contact windows read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the region and placed-action types.
   */
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

  /**
   * A built defence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds.
   * @evidence contracts/development/design.md#principled-representation A posture per second and contact windows as shares.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture and contact window types.
   */
  export interface IGeometry {
    /**
     * The complete posture at action-relative seconds, borrowing only this
     * synchronous body's optional FK/ROM sources.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines action-relative time, unchanged-body query loans, full output and preserved complete posture despite optional channel demand.
     * @evidence contracts/development/implementation.md#principled-implementation The actual build producer evaluates its original movement envelope, root/trunk evasion, fixed stance feet, guard and selected limb defence on the current posed trunk.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One share drives the base and original limb blends; one current trunk map serves guard and defence goals.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains every actual posture projection, original limb/rival fit, contact window, guard and selected defence; channel demand does not omit physical goals.
     * @evidence contracts/development/implementation.md#efficient-algorithms Fixed foot hints/contacts and demanded rig names prepare once, while each actual query evaluates its full current posture, FK and original blend loop; no speedup is measured.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows genuine query-scoped exact FK/ROM sources without storing them; fixed body/feet/support geometry belongs to the built defence, and every changing root/joint value still reaches native resolution.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The geometry retains fixed stance/sight metadata until plan settle/release; each call returns fresh authored goals and releases its borrowed source/projector and current bone map.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its inputs and result; the namespace states the build.
   * @evidence contracts/development/implementation.md#principled-implementation The weapon is the attacker's limb moving most toward the struck region at the read second; the evasion and the goals follow from the line it comes in on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The sight, the evasion's displacement, the base posture, then the limbs blended from the guard to the goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing about contact is decided here; the displacement shares are documented provisional values.
   * @evidence contracts/development/implementation.md#efficient-algorithms The original two attacker observations remain. Fixed requested-bone metadata and authored foot hints/MTP contacts prepare once; each posture evaluates its envelope once, one actual native trunk and the original guard/limb blends. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed sight, displacement, entry feet and checking support selection belong to this built defence. Only their authored geometry is shared; query-scoped exact FK/ROM loans reach the native current trunk, and no changing pose, fit, actor observation or time answer is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains its original sight/feet and fixed demanded-rig/foot-geometry readers until plan settle/release. Every query returns independent authored goals and releases its current map and optional borrowed FK/ROM sources on return or failure.
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
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);

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
    const attackedSide: "left" | "right" = attacked(timing.region, lead);
    const sight: defendGoals.ISight = {
      incoming,
      across,
      outside,
      attackedSide,
    };
    const fist: number = StrikingQuality.fist(m.hand);

    // The movement's share in, and out again after the strike has passed.
    const w = (t: number): number =>
      minimumJerk.share((t - timing.begin) / timing.movement) -
      minimumJerk.share((t - timing.hold) / timing.recovery);

    // Whole-body evasions: the head's displacement in the trunk's lean and
    // the root's dip and shift.
    const trunkLength: number = m.eyeHeight - m.hipHeight;
    const clear: number = m.headRadius + fist + 0.04;
    // The lean that moves the eyes `lateral` off the hips' vertical; a
    // displacement past the trunk's own length is no lean at all.
    const tilt = (lateral: number): number => {
      if (!(lateral < trunkLength))
        throw new Error(
          `A defence's head displacement of ${lateral.toFixed(3)} m exceeds the trunk's ${trunkLength.toFixed(3)} m`,
        );
      return (Math.asin(lateral / trunkLength) * 180) / Math.PI;
    };
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
    const checking: "left" | "right" | undefined =
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
   * The defender's side a region lies on: its own side, or the lead side for
   * a central region.
   *
   * @param region The struck region.
   * @param lead The stance's lead side.
   * @returns The side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule for sided and central regions.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the side from the region's own name, the surface vocabulary's convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional chain.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function attacked(
    region: AutoMovieHumanoidRegion,
    lead: "left" | "right",
  ): "left" | "right" {
    return /Left$/.test(region)
      ? "left"
      : /Right$/.test(region)
        ? "right"
        : lead;
  }

  /**
   * The feet's windows: both planted, except a checking leg off the floor
   * from its read to its end.
   *
   * @param checking The checking leg's side, undefined when both feet stay.
   * @param timing The movement's start and the whole duration, seconds.
   * @param support The inherited touchdown and release times, when present.
   * @returns The windows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the windows and the checking leg's exception.
   * @evidence contracts/development/implementation.md#principled-implementation The checking foot is planted until the movement starts and again at the end, the instant it is back on the floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over the two sides.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data.
   */
  export function windows(
    checking: "left" | "right" | undefined,
    timing: Pick<ITiming, "begin" | "duration">,
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

  /** The roll sign that tips the body toward a horizontal direction: +1 when it lies on the body's right. */
  function sideRoll(yaw: number, direction: IAutoMovieVector3): number {
    const r: number = (yaw * Math.PI) / 180;
    const left: IAutoMovieVector3 = { x: Math.cos(r), y: 0, z: -Math.sin(r) };
    return Vector3.dot(direction, left) > 0 ? -1 : 1;
  }
}
