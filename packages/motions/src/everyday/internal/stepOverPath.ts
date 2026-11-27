import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanStepOver,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { walkRoot } from "../../actions/internal/walkRoot";
import { motionManner } from "../../compose/internal/motionManner";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFootRotation } from "../../posture/internal/HumanFootRotation";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanObstacle } from "./HumanObstacle";
import { stepOver } from "./stepOver";
import { stepOverLanding } from "./stepOverLanding";
import { stepOverPathSwing } from "./stepOverPathSwing";

/*
 * The footprints, timing and swings of a step over.
 * Parameter context: The action's context.
 * Returns: What the plan's pelvis and postures read: the body, the feet's
 * sides, the heading, the start, the footprints, the timing and the feet at a
 * second.
 * When the prop declares no edge or depth, or the
 * obstacle is too far, behind, too high or too deep to cross in one step.
 */
export function stepOverPath(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStepOver.IParams>,
): stepOverPath.IPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const obstacle: HumanObstacle.IObstacle = HumanObstacle(
    context,
    context.params.obstacle,
    context.entry.posture.root,
  );
  const lead: AutoMovieHumanSide = context.params.lead ?? "right";
  const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const yaw: number = context.entry.posture.yaw;
  const feet: Record<AutoMovieHumanSide, IAutoMovieVector3> = stand.feet(
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

  // A foot whose toe already stands over the near side starts inside the
  // obstacle: the nearest admitted near side is the farther toe as entered.
  const toes: number = Math.max(
    framed.local(HumanFoot.point(body, "left", "toe", context.entry.feet.left))
      .z,
    framed.local(
      HumanFoot.point(body, "right", "toe", context.entry.feet.right),
    ).z,
  );
  if (near < toes || near > leg)
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "obstacle",
      value: near,
      feasible: {
        kind: "range",
        minimum: toes,
        maximum: leg,
        unit: "m",
      },
      reason: `the obstacle's near side is ${near.toFixed(3)} m ahead; stand ${toes.toFixed(3)} to ${leg.toFixed(3)} m before it`,
      fix: "stand before the obstacle within that distance of its near side",
    });
  if (obstacle.height > HIGH * m.hipHeight)
    throw new AutoMovieMotionHumanRefusal({
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
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "obstacle",
      value: obstacle.depth,
      reason: `an obstacle ${obstacle.depth.toFixed(3)} m deep is too deep to cross in one step`,
      fix: "use a shallower obstacle",
    });
  // Footprints: each foot from its start to beside the other beyond the
  // obstacle, on the floor it left or on the named landing surface.
  const rest: Record<AutoMovieHumanSide, number> = {
    left: body.rest.get("leftFoot")!.x,
    right: body.rest.get("rightFoot")!.x,
  };
  const restX: stepOverPath.IPlan["restX"] = (
    side: AutoMovieHumanSide,
  ): number => rest[side];
  const { height: ground, z: landing }: stepOverLanding.ILanding =
    stepOverLanding(
      context,
      framed,
      rest,
      nearest,
      Math.min(
        farthest,
        Math.max(nearest, near + far - framed.local(feet[lead]).z),
      ),
    );
  const end: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: framed.point({
      x: restX("left"),
      y: ground + m.ankleHeight,
      z: landing,
    }),
    right: framed.point({
      x: restX("right"),
      y: ground + m.ankleHeight,
      z: landing,
    }),
  };
  const heading: (side: AutoMovieHumanSide) => number = (
    side: AutoMovieHumanSide,
  ): number => yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT);
  const rotations: Record<
    AutoMovieHumanSide,
    ReturnType<typeof HumanFoot.rotation>
  > = {
    left: HumanFoot.rotation(heading("left"), 0),
    right: HumanFoot.rotation(heading("right"), 0),
  };
  const pitched: Record<
    AutoMovieHumanSide,
    ReturnType<typeof HumanFootRotation.prepare>
  > = {
    left: HumanFootRotation.prepare(heading("left"), 0),
    right: HumanFootRotation.prepare(heading("right"), 0),
  };
  const flat: stepOverPath.IPlan["flat"] = (
    side: AutoMovieHumanSide,
    ankle: IAutoMovieVector3,
  ): IAutoMovieMotionHumanFoot.IPlacement => ({
    ankle,
    rotation: { ...rotations[side] },
  });
  const duration: number =
    2.4 *
    Math.sqrt(m.hipHeight / walkRoot.REFERENCE_HIP) *
    motionManner(context, context.params.manner).tempo;
  const leading: [number, number] = [
    WINDOWS[0] * duration,
    WINDOWS[1] * duration,
  ];
  const trailing: [number, number] = [
    WINDOWS[2] * duration,
    WINDOWS[3] * duration,
  ];
  const windows: Record<AutoMovieHumanSide, [number, number]> =
    lead === "left"
      ? { left: leading, right: trailing }
      : { left: trailing, right: leading };

  const {
    top,
    heeled,
    surface,
    smooth,
    departure,
    summit,
    envelopes,
    path,
  }: stepOverPathSwing.ISwing = stepOverPathSwing({
    body,
    obstacle,
    origin,
    framed,
    near,
    far,
    ground,
    lead,
    trail,
    feet,
    end,
    heading,
    pitched,
    flat,
  });
  const leadSwing: (u: number) => IAutoMovieMotionHumanFoot.IPlacement = path(
    lead,
    0,
  );
  const trailSwing: (u: number) => IAutoMovieMotionHumanFoot.IPlacement = path(
    trail,
    -stepOver.PUSH,
  );
  const swings: Record<
    AutoMovieHumanSide,
    (u: number) => IAutoMovieMotionHumanFoot.IPlacement
  > =
    lead === "left"
      ? { left: leadSwing, right: trailSwing }
      : { left: trailSwing, right: leadSwing };
  // The trail foot rises on its ball as the pelvis leaves it during the
  // lead swing, the forefoot rocker of a stance foot the body passes over.
  const riseFrom: number = windows[lead][0];
  const riseTo: number =
    windows[lead][0] + RISE * (windows[lead][1] - windows[lead][0]);
  const rising: stepOverPath.IPlan["rising"] = (t: number): number =>
    smooth(t, riseFrom, riseTo);
  const footAt: stepOverPath.IPlan["footAt"] = (
    side: AutoMovieHumanSide,
    t: number,
  ): IOfFootAtResult => {
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
  const needed: stepOverPath.IPlan["needed"] = (
    side,
    socket,
    point,
  ): number => {
    const z: number = framed.local(point).z;
    return origin.y + (side === lead ? envelopes[socket](z) : surface(side, z));
  };
  const finishOf: (socket: IAutoMovieMotionHumanFoot.Socket) => number = (
    socket: IAutoMovieMotionHumanFoot.Socket,
  ): number =>
    framed.local(HumanFoot.point(body, trail, socket, flat(trail, end[trail])))
      .z;
  const finishes: Record<IAutoMovieMotionHumanFoot.Socket, number> = {
    heel: finishOf("heel"),
    ball: finishOf("ball"),
    toe: finishOf("toe"),
  };
  const advance: stepOverPath.IPlan["advance"] = (
    ankle,
    socket,
    point,
  ): number => {
    const z: number = framed.local(point).z;
    if (framed.local(ankle).z <= far || z < near || z > far) return Infinity;
    const fallen: number = Math.min(
      1,
      Math.max(0, 1 - (point.y - origin.y - ground) / (top(trail) - ground)),
    );
    return far + (finishes[socket] - far) * fallen - z;
  };
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
    rocker: (height: number): number => smooth(height, departure, summit),
    footAt,
    needed,
    advance,
  };
}

