import { Vector3, convexHull2D, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanTrunk } from "./HumanTrunk";
import { handGoals } from "./handGoals";
import { poseBones } from "../posture/poseBones";

/**
 * Bracing for an expected impact, push or a falling body: the stance
 * widens and staggers along the line of the coming force, the body lowers
 * and leans into it, and the hands come up in front, all set before the
 * force arrives.
 *
 * People preparing for a predictable perturbation adjust their posture in
 * advance, anticipatory postural adjustments (Massion 1992, Prog Neurobiol
 * 38:35): they enlarge the base of support along the expected force, lower
 * the centre of mass and lean against the force, keeping the feet in place
 * once set (Horak and Nashner 1986, J Neurophysiol 55:1369; Maki and
 * McIlroy 1997, Phys Ther 77:488, on changing the base of support). The
 * goals: the foot on the side away from the force steps back along the
 * force's line by `STAGGER` leg lengths and out until the feet stand a
 * shoulder width apart (a staggered, wider base); the pelvis drops until
 * the knees flex `KNEE` degrees and is then moved so the engine's
 * whole-body centre of mass stands over the middle of the new base's hull,
 * found on the solved posture; the trunk inclines 10 degrees toward the
 * force; and both palms
 * come up ahead of the chest, facing the force for an `impact` or a `push`,
 * turned up and lower to receive a `catchBody`. Step size, drop, lean and
 * timing are provisional (Massion describes the adjustments, not these
 * magnitudes). The stepping foot swings over 0.4 s with a 3 cm lift, the
 * set is reached at `set`, 0.6 s after the start (provisional lead time),
 * and held for the rest of the action.
 *
 * The force comes from `toward` (a person, prop or point the force comes
 * from) or from straight ahead when absent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the provisional values.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, hand, trunk and contact types.
 */
export namespace brace {
  /** The action's name. */
  export const name: HumanActionName = "brace";

  /** Cancel table: a brace is standing and may become standing again. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /**
   * Parameters of a brace: where the force comes from, what is braced for
   * and how long the brace lasts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its meaning, unit and the default an absent value takes.
   * @evidence contracts/development/design.md#principled-representation The source is the shared motion target union, read once at the start and projected to the floor; the kind is a closed union selecting the palms' facing; the duration is seconds, raised to at least the set time plus 0.2 s by the plan rather than refused.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by this law and read only by its plan; the target type is imported from the interface package.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No field names a scene or body, and every combination is meaningful.
   */
  export interface IParams {
    /** Where the force comes from; straight ahead when absent. */
    toward?: AutoMovieMotionTarget;

    /** What is braced for; `impact` when absent. */
    kind?: "impact" | "push" | "catchBody";

    /** How long the brace lasts, seconds; 1.5 when absent. */
    seconds?: number;
  }

  /** Knee flexion of the set posture, degrees (20 to 30 in a braced stance). */
  export const KNEE: number = 25;

  /** How far the rear foot steps back along the force's line, leg lengths (provisional). */
  export const STAGGER: number = 0.3;

  /** Lead time to the set posture, seconds (provisional). */
  export const SET: number = 0.6;

