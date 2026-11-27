import {
  Quaternion,
  AutoMovieEngineMotionSampling,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTravelDoor,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieMotionObstacleAperture,
  IAutoMoviePhysicalShapeBounds,
  IAutoMoviePose,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../../gait/internal/walk";
import { AutoMovieMotionHumanSignature } from "../../audit/AutoMovieMotionHumanSignature";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanSegmentPlant } from "../../perform/internal/HumanSegmentPlant";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { planProneOpening } from "./planProneOpening";

/*
 * Stage a lowered, side-on or prone crossing of a fixed opening whose sill is
 * at floor height. A duck walks through with the pelvis lowered and the trunk
 * pitched while the root is within a leg length of the solid; a squeeze walks
 * side-on along a lane offset toward the back, re-centred once on the measured
 * envelope if that makes it fit; a crawl travels prone (`planProneOpening`).
 * The displayed body's collider envelope over the solid's whole depth must fit
 * the opening's width and height, or the crossing is refused with the dimension
 * the posed body needs.
 * Parameter context: The performer, selected action and scene.
 * Parameter obstacle: The fixed solid containing the named opening.
 * Parameter opening: Its world sill and clear dimensions.
 * Parameter out: Unit vector in the direction of travel.
 * Returns: A crossing whose displayed body fits through the depth.
 * For a moving or raised opening, or a sampled part
 * outside the clear opening.
 */
export function planReducedOpening(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTravelDoor.IParams>,
  obstacle: IAutoMovieMotionHumanObstacle,
  opening: IAutoMovieMotionObstacleAperture,
  out: IAutoMovieVector3,
): IAutoMovieMotionHumanActionPlan {
  const mode: IAutoMovieMotionHumanTravelDoor.IParams["mode"] =
    context.params.mode;
  if (obstacle.motion !== undefined || opening.at.y !== 0)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "aperture",
      value: opening.id,
      reason:
        "reduced travel needs a fixed opening with a level floor at its sill",
      fix: "name a stationary opening with its sill at floor height",
    });

  const frame: IAutoMovieMotionHumanFrame = {
    origin: opening.at,
    yaw: (Math.atan2(out.x, out.z) * 180) / Math.PI,
  };
  const local: HumanFrame.IPrepared = HumanFrame.prepare(frame);
  const footprint: IAutoMovieVector3[] = obstacle.footprint.map(local.local);
  const near: number = Math.min(
    ...footprint.map((point: IAutoMovieVector3): number => point.z),
  );
  const far: number = Math.max(
    ...footprint.map((point: IAutoMovieVector3): number => point.z),
  );
  const originalLane: number =
    mode === "squeeze" ? -SIDE_LANE * context.body.measure.hipHeight : 0;
  let plan: IAutoMovieMotionHumanActionPlan =
    mode === "crawl"
      ? planProneOpening(context, local, near, far)
      : planReducedWalk(
          context,
          obstacle.subject,
          frame,
          local,
          near,
          far,
          opening.height,
          originalLane,
        );
  let envelope: IOpeningEnvelope = measureOpening(
    context.body,
    plan,
    frame.yaw,
    local,
    near,
    far,
  );

  // A side step's knees and torso need not extend equally on both sides
  // of the root. If its span fits, center that measured envelope and re-fit
  // the actual feet along the offset line.
  if (
    mode === "squeeze" &&
    widthOf(envelope) > opening.width &&
    envelope.right - envelope.left + 2 * JAMB <= opening.width
  ) {
    const centered: number =
      originalLane - (envelope.left + envelope.right) / 2;
    plan = planReducedWalk(
      context,
      obstacle.subject,
      frame,
      local,
      near,
      far,
      opening.height,
      centered,
    );
    envelope = measureOpening(context.body, plan, frame.yaw, local, near, far);
  }
  const neededWidth: number = widthOf(envelope);
  const neededHeight: number = envelope.height + ROOM;
  const width: boolean = neededWidth > opening.width;
  const height: boolean = neededHeight > opening.height;
  if (width || height)
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "aperture",
      value: opening.id,
      feasible: {
        kind: "range",
        minimum: width ? neededWidth : neededHeight,
        maximum: null,
        unit: "m",
      },
      reason: `the ${mode} passage needs more ${width ? "width" : "headroom"} through ${opening.id}`,
      fix: "give the whole reduced pose more clearance at this opening",
    });

  return { ...plan, yields: [] };
}

