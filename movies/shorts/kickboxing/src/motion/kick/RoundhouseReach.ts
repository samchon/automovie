import * as THREE from "three";

import type { MotionAction } from "../core/MotionAction";

/**
 * Geometry-derived knee and ankle guides for an actual rigid shin witness.
 *
 * @evidence contracts/common.md#implementation-and-ownership Sphere intersection constructs the knee from the measured thigh length and knee-to-contact distance. A rigid delta rotation maps the actual shin/ankle vectors together. This supplies an anatomical seed and explicit reach deficit instead of treating the whole leg length as shin-contact reach. Constant-size vector math owns no host objects; clinical ROM, support and surfaces remain the real consumer's constraints.
 * @evidence contracts/common.md#authoring-interface All points use the same actor-local metre frame. Pole chooses the bend-plane side. Unreachable targets remain unchanged in result.target; feasible is geometric only and never admits clinical range, balance or contact.
 */
export namespace RoundhouseReach {
  /**
   * Measured triangle and rigid distal segment from the displayed initial pose.
   *
   * @evidence contracts/common.md#implementation-and-ownership Real hip/knee/ankle/contact points identify the actual contact lever arm, preventing an upper-calf probe from borrowing the entire shin's reach.
   * @evidence contracts/common.md#authoring-interface These actor-local metre points and positive thigh length must belong to the same pose and person. An interior or surface shin point retains its exact real bone-local binding in the owning action.
   */
  export interface Geometry {
    /** Actual acting hip centre. */
    hip: MotionAction.Vec3;
    /** Actual initial knee centre. */
    knee: MotionAction.Vec3;
    /** Actual initial ankle centre. */
    ankle: MotionAction.Vec3;
    /** Actual initial bone-bound shin contact point. */
    contact: MotionAction.Vec3;
    /** Actual neutral hip-to-knee length, metres. */
    thighMetres: number;
  }

  /**
   * Requested target plus anatomical guides and explicit radial feasibility.
   *
   * @evidence contracts/common.md#implementation-and-ownership The target retains caller identity while knee/ankle guides describe the nearest valid two-link radial construction, with any deficit separately exposed. No target, bone or collision geometry is shortened.
   * @evidence contracts/common.md#authoring-interface A zero deficit is only the triangle-inequality test; actual clinical axes, floor and whole-limb surface queries must still succeed on the same final pose.
   */
  export interface Result {
    /** Original caller target, never range-clamped. */
    target: MotionAction.Vec3;
    /** Knee guide in the chosen bend plane. */
    knee: MotionAction.Vec3;
    /** Ankle guide carried rigidly with the real shin point. */
    ankle: MotionAction.Vec3;
    /** Triangle interval within a 1 nm arithmetic allowance, independently of host admission. */
    feasible: boolean;
    /** Distance outside that interval, metres. */
    deficitMetres: number;
    /** Maximum hip-to-this-witness distance, not ankle or foot reach. */
    maximumReachMetres: number;
    /** Optional actual clinical fit error from the action; the radial constructor alone does not supply this. */
    clinicalErrorMetres?: number;
  }

  /**
   * Construct side-selected knee and rigid ankle targets without a host or IK iteration.
   *
   * @evidence contracts/common.md#implementation-and-ownership The law of cosines gives the intersection-circle centre/radius. A projected pole chooses a point on that circle; a deterministic nonparallel axis handles a collinear pole. A minimal quaternion rotation carries the original ankle/contact relation exactly. Out-of-range requests retain their raw target and positive deficit rather than creating an accepted shortened strike. The 1 nm radial comparison allowance addresses floating arithmetic only and changes no host tolerance.
   * @evidence contracts/common.md#authoring-interface Requires arrays with exactly three occupied own finite coordinates, a nonzero shin lever and positive thigh metres. Sparse, missing or extra coordinates refuse before vector construction. Returns independent tuples; collinear or fully extended configurations remain finite. The anatomical clinical solver and real support/mesh inspection own admission.
   */
  export function solve(
    geometry: Geometry,
    target: MotionAction.Vec3,
    pole: MotionAction.Vec3,
  ): Result {
    const points: MotionAction.Vec3[] = [
      geometry.hip,
      geometry.knee,
      geometry.ankle,
      geometry.contact,
      target,
      pole,
    ];
    if (
      !points.every(
        (point: MotionAction.Vec3): boolean =>
          Array.isArray(point) &&
          point.length === 3 &&
          [0, 1, 2].every(
            (axis: number): boolean =>
              Object.hasOwn(point, axis) && Number.isFinite(point[axis]),
          ),
      ) ||
      !Number.isFinite(geometry.thighMetres) ||
      geometry.thighMetres <= 0
    )
      throw new Error("Roundhouse reach requires finite measured geometry");
    const hip: THREE.Vector3 = new THREE.Vector3(...geometry.hip);
    const initialKnee: THREE.Vector3 = new THREE.Vector3(...geometry.knee);
    const initialContact: THREE.Vector3 = new THREE.Vector3(
      ...geometry.contact,
    ).sub(initialKnee);
    const lever: number = initialContact.length();
    if (lever <= 1e-7)
      throw new Error(
        "Roundhouse contact must be distinct from the knee centre",
      );
    const offset: THREE.Vector3 = new THREE.Vector3(...target).sub(hip);
    const distance: number = offset.length();
    const axis: THREE.Vector3 =
      distance > 1e-9
        ? offset.clone().divideScalar(distance)
        : new THREE.Vector3(1, 0, 0);
    const upper: number = geometry.thighMetres;
    const minimum: number = Math.abs(upper - lever);
    const maximum: number = upper + lever;
    const deficit: number = Math.max(0, minimum - distance, distance - maximum);

    // The guides retain segment lengths even when the raw target is out of range; deficit exposes that incompatibility.
    const span: number = Math.max(
      1e-9,
      Math.max(minimum, Math.min(maximum, distance)),
    );
    const along: number =
      (upper * upper - lever * lever + span * span) / (2 * span);
    const radius: number = Math.sqrt(
      Math.max(0, upper * upper - along * along),
    );
    const bend: THREE.Vector3 = new THREE.Vector3(...pole).sub(hip);
    bend.addScaledVector(axis, -bend.dot(axis));
    if (bend.lengthSq() < 1e-14) {
      const alternative: THREE.Vector3 =
        Math.abs(axis.y) < 0.8
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(0, 0, 1);
      bend.copy(alternative).addScaledVector(axis, -alternative.dot(axis));
    }
    bend.normalize();
    const knee: THREE.Vector3 = hip
      .clone()
      .addScaledVector(axis, along)
      .addScaledVector(bend, radius);
    const reachableContact: THREE.Vector3 = hip
      .clone()
      .addScaledVector(axis, span);
    const rotation: THREE.Quaternion =
      new THREE.Quaternion().setFromUnitVectors(
        initialContact.clone().normalize(),
        reachableContact.sub(knee).normalize(),
      );
    const ankle: THREE.Vector3 = new THREE.Vector3(...geometry.ankle)
      .sub(initialKnee)
      .applyQuaternion(rotation)
      .add(knee);
    return {
      target: [...target],
      knee: knee.toArray(),
      ankle: ankle.toArray(),
      feasible: deficit <= 1e-9,
      deficitMetres: deficit,
      maximumReachMetres: maximum,
    };
  }
}
