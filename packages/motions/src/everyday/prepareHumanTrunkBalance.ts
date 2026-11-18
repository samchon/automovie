import { Vector3, convexHull2D, pointInHull, resolveAutoMovieCenterOfMass, wrapDegrees } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanJacobian } from "../posture/HumanJacobian";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** A stance can borrow the caller's synchronous FK and ROM metadata. */
type Balance = (
  posture: IAutoMovieMotionHumanPosture,
  weight: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
) => IAutoMovieMotionHumanPosture;

/** The clinical turn that tilts the upper body without moving the planted feet. */
const FLEXION: IAutoMovieMotionHumanJacobian.IVariable = {
  kind: "angle",
  bone: "spine",
  axis: 0,
};

/** A tilted mass centre is a fixed point plus cos and sin terms of the lumbar angle. */
interface IArc {
  /** The portion of the centre invariant under rotation, world metres. */
  fixed: IAutoMovieVector3;
  /** The radial term of the impact of the rotated subtree on the total mass centre. */
  radial: IAutoMovieVector3;
  /** The perpendicular term in the direction of a positive clinical turn. */
  tangent: IAutoMovieVector3;
}

/**
 * Tilt a supported trunk only enough to put its centre over its actual
 * foot support (Hof, Gazendam and Sinke 2005), by the spine's flexion axis.
 * The body below the spine is fixed. Rodrigues' formula gives the moved
 * mass centre at the intersection of its arc with a support edge.
 *
 * @param body The body whose segment masses, lumbar axis and sole frames are read.
 * @returns One instantaneous closed-form shift, scaled by the caller's weight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the mass centre, support, axis and instant-scoped correction.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the canonical mass points and Jacobian to express the posed centre's horizontal arc. Each hull edge yields two trigonometric intersections. The least legal angle that enters the foot hull is used.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose and mass placement, one rigid-subtree reduction, and one scan of the arc's support-boundary intersections.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The actual rig's mass, foot hull, lumbar axis and range apply. A centre already over the feet reads no correction, and an unattainable boundary stays visible to the audit.
 * @evidence contracts/development/implementation.md#efficient-algorithms One current pose and O(M) segment work per active evaluation. The bounded sole hull has H edges. At most 2H closed-form candidates each test H half-planes, with no trial pose.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One posed mass point serves both the whole centre and the rotated subset. The body and its demanded FK setup are fixed for the plan.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the body's fixed model and FK names. Current posed frames and arc candidates are released on return.
 */
export function prepareHumanTrunkBalance(body: IAutoMovieMotionHumanBody): Balance {
  if (!body.bones.has("spine")) return (posture: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture => posture;
  const model: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
  const names: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "spine",
    ...HumanFoot.bones(body),
    ...model.segments.map((segment: IAutoMovieResolveCenterOfMass.ISegment): AutoMovieHumanoidBone => segment.bone),
  ]);
  const readPose: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, names);
  return (
    posture: IAutoMovieMotionHumanPosture,
    weight: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IAutoMovieMotionHumanPosture => {
    if (weight <= 0) return posture;
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = readPose(
      resolveHumanPosture.seeded(body, posture, undefined, undefined, read, names, projection).pose,
      read(),
    );
    const hull: IAutoMovieVector3[] = convexHull2D(HumanFoot.base(body, bones));
    if (hull.length < 3) return posture;
    const pivot: IAutoMovieVector3 = bones.get("spine")!.worldPosition;
    const joint: ReturnType<typeof HumanJacobian.read> = HumanJacobian.read(
      body, posture, bones, [FLEXION], body.projection.joints,
    );
    const motion: IAutoMovieMotionHumanJacobian.IMotion = joint.motions[0]!;
    const spun: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.mean(
      model,
      (segment: IAutoMovieResolveCenterOfMass.ISegment): IAutoMovieVector3 => {
        const point: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.point(segment, bones.get(segment.bone)!);
        if (motion.moves?.has(segment.bone) === true) {
          const portion: number = segment.mass / model.mass;
          spun.x += portion * (point.x - pivot.x);
          spun.y += portion * (point.y - pivot.y);
          spun.z += portion * (point.z - pivot.z);
        }
        return point;
      },
    );
    if (pointInHull(centre, hull)) return posture;
    const angular: number = Vector3.length(motion.angular);
    if (angular === 0) return posture;
    const axis: IAutoMovieVector3 = Vector3.scale(motion.angular, 1 / angular);
    const radial: IAutoMovieVector3 = Vector3.addScaled(spun, axis, -Vector3.dot(spun, axis));
    const arc: IArc = {
      fixed: Vector3.subtract(centre, radial),
      radial,
      tangent: Vector3.cross(axis, radial),
    };
    const clamped: IAutoMovieJointPose = joint.clamped.get("spine")!;
    const flexion: number = clamped.flexion ?? 0;
    let nearest: number = Infinity;
    for (const radians of crossings(arc, hull)) {
      const degrees: number = radians / angular;
      if (Math.abs(degrees) >= Math.abs(nearest)) continue;
      const trial: IAutoMovieJointPose = body.projection.joints.values(
        "spine", flexion + degrees, clamped.abduction, clamped.twist,
      );
      if (trial.flexion !== flexion + degrees ||
          trial.abduction !== clamped.abduction || trial.twist !== clamped.twist) continue;
      const place: IAutoMovieVector3 = Vector3.addScaled(
        Vector3.addScaled(arc.fixed, arc.radial, Math.cos(radians)),
        arc.tangent,
        Math.sin(radians),
      );
      if (pointInHull(place, hull)) nearest = degrees;
    }
    if (!Number.isFinite(nearest)) return posture;
    return {
      ...posture,
      joints: {
        ...posture.joints,
        spine: [flexion + nearest * weight, clamped.abduction ?? 0, clamped.twist ?? 0],
      },
    };
  };
}

/** Angles in radians where the moving mass centre meets a hull edge's supporting line. */
function* crossings(arc: IArc, hull: readonly IAutoMovieVector3[]): Iterable<number> {
  for (const [index, point] of hull.entries()) {
    const edge: IAutoMovieVector3 = Vector3.subtract(hull[(index + 1) % hull.length]!, point);
    const inward: IAutoMovieVector3 = { x: -edge.z, y: 0, z: edge.x };
    const a: number = Vector3.dot(arc.radial, inward);
    const b: number = Vector3.dot(arc.tangent, inward);
    const c: number = Vector3.dot(Vector3.subtract(point, arc.fixed), inward);
    const radius: number = Math.hypot(a, b);
    if (radius === 0 || Math.abs(c) > radius) continue;
    const phase: number = Math.atan2(b, a);
    const angle: number = Math.acos(c / radius);
    for (const solution of [phase - angle, phase + angle])
      yield (wrapDegrees((solution * 180) / Math.PI) * Math.PI) / 180;
  }
}
