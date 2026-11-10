import {
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { poseBones } from "../posture/poseBones";

/**
 * Stepping over a low obstacle from standing in front of it: the lead foot
 * lifts over it and lands beyond, then the trail foot follows and lands
 * beside it, both feet clearing the obstacle's top.
 *
 * The goals are footprints and clearance: each swinging foot travels from
 * its footprint to its landing on a minimum-jerk path and is lifted so its
 * lowest sole point (heel, ball or toe) stays at least `MARGIN` above the
 * obstacle's top while any part of the foot is over it; where the ankle
 * cannot dorsiflex enough to keep the foot level and the toes droop, the
 * ankle is raised until the lowest sole point is at the lift. Patla and Rietdyk
 * (1993, Gait Posture 1:45) found that the lead toe clears an obstacle by a
 * roughly constant margin whatever its height, so the lift grows with the
 * obstacle and the margin does not; 0.1 m is the margin used (provisional,
 * of the order they report). The lead foot lands so the obstacle's middle
 * falls at mid-swing, where the lift is fullest, at least one tenth of a
 * foot length beyond the far side and no farther than the legs' stride
 * allows; the trail foot lands beside it at the
 * body's rest separation. The pelvis moves halfway between the feet while
 * the lead foot swings, stays there through the double support, and moves
 * over the landed feet while the trail foot swings, each leg on a
 * minimum-jerk path, lowered wherever a planted leg could not
 * reach its foot with the knee 0.5 % short of straight, so no plant is
 * stretched off its footprint.
 *
 * Time scales with leg length by dynamic similarity (Alexander 1984): the
 * whole action takes `2.4 sqrt(l / 0.93)` seconds for a hip height `l`
 * (provisional: a deliberate two-step crossing near 1 s a step for an adult),
 * the lead swinging over 8 to 42 % and the trail over 50 to 82 %, the
 * pelvis staying between the feet until 70 % so the trail limb crosses with
 * the hip above the obstacle, where hip and knee flexion can lift its toe
 * (trail-limb clearance comes from hip and knee flexion, Chou and Draganich
 * 1997, J Biomech 30:331), then moving over the landed feet.
 *
 * The obstacle lies ahead along the performer's heading; its near side must
 * be within one leg length of the feet and its height at most 0.55 of the hip
 * height (provisional, near the hip flexion a standing step can use),
 * otherwise the step is refused with the limits. Events: `leadToeOff`,
 * `leadContact`, `trailToeOff`, `trailContact`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Effector goals (sockets, footprints, the gaze line) solved by the shared inverse kinematics, with balance and timing from the cited laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plans once, then evaluates each posture in closed form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Infeasible requests are refused with the feasible range instead of clamped; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond a few forward-kinematics passes and limb fits.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance and every posture reads it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
 */
export namespace stepOver {
  /** The action's name. */
  export const name: HumanActionName = "stepOver";

  /** Cancel table: a crossing completes before anything else. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: ["trailContact", 1], kind: "inertialize", entry: 0 }],
    walk: [
      {
        window: ["trailContact", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
  };

  /** Parameters. */
  export interface IParams {
    /** The obstacle: the middle of its near side on the floor, its height and its depth along the heading, metres. */
    obstacle: { at: IAutoMovieVector3; height: number; depth: number };

    /** The leading foot; `right` when absent. */
    lead?: "left" | "right";
  }

  /** How far before and beyond the obstacle the full lift is held, metres: room for a drooping toe and the ramp's start (provisional). */
  export const SPAN: number = 0.06;

  /** Sole clearance over the obstacle's top, metres (provisional; Patla and Rietdyk 1993). */
  export const MARGIN: number = 0.1;

  /**
   * Plan a step over.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the obstacle is too far, behind, too high or too deep to cross in one step.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const { obstacle } = context.params;
    const lead: "left" | "right" = context.params.lead ?? "right";
    const trail: "left" | "right" = lead === "left" ? "right" : "left";
    const yaw: number = context.entry.posture.yaw;
    const feet: Record<"left" | "right", IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      yaw,
    );
    const origin: IAutoMovieVector3 = {
      x: (feet.left.x + feet.right.x) / 2,
      y: 0,
      z: (feet.left.z + feet.right.z) / 2,
    };
    const frame: HumanFrame.IFrame = { origin, yaw };
    const near: number = HumanFrame.local(frame, obstacle.at).z;
    const leg: number = m.thigh + m.shank;
    if (!(obstacle.height > 0 && obstacle.depth > 0))
      throw new Error("An obstacle has a positive height and depth");
    if (near < 0.5 * m.footLength || near > leg)
      throw new Error(
        `${context.subject}: the obstacle's near side is ${near.toFixed(3)} m ahead; stand ${(0.5 * m.footLength).toFixed(3)} to ${leg.toFixed(3)} m before it`,
      );
    if (obstacle.height > 0.55 * m.hipHeight)
      throw new Error(
        `${context.subject}: an obstacle ${obstacle.height.toFixed(3)} m high is above the ${(0.55 * m.hipHeight).toFixed(3)} m this body steps over`,
      );
    const far: number = near + obstacle.depth;
    const heelBack: number = -HumanFoot.offset(body, lead, "heel").z;
    const nearest: number = far + 0.1 * m.footLength + heelBack;
    const farthest: number =
      HumanFrame.local(frame, feet[trail]).z +
      0.95 *
        2 *
        Math.sqrt(
          Math.max(0, leg * leg - (0.9 * m.hipHeight - m.ankleHeight) ** 2),
        );
    if (nearest > farthest)
      throw new Error(
        `${context.subject}: an obstacle ${obstacle.depth.toFixed(3)} m deep is too deep to cross in one step`,
      );
    const landing: number = Math.min(
      farthest,
      Math.max(nearest, near + far - HumanFrame.local(frame, feet[lead]).z),
    );

    // Footprints: each foot from its start to beside the other beyond the obstacle.
    const restX = (side: "left" | "right"): number =>
      body.rest.get(`${side}Foot`)!.x;
    const end: Record<"left" | "right", IAutoMovieVector3> = {
      left: HumanFrame.point(frame, {
        x: restX("left"),
        y: m.ankleHeight,
        z: landing,
      }),
      right: HumanFrame.point(frame, {
        x: restX("right"),
        y: m.ankleHeight,
        z: landing,
      }),
    };
    const heading = (side: "left" | "right"): number =>
      yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT);
    const flat = (
      side: "left" | "right",
      ankle: IAutoMovieVector3,
    ): HumanFoot.IPlacement => ({
      ankle,
      rotation: HumanFoot.rotation(heading(side), 0),
    });
    const duration: number = 2.4 * Math.sqrt(m.hipHeight / 0.93);
    const windows: Record<"left" | "right", [number, number]> = {
      [lead]: [0.08 * duration, 0.42 * duration],
      [trail]: [0.5 * duration, 0.82 * duration],
    } as Record<"left" | "right", [number, number]>;

    // Lift each swing so the foot's sole clears the top by the margin over the
    // whole span in which any part of the foot is above the obstacle, easing
    // in before it and out after it on minimum-jerk ramps.
    const top: number = obstacle.height + MARGIN;
    const reachAt = (
      side: "left" | "right",
      point: "heel" | "toe",
      z: number,
    ): number => {
      const at = (s: number): number =>
        HumanFrame.local(
          frame,
          HumanFoot.point(
            body,
            side,
            point,
            flat(side, lerp(feet[side], end[side], minimumJerk(s).s)),
          ),
        ).z;
      let lo: number = 0;
      let hi: number = 1;
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (at(mid) < z) lo = mid;
        else hi = mid;
      }
      return hi;
    };
    const spans: Record<"left" | "right", [number, number]> = {
      left: [
        reachAt("left", "toe", near - SPAN),
        reachAt("left", "heel", far + SPAN),
      ],
      right: [
        reachAt("right", "toe", near - SPAN),
        reachAt("right", "heel", far + SPAN),
      ],
    };
    const swing = (
      side: "left" | "right",
      s: number,
    ): { placement: HumanFoot.IPlacement; lift: number } => {
      const [s0, s1] = spans[side];
      const w: number =
        s < s0
          ? minimumJerk(s / s0).s
          : s > s1
            ? 1 - minimumJerk((s - s1) / (1 - s1)).s
            : 1;
      const ankle: IAutoMovieVector3 = lerp(
        feet[side],
        end[side],
        minimumJerk(s).s,
      );
      return {
        placement: flat(side, { ...ankle, y: m.ankleHeight + top * w }),
        lift: top * w,
      };
    };
    const footAt = (
      side: "left" | "right",
      t: number,
    ): { placement: HumanFoot.IPlacement; planted: boolean; lift: number } => {
      const [a, b] = windows[side];
      if (t <= a)
        return { placement: flat(side, feet[side]), planted: true, lift: 0 };
      if (t >= b)
        return { placement: flat(side, end[side]), planted: true, lift: 0 };
      return { ...swing(side, (t - a) / (b - a)), planted: false };
    };

    // The pelvis: from over the start to over the end, lowered where a planted leg needs it.
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      {
        x: (restX("left") + restX("right")) / 2,
        y: 0,
        z: (body.rest.get("leftFoot")!.z + body.rest.get("rightFoot")!.z) / 2,
      },
    );
    const startRoot: IAutoMovieVector3 = context.entry.posture.root;
    const endMid: IAutoMovieVector3 = {
      x: (end.left.x + end.right.x) / 2 - centre.x,
      y: -0.005,
      z: (end.left.z + end.right.z) / 2 - centre.z,
    };
    const rootAt = (t: number): IAutoMovieVector3 => {
      const s: number =
        0.5 * minimumJerk((t - 0.04 * duration) / (0.42 * duration)).s +
        0.5 * minimumJerk((t - 0.7 * duration) / (0.28 * duration)).s;
      return {
        x: startRoot.x + (endMid.x - startRoot.x) * s,
        y: startRoot.y + (endMid.y - startRoot.y) * s,
        z: startRoot.z + (endMid.z - startRoot.z) * s,
      };
    };

    const share = (t: number): number => t / duration;
    return {
      duration,
      events: [
        { name: "leadToeOff", share: share(windows[lead][0]) },
        { name: "leadContact", share: share(windows[lead][1]) },
        { name: "trailToeOff", share: share(windows[trail][0]) },
        { name: "trailContact", share: share(windows[trail][1]) },
      ],
      contacts: [
        {
          part: lead === "left" ? "leftFoot" : "rightFoot",
          kind: "plant",
          from: 0,
          to: 0.08,
          support: { kind: "ground" },
        },
        {
          part: lead === "left" ? "leftFoot" : "rightFoot",
          kind: "plant",
          from: 0.42,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: trail === "left" ? "leftFoot" : "rightFoot",
          kind: "plant",
          from: 0,
          to: 0.5,
          support: { kind: "ground" },
        },
        {
          part: trail === "left" ? "leftFoot" : "rightFoot",
          kind: "plant",
          from: 0.82,
          to: 1,
          support: { kind: "ground" },
        },
      ],
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const root: IAutoMovieVector3 = rootAt(t);
        const limbs: IHumanPosture["limbs"] = {};
        for (const side of ["left", "right"] as const) {
          const f = footAt(side, t);
          const knee: IAutoMovieVector3 = HumanFrame.point(
            { origin: root, yaw },
            {
              ...body.rest.get(`${side}LowerLeg`)!,
              z: body.rest.get(`${side}LowerLeg`)!.z + 1,
            },
          );
          limbs[side === "left" ? "leftLeg" : "rightLeg"] = {
            point: f.placement.ankle,
            bend: knee,
            rotation: f.placement.rotation,
            ...(f.planted
              ? { planted: true, contact: HumanFoot.offset(body, side, "ball") }
              : {}),
          };
        }
        let posture: IHumanPosture = resolveHumanPosture.lower(body, {
          root,
          yaw,
          pitch: 0,
          roll: 0,
          joints: { ...stand.RELAXED, ...standUpright.of(body).joints },
          limbs,
        });

        // A swinging foot whose ankle cannot dorsiflex enough to stay level
        // droops its toes, and raising its ankle folds the knee and droops them
        // further, so each lifted ankle rises by secant steps on its lowest sole
        // point's height (the step scaled by the last round's ankle-to-sole
        // ratio, 1 to 4) until that point is within 2 mm of the planned lift,
        // in at most six rounds, so the clearance holds on the sole itself.
        const lifted = (["left", "right"] as const).filter(
          (side) => footAt(side, t).lift > 0,
        );
        const last: Partial<
          Record<"left" | "right", { ankle: number; lowest: number }>
        > = {};
        for (let round: number = 0; round < 6 && lifted.length > 0; round++) {
          const bones = poseBones(body, resolveHumanPosture(body, posture));
          const next: IHumanPosture["limbs"] = { ...posture.limbs };
          let moved: boolean = false;
          for (const side of lifted) {
            const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
            const lowest: number = Math.min(
              ...(["heel", "ball", "toe"] as const).map(
                (name) =>
                  resolveAutoMovieHumanoidSurfaces.place(
                    body.surfaces.sockets[`${name}${Side}`],
                    bones.get(`${side}Foot`)!,
                  ).point.y,
              ),
            );
            const short: number = footAt(side, t).lift - lowest;
            if (short <= 0.002) continue;
            const limb: "leftLeg" | "rightLeg" =
              side === "left" ? "leftLeg" : "rightLeg";
            const goal = next[limb]!;
            const previous = last[side];
            const ratio: number =
              previous === undefined
                ? 1
                : Math.min(
                    4,
                    Math.max(
                      1,
                      (goal.point.y - previous.ankle) /
                        Math.max(1e-4, lowest - previous.lowest),
                    ),
                  );
            last[side] = { ankle: goal.point.y, lowest };
            next[limb] = {
              ...goal,
              point: { ...goal.point, y: goal.point.y + short * ratio },
            };
            moved = true;
          }
          if (!moved) break;
          posture = { ...posture, limbs: next };
        }
        return posture;
      },
    };
  }
}

/** A point a share of the way from one point to another. */
function lerp(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  s: number,
): IAutoMovieVector3 {
  return {
    x: a.x + (b.x - a.x) * s,
    y: a.y + (b.y - a.y) * s,
    z: a.z + (b.z - a.z) * s,
  };
}
