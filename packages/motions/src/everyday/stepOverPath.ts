import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClearance,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanStepOver,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanClearance } from "../compose/AutoMovieMotionHumanClearance";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFootRotation } from "../posture/HumanFootRotation";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface One typed footprint/time plan and its factory, read by stepOver.plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The margins and angles are `stepOver`'s named constants.
 */
export namespace stepOverPath {
  /** The swings' windows as shares of the action: the lead from 8 % to 42 %, the trail from 50 % to 82 % (provisional, as `stepOver` states). */
  const WINDOWS: readonly [number, number, number, number] = [0.08, 0.42, 0.5, 0.82];

  /** How far beyond the far side the lead heel lands, as a share of the foot's length (provisional, as `stepOver` states). */
  const BEYOND: number = 0.1;

  /** The nearest the obstacle's near side may stand, as a share of the foot's length, so the lead toe does not start on it (provisional). */
  const NEAR: number = 0.5;

  /** The highest obstacle a standing step clears, as a share of the hip height (provisional, as `stepOver` states). */
  const HIGH: number = 0.55;

  /** A step's longest stride as a share of twice the leg's horizontal reach at a hip lowered to `LOW` of its height (provisional). */
  const STRIDE: number = 0.95;

  /** The hip's height over the stride's widest step, as a share of its standing height (provisional). */
  const LOW: number = 0.9;

  /** How far into the lead swing the trail heel has risen, as a share of the swing (provisional). */
  const RISE: number = 0.4;

  /** The fixed footprint geometry and random-access readers of one crossing. */
  export interface IPlan {
    /** The performer and its unchanged geometry. */
    body: IAutoMovieMotionHumanBody;

    /** The two feet in crossing order. */
    lead: "left" | "right";

    /** The foot that follows the lead. */
    trail: "left" | "right";

    /** The fixed heading, degrees. */
    yaw: number;

    /** Starting ankles, world metres. */
    feet: Record<"left" | "right", IAutoMovieVector3>;

    /** Each foot's fixed rest lateral coordinate, metres. */
    restX: (side: "left" | "right") => number;

    /** Ending ankles, world metres. */
    end: Record<"left" | "right", IAutoMovieVector3>;

    /** A flat foot at the given actual ankle, world metres. */
    flat: (side: "left" | "right", ankle: IAutoMovieVector3) => IAutoMovieMotionHumanFoot.IPlacement;

    /** Total action seconds. */
    duration: number;

    /** Toe-off and contact action seconds. */
    windows: Record<"left" | "right", [number, number]>;

    /** A foot pitched in degrees about its actual flat MTP contact. */
    heeled: (side: "left" | "right", ankle: IAutoMovieVector3, pitch: number) => IAutoMovieMotionHumanFoot.IPlacement;

    /** The same bounded minimum-jerk share over a scalar interval. */
    smooth: (x: number, a: number, b: number) => number;

    /** The trail heel's rise share at an action second. */
    rising: (seconds: number) => number;

    /** The actual placement and bearing state at an action second. */
    footAt: (side: "left" | "right", seconds: number) => { placement: IAutoMovieMotionHumanFoot.IPlacement; planted: boolean };

    /** Required sole height at an actual world point, metres. */
    needed: (side: "left" | "right", point: IAutoMovieVector3) => number;
  }