/*
 * Extra clearance to leave around the forehead and jambs, in metres.
 */
const ROOM: number = 0.005;

/*
 * Extra horizontal margin at each jamb, in metres.
 */
const JAMB: number = 0.002;

/*
 * The side-on lane's offset toward the actor's back, hip heights (provisional:
 * the flexed knees and toes reach further forward than the back).
 */
const SIDE_LANE: number = 0.085;

/*
 * The side-on swing's toe lift over a level sill, metres (provisional: no riser
 * to clear).
 */
const SIDE_LIFT: number = 0.012;

/*
 * The most a side step raises the pelvis out of the forward gait's knee bend,
 * hip heights (provisional).
 */
const SIDE_RISE: number = 0.06;

/*
 * The share of the leg's length a raised pelvis leaves the stance leg, short of
 * a locked knee (provisional).
 */
const STRAIGHT: number = 0.997;

/*
 * The deepest duck, as a share of the hip height (provisional: a half squat).
 */
const DROP: number = 0.33;

/*
 * Clearance the duck adds under the lintel before the trunk's pitch, metres
 * (provisional).
 */
const HEAD_ROOM: number = 0.06;
/*
 * The duck's forward trunk pitch at its deepest, degrees (provisional).
 */
const PITCH: number = 19;

/*
 * The extrema of shapes that overlap the depth, in aperture-local metres.
 */
interface IOpeningEnvelope {
  left: number;
  right: number;
  height: number;
}

/*
 * Width at the current lateral placement, including both jamb margins.
 */
function widthOf(envelope: IOpeningEnvelope): number {
  return 2 * (Math.max(-envelope.left, envelope.right) + JAMB);
}

/*
 * Observe the fully fitted body throughout the depth of the fixed opening.
 */
function measureOpening(
  body: IAutoMovieMotionHumanBody,
  plan: IAutoMovieMotionHumanActionPlan,
  yaw: number,
  local: HumanFrame.IPrepared,
  near: number,
  far: number,
): IOpeningEnvelope {
  // Check the posed shape only when it intersects the solid's depth.
  // Project the already-posed shapes into aperture axes to measure the
  // lintel and jambs across the full thickness rather than the centre line.
  const inverse: IAutoMovieRigidTransform["rotation"] = HumanFrame.turn(-yaw);
  const project: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const envelope: IOpeningEnvelope = { left: 0, right: 0, height: 0 };
  for (const t of [
    ...AutoMovieMotionHumanSignature.times(0, plan.duration),
    plan.duration,
  ]) {
    const current: IAutoMovieMotionHumanPosture = plan.posture(t);
    const fit: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      current,
      undefined,
      undefined,
      undefined,
      undefined,
      project,
    ).pose;
    const resolved: IAutoMoviePose = HumanSegmentPlant.fit(
      body,
      prepareHumanPostureProjection.project(body, fit, project),
      current.limbs,
    ).pose;
    for (const segment of HumanColliders.placed(
      body,
      poseBones(body, resolved),
    )) {
      const parent: IAutoMovieRigidTransform = {
        position: local.local(segment.pose.position),
        rotation: Quaternion.multiply(inverse, segment.pose.rotation),
      };
      for (const shape of segment.shapes) {
        const bounds: IAutoMoviePhysicalShapeBounds.IResult =
          AutoMovieEnginePhysics.physicalShapeBounds(parent, shape);
        if (bounds.max.z < near - ROOM || bounds.min.z > far + ROOM) continue;
        envelope.left = Math.min(envelope.left, bounds.min.x);
        envelope.right = Math.max(envelope.right, bounds.max.x);
        envelope.height = Math.max(envelope.height, bounds.max.y);
      }
    }
  }
  return envelope;
}

/*
 * Fit the standing gait to the doorway without sending its feet off their
 * marks.
 */
