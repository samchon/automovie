import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import { walk } from "../actions/walk";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanClearance } from "../compose/AutoMovieMotionHumanClearance";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import { HumanObstacle } from "./HumanObstacle";

/**
 * Stepping over a low obstacle placed in the scene, a kerb or a hurdle
 * (`HumanObstacle`), from standing in front of it: the lead foot
 * lifts over it and lands beyond, then the trail foot follows and lands
 * beside it, both feet clearing the obstacle's top.
 *
 * The goals are footprints and clearance: each swinging foot takes the
 * shortest path from its footprint to its landing that keeps every sole
 * point over the obstacle at least `MARGIN` above its top and every other
 * one on or above the floor, the taut string over the obstacle
 * (`AutoMovieMotionHumanClearance`), travelled on minimum-jerk progress.
 * Patla and Rietdyk (1993, Gait Posture 1:45) found that the lead toe
 * clears an obstacle by a roughly constant margin whatever its height, so
 * the lift grows with the obstacle and the margin does not; 0.1 m is the
 * margin used (provisional, of the order they report). The lead foot lifts
 * its toes by up to `TOE_UP` as they pass over the near side and is level
 * again once its heel does, so the toe clears the edge with the ankle and
 * the knee lower than a level foot would need; where the ankle cannot take
 * the planned pitch and the toes droop, the ankle is raised until every
 * sole point clears. The lead foot lands so the obstacle's middle falls at
 * mid-swing, at least one tenth of a foot length beyond the far side and
 * no farther than the legs' stride allows; the trail foot lands beside it
 * at the body's rest separation.
 *
 * While the lead foot swings, the trail foot rises on its ball by `PUSH`,
 * the forefoot rocker of a stance foot the body passes over (Perry and
 * Burnfield), and the pelvis rises with it as far as it lifts that ankle,
 * so the lead hip stands higher over the obstacle; the trail foot later
 * leaves from that pitch and levels by the time its toe reaches the near
 * side. The pelvis stays back over the trail foot until the lead foot is
 * crossing, moves halfway between the feet by the double support and over
 * the landed feet while the trail foot swings, each leg on a minimum-jerk
 * path. It is lowered wherever a planted leg could not reach its foot,
 * and over the second half of each swing toward where the swinging leg
 * will reach its landing, so it has come down when the foot lands instead
 * of dropping at the contact.
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
    /** The obstacle's prop subject: a kerb or a hurdle, whose near edge, height and depth its contacts declare (`HumanObstacle`). */
    obstacle: string;

    /** The leading foot; `right` when absent. */
    lead?: "left" | "right";
  }

  /** How far the lead foot lifts its toes as they pass over the obstacle's near side, degrees toes-up (provisional): the toe clears the edge with the ankle lower than a level foot's would be. */
  export const TOE_UP: number = 35;

  /** How far the trail foot rises on its ball while the pelvis leaves it during the lead swing, degrees toes-down (provisional, the forefoot rocker of a stance foot the body passes over, Perry and Burnfield). */
  export const PUSH: number = 30;

  /** Sole clearance over the obstacle's top, metres (provisional; Patla and Rietdyk 1993). */
  export const MARGIN: number = 0.1;

  /**
   * Plan a step over.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the prop declares no edge or depth, or the obstacle is too far, behind, too high or too deep to cross in one step.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const obstacle: HumanObstacle.IObstacle = HumanObstacle.of(
      context,
      context.params.obstacle,
    );
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

    if (near < 0.5 * m.footLength || near > leg)
      throw new HumanRefusal({
        kind: "reach",
        axis: "obstacle",
        value: near,
        feasible: {
          kind: "range",
          minimum: 0.5 * m.footLength,
          maximum: leg,
          unit: "m",
        },
        reason: `the obstacle's near side is ${near.toFixed(3)} m ahead; stand ${(0.5 * m.footLength).toFixed(3)} to ${leg.toFixed(3)} m before it`,
        fix: "stand before the obstacle within that distance of its near side",
      });
    if (obstacle.height > 0.55 * m.hipHeight)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "obstacle",
        value: obstacle.height,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: 0.55 * m.hipHeight,
          unit: "m",
        },
        reason: `an obstacle ${obstacle.height.toFixed(3)} m high is above the ${(0.55 * m.hipHeight).toFixed(3)} m this body steps over`,
        fix: "use an obstacle no higher than that",
      });
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
      throw new HumanRefusal({
        kind: "parameter",
        axis: "obstacle",
        value: obstacle.depth,
        reason: `an obstacle ${obstacle.depth.toFixed(3)} m deep is too deep to cross in one step`,
        fix: "use a shallower obstacle",
      });
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

    // Each swing takes the shortest path over what its sole must clear, the
    // taut string over the obstacle (`AutoMovieMotionHumanClearance`): every
    // sole point over the obstacle at least `MARGIN` above its top and every
    // other one on or above the floor. The trail foot leaves from its ball,
    // pitched as the pelvis left it, and levels by the time its toe reaches
    // the near side; the lead foot lifts its toes by up to `TOE_UP` as its
    // toe passes over the near side and is level again once its heel does,
    // so the ankle need not rise as high as a level foot's.
    const top: number = obstacle.height + MARGIN;
    const heeled = (
      side: "left" | "right",
      ankle: IAutoMovieVector3,
      pitch: number,
    ): HumanFoot.IPlacement =>
      pitch === 0
        ? flat(side, ankle)
        : HumanFoot.pivot(
            body,
            side,
            "mtp",
            HumanFoot.point(body, side, "mtp", flat(side, ankle)),
            heading(side),
            pitch,
          );
    const surface = (z: number): number => (z >= near && z <= far ? top : 0);
    const sole = (
      side: "left" | "right",
      pitch: number,
    ): AutoMovieMotionHumanClearance.IPoint[] =>
      (["heel", "ball", "toe"] as const).map((point) => {
        const at: IAutoMovieVector3 = HumanFrame.local(
          frame,
          HumanFoot.point(body, side, point, {
            ankle: origin,
            rotation: HumanFoot.rotation(heading(side), pitch),
          }),
        );
        return { z: at.z, y: at.y };
      });
    const smooth = (x: number, a: number, b: number): number =>
      b <= a
        ? x >= b
          ? 1
          : 0
        : minimumJerk(Math.min(1, Math.max(0, (x - a) / (b - a)))).s;
    const pitches = (
      side: "left" | "right",
      start: number,
      from: number,
    ): ((z: number) => number) => {
      const level: AutoMovieMotionHumanClearance.IPoint[] = sole(side, 0);
      const toe: number = near - level[2]!.z;
      const heel: number = near - level[0]!.z;
      return (z: number): number =>
        start * (1 - smooth(z, from, toe)) +
        (side === lead
          ? TOE_UP * (smooth(z, from, toe) - smooth(z, toe, heel))
          : 0);
    };
    const path = (
      side: "left" | "right",
      start: number,
    ): ((u: number) => HumanFoot.IPlacement) => {
      const a: IAutoMovieVector3 = HumanFrame.local(
        frame,
        heeled(side, feet[side], start).ankle,
      );
      const pitch = pitches(side, start, a.z);
      const b: IAutoMovieVector3 = HumanFrame.local(frame, end[side]);
      const line = AutoMovieMotionHumanClearance.path(
        { z: a.z, y: a.y },
        { z: b.z, y: b.y },
        (z: number): number =>
          Math.max(...sole(side, pitch(z)).map((p) => surface(z + p.z) - p.y)),
      );
      return (u: number): HumanFoot.IPlacement => {
        const at = line(minimumJerk(Math.min(1, Math.max(0, u))).s);
        return {
          ankle: HumanFrame.point(frame, {
            x: a.x + ((b.x - a.x) * (at.z - a.z)) / Math.max(1e-9, b.z - a.z),
            y: at.y,
            z: at.z,
          }),
          rotation: HumanFoot.rotation(heading(side), pitch(at.z)),
        };
      };
    };
    const swings: Record<
      "left" | "right",
      (u: number) => HumanFoot.IPlacement
    > = {
      [lead]: path(lead, 0),
      [trail]: path(trail, -PUSH),
    } as Record<"left" | "right", (u: number) => HumanFoot.IPlacement>;
    // The trail foot rises on its ball as the pelvis leaves it during the
    // lead swing, the forefoot rocker of a stance foot the body passes over.
    const rising = (t: number): number =>
      smooth(
        t,
        windows[lead][0],
        windows[lead][0] + 0.4 * (windows[lead][1] - windows[lead][0]),
      );
    const footAt = (
      side: "left" | "right",
      t: number,
    ): { placement: HumanFoot.IPlacement; planted: boolean } => {
      const [a, b] = windows[side];
      if (t <= a)
        return {
          placement:
            side === trail
              ? heeled(side, feet[side], -PUSH * rising(t))
              : flat(side, feet[side]),
          planted: true,
        };
      if (t >= b) return { placement: flat(side, end[side]), planted: true };
      return { placement: swings[side]((t - a) / (b - a)), planted: false };
    };
    // How far a sole socket at a frame-local place must stand above the floor.
    const needed = (p: IAutoMovieVector3): number =>
      surface(HumanFrame.local(frame, p).z);

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
    // The trail foot's heel rise lifts the pelvis as far as it lifts that
    // ankle, so the trail leg stands as straight as at the start while the
    // lead foot crosses, and the lift is shed as the trail foot swings.
    const hike: number =
      heeled(trail, feet[trail], -PUSH).ankle.y -
      flat(trail, feet[trail]).ankle.y;
    const hiked = (t: number): number =>
      rising(t) *
      (1 -
        smooth(
          t,
          windows[trail][0],
          (windows[trail][0] + windows[trail][1]) / 2,
        ));
    const rootAt = (t: number): IAutoMovieVector3 => {
      const s: number =
        0.5 * minimumJerk((t - 0.12 * duration) / (0.38 * duration)).s +
        0.5 * minimumJerk((t - 0.7 * duration) / (0.28 * duration)).s;
      return {
        x: startRoot.x + (endMid.x - startRoot.x) * s,
        y: startRoot.y + (endMid.y - startRoot.y) * s + hike * hiked(t),
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
        const toes: Record<"left" | "right", number> = { left: 0, right: 0 };
        for (const side of ["left", "right"] as const) {
          const f = footAt(side, t);
          const knee: IAutoMovieVector3 = HumanFrame.point(
            { origin: root, yaw },
            {
              ...body.rest.get(`${side}LowerLeg`)!,
              z: body.rest.get(`${side}LowerLeg`)!.z + 1,
            },
          );
          // A foot on its ball extends its toes so they stay on the floor.
          toes[side] = Math.max(0, -HumanFoot.pitch(f.placement.rotation));
          limbs[side === "left" ? "leftLeg" : "rightLeg"] = {
            point: f.placement.ankle,
            bend: knee,
            rotation: f.placement.rotation,
            ...(f.planted
              ? { planted: true, contact: HumanFoot.offset(body, side, "mtp") }
              : {}),
          };
        }
        // The trunk carries a walk's forward inclination over the step, the
        // pelvis's share tipping the body about the hips.
        const inclined = HumanTrunk.incline(
          standUpright.of(body).joints,
          walk.LEAN,
        );
        let posture: IHumanPosture = resolveHumanPosture.lower(
          body,
          AutoMovieMotionHumanLean.pivot(
            body,
            {
              root,
              yaw,
              pitch: 0,
              roll: 0,
              joints: {
                ...stand.RELAXED,
                ...inclined.joints,
                leftToes: [toes.left, 0, 0],
                rightToes: [toes.right, 0, 0],
              },
              limbs,
            },
            { pitch: inclined.pitch, roll: 0 },
          ),
        );
        // A swinging foot's leg reaches for its landing over the second half
        // of its swing, so the pelvis has come down to where that leg stands
        // when it lands rather than dropping at the contact.
        const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
          body,
          posture.root,
          resolveHumanPosture.heading(posture),
          posture.joints.hips,
        );
        let landing: number = 0;
        for (const side of ["left", "right"] as const) {
          const [a, b] = windows[side];
          if (t <= a || t >= b) continue;
          landing = Math.max(
            landing,
            smooth(t, (a + b) / 2, b) *
              resolveHumanPosture.short(body, hips[side], end[side], 5),
          );
        }
        if (landing > 0)
          posture = {
            ...posture,
            root: { ...posture.root, y: posture.root.y - landing },
          };

        // A swinging foot whose ankle cannot take the planned pitch droops its
        // toes, and raising its ankle folds the knee and droops them further,
        // so each swinging ankle rises by secant steps on its sole's deficit,
        // the most any sole socket stands under what it must clear there (the
        // step scaled by the last round's ankle-to-deficit ratio, 1 to 4),
        // until no socket is more than 2 mm under, in at most six rounds, so
        // the clearance holds on the sole itself.
        const lifted = (["left", "right"] as const).filter(
          (side) => !footAt(side, t).planted,
        );
        const last: Partial<
          Record<"left" | "right", { ankle: number; short: number }>
        > = {};
        for (let round: number = 0; round < 6 && lifted.length > 0; round++) {
          const bones = poseBones(body, resolveHumanPosture(body, posture));
          const next: IHumanPosture["limbs"] = { ...posture.limbs };
          let moved: boolean = false;
          for (const side of lifted) {
            const short: number = Math.max(
              ...HumanFoot.sockets(body, bones, side).map(
                (s: HumanFoot.ISocket): number => needed(s.point) - s.point.y,
              ),
            );
            if (short <= 0.002) continue;
            const limb: "leftLeg" | "rightLeg" =
              side === "left" ? "leftLeg" : "rightLeg";
            const goal = next[limb]!;
            const previous = last[side];
            const ratio: number =
              previous === undefined || previous.short - short < 1e-3
                ? 1
                : Math.min(
                    4,
                    Math.max(
                      1,
                      (goal.point.y - previous.ankle) /
                        Math.max(1e-4, previous.short - short),
                    ),
                  );
            last[side] = { ankle: goal.point.y, short };
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
