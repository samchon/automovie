import { samplePhysicalTracking as samplePhysicalTrackingImplementation } from "./internal/samplePhysicalTracking";
import { physicalTrackingWithdrawn as physicalTrackingWithdrawnImplementation } from "./internal/physicalTrackingWithdrawn";
import { samplePhysicalTrackingTarget as samplePhysicalTrackingTargetImplementation } from "./internal/samplePhysicalTrackingTarget";
import { type AutoMovieEngineXpbdWorld } from "./AutoMovieEngineXpbdWorld";
import { type IAutoMovieEnginePhysicalBinding as Bound } from "./IAutoMovieEnginePhysicalBinding";
import { releasePhysicalTracking as releasePhysicalTrackingImplementation } from "./internal/releasePhysicalTracking";
import { admitPhysicalReleasePolicy as admitPhysicalReleasePolicyImplementation } from "./internal/admitPhysicalReleasePolicy";

import { type IAutoMoviePhysicalJointAxis, type IAutoMoviePhysicalTracking, type IAutoMovieQuaternion, type IAutoMovieVector3, type IAutoMoviePhysicalSimulationInput, type IAutoMoviePhysicsCache, type IAutoMoviePhysicalTrackingWithdrawn, type IAutoMovieContactReceipt } from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../math/AutoMovieEngineVector3";

/**
 * Bounded implicit PD in a joint frame. Tan, Liu & Turk (2011), stable PD,
 * motivates solving the next-step damping term rather than an explicit stiff
 * spring. Axis inertia is the caller's effective inertia in kg m². The result
 * is N m, never a pose offset; equal opposite torques act on the joint bodies.
 */
export namespace AutoMovieEnginePhysicalTracking {
  /** Calculate a torque without retaining a controller state or changing inputs. */
  export function torque(
    current: IAutoMovieQuaternion,
    target: IAutoMovieQuaternion,
    velocity: IAutoMovieVector3,
    axes: readonly IAutoMoviePhysicalJointAxis[],
    inertia: IAutoMovieVector3,
    dt: number,
    strength: number,
  ): IAutoMoviePhysicalTracking.IResult {
    if (dt <= 0 || strength < 0 || strength > 1)
      throw new Error("Invalid physical tracking timestep or strength");
    const delta: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      target,
      AutoMovieEngineQuaternion.inverse(current),
    );
    const sign: number = delta.w < 0 ? -1 : 1;
    const norm: number = Math.hypot(delta.x, delta.y, delta.z);
    const scale: number =
      norm < 1e-12
        ? 2 * sign
        : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign) / norm;
    const error: IAutoMovieVector3 = {
      x: delta.x * scale,
      y: delta.y * scale,
      z: delta.z * scale,
    };
    const result: IAutoMoviePhysicalTracking.IResult = {
      torque: { x: 0, y: 0, z: 0 },
      error,
      saturated: [],
    };
    for (const axis of axes) {
      const k: number = axis.stiffness * strength;
      const d: number = axis.damping * strength;
      const effective: number = inertia[axis.axis];
      if (effective <= 0) throw new Error("Invalid effective angular inertia");
      const raw: number =
        (k * error[axis.axis] - (d + k * dt) * velocity[axis.axis]) /
        (1 + (d * dt + k * dt * dt) / effective);
      const limit: number = axis.maximumTorque * strength;
      if (Math.abs(raw) > limit) result.saturated.push(axis.axis);
      result.torque[axis.axis] = Math.max(-limit, Math.min(limit, raw));
    }
    return result;
  }
  /**
   * Root positional PD; gravity compensation is explicit in the caller's
   * acceleration.
   */
  export function force(
    error: IAutoMovieVector3,
    velocity: IAutoMovieVector3,
    mass: number,
    stiffness: number,
    damping: number,
    maximumForce: number,
    dt: number,
  ): IAutoMovieVector3 {
    const value: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.subtract(
        AutoMovieEngineVector3.scale(error, stiffness),
        AutoMovieEngineVector3.scale(velocity, damping + stiffness * dt),
      ),
      1 / (1 + (damping * dt + stiffness * dt * dt) / mass),
    );
    const length: number = AutoMovieEngineVector3.length(value);
    return length > maximumForce
      ? AutoMovieEngineVector3.scale(value, maximumForce / length)
      : value;
  }

  /**
   * Dense authored-relative joint errors at any cached film second, without
   * retaining film-sized diagnostics. Error is the shortest relative-rotation
   * distance in radians. Recovery retargets can intentionally depart from the
   * original authored hint. Saturation entries remain the most recent completed
   * step's pre-solve demand forecasts, never a claim to a native motor impulse
   * that the pinned SDK does not expose.
   */
  export function sample(input: IAutoMoviePhysicalSimulationInput.IInput, cache: IAutoMoviePhysicsCache, diagnostics: readonly IAutoMoviePhysicalSimulationInput.IDiagnostic[], seconds: number): IAutoMoviePhysicalSimulationInput.IDiagnostic[] {
    return samplePhysicalTrackingImplementation(input, cache, diagnostics, seconds);
  }

  /**
   * Whether a body's default tracking is withdrawn at one tick.
   *
   * Tracking is withdrawn only when the effective body strength is zero and no
   * explicit per-joint protective strength stays positive; an explicit joint
   * keeps its own motor and therefore keeps the body under tracking.
   */
  export function withdrawn(target: IAutoMoviePhysicalTrackingWithdrawn.ITarget): boolean {
    return physicalTrackingWithdrawnImplementation(target);
  }

  /**
   * Resolve declared contact-triggered withdrawal from causal solver samples.
   * Keep joint overrides for protective effort, and retain the transition in
   * checkpoint-owned state. Geometric, future and zero-impulse observations
   * cannot trigger release.
   */
  export function sampleTarget(body: IAutoMoviePhysicalSimulationInput.IBody, target: IAutoMoviePhysicalSimulationInput.ITarget, contacts: readonly IAutoMovieContactReceipt[], seconds: number, released: Set<string>): IAutoMoviePhysicalSimulationInput.ITarget {
    return samplePhysicalTrackingTargetImplementation(body, target, contacts, seconds, released);
  }

  /**
   * Withdraw all default actuator effort once: clear the body's forces and
   * torques and set every joint's motors to zero strength, keeping passive
   * damping and the joint constraints. The caller verifies that no explicit
   * protective joint remains active.
   */
  export function release(world: AutoMovieEngineXpbdWorld, body: IAutoMoviePhysicalSimulationInput.IBody, bound: Bound): void {
    releasePhysicalTrackingImplementation(world, body, bound);
  }

  /** Contact withdrawal names actual other-body geometry and a local-time window. */
  export function admitReleasePolicy(input: IAutoMoviePhysicalSimulationInput.IInput, body: IAutoMoviePhysicalSimulationInput.IBody): void {
    admitPhysicalReleasePolicyImplementation(input, body);
  }
}
