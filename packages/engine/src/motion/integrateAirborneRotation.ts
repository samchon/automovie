import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import type { resolveAutoMovieCenterOfMass } from "../kinematics/resolveAutoMovieCenterOfMass";
import { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { integrateMotionTrajectory } from "./integrateMotionTrajectory";

/**
 * The root orientation of a body in flight, from its angular momentum about
 * the centre of mass, constant while nothing touches it, and the shape the
 * body takes at each instant (#3426).
 *
 * A multi-segment body in torque-free flight keeps its whole-body angular
 * momentum `L` about the centre of mass. Split into the root's own rotation
 * and the segments' motion relative to the root, `L = R (I_b w_b + h_b)`,
 * with `R` the root's orientation, `I_b` the composite inertia about the
 * centre in the root's frame, `w_b` the root's angular velocity in that frame
 * and `h_b` the angular momentum of the segments' motion relative to the
 * root, so the root turns at `w_b = I_b⁻¹ (Rᵀ L - h_b)` (Yeadon, Atha and
 * Hales 1990, "The simulation of aerial movement IV", J Biomech 23(1):85-89;
 * Yeadon 1993, "The biomechanics of twisting somersaults", J Sports Sci 11,
 * Part I pp. 187-198 for the rigid modes). `I_b` and `h_b` come from the
 * shape's history (`integrateAirborneRotation.history`), and the orientation
 * is integrated by the engine's fixed-step integrator on its quaternion block
 * (`integrateMotionTrajectory`), so the result is a value read by time,
 * independent of the times read.
 *
 * The centre of mass is not integrated: in flight it follows the parabola
 * the take-off gives in closed form, and a caller places the root so the
 * shape's centre, turned by `orientation`, lies on it. The shape's bones are
 * in the root's own frame (root at the origin, unturned), so the result does
 * not depend on where in the world or at which heading the flight happens.
 *
 * @param props The shape's history, the flight and the momentum.
 * @returns The flight's orientation, read by time.
 * @throws {Error} When the interval or the step is not positive, or the shape misses a segment's bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the conservation law, the decomposition into root and relative motion with its sources, where each term comes from, the frames, what is not integrated and why the result is translation and heading invariant.
 * @evidence contracts/development/implementation.md#principled-implementation Conservation of angular momentum about the centre of mass of a torque-free multibody, with the root's angular velocity solved from the composite inertia (Yeadon, Atha and Hales 1990); the inverse is applied through the tensor's principal frame, exact for a symmetric positive-definite tensor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A right-hand side over the history handed to the one fixed-step integrator.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rate is clamped and no angle scripted: the orientation is whatever the momentum and the shape give.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four right-hand sides per step, each a history read (kept by instant) and two quaternion turns.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The history keeps each instant's inertia and relative momentum, which depend on the shape alone, so the integrator's repeated middles and every integration of a take-off search share them.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned flight holds the integrator's knots, `ceil((t1 - t0) / h) + 1` orientations, for as long as its caller keeps it; the history is the caller's.
 */
export function integrateAirborneRotation(
  props: integrateAirborneRotation.IProps,
): integrateAirborneRotation.IFlight {
  const { history, momentum } = props;
  const trajectory: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        t: number,
        _x: readonly number[],
        q: IAutoMovieQuaternion | null,
      ): integrateMotionTrajectory.IRate => ({
        dx: [],
        w: integrateAirborneRotation.rate(
          history(t),
          Quaternion.rotateVector(Quaternion.inverse(q!), momentum),
        ),
      }),
      x0: [],
      q0: props.q0,
      t0: props.t0,
      t1: props.t1,
      h: props.h,
    });
  return {
    t0: trajectory.t0,
    t1: trajectory.t1,
    h: trajectory.h,
    knots: trajectory.knots,
    orientation: (seconds: number): IAutoMovieQuaternion =>
      trajectory.at(seconds).q!,
  };
}

/**
 * Companion types, constants, the shape's history and the rate of
 * {@link integrateAirborneRotation}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame, unit and meaning.
 * @evidence contracts/development/design.md#principled-representation The flight's inputs are the conserved momentum and a shape history in the root's frame; the output is an orientation read by time, as the integrator's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the flight pass (#3427) and the take-off solver read: the inputs, the history, the read-back and the rate a test checks by closed form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mass model is `resolveAutoMovieCenterOfMass`'s, the tensor and momenta `resolveAutoMovieMomentum`'s and the trajectory `integrateMotionTrajectory`'s, not restated.
 */
