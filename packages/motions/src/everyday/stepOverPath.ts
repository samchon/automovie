import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import {
  AutoMovieMotionHumanClearance,
} from "../compose/AutoMovieMotionHumanClearance";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanObstacle } from "./HumanObstacle";
import { stepOver } from "./stepOver";

/**
 * A step over's footprints, timing and swings (`stepOver`): the obstacle's
 * checks, where each foot starts and lands, the swings' windows, and each
 * swing's shortest path over what its sole must clear, the taut string over
 * the obstacle (`AutoMovieMotionHumanClearance`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is planned and who reads it.
 * @evidence contracts/development/design.md#principled-representation The feet's half of one crossing's plan, read once by the plan's pelvis and postures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `stepOver.plan`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The margins and angles are `stepOver`'s named constants.
 */
export namespace stepOverPath {
  /**
   * The footprints, timing and swings of a step over.
   *
   * @param context The action's context.
   * @returns What the plan's pelvis and postures read: the body, the feet's sides, the heading, the start, the landing, the footprints, the timing and the feet at a second.
   * @throws {HumanRefusal} When the prop declares no edge or depth, or the obstacle is too far, behind, too high or too deep to cross in one step.
   */
  export function of(
    context: IHumanActionContext<stepOver.IParams>,
  ) {
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
    const duration: number =
      2.4 *
      Math.sqrt(m.hipHeight / 0.93) *
      AutoMovieMotionManner.of(context, context.params.manner).tempo;
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
    const top: number = obstacle.height + stepOver.MARGIN;
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
          ? stepOver.TOE_UP * (smooth(z, from, toe) - smooth(z, toe, heel))
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
      [trail]: path(trail, -stepOver.PUSH),
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
              ? heeled(side, feet[side], -stepOver.PUSH * rising(t))
              : flat(side, feet[side]),
          planted: true,
        };
      if (t >= b) return { placement: flat(side, end[side]), planted: true };
      return { placement: swings[side]((t - a) / (b - a)), planted: false };
    };
    // How far a sole socket at a frame-local place must stand above the floor.
    const needed = (p: IAutoMovieVector3): number =>
      surface(HumanFrame.local(frame, p).z);

    return {
      body,
      lead,
      trail,
      yaw,
      feet,
      origin,
      landing,
      restX,
      end,
      flat,
      duration,
      windows,
      heeled,
      smooth,
      rising,
      footAt,
      needed,
    };
  }
}