/*
 * A step over's footprints, timing and swings (`stepOver`): the obstacle's
 * checks, where each foot starts and lands, the swings' windows, and each
 * swing's shortest path over what its sole must clear, the taut string over the
 * obstacle (`AutoMovieMotionHumanClearance`).
 */
export namespace stepOverPath {
  /*
   * The fixed footprint geometry and random-access readers of one crossing.
   */
  export interface IPlan {
    /*
     * The performer and its unchanged geometry.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The two feet in crossing order.
     */
    lead: AutoMovieHumanSide;

    /*
     * The foot that follows the lead.
     */
    trail: AutoMovieHumanSide;

    /*
     * The fixed heading, degrees.
     */
    yaw: number;

    /*
     * Starting ankles, world metres.
     */
    feet: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /*
     * Each foot's fixed rest lateral coordinate, metres.
     */
    restX: (side: AutoMovieHumanSide) => number;

    /*
     * Ending ankles, world metres.
     */
    end: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /*
     * A flat foot at the given actual ankle, world metres.
     */
    flat: (
      side: AutoMovieHumanSide,
      ankle: IAutoMovieVector3,
    ) => IAutoMovieMotionHumanFoot.IPlacement;

    /*
     * Total action seconds.
     */
    duration: number;

    /*
     * Toe-off and contact action seconds.
     */
    windows: Record<AutoMovieHumanSide, [number, number]>;