  /**
   * The footprints, timing and swings of a step over.
   *
   * @param context The action's context.
   * @returns What the plan's pelvis and postures read: the body, the feet's sides, the heading, the start, the footprints, the timing and the feet at a second.
   * @throws {HumanRefusal} When the prop declares no edge or depth, or the obstacle is too far, behind, too high or too deep to cross in one step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/obstacle geometry, footprint and action-time readers; the namespace supplies all clearance, angle and contact rules.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the same taut clearance path over every heel/ball/toe sample, original toe-up/trail-rocker pitch and minimum-jerk phase, binding only unchanged frame and socket prerequisites.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Obstacle admission precedes fixed frame/flat/pivot/socket preparation, the same pitch/profile path builder and random-access foot readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No footfall, obstacle bound, margin, pitch, path probe, strict phase comparison or minimum-jerk arithmetic changes; flat rotations remain fresh and explicit pivot contacts are actually evaluated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed heading axes, sole offsets and yaw/roll prefixes prepare once; one actual sole rotation serves all three original socket probes instead of reconstructing the same rotation three times.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One take fixes body, obstacle, frame, footprint headings and zero-toe sole geometry; each actual pitch, query point and second still evaluates its own dependent path/contact arithmetic.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned plan owns fixed footprint/socket/frame readers and two clearance paths until released; no sampled pose, queried foot placement or arbitrary-second cache is retained.
   */
  export function of(context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStepOver.IParams>): IPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
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
      y: (feet.left.y + feet.right.y) / 2 - m.ankleHeight,
      z: (feet.left.z + feet.right.z) / 2,
    };
    const frame: IAutoMovieMotionHumanFrame = { origin, yaw };
    const framed: HumanFrame.IPrepared = HumanFrame.prepare(frame);
    const near: number = framed.local(obstacle.at).z;
    const leg: number = m.thigh + m.shank;

    if (near < NEAR * m.footLength || near > leg)
      throw new HumanRefusal({
        kind: "reach",
        axis: "obstacle",
        value: near,
        feasible: {
          kind: "range",
          minimum: NEAR * m.footLength,
          maximum: leg,
          unit: "m",
        },
        reason: `the obstacle's near side is ${near.toFixed(3)} m ahead; stand ${(NEAR * m.footLength).toFixed(3)} to ${leg.toFixed(3)} m before it`,
        fix: "stand before the obstacle within that distance of its near side",
      });
    if (obstacle.height > HIGH * m.hipHeight)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "obstacle",
        value: obstacle.height,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: HIGH * m.hipHeight,
          unit: "m",
        },
        reason: `an obstacle ${obstacle.height.toFixed(3)} m high is above the ${(HIGH * m.hipHeight).toFixed(3)} m this body steps over`,
        fix: "use an obstacle no higher than that",
      });
    const far: number = near + obstacle.depth;
    const heelBack: number = -HumanFoot.offset(body, lead, "heel").z;
    const nearest: number = far + BEYOND * m.footLength + heelBack;
    const farthest: number =
      framed.local(feet[trail]).z +
      STRIDE *
        2 *
        Math.sqrt(
          Math.max(0, leg * leg - (LOW * m.hipHeight - m.ankleHeight) ** 2),
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
      Math.max(nearest, near + far - framed.local(feet[lead]).z),
    );

    // Footprints: each foot from its start to beside the other beyond the obstacle.
    const rest: Record<"left" | "right", number> = { left: body.rest.get("leftFoot")!.x, right: body.rest.get("rightFoot")!.x };
    const restX: IPlan["restX"] = (side: "left" | "right"): number => rest[side];
    const end: Record<"left" | "right", IAutoMovieVector3> = {
      left: framed.point({
        x: restX("left"),
        y: m.ankleHeight,
        z: landing,
      }),
      right: framed.point({
        x: restX("right"),
        y: m.ankleHeight,
        z: landing,
      }),
    };
    const heading: (side: "left" | "right") => number = (side: "left" | "right"): number =>
      yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT);
    const rotations: Record<"left" | "right", ReturnType<typeof HumanFoot.rotation>> = {
      left: HumanFoot.rotation(heading("left"), 0), right: HumanFoot.rotation(heading("right"), 0),
    };
    const pitched: Record<"left" | "right", ReturnType<typeof HumanFootRotation.prepare>> = {
      left: HumanFootRotation.prepare(heading("left"), 0), right: HumanFootRotation.prepare(heading("right"), 0),
    };
    const flat: IPlan["flat"] = (
      side: "left" | "right",
      ankle: IAutoMovieVector3,
    ): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle,
      rotation: { ...rotations[side] },
    });
    const duration: number =
      2.4 *
      Math.sqrt(m.hipHeight / 0.93) *
      AutoMovieMotionManner.of(context, context.params.manner).tempo;
    const leading: [number, number] = [WINDOWS[0] * duration, WINDOWS[1] * duration];
    const trailing: [number, number] = [WINDOWS[2] * duration, WINDOWS[3] * duration];
    const windows: Record<"left" | "right", [number, number]> =
      lead === "left"
        ? { left: leading, right: trailing }
        : { left: trailing, right: leading };

    // Each swing takes the shortest path over what its sole must clear, the
    // taut string over the obstacle (`AutoMovieMotionHumanClearance`): every
    // sole point over the obstacle at least `MARGIN` above its top and every
    // other one on or above the floor. The trail foot leaves from its ball,
    // pitched as the pelvis left it, and levels by the time its toe reaches
    // the near side; the lead foot lifts its toes by up to `TOE_UP` as its
    // toe passes over the near side and is level again once its heel does,
    // so the ankle need not rise as high as a level foot's.
    // The lead sole clears the top by `MARGIN`, the trail sole by `TRAIL`.
    const top: (side: "left" | "right") => number = (side: "left" | "right"): number =>
      obstacle.at.y - origin.y + obstacle.height + (side === lead ? stepOver.MARGIN : stepOver.TRAIL);
    const mtp: Record<"left" | "right", ReturnType<typeof HumanFoot.preparePoint>> = {
      left: HumanFoot.preparePoint(body, "left", "mtp"), right: HumanFoot.preparePoint(body, "right", "mtp"),
    };
    const rocking: Record<"left" | "right", ReturnType<typeof HumanFoot.preparePivot>> = {
      left: HumanFoot.preparePivot(body, "left", "mtp", mtp.left(flat("left", feet.left)), heading("left")),
      right: HumanFoot.preparePivot(body, "right", "mtp", mtp.right(flat("right", feet.right)), heading("right")),
    };
    const heeled: IPlan["heeled"] = (
      side: "left" | "right",
      ankle: IAutoMovieVector3,
      pitch: number,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      pitch === 0
        ? flat(side, ankle)
        : rocking[side](pitch, mtp[side](flat(side, ankle)));
    const surface: (side: "left" | "right", z: number) => number = (side: "left" | "right", z: number): number =>
      z >= near && z <= far ? top(side) : 0;
    const sockets: Record<"left" | "right", ReturnType<typeof HumanFoot.preparePoint>[]> = {
      left: HumanFoot.SOCKETS.map((point: IAutoMovieMotionHumanFoot.Socket): ReturnType<typeof HumanFoot.preparePoint> => HumanFoot.preparePoint(body, "left", point)),
      right: HumanFoot.SOCKETS.map((point: IAutoMovieMotionHumanFoot.Socket): ReturnType<typeof HumanFoot.preparePoint> => HumanFoot.preparePoint(body, "right", point)),
    };
    const sole: (side: "left" | "right", pitch: number) => IAutoMovieMotionHumanClearance.IPoint[] = (
      side: "left" | "right",
      pitch: number,
    ): IAutoMovieMotionHumanClearance.IPoint[] => {
      const foot: IAutoMovieMotionHumanFoot.IPlacement = { ankle: origin, rotation: pitched[side](pitch) };
      return sockets[side].map((point: ReturnType<typeof HumanFoot.preparePoint>): IAutoMovieMotionHumanClearance.IPoint => {
        const at: IAutoMovieVector3 = framed.local(point(foot));
        return { z: at.z, y: at.y };
      });
    };
    const smooth: IPlan["smooth"] = (x: number, a: number, b: number): number =>
      b <= a
        ? x >= b
          ? 1
          : 0
        : minimumJerk.share(Math.min(1, Math.max(0, (x - a) / (b - a))));
    const pitches: (side: "left" | "right", start: number, from: number) => (z: number) => number = (
      side: "left" | "right",
      start: number,
      from: number,
    ): ((z: number) => number) => {
      const level: IAutoMovieMotionHumanClearance.IPoint[] = sole(side, 0);
      const toe: number = near - level[2]!.z;
      const heel: number = near - level[0]!.z;
      return (z: number): number =>
        start * (1 - smooth(z, from, toe)) +
        (side === lead
          ? stepOver.TOE_UP * (smooth(z, from, toe) - smooth(z, toe, heel))
          : 0);
    };
    const path: (side: "left" | "right", start: number) => (u: number) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: "left" | "right",
      start: number,
    ): ((u: number) => IAutoMovieMotionHumanFoot.IPlacement) => {
      const a: IAutoMovieVector3 = framed.local(
        heeled(side, feet[side], start).ankle,
      );
      const pitch: (z: number) => number = pitches(side, start, a.z);
      const b: IAutoMovieVector3 = framed.local(end[side]);
      const across: number = b.x - a.x;
      const forward: number = Math.max(1e-9, b.z - a.z);
      const line: ReturnType<typeof AutoMovieMotionHumanClearance.path> = AutoMovieMotionHumanClearance.path(
        { z: a.z, y: a.y },
        { z: b.z, y: b.y },
        (z: number): number => {
          let height: number = -Infinity;
          for (const point of sole(side, pitch(z)))
            height = Math.max(height, surface(side, z + point.z) - point.y);
          return height;
        },
      );
      return (u: number): IAutoMovieMotionHumanFoot.IPlacement => {
        const at: IAutoMovieMotionHumanClearance.IPoint = line(minimumJerk.share(Math.min(1, Math.max(0, u))));
        return {
          ankle: framed.point({
            x: a.x + (across * (at.z - a.z)) / forward,
            y: at.y,
            z: at.z,
          }),
          rotation: pitched[side](pitch(at.z)),
        };
      };
    };
    const leadSwing: (u: number) => IAutoMovieMotionHumanFoot.IPlacement = path(lead, 0);
    const trailSwing: (u: number) => IAutoMovieMotionHumanFoot.IPlacement = path(trail, -stepOver.PUSH);
    const swings: Record<
      "left" | "right",
      (u: number) => IAutoMovieMotionHumanFoot.IPlacement
    > =
      lead === "left"
        ? { left: leadSwing, right: trailSwing }
        : { left: trailSwing, right: leadSwing };
    // The trail foot rises on its ball as the pelvis leaves it during the
    // lead swing, the forefoot rocker of a stance foot the body passes over.
    const riseFrom: number = windows[lead][0];
    const riseTo: number = windows[lead][0] + RISE * (windows[lead][1] - windows[lead][0]);
    const rising: IPlan["rising"] = (t: number): number =>
      smooth(
        t,
        riseFrom,
        riseTo,
      );
    const footAt: IPlan["footAt"] = (
      side: "left" | "right",
      t: number,
    ): { placement: IAutoMovieMotionHumanFoot.IPlacement; planted: boolean; } => {
      const [a, b]: [number, number] = windows[side];
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
    const needed: IPlan["needed"] = (side: "left" | "right", p: IAutoMovieVector3): number =>
      origin.y + surface(side, framed.local(p).z);

    return {
      body,
      lead,
      trail,
      yaw,
      feet,
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
