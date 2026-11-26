import { HUMANOID_REST_FRAME, Quaternion, Vector3, clampPose, decomposeJointRotation, hingedArmSwivel, physicalShapeBounds, prepareChainPlant, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHingedChainGeometry,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { fitSeatedAnkleCrossShape } from "./fitSeatedAnkleCrossShape";
import { fitSeatedAnkleCrossSweep } from "./fitSeatedAnkleCrossSweep";

interface ILegPose {
  hip: IAutoMovieJointPose;
  knee: IAutoMovieJointPose;
}

const RAD = Math.PI / 180;

/**
 * Surface convergence, metres, within the existing one-centimetre placement
 * fit.
 */
const SURFACE_PRECISION = 0.00005;

interface IReading {
  moving: fitSeatedAnkleCrossShape.IShape[];
  ankle: IAutoMovieVector3;
  order: number;
}

const ANGLES = ["flexion", "abduction", "twist"] as const;

function angleTravel(a: IAutoMovieJointPose, b: IAutoMovieJointPose): number {
  return ANGLES.reduce(
    (total, angle) => total + Math.abs((a[angle] ?? 0) - (b[angle] ?? 0)),
    0,
  );
}

/** Timing is a separate concern from the certified segment's angle curve. */
function interpolateSeatedAnkleCross(
  a: ILegPose,
  b: ILegPose,
  t: number,
): ILegPose {
  const angle = (a: number | null, b: number | null): number =>
    (a ?? 0) + ((b ?? 0) - (a ?? 0)) * t;
  const between = (
    from: IAutoMovieJointPose,
    to: IAutoMovieJointPose,
  ): IAutoMovieJointPose => ({
    bone: from.bone,
    flexion: angle(from.flexion, to.flexion),
    abduction: angle(from.abduction, to.abduction),
    twist: angle(from.twist, to.twist),
  });
  return { hip: between(a.hip, b.hip), knee: between(a.knee, b.knee) };
}

/**
 * Fit the ankle against the carrying leg's posed body; first travel outside
 * that leg, then over it, then settle vertically into its bearing region. The
 * seat, supporting leg, and planted foot keep the entry pose throughout.
 */
export function fitSeatedAnkleCross(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanEntryState,
  side: AutoMovieHumanSide,
  outward: IAutoMovieVector3,
  fitGap: number,
): readonly ILegPose[] | undefined {
  const carried = side === "left" ? "right" : "left";
  const upper = `${side}UpperLeg` as const;
  const lower = `${side}LowerLeg` as const;
  const foot = `${side}Foot` as const;
  const otherUpper = `${carried}UpperLeg` as const;
  const otherLower = `${carried}LowerLeg` as const;
  const upperAxes = body.poseResolution.jointAxes[upper];
  const lowerAxes = body.poseResolution.jointAxes[lower];
  if (upperAxes?.rotationOrder !== "flexion-abduction-twist") return undefined;

  const before = poseBones(body, entry.pose);
  const bearing = before.get(otherLower)!.worldPosition;
  const chain = prepareChainPlant(
    {
      skeleton: body.skeleton,
      pose: entry.pose,
      chain: { upper, lower, effector: foot },
      topology: body.topology,
      jointAxes: body.poseResolution.jointAxes,
      restFrames: HUMANOID_REST_FRAME,
    },
    undefined,
    body.poseResolution,
  );
  const range = chain?.upperDomain.constraint;
  const hinge = chain?.lowerDomain.constraint?.flexion;
  if (
    !chain ||
    !range?.flexion ||
    !range.abduction ||
    !range.twist ||
    !hinge ||
    range.swingTwist ||
    chain.lowerDomain.constraint?.swingTwist ||
    typeof chain.lowerDomain.constraint?.swingDeg === "number" ||
    [range.flexion, range.abduction].some(
      ({ min, max }) => min <= -180 || max >= 180,
    )
  )
    return undefined;
  const startHip = entry.pose.joints.find((joint) => joint.bone === upper);
  const startKnee = entry.pose.joints.find((joint) => joint.bone === lower);
  if (!startHip || !startKnee) return undefined;
  const start: ILegPose = {
    hip: startHip,
    knee: startKnee,
  };
  const carry = fitSeatedAnkleCrossShape.readShapes(
    body,
    new Set<AutoMovieHumanoidBone>([
      otherUpper,
      otherLower,
      `${carried}Foot`,
      `${carried}Toes`,
    ]),
  )(before);
  const surface = upperSurface(
    carry.filter(
      (item) => item.bone === otherUpper || item.bone === otherLower,
    ),
    bearing,
  );
  const readMoving = fitSeatedAnkleCrossShape.readShapes(
    body,
    new Set<AutoMovieHumanoidBone>([upper, lower, foot, `${side}Toes`]),
  );
  const standingFoot = readMoving(before).filter(({ bone }) => bone === foot);
  if (!surface || standingFoot.length === 0) return undefined;
  const outlineHeight =
    before.get(foot)!.worldPosition.y -
    Math.min(
      ...standingFoot.map(
        ({ pose, shape }) => physicalShapeBounds(pose, shape).min.y,
      ),
    );
  if (!(outlineHeight > 0)) return undefined;

  const check = clampPose.prepare(body.skeleton).joints;
  const admits = (leg: ILegPose): boolean =>
    [leg.hip, leg.knee].every((joint) => {
      const accepted = check(joint);
      return ANGLES.every(
        (angle) =>
          Math.abs((joint[angle] ?? 0) - (accepted[angle] ?? 0)) < 1e-8,
      );
    });
  const read = (leg: ILegPose): IReading => {
    const frames = poseBones(body, {
      ...entry.pose,
      joints: entry.pose.joints.map((joint) =>
        joint.bone === upper
          ? leg.hip
          : joint.bone === lower
            ? leg.knee
            : joint,
      ),
    });
    return {
      moving: readMoving(frames),
      ankle: frames.get(foot)!.worldPosition,
      order: Vector3.dot(
        Vector3.subtract(frames.get(lower)!.worldPosition, bearing),
        outward,
      ),
    };
  };
  // The adjoining thigh hulls overlap in an ordinary seated entry. All
  // independent leg pairs remain subject to the sweep clearance test.
  const pairClearance = fitSeatedAnkleCrossSweep(carry, surface.normal);
  const clearance = (reading: IReading, sweep: number): number => {
    let nearest = reading.order;
    for (const moving of reading.moving) {
      nearest = Math.min(nearest, moving.bounds.min.y);
      for (const fixed of carry) {
        if (moving.bone === upper && fixed.bone === otherUpper) continue;
        const separated = fitSeatedAnkleCrossShape.boundsGap(
          fixed.bounds,
          moving.bounds,
        );
        nearest = Math.min(
          nearest,
          separated > 0 ? separated : pairClearance(fixed, moving, sweep),
        );
      }
    }
    return nearest;
  };
  const geometry: IAutoMovieHingedChainGeometry = {
    upper: chain.upper,
    midOffset: chain.lowerOffset,
    midRest: chain.lowerRotation,
    endOffset: chain.effectorOffset,
    hinge: Quaternion.rotateVector(
      Quaternion.inverse(chain.lower.worldRotation),
      chain.hinge,
    ),
    target: { ...bearing, y: surface.y + outlineHeight / 2 },
    range: { min: hinge.min * RAD, max: hinge.max * RAD },
  };
  const at = (
    target: IAutoMovieVector3,
    swivel: number,
  ): ILegPose | undefined => {
    const shape = { ...geometry, target };
    const branch = hingedArmSwivel
      .branches(shape)
      ?.find(({ shortfall }) => shortfall <= fitGap);
    if (!branch) return undefined;
    const fit = hingedArmSwivel.pose(shape, branch.theta)(swivel);
    const leg = {
      hip: {
        bone: upper,
        ...decomposeJointRotation(
          fit.upper,
          upperAxes,
          HUMANOID_REST_FRAME[upper],
          chain.upperDomain,
        ),
      },
      knee: {
        bone: lower,
        ...decomposeJointRotation(
          fit.lower,
          lowerAxes,
          HUMANOID_REST_FRAME[lower],
          chain.lowerDomain,
        ),
      },
    };
    return admits(leg) ? leg : undefined;
  };
  // Read the exact displacement bound from the pose's shape extents. The
  // radii remain valid in all the subsequent rigid rotations about the bone.
  const radius = (
    frame: IAutoMovieVector3,
    row: fitSeatedAnkleCrossShape.IShape,
  ): number => {
    const { min, max } = row.bounds;
    return Math.hypot(
      Math.max(Math.abs(min.x - frame.x), Math.abs(max.x - frame.x)),
      Math.max(Math.abs(min.y - frame.y), Math.abs(max.y - frame.y)),
      Math.max(Math.abs(min.z - frame.z), Math.abs(max.z - frame.z)),
    );
  };
  const neutral = readMoving(before);
  const ankleAtEntry = before.get(foot)!.worldPosition;
  const footRadius = Math.max(
    ...neutral
      .filter(({ bone }) => bone === foot || bone === `${side}Toes`)
      .map((row) => radius(ankleAtEntry, row)),
  );
  const kneeRadius = Math.max(
    Vector3.length(chain.effectorOffset) + footRadius,
    ...neutral
      .filter(({ bone }) => bone === lower)
      .map((row) => radius(before.get(lower)!.worldPosition, row)),
  );
  const hipRadius = Math.max(
    Vector3.length(chain.lowerOffset) + kneeRadius,
    ...neutral
      .filter(({ bone }) => bone === upper)
      .map((row) => radius(before.get(upper)!.worldPosition, row)),
  );
  // The single-turn hip swing cap is a convex region: log(cos(flexion / 2))
  // + log(cos(abduction / 2)) is concave. Linear angles between admitted
  // endpoints therefore stay inside ROM.
  const certify = (a: ILegPose, b: ILegPose): boolean => {
    const bound =
      RAD *
      (hipRadius * angleTravel(a.hip, b.hip) +
        kneeRadius * angleTravel(a.knee, b.knee));
    const visit = (from: number, to: number): boolean => {
      const middle = (from + to) / 2;
      const placed = interpolateSeatedAnkleCross(a, b, middle);
      if (!admits(placed)) return false;
      const allowance = (bound * (to - from)) / 2;
      const gap = clearance(read(placed), allowance);
      if (gap <= 0) return false;
      if (gap > (bound * (to - from)) / 2) return true;
      if (bound * (to - from) < SURFACE_PRECISION / 8) return false;
      return visit(from, middle) && visit(middle, to);
    };
    return visit(0, 1);
  };

  // Choose the bearing position itself from the convex body witnesses. Try
  // both sides of the chart seam, in the engine's normal swivel increments.
  for (let step = 0; step < 360 / hingedArmSwivel.STEP; ++step) {
    const swivel =
      Math.ceil(step / 2) * (step % 2 === 0 ? -1 : 1) * hingedArmSwivel.STEP;
    let target = geometry.target;
    for (let correction = 0; correction < 12; ++correction) {
      const end = at(target, swivel);
      if (!end) break;
      const positioned = read(end);
      if (
        Vector3.distance(target, positioned.ankle) > fitGap ||
        positioned.order <= 0
      )
        break;
      const contact = Math.min(
        ...carry
          .filter((row) => row.bone === otherUpper || row.bone === otherLower)
          .flatMap((fixed) =>
            positioned.moving
              .filter((row) => row.bone === lower || row.bone === foot)
              .map((moving) =>
                fitSeatedAnkleCrossShape.distance(fixed, moving),
              ),
          ),
      );
      if (contact >= SURFACE_PRECISION / 2 && contact <= SURFACE_PRECISION) {
        const over = liftedAbove(end, positioned, outlineHeight, admits, read);
        if (!over || !certify(over, end)) break;
        for (const abduction of [range.abduction.max, range.abduction.min]) {
          for (
            let flexion = over.hip.flexion ?? 0;
            flexion <= range.flexion.max;
            flexion += hingedArmSwivel.STEP
          ) {
            const opened: ILegPose = {
              hip: { ...over.hip, flexion, abduction, twist: 0 },
              knee: end.knee,
            };
            if (
              admits(start) &&
              admits(opened) &&
              certify(start, opened) &&
              certify(opened, over)
            )
              return [start, opened, over, end];
          }
        }
        break;
      }
      target = {
        ...target,
        y: target.y + (SURFACE_PRECISION * 0.75 - contact) / surface.normal.y,
      };
    }
  }
  return undefined;
}

/** Interpolate the exact joint-space curve admitted by the fit. */
export namespace fitSeatedAnkleCross {
  /** Sample one fitted segment independently of its downstream timing. */
  export const interpolate = interpolateSeatedAnkleCross;
}

/** The record of `IUpperSurfaceResult`'s site. */
type IUpperSurfaceResult = { y: number; normal: IAutoMovieVector3 };

function upperSurface(
  rows: readonly fitSeatedAnkleCrossShape.IShape[],
  station: IAutoMovieVector3,
): IUpperSurfaceResult | undefined {
  let top: ReturnType<typeof upperSurface>;
  for (const { pose, shape, bounds } of rows) {
    const { min, max } = bounds;
    if (
      !(
        min.x <= station.x &&
        station.x <= max.x &&
        min.z <= station.z &&
        station.z <= max.z
      )
    )
      continue;
    for (let y = max.y + SURFACE_PRECISION; y >= min.y; ) {
      const point = { ...station, y };
      const result = AutoMovieEnginePhysics.physicalShapeNearest(pose, shape, point, point);
      if (result.distance <= SURFACE_PRECISION) {
        if (result.normal.y > 0 && (top === undefined || y > top.y))
          top = { y, normal: result.normal };
        break;
      }
      y -= result.distance;
    }
  }
  return top;
}

function liftedAbove(
  end: ILegPose,
  contact: IReading,
  height: number,
  admits: (leg: ILegPose) => boolean,
  read: (leg: ILegPose) => IReading,
): ILegPose | undefined {
  // Move over the carrying leg with the shin already in its landing
  // orientation. Lift by one measured ankle half-outline before crossing.
  const lift = (flexion: number): ILegPose => ({
    ...end,
    hip: { ...end.hip, flexion },
  });
  const origin = end.hip.flexion ?? 0;
  const from = contact.ankle;
  for (const sign of [1, -1]) {
    for (
      let amount = hingedArmSwivel.STEP;
      amount <= 180;
      amount += hingedArmSwivel.STEP
    ) {
      const over = lift(origin + sign * amount);
      if (!admits(over)) break;
      const raised = read(over).ankle;
      if (raised.y <= from.y) break;
      if (raised.y - from.y >= height / 2) return over;
    }
  }
  return undefined;
}
