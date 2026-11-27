import type {
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalTracking as Tracking } from "./AutoMoviePhysicalTracking";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { AutoMovieEnginePhysics } from "./AutoMovieEnginePhysics";
import { physicalShapeBoundsImplementation as Bounds } from "./internal/physicalShapeBoundsImplementation";
import { physicalSupportPoint } from "./internal/physicalSupportPoint";

/**
 * The input {@link AutoMoviePhysicalSupportTracking.track} reads for one body and one substep.
 * Each optional member widens the default: without a recovery bone every limb
 * may get force, without an actuation map forces act on the carriers, without
 * constrained limbs no stance yields and without a dynamic set every bone may
 * get an endpoint force.
 */
export namespace AutoMoviePhysicalSupportTracking {
  /**
   * Pull each enabled support endpoint toward its interpolated world goal with a
   * bounded force, leaving the rest of the body's motion to the solver.
   *
   * A limb's strength is the target's strength times its declared support
   * strength; a limb with none, the limb an active recovery swing owns, or a limb
   * on an authored segment gets no force. The force is the stable finite-step PD
   * law of `AutoMoviePhysicalTracking.force` on the endpoint's world error and
   * its velocity error against the goal point's velocity (`v + w x r`), with the
   * carrier's mass and the policy's stiffness, damping and maximum force scaled
   * by the strength, in newtons. Under internal actuation the force becomes joint
   * torques through `accumulatePhysicalMotorTorques`, and a stationary goal on a
   * patch that a real floor constraint already holds yields to that constraint
   * while its goal geometry stays floor-compatible (within the contact tolerance
   * above the floor and no deeper than the material compresses); otherwise it
   * acts on the carrier at the endpoint. An endpoint whose world position is not
   * finite throws instead of reaching the solver.
   *
   * @param input The body, target, goals, segment bodies, substep and actuation
   *   context.
   */
  export function track(
    input: AutoMoviePhysicalSupportTracking.IInput,
  ): void {
    const policy: IAutoMoviePhysicalSimulationInput.IBody["supportTracking"] =
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
        (input.recoveryBones?.includes(limb.bone) ?? false) ||
        (input.dynamic && !input.dynamic.has(limb.bone))
      )
        continue;
      const rigid: AutoMovieXpbdBody = input.segments.get(limb.bone)!;
      const actual: IAutoMovieVector3 = physicalSupportPoint(
        { position: rigid.translation(), rotation: rigid.rotation() },
        limb.localPoint,
      );
      const goal: IAutoMovieSamplePhysicalTarget.IResult =
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
      // A stationary support planted on the floor belongs to the balance under
      // internal actuation, touching this step or lifted a moment by a tipping
      // body: an endpoint spring on it would push it into the floor and pull it
      // back to its old world place, holding the body by its feet. The leg's
      // joints return a lifted one; only a moving or off-floor goal is tracked.
      if (
        input.actuation &&
        (input.constrained?.has(limb.bone) || !!input.body.balance) &&
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
        AutoMovieEnginePhysics.accumulatePhysicalMotorTorques({
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
      else rigid.addForceAtPoint(force, actual);
    }

    /*
     * A stationary task may yield to stance only while its declared surface
     * geometry remains floor-compatible. Explicit witnesses all share the plane;
     * otherwise the declared patch's lowest convex point owns contact.
     */
    function matchesFloor(limb: ILimb): boolean {
      const parts: IAutoMoviePhysicalSegment[] =
        input.body.profile.segments.filter(
          (segment: IAutoMoviePhysicalSegment): boolean =>
            (limb.contacts ?? [limb.bone]).includes(segment.bone),
        );
      if (limb.floorPoints?.length)
        return limb.floorPoints.every(
          (point: NonNullable<ILimb["floorPoints"]>[number]): boolean => {
            const segment: IAutoMoviePhysicalSegment = parts.find(
              (segment: IAutoMoviePhysicalSegment): boolean =>
                segment.bone === point.bone,
            )!;
            const compression: number = Math.max(
              0,
              ...segment.shapes.map((shape: IAutoMoviePhysicalShape): number =>
                compressionOf(shape),
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
      const lowest: ILowest = parts
        .flatMap((segment: IAutoMoviePhysicalSegment): ILowest[] =>
          segment.shapes.map(
            (shape: IAutoMoviePhysicalShape): ILowest => ({
              height: Bounds.physicalShapeBounds(input.goals[segment.bone]!.pose, shape)
                .min.y,
              compression: compressionOf(shape),
            }),
          ),
        )
        .reduce(
          (minimum: ILowest, candidate: ILowest): ILowest =>
            candidate.height < minimum.height ? candidate : minimum,
          { height: Infinity, compression: 0 },
        );
      return (
        lowest.height <= input.floor + input.tolerance &&
        lowest.height >= input.floor - lowest.compression - input.tolerance
      );
    }

    /*
     * A shape's material's maximum compression, metres; zero for a rigid
     * material.
     */
    function compressionOf(shape: IAutoMoviePhysicalShape): number {
      return (
        input.body.profile.materials.find(
          (material: IAutoMoviePhysicalMaterial): boolean =>
            material.id === shape.material,
        )!.maximumCompression ?? 0
      );
    }
  }

  /** What one support-tracking substep needs. */
  export interface IInput {
    /** The body: its profile and support-tracking policy. */
    body: IAutoMoviePhysicalSimulationInput.IBody;

    /**
     * The current admitted target: strength, support strengths and unavailable
     * supports.
     */
    target: IAutoMoviePhysicalSimulationInput.ITarget;

    /** Interpolated world goals by bone, including accepted recovery offsets. */
    goals: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>;

    /** The body's segment bodies by bone. */
    segments: ReadonlyMap<string, AutoMovieXpbdBody>;

    /** The solver substep, seconds. */
    dt: number;

    /**
     * The limbs an active recovery swing drives itself, a diagonal pair's both;
     * they get no force here.
     */
    recoveryBones?: readonly string[];

    /**
     * Joint torques by joint, N m, that internal actuation accumulates into;
     * absent, forces act on the carriers directly.
     */
    actuation?: Map<string, IAutoMovieVector3>;

    /** Limbs a real floor constraint holds this substep. */
    constrained?: ReadonlySet<string>;

    /**
     * Bones the solver owns; an authored segment gets no endpoint force.
     * Absent, every bone may.
     */
    dynamic?: ReadonlySet<string>;

    /** Declared horizontal floor height, metres. */
    floor: number;

    /** Admitted contact tolerance, metres. */
    tolerance: number;
  }
}

/*
 * A support limb of a body's support-tracking pattern.
 */
type ILimb = NonNullable<
  IAutoMoviePhysicalSimulationInput.IBody["supportTracking"]
>["pattern"]["limbs"][number];

/*
 * The lowest point of a patch's goal geometry and how deep its material may
 * compress.
 */
interface ILowest {
  /*
   * World height of the lowest convex point, metres.
   */
  height: number;

  /*
   * The material's maximum compression, metres; zero for a rigid one.
   */
  compression: number;
}