export namespace integrateAirborneRotation {
  /**
   * The half-interval of the shape's central difference, seconds: a
   * millisecond, whose second-order error is a millionth of the shape's third
   * derivative, far under the integrator's own at its sixtieth-of-a-second
   * step. The shape is read on `[t0 - DELTA, t1 + DELTA]`.
   */
  export const DELTA: number = 1e-3;

  /** What a flight is integrated from. */
  export interface IProps {
    /** The shape's history (`history`). */
    history: IHistory;

    /** Take-off, seconds. */
    t0: number;

    /** Touchdown, seconds, after `t0`. */
    t1: number;

    /** The root's world orientation at take-off, unit. */
    q0: IAutoMovieQuaternion;

    /** The whole-body angular momentum about the centre of mass, world frame, kg m²/s; constant through the flight. */
    momentum: IAutoMovieVector3;

    /** The integrator's step, seconds; its default when absent. */
    h?: number;
  }

  /**
   * The shape's mass distribution at a second, in the root's own frame: its
   * composite inertia's principal frame and the relative angular momentum of
   * its segments' motion with respect to the root.
   */
  export type IHistory = (seconds: number) => IInstant;

  /** The shape's mass distribution at one instant, root frame. */
  export interface IInstant {
    /** The composite inertia about the centre of mass, as its principal frame, kg m². */
    inertia: resolveAutoMovieMomentum.IPrincipal;

    /** The angular momentum of the segments' motion relative to the root, about the centre of mass, kg m²/s. */
    relative: IAutoMovieVector3;
  }

  /** A flight's orientation, read by time. */
  export interface IFlight {
    /** Take-off, seconds. */
    t0: number;

    /** Touchdown, seconds. */
    t1: number;

    /** The integrator's step, seconds. */
    h: number;

    /** The integrator's knot count, the steps plus one. */
    knots: number;

    /**
     * The root's world orientation at a second, held at the ends outside the flight.
     *
     */
    orientation: (seconds: number) => IAutoMovieQuaternion;
  }

  /**
   * A shape's history: at each second, the composite inertia of the posed
   * bones and the relative momentum from the bones `DELTA` either side,
   * second order in `DELTA`, each instant computed once and kept by its exact
   * second for the history's lifetime.
   *
   * @param model The body's mass model.
   * @param shape The posed bones at a second, in the root's own frame (the root at the origin, unturned): the composed shape without the flight's rotation. Pure, and read up to `DELTA` outside the flight.
   * @returns The history.
   */
  export function history(
    model: resolveAutoMovieCenterOfMass.IModel,
    shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IHistory {
    type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    const bones: Map<number, Bones> = new Map();
    const read = (seconds: number): Bones => {
      const known: Bones | undefined = bones.get(seconds);
      if (known !== undefined) return known;
      const posed: Bones = shape(seconds);
      bones.set(seconds, posed);
      return posed;
    };
    const instants: Map<number, IInstant> = new Map();
    return (seconds: number): IInstant => {
      const known: IInstant | undefined = instants.get(seconds);
      if (known !== undefined) return known;
      const instant: IInstant = {
        inertia: resolveAutoMovieMomentum.principal(
          resolveAutoMovieMomentum.inertia(model, read(seconds)),
        ),
        relative: resolveAutoMovieMomentum(
          model,
          read(seconds - DELTA),
          read(seconds + DELTA),
          2 * DELTA,
        ).angular,
      };
      instants.set(seconds, instant);
      return instant;
    };
  }

  /**
   * The root's angular velocity in its own frame, `I_b⁻¹ (L_b - h_b)`: the
   * momentum the root's own turn must carry once the segments' relative
   * motion has taken its share, divided by the composite inertia, applied
   * through the tensor's principal frame.
   *
   * @param instant The shape's inertia and relative momentum at the instant, root frame.
   * @param momentum The whole-body momentum `L_b`, root frame, kg m²/s.
   * @returns The root's angular velocity in its own frame, radians per second.
   */
  export function rate(
    instant: IInstant,
    momentum: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const frame: resolveAutoMovieMomentum.IPrincipal = instant.inertia;
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(momentum, instant.relative),
    );
    return Quaternion.rotateVector(frame.rotation, {
      x: local.x / frame.moments.x,
      y: local.y / frame.moments.y,
      z: local.z / frame.moments.z,
    });
  }
}
