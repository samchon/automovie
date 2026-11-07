import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import { accumulatePhysicalMotorTorques } from "./accumulatePhysicalMotorTorques";
import { physicalNativeVector } from "./physicalNativeVector";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalSupportPoint } from "./physicalSupportPoint";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Track explicitly enabled world endpoints through bounded forces, retaining all actual native motion. */
export function trackPhysicalSupports(input: {
  /** Provider and explicit endpoint actuator budgets. */ body: Simulation.IBody;
  /** Current admitted authored phase strengths. */ target: Simulation.ITarget;
  /** Interpolated world motor goals, including accepted recovery offsets. */ goals: Readonly<
    Record<string, ReturnType<typeof samplePhysicalTarget>>
  >;
  /** Native segment wrappers. */ segments: ReadonlyMap<string, RigidBody>;
  /** Native integration seconds. */ dt: number;
  /** An active recovery swing owns its endpoint force independently. */ recoveryBone?: string;
  /** Internal Cartesian demands accumulate through the same bounded joint motors. */ actuation?: Map<
    string,
    IAutoMovieVector3
  >;
  /** Actual floor constraints have priority over a stationary world-point task in internal actuation. */ constrained?: ReadonlySet<string>;
  /** Authored native segments have no endpoint force actuator. */ dynamic?: ReadonlySet<string>;
  /** Declared horizontal floor height, metres. */ floor: number;
  /** Existing admitted contact tolerance, metres. */ tolerance: number;
}): void {
  const policy: Simulation.IBody["supportTracking"] =
    input.body.supportTracking;
  if (!policy) return;
  for (const limb of policy.pattern.limbs) {
    const strength: number =
      input.target.strength *
      (input.target.supportStrength &&
      Object.hasOwn(input.target.supportStrength, limb.bone)
        ? input.target.supportStrength[limb.bone]!
        : 0);
    if (
      strength === 0 ||
      limb.bone === input.recoveryBone ||
      (input.dynamic && !input.dynamic.has(limb.bone))
    )
      continue;
    const rigid: RigidBody = input.segments.get(limb.bone)!;
    const actual: IAutoMovieVector3 = physicalNativeVector(
      physicalSupportPoint(
        { position: rigid.translation(), rotation: rigid.rotation() },
        limb.localPoint,
      ),
    );
    const goal: ReturnType<typeof samplePhysicalTarget> =
      input.goals[limb.bone]!;
    const desired: IAutoMovieVector3 = physicalSupportPoint(
      goal.pose,
      limb.localPoint,
    );
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      goal.pose.rotation,
      limb.localPoint ?? { x: 0, y: 0, z: 0 },
    );
    const velocity: IAutoMovieVector3 = Vector3.add(
      goal.velocity,
      Vector3.cross(goal.angularVelocity, offset),
    );
    if (
      input.actuation &&
      input.constrained?.has(limb.bone) &&
      !input.target.unavailableSupports?.includes(limb.bone) &&
      Vector3.length(velocity) <=
        64 * Number.EPSILON * Math.max(1, Vector3.length(desired) / input.dt) &&
      matchesFloor(limb)
    )
      continue;
    // The same stable finite-step force law as recovery is evaluated at the
    // actual endpoint. Its effective isolated mass keeps small carriers stable;
    // the articulation propagates the bounded force through the complete body.
    const force: IAutoMovieVector3 = Tracking.force(
      Vector3.subtract(desired, actual),
      Vector3.subtract(rigid.velocityAtPoint(actual), velocity),
      rigid.mass(),
      policy.stiffness * strength,
      policy.damping * strength,
      policy.maximumForce * strength,
      input.dt,
    );
    if (input.actuation)
      accumulatePhysicalMotorTorques({
        profile: input.body.profile,
        segments: input.segments,
        chain: limb.chain,
        carrier: limb.bone,
        point: actual,
        force,
        torque: { x: 0, y: 0, z: 0 },
        reverse: false,
        torques: input.actuation,
      });
    else rigid.addForceAtPoint(physicalNativeVector(force), actual, true);
  }

  /** A stationary task may yield to stance only while its declared surface geometry remains floor-compatible. Explicit witnesses all share the plane; otherwise the declared patch's lowest convex point owns contact. */
  function matchesFloor(
    limb: NonNullable<
      Simulation.IBody["supportTracking"]
    >["pattern"]["limbs"][number],
  ): boolean {
    const parts: P.ISegment[] = input.body.profile.segments.filter(
      (segment: P.ISegment): boolean =>
        (limb.contacts ?? [limb.bone]).includes(segment.bone),
    );
    if (limb.floorPoints?.length)
      return limb.floorPoints.every(
        (point: NonNullable<typeof limb.floorPoints>[number]): boolean => {
          const segment: P.ISegment = parts.find(
            (segment: P.ISegment): boolean => segment.bone === point.bone,
          )!;
          const compression: number = Math.max(
            0,
            ...segment.shapes.map(
              (shape: P.IShape): number =>
                input.body.profile.materials.find(
                  (material: P.IMaterial): boolean =>
                    material.id === shape.material,
                )!.maximumCompression ?? 0,
            ),
          );
          const clearance: number =
            physicalSupportPoint(
              input.goals[point.bone]!.pose,
              point.localPoint,
            ).y - input.floor;
          return (
            clearance <= input.tolerance &&
            clearance >= -compression - input.tolerance
          );
        },
      );
    const lowest: { height: number; compression: number } = parts
      .flatMap(
        (segment: P.ISegment): { height: number; compression: number }[] =>
          segment.shapes.map(
            (shape: P.IShape): { height: number; compression: number } => ({
              height: physicalShapeBounds(
                input.goals[segment.bone]!.pose,
                shape,
              ).min.y,
              compression:
                input.body.profile.materials.find(
                  (material: P.IMaterial): boolean =>
                    material.id === shape.material,
                )!.maximumCompression ?? 0,
            }),
          ),
      )
      .reduce(
        (
          minimum: { height: number; compression: number },
          candidate: { height: number; compression: number },
        ): typeof minimum =>
          candidate.height < minimum.height ? candidate : minimum,
        { height: Infinity, compression: 0 },
      );
    return (
      lowest.height <= input.floor + input.tolerance &&
      lowest.height >= input.floor - lowest.compression - input.tolerance
    );
  }
}