    /*
     * A foot pitched in degrees about its actual flat MTP contact.
     */
    heeled: (
      side: AutoMovieHumanSide,
      ankle: IAutoMovieVector3,
      pitch: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement;

    /*
     * The same bounded minimum-jerk share over a scalar interval.
     */
    smooth: (x: number, a: number, b: number) => number;

    /*
     * The trail heel's rise share at an action second.
     */
    rising: (seconds: number) => number;

    /*
     * The settled lead foot's rocker share as the trailing ankle lifts over the
     * obstacle.
     */
    rocker: (ankleHeight: number) => number;

    /*
     * The actual placement and bearing state at an action second.
     */
    footAt: (side: AutoMovieHumanSide, seconds: number) => IPlanFootAt;

    /*
     * Required world height at a fitted socket, including the approach and
     * landing ramps for the lead foot.
     */
    needed: (
      side: AutoMovieHumanSide,
      socket: IAutoMovieMotionHumanFoot.Socket,
      point: IAutoMovieVector3,
    ) => number;

    /*
     * Forward correction on the trail socket's landing ramp past the far face,
     * infinity elsewhere.
     */
    advance: (
      ankle: IAutoMovieVector3,
      socket: IAutoMovieMotionHumanFoot.Socket,
      point: IAutoMovieVector3,
    ) => number;
  }
}

/*
 * The swings' windows as shares of the action: the lead from 8 % to 42 %, the
 * trail from 50 % to 82 % (provisional, as `stepOver` states).
 */
const WINDOWS: readonly [number, number, number, number] = [
  0.08, 0.42, 0.5, 0.82,
];

/*
 * How far beyond the far side the lead heel lands, as a share of the foot's
 * length (provisional, as `stepOver` states).
 */
const BEYOND: number = 0.1;

/*
 * The highest obstacle a standing step clears, as a share of the hip height
 * (provisional, as `stepOver` states).
 */
const HIGH: number = 0.55;

/*
 * A step's longest stride as a share of twice the leg's horizontal reach at a
 * hip lowered to `LOW` of its height (provisional).
 */
const STRIDE: number = 0.95;

/*
 * The hip's height over the stride's widest step, as a share of its standing
 * height (provisional).
 */
const LOW: number = 0.9;

/*
 * How far into the lead swing the trail heel has risen, as a share of the swing
 * (provisional).
 */
const RISE: number = 0.4;

/*
 * The record of `IOfFootAtResult`'s site.
 */
type IOfFootAtResult = {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  planted: boolean;
};

/*
 * The record of `IPlanFootAt`'s site.
 */
type IPlanFootAt = {
  placement: IAutoMovieMotionHumanFoot.IPlacement;
  planted: boolean;
};