function planReducedWalk(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTravelDoor.IParams>,
  through: string,
  frame: IAutoMovieMotionHumanFrame,
  local: HumanFrame.IPrepared,
  near: number,
  far: number,
  height: number,
  lane: number,
): IAutoMovieMotionHumanActionPlan {
  const sideOn: boolean = context.params.mode === "squeeze";

  // Put both changes of posture outside the whole solid, with room for a
  // reaching foot before and behind the pelvis.
  const leg: number = context.body.measure.hipHeight;
  const fringe: number = leg;
  // With the hips side-on, the toes and flexed knees occupy more space
  // toward the actor's front. Offset the stance toward its back and use a
  // low swing over the level sill, where there is no riser to clear.
  const along = (z: number): IAutoMovieVector3 =>
    local.point({ x: lane, y: 0, z });
  const gaitContext: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkParams> =
    {
      ...context,
      obstacles: (): readonly IAutoMovieMotionHumanObstacle[] =>
        context
          .obstacles()
          .filter(
            (candidate: IAutoMovieMotionHumanObstacle): boolean =>
              candidate.subject !== through,
          ),
      params: {
        to: along(far + fringe * 1.5),
        ...(local.local(context.entry.posture.root).z < near - fringe * 0.75
          ? { via: [along(near - fringe * 0.75)] }
          : {}),
        pace: context.params.pace ?? "slow",
        armSwing: 0,
        face: frame.yaw,
        ...(sideOn ? { facing: { yaw: frame.yaw + 90 } } : {}),
      },
    };

  const gait: IAutoMovieMotionHumanWalkGait = walk.walking(
    walk.FROUDE[gaitContext.params.pace ?? "slow"],
  );
  const walked: IAutoMovieMotionHumanActionPlan = sideOn
    ? walk.locomote(gaitContext, { ...gait, lift: SIDE_LIFT })
    : walk.plan(gaitContext);

  // Marry the walk's actual rooted feet to an eased change in pelvis height
  // and torso pitch. The ordinary leg resolver refits the same stance goals.
  const drop: number = Math.max(
    0,
    Math.min(DROP * leg, context.body.measure.stature - height + HEAD_ROOM),
  );
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
  ): IAutoMovieMotionHumanPosture => {
    const base: IAutoMovieMotionHumanPosture = walked.posture(...args);
    const depth: number = local.local(base.root).z;
    const outside: number = Math.max(0, near - depth, depth - far);
    const lowered: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(1, Math.max(0, (fringe - outside) / (fringe * 0.5))),
    );
    if (sideOn) return sideStepPosture(context.body, base, lowered);
    return lowered === 0
      ? base
      : {
          ...base,
          root: { ...base.root, y: base.root.y - drop * lowered },
          pitch: base.pitch + PITCH * lowered,
        };
  };

  return { ...walked, posture };
}

/*
 * Ease a side step out of the normal forward gait's knee bend.
 */
function sideStepPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  weight: number,
): IAutoMovieMotionHumanPosture {
  if (weight === 0) return posture;
  const hips: ReturnType<typeof hipJoints> = hipJoints(
    body,
    posture.root,
    humanPostureHeading(posture),
    posture.joints.hips,
  );
  const length: number = (body.measure.thigh + body.measure.shank) * STRAIGHT;
  let rise: number = SIDE_RISE * body.measure.hipHeight;
  for (const side of ["left", "right"] as const) {
    const ankle: IAutoMovieVector3 | undefined =
      posture.limbs[`${side}Leg`]?.point;
    if (ankle === undefined) continue;
    const hip: IAutoMovieVector3 = hips[side];
    const horizontalSquared: number =
      (ankle.x - hip.x) ** 2 + (ankle.z - hip.z) ** 2;
    const reach: number = Math.sqrt(
      Math.max(0, length * length - horizontalSquared),
    );
    rise = Math.min(rise, ankle.y + reach - hip.y);
  }
  return rise <= 0
    ? posture
    : {
        ...posture,
        root: { ...posture.root, y: posture.root.y + rise * weight },
      };
}