  /**
   * Plan a brace: the rear foot's step, the lowered and centred set root,
   * and postures that reach the set at `SET` seconds with the palms up toward
   * the force, then hold it.
   *
   * @param context The action's context.
   * @returns The plan; a duration shorter than `SET + 0.2` s is raised to it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is planned, when the set is reached and how a short duration is treated; the law's doc gives the sources and the provisional magnitudes.
   * @evidence contracts/development/implementation.md#principled-implementation The anticipatory adjustments of Massion 1992: the foot away from the force steps back along its line and out to shoulder width, the pelvis drops by the leg-length change of a `KNEE` flexion (law of cosines over thigh and shank), and the root moves so the engine's centre of mass stands over the mean of the new base's hull vertices, measured on the solved posture; the trunk inclines toward the force by the cosine of its bearing, so a force from the side adds no lean.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plans the step and the set root once; the posture closure interpolates root, lean and palms on one minimum-jerk set curve and delegates legs to the stand law and hands to handGoals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts KNEE, STAGGER, SET, the 10 degree lean, the 0.55 reach share and the 0.4 s step with its 3 cm lift are named provisional magnitudes; the centring runs exactly two corrections, a fixed precision policy, and the hull centre is the vertex mean, not the area centroid.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning costs two posture solves with centre-of-mass and hull evaluation; each posture costs one leg solve, one bone resolve for the hanging palms and a two-hand solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The step, set root and lean are computed once per instance and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The posture closure holds this instance's body, feet, set root and parameters, released with the performance; nothing grows per call.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const p: IParams = context.params;
    const duration: number = Math.max(SET + 0.2, p.seconds ?? 1.5);
    const yaw: number = context.entry.posture.yaw;
    const feet: Record<"left" | "right", IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      yaw,
    );
    const middle: IAutoMovieVector3 = {
      x: (feet.left.x + feet.right.x) / 2,
      y: 0,
      z: (feet.left.z + feet.right.z) / 2,
    };

    // The force's line: toward the source, on the floor.
    const source: IAutoMovieVector3 =
      p.toward === undefined
        ? HumanFrame.point({ origin: middle, yaw }, { x: 0, y: 0, z: 1 })
        : context.aim(p.toward, context.start).point;
    const toward: IAutoMovieVector3 = Vector3.normalize({
      x: source.x - middle.x,
      y: 0,
      z: source.z - middle.z,
    });
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 1, y: 0, z: 0 },
    );

    // The foot farther from the source steps back along the line and out.
    const back: "left" | "right" =
      Vector3.dot(Vector3.subtract(feet.left, feet.right), toward) < 0
        ? "left"
        : "right";
    const out: IAutoMovieVector3 = Vector3.scale(
      left,
      back === "left" ? 1 : -1,
    );
    const leg: number = m.thigh + m.shank;
    const across: number = Math.abs(
      Vector3.dot(Vector3.subtract(feet.left, feet.right), out),
    );
    const widen: number = Math.max(0, 2 * m.shoulderHalfWidth - across);
    const placed: IAutoMovieVector3 = Vector3.add(
      feet[back],
      Vector3.add(
        Vector3.scale(toward, -STAGGER * leg),
        Vector3.scale(out, widen),
      ),
    );
    const swing: [number, number] = [0.1, 0.5];
    const footAt = (
      side: "left" | "right",
      t: number,
    ): { ankle: IAutoMovieVector3; planted: boolean } => {
      if (side !== back || t <= swing[0])
        return { ankle: feet[side], planted: true };
      if (t >= swing[1]) return { ankle: placed, planted: true };
      const u: number = (t - swing[0]) / (swing[1] - swing[0]);
      const ankle: IAutoMovieVector3 = Vector3.lerp(
        feet[side],
        placed,
        minimumJerk(u).s,
      );
      return {
        ankle: { ...ankle, y: ankle.y + 0.03 * Math.sin(Math.PI * u) },
        planted: false,
      };
    };

    // The pelvis settles over the new base, lowered; the trunk leans into the force.
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      {
        x: (body.rest.get("leftFoot")!.x + body.rest.get("rightFoot")!.x) / 2,
        y: 0,
        z: (body.rest.get("leftFoot")!.z + body.rest.get("rightFoot")!.z) / 2,
      },
    );
    const settled: IAutoMovieVector3 = Vector3.lerp(
      feet[back === "left" ? "right" : "left"],
      placed,
      0.5,
    );
    const start: IAutoMovieVector3 = context.entry.posture.root;
    const bent: number = Math.sqrt(
      m.thigh * m.thigh +
        m.shank * m.shank +
        2 * m.thigh * m.shank * Math.cos((KNEE * Math.PI) / 180),
    );
    const lean: number = 10;
    const forward: number =
      (Math.atan2(toward.x, toward.z) * 180) / Math.PI - yaw;
    const upright = standUpright.of(body).joints;
    const setAt = (root: IAutoMovieVector3): IHumanPosture => {
      const tilt = HumanTrunk.incline(
        { ...stand.RELAXED, ...upright },
        lean * Math.cos((forward * Math.PI) / 180),
      );
      return resolveHumanPosture.lower(body, {
        root,
        yaw,
        pitch: tilt.pitch,
        roll: 0,
        joints: tilt.joints,
        limbs: stand.legs(body, root, yaw, {
          left: back === "left" ? placed : feet.left,
          right: back === "right" ? placed : feet.right,
        }),
      });
    };

    // The set root: lowered by the knee flexion, then moved twice so the
    // engine's centre of mass stands over the middle of the new base's hull.
    let goal: IAutoMovieVector3 = {
      x: settled.x - centre.x,
      y: -0.005 - (leg - bent),
      z: settled.z - centre.z,
    };
    for (let round: number = 0; round < 2; round++) {
      const held = HumanBalance.support(body, setAt(goal));
      const hull: IAutoMovieVector3[] = convexHull2D(held.points);
      const mid: IAutoMovieVector3 = Vector3.scale(
        hull.reduce(
          (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(a, b),
          { x: 0, y: 0, z: 0 },
        ),
        1 / hull.length,
      );
      goal = {
        x: goal.x + mid.x - held.centre.x,
        y: goal.y,
        z: goal.z + mid.z - held.centre.z,
      };
    }

    const contacts: IHumanContactWindow[] = [
      {
        part: back === "left" ? "rightFoot" : "leftFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: back === "left" ? "leftFoot" : "rightFoot",
        kind: "plant",
        from: 0,
        to: swing[0] / duration,
        support: { kind: "ground" },
      },
      {
        part: back === "left" ? "leftFoot" : "rightFoot",
        kind: "plant",
        from: swing[1] / duration,
        to: 1,
        support: { kind: "ground" },
      },
    ];
    return {
      duration,
      events: [{ name: "set", share: SET / duration }],
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number = minimumJerk(t / SET).s;
        const root: IAutoMovieVector3 = Vector3.lerp(start, goal, s);
        const tilt = HumanTrunk.incline(
          { ...stand.RELAXED, ...upright },
          lean * s * Math.cos((forward * Math.PI) / 180),
        );
        const legs: IHumanPosture["limbs"] = stand.legs(body, root, yaw, {
          left: footAt("left", t).ankle,
          right: footAt("right", t).ankle,
        });
        for (const side of ["left", "right"] as const) {
          const limb: "leftLeg" | "rightLeg" =
            side === "left" ? "leftLeg" : "rightLeg";
          if (!footAt(side, t).planted)
            legs[limb] = { ...legs[limb]!, planted: false };
        }
        const posture: IHumanPosture = resolveHumanPosture.lower(body, {
          root,
          yaw,
          pitch: tilt.pitch,
          roll: 0,
          joints: tilt.joints,
          limbs: legs,
        });

        // The palms come up ahead of the chest, toward the force.
        const frame: HumanFrame.IFrame = { origin: posture.root, yaw };
        const reach: number = (m.upperArm + m.forearm) * 0.55;
        const catching: boolean = p.kind === "catchBody";
        const requests: AutoMovieMotionHumanArm.ISided[] = (["left", "right"] as const).map(
          (side) => {
            const sign: number = side === "left" ? 1 : -1;
            const point: IAutoMovieVector3 = Vector3.add(
              HumanFrame.point(frame, {
                x: sign * m.shoulderHalfWidth * 0.9,
                y: catching ? m.chestHeight - 0.1 * m.stature : m.chestHeight,
                z: 0,
              }),
              Vector3.scale(toward, reach),
            );
            const turn = HumanHand.rotation(
              side,
              catching
                ? { fingers: toward, palm: { x: 0, y: 1, z: 0 } }
                : { fingers: { x: 0, y: 1, z: 0 }, palm: toward },
            );
            return {
              side,
              surface: "palm",
              shape: "flat",
              point,
              rotation: turn,
              bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
            };
          },
        );
        if (s <= 0) return posture;
        const hanging = poseHands(body, posture);
        return handGoals(
          body,
          {
            ...posture,
            joints: {
              ...posture.joints,
              ...HumanHand.shape("left", "flat"),
              ...HumanHand.shape("right", "flat"),
            },
          },
          requests.map((r) => ({
            ...r,
            point: Vector3.lerp(hanging[r.side], r.point, s),
          })),
        );
      },
    };
  }
}

/** Where each palm hangs in a posture whose arms are not goal-driven. */
function poseHands(
  body: IHumanBody,
  posture: IHumanPosture,
): Record<"left" | "right", IAutoMovieVector3> {
  const bones = poseBones(body, resolveHumanPosture(body, posture));
  return {
    left: HumanHand.frame(body, bones, "left", "palm").point,
    right: HumanHand.frame(body, bones, "right", "palm").point,
  };
}
