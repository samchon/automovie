import {
  Quaternion,
  Vector3,
  getConstraint,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeatedHeelBounce,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { seated } from "./seated";

/** The alternatives of `PlanLimb`'s site. */
type PlanLimb = "leftLeg" | "rightLeg";

/** The alternatives of `PlanToes`'s site. */
type PlanToes = "leftToes" | "rightToes";

/** The alternatives of `PlanPart`'s site. */
type PlanPart = "leftFoot" | "rightFoot";

/**
 * Repeated seated heel raises, with the moving foot rocking about its ball. Qi
 * et al. (2019, doi:10.1038/s41598-019-43824-0) used unilateral seated heel
 * tapping as one of their lower-limb rhythm tasks. Narayanan et al. (2026,
 * doi:10.1038/s41598-025-33921-8) instructed seated rhythmic foot tapping or
 * bouncing on one leg. Pettit-Mee et al. (2021, doi:10.1002/oby.23173) used
 * heel tapping and knee bouncing at self-selected cadence. The author sets
 * cadence and amplitude. Soucie et al. (2011,
 * doi:10.1111/j.1365-2516.2010.02399.x) measured passive ankle range, which
 * informs the rig range used by the shared fit, rather than a fidget
 * amplitude.
 *
 * Each beat rises and falls on two minimum-jerk halves. Heel travel follows
 * from the body's own ball-to-heel geometry and the authored rotation. The ball
 * stays fixed, the toes counter-rotate to maintain their entry height, and the
 * knee follows the ankle through the existing leg fit. The seat and opposite
 * foot retain their entry contacts. When they share a prop with the moving
 * foot, the whole posture rides that prop.
 */
export namespace seatedHeelBounce {
  /** The action's registry name. */
  export const name = "seatedHeelBounce" as const;

  /** A subsequent action can cut at the last heel return. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    rise: [{ window: ["heelDown", 1], kind: "inertialize", entry: 0 }],
    seatedHeelBounce: [
      { window: ["heelDown", 1], kind: "inertialize", entry: 0 },
    ],
  };

  /**
   * Plan a full number of beats on the seated entry pose.
   *
   * @param context The action's body, entry supports and authored beats.
   * @returns The plan in action seconds.
   * @throws {HumanRefusal} If timing, entry contacts or peak rotation are
   *   infeasible.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSeatedHeelBounce>,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const { side, count: beats, cadence, amplitude } = params;
    const duration: number = beats / cadence;
    if (side !== "left" && side !== "right")
      throw new HumanRefusal({
        kind: "parameter",
        axis: "side",
        value: side,
        reason: "one foot rocks while the other holds its plant",
        fix: "specify left or right",
      });
    if (!Number.isSafeInteger(beats) || beats < 1)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "count",
        value: beats,
        reason: "a heel bounce consists of a positive whole number of beats",
        fix: "specify one or more whole beats",
      });
    if (
      !(
        Number.isFinite(cadence) &&
        cadence > 0 &&
        Number.isFinite(duration) &&
        duration > 0
      )
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "cadence",
        value: cadence,
        reason: "the cadence must yield a positive finite duration",
        fix: "specify a positive finite number of beats per second",
      });

    const part: PlanPart = `${side}Foot`;
    const toes: PlanToes = `${side}Toes`;
    const limb: PlanLimb = `${side}Leg`;
    const seat: IAutoMovieMotionHumanEntryState.ISupport | undefined =
      entry.supports.find(
        (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          s.part === "seat" && s.kind === "seat",
      );
    const floor: number = seated.floor(body, entry);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
    );
    const flat = (foot: AutoMovieHumanSide): boolean =>
      entry.feet[foot].planted &&
      HumanFoot.sockets(body, bones, foot).every(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          Math.abs(socket.point.y - floor) <= HumanFoot.BEARING,
      );
    if (
      entry.base.kind !== "seated" ||
      seat === undefined ||
      !flat("left") ||
      !flat("right") ||
      (entry.base.seat !== undefined &&
        seated.high(body, entry.base.seat, floor))
    )
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: entry.base.kind,
        reason:
          "heel bouncing requires a seated entry with both soles on the same floor",
        fix: "sit with both feet flat on the floor first",
      });

    const neutral: IAutoMovieMotionHumanPosture = entry.posture;
    const foot: IAutoMovieMotionHumanFoot.IPlacement = entry.feet[side];
    const bend: IAutoMovieVector3 = bones.get(`${side}LowerLeg`)!.worldPosition;
    const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "ball", foot);
    const heading: number = HumanFoot.heading(foot.rotation);
    const pitch: number = HumanFoot.pitch(foot.rotation);
    const roll: number = HumanFoot.roll(foot.rotation);
    const toeEntry: number =
      entry.pose.joints.find((j): boolean => j.bone === toes)?.flexion ?? 0;
    const toeOffset: IAutoMovieVector3 = HumanFoot.offset(
      body,
      side,
      "toe",
      toeEntry,
    );
    const mtp: IAutoMovieVector3 = HumanFoot.offset(body, side, "mtp");
    const toeVector: IAutoMovieVector3 = Vector3.subtract(toeOffset, mtp);
    const toeWorld: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      "toe",
      foot,
      toeEntry,
    );
    const toeY: number = Quaternion.rotateVector(foot.rotation, {
      x: 0,
      y: toeVector.y,
      z: toeVector.z,
    }).y;
    const toeSlope: number = Quaternion.rotateVector(foot.rotation, {
      x: 0,
      y: toeVector.z,
      z: -toeVector.y,
    }).y;
    const toePhase: number = Math.atan2(toeY, toeSlope);
    const toeRadius: number = Math.hypot(toeY, toeSlope);
    const toeLateral: number = Quaternion.rotateVector(foot.rotation, {
      x: toeVector.x,
      y: 0,
      z: 0,
    }).y;
    const footContact: IAutoMovieVector3 = HumanFoot.offset(body, side, "ball");
    const jointed: boolean =
      body.surfaces.sockets[side === "left" ? "toeLeft" : "toeRight"].bone ===
      toes;

    /** Rock about the sole's ball and keep the toe at its original height. */
    const at = (angle: number): IAutoMovieMotionHumanPosture => {
      if (angle === 0) return neutral;
      const placed: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
        body,
        side,
        "ball",
        ball,
        heading,
        pitch - angle,
        toeEntry,
        roll,
      );
      // With the rocker subtracted at the toe joint, its own vector keeps
      // the entry orientation. A second, small turn compensates for the MTP
      // joint dropping by a chord as the foot rocks around the sole.
      const centre: IAutoMovieVector3 = HumanFoot.point(
        body,
        side,
        "mtp",
        placed,
      );
      const correction: number = jointed
        ? ((Math.asin((toeWorld.y - centre.y - toeLateral) / toeRadius) -
            toePhase) *
            180) /
          Math.PI
        : 0;
      const goal: IAutoMovieHumanLimbGoal = {
        point: placed.ankle,
        rotation: placed.rotation,
        bend,
        planted: true,
        contact: footContact,
      };
      return {
        ...neutral,
        joints: {
          ...neutral.joints,
          [toes]: [toeEntry + angle + correction, 0, 0],
        },
        limbs: { ...neutral.limbs, [limb]: goal },
      };
    };

    const toeRange = getConstraint(
      toes,
      body.skeleton.bones.find((b): boolean => b.bone === toes)?.constraint ??
        null,
    )?.flexion;
    const ankleRange = getConstraint(
      part,
      body.skeleton.bones.find((b): boolean => b.bone === part)?.constraint ??
        null,
    )?.flexion;
    const limit: number = Math.max(
      0,
      Math.min(
        (toeRange?.max ?? 0) - toeEntry,
        (ankleRange?.max ?? 0) - (ankleRange?.min ?? 0),
      ),
    );

    /** Whether the solved rig realizes a rotation and retains the forefoot. */
    const fits = (angle: number): boolean => {
      const posture: IAutoMovieMotionHumanPosture = at(angle);
      const toeAngle: number = posture.joints[toes]![0];
      if (!(toeAngle <= (toeRange?.max ?? 0))) return false;
      const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, resolveHumanPosture(body, posture));
      const actual: IAutoMovieResolvedBone = shown.get(part)!;
      const sockets: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
        body,
        shown,
        side,
      );
      return (
        Math.abs(HumanFoot.pitch(actual.worldRotation) - (pitch - angle)) <=
          0.1 &&
        Vector3.length(Vector3.subtract(sockets[1]!.point, ball)) <=
          HumanFoot.BEARING &&
        Math.abs(sockets[2]!.point.y - toeWorld.y) <= HumanFoot.BEARING
      );
    };
    if (!(amplitude > 0 && Number.isFinite(amplitude) && amplitude <= limit))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "amplitude",
        value: amplitude,
        feasible: { kind: "range", minimum: 0, maximum: limit, unit: "deg" },
        reason: "the rocker must be positive and stay within the joint range",
        fix: "reduce the heel pitch within the seated joint range",
      });
    // Every beat uses the same rocker. Its midpoint and peak are the two
    // fitted witnesses for travel and maximum joint excursion.
    if (!fits(amplitude / 2) || !fits(amplitude))
      throw new HumanRefusal({
        kind: "reach",
        axis: "amplitude",
        value: amplitude,
        reason:
          "the seated leg cannot realize the rocker and preserve the forefoot at its fitted witnesses",
        fix: "use a smaller heel pitch from a flat, seated entry",
      });

    const contacts: IAutoMovieMotionHumanContactWindow[] = entry.supports
      .filter(
        (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          s.part !== "leftFoot" && s.part !== "rightFoot",
      )
      .map(
        (
          s: IAutoMovieMotionHumanEntryState.ISupport,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...s,
          from: 0,
          to: 1,
        }),
      );
    for (const foot of ["leftFoot", "rightFoot"] as const)
      contacts.push({
        part: foot,
        kind: "plant",
        support: HumanSupportFrame.contact(context, foot),
        from: foot === part ? 1 : 0,
        to: 1,
      });
    contacts.push({
      part,
      kind: "pivot",
      support: HumanSupportFrame.contact(context, part),
      from: 0,
      to: 1,
    });
    const support: IAutoMovieMotionHumanContactWindow.Support = seat.support;
    const prop: string | undefined =
      support.kind === "prop" &&
      contacts.every(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.kind === "grip" ||
          (c.support.kind === "prop" && c.support.subject === support.subject),
      )
        ? support.subject
        : undefined;
    const plan: IAutoMovieMotionHumanActionPlan = {
      base: entry.base,
      duration,
      events: [
        { name: "heelPeak", share: 0.5 / beats },
        { name: "heelDown", share: 1 },
      ],
      contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(seconds, duration));
        const phase: number = (t * cadence) % 1;
        const angle: number =
          t === duration
            ? 0
            : amplitude * minimumJerk.share(1 - Math.abs(2 * phase - 1));
        return at(angle);
      },
    };
    return prop === undefined
      ? plan
      : HumanSupportCarry.on(context, plan, prop);
  }
}
