import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolveMomentum,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * root, so the root turns at `w_b = I_b⁻¹ (Rᵀ L - h_b)`: the angular
 * momentum balance of a multibody, the model #3416 attributes to Yeadon,
 * Atha and Hales 1990 ("The simulation of aerial movement IV", J Biomech
 * 23(1)) and Yeadon 1993 ("The biomechanics of twisting somersaults", J
 * Sports Sci 11), neither yet read at the source. `I_b` and `h_b` come from the
 * shape's history (`integrateAirborneRotation.history`), and the orientation
 * is integrated by the engine's trajectory integrator on its quaternion block
 * (`integrateMotionTrajectory`), so the result is a value read by time,
 * independent of the times read.
 *
 * The centre of mass is not integrated: in flight it follows the parabola
 * the take-off gives in closed form, and a caller places the root so the
 * shape's centre, turned by `orientation`, lies on it. The shape's bones are
 * in the root's own frame (root at the origin, unturned), so the result does
 * not depend on where in the world or at which heading the flight happens.
 * Requested momentum variations are integrated alongside it as body-frame
 * rotation tangents: the forward sensitivity equations `s' = f_y s + f_p`
 * (SUNDIALS CVODES, https://sundials.readthedocs.io/en/latest/cvodes/Mathematics_link.html).
 *
 * @param props The shape's history, the flight and the momentum.
 * @returns The flight's orientation, read by time.
 * @throws {Error} When the interval or the step is not positive, or the shape misses a segment's bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the conservation law, the decomposition into root and relative motion with its sources, where each term comes from, the frames, what is not integrated and why the result is translation and heading invariant.
 * @evidence contracts/development/implementation.md#principled-implementation Conservation of angular momentum about the centre of mass of a torque-free multibody, with the root's angular velocity solved from the composite inertia; the inverse is applied through its principal frame, exact for a symmetric positive-definite tensor. Forward sensitivity differentiates this same ODE, with eta' = -w cross eta + I^-1((R^T L) cross eta + R^T dL), in the instantaneous body's frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One right-hand side over the history, with the requested variations, handed to the existing trajectory integrator.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rate is clamped and no angle scripted: the orientation is whatever the momentum and the shape give.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four right-hand sides per fixed step or six new stages per adaptive attempt, each one history read and linear work in the requested variation directions; no separate flight is integrated for a derivative.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The history keeps each exact instant's inertia and relative momentum, which depend on the shape alone. Repeated times reuse them across stages and shooting trials; different adaptive meshes generally require new instants.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned trajectory retains accepted-step states and their dense-output coefficients for its lifetime, linear in accepted steps and requested variations. Adaptive step count has no fixed bound. The caller owns the history, whose caches also grow with distinct evaluated times, including rejected attempts.
 */
export function integrateAirborneRotation(
  props: IAutoMovieIntegrateAirborneRotation.IProps,
): IAutoMovieIntegrateAirborneRotation.IFlight {
  const { history, momentum } = props;
  const variations: readonly IAutoMovieVector3[] = props.variations ?? [];
  // The integrator averages squared error over all components. Dividing
  // both tolerances by sqrt(1 + directions) keeps the orientation's old
  // three-component RMS contribution unchanged when tangent states are added.
  const errorScale: number = Math.sqrt(1 + variations.length);
  const tolerance: IAutoMovieIntegrateMotionTrajectory.ITolerance | undefined =
    props.tolerance === undefined
      ? undefined
      : {
          relative: props.tolerance.relative / errorScale,
          absolute: props.tolerance.absolute / errorScale,
        };
  const trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        t: number,
        x: readonly number[],
        q: IAutoMovieQuaternion | null,
      ): IAutoMovieIntegrateMotionTrajectory.IRate => {
        const instant: IAutoMovieIntegrateAirborneRotation.IInstant =
          history(t);
        const back: IAutoMovieQuaternion = Quaternion.inverse(q!);
        const carried: IAutoMovieVector3 = Quaternion.rotateVector(
          back,
          momentum,
        );
        const w: IAutoMovieVector3 = integrateAirborneRotation.rate(
          instant,
          carried,
        );

        // Forward sensitivity, q(L + dL) = q(L) exp(eta / 2): differentiating
        // q' = q w / 2 gives eta' = -w x eta + I^-1((R^T L) x eta + R^T dL).
        const dx: number[] = variations.flatMap(
          (direction: IAutoMovieVector3, i: number): number[] => {
            const eta: IAutoMovieVector3 = {
              x: x[3 * i]!,
              y: x[3 * i + 1]!,
              z: x[3 * i + 2]!,
            };
            const changed: IAutoMovieVector3 = inverse(
              instant.inertia,
              Vector3.add(
                Vector3.cross(carried, eta),
                Quaternion.rotateVector(back, direction),
              ),
            );
            const rate: IAutoMovieVector3 = Vector3.subtract(
              changed,
              Vector3.cross(w, eta),
            );
            return [rate.x, rate.y, rate.z];
          },
        );
        return { dx, w };
      },
      x0: Array.from({ length: 3 * variations.length }, (): number => 0),
      q0: props.q0,
      t0: props.t0,
      t1: props.t1,
      h: props.h,
      tolerance,
    });
  return {
    t0: trajectory.t0,
    t1: trajectory.t1,
    h: trajectory.h,
    knots: trajectory.knots,
    orientation: (seconds: number): IAutoMovieQuaternion =>
      trajectory.at(seconds).q!,
    variations: (seconds: number): IAutoMovieVector3[] => {
      const x: number[] = trajectory.at(seconds).x;
      return variations.map(
        (_: IAutoMovieVector3, i: number): IAutoMovieVector3 => ({
          x: x[3 * i]!,
          y: x[3 * i + 1]!,
          z: x[3 * i + 2]!,
        }),
      );
    },
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

  /**
   * A shape's history: at each second, the composite inertia of the posed
   * bones and the relative momentum from the bones `DELTA` either side,
   * second order in `DELTA`, each instant computed once and kept by its exact
   * second for the history's lifetime.
   *
   * Given the flight's span, the three-point stencil slides up to its
   * boundary and then stays inside it. At a requested instant `t` away
   * from the stencil's centre `s`, its central momentum is corrected by
   * `(t-s)/δ` times the difference of its right and left half-interval
   * momenta: the derivative of a quadratic interpolant, second order in
   * `δ` (Fornberg 1988, Mathematics of Computation 51:699-706). Its weights
   * and nodes are continuous when it becomes centred again, so an ODE
   * reading the history sees no artificial stencil-switch discontinuity.
   *
   * @param model The body's mass model.
   * @param shape The posed bones at a second, in the root's own frame (the root at the origin, unturned): the composed shape without the flight's rotation. Pure, and read up to `DELTA` outside the flight, or up to `2 DELTA` inside it at its ends when `span` is given.
   * @param span The flight's take-off and touchdown, seconds; the shape is read across them when absent.
   * @returns The history.
   */
  export function history(
    model: IAutoMovieResolveCenterOfMass.IModel,
    shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    span?: IAutoMovieIntegrateAirborneRotation.IHistorySpan,
  ): IAutoMovieIntegrateAirborneRotation.IHistory {
    type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    const bones: Map<number, Bones> = new Map();
    const read = (seconds: number): Bones => {
      const known: Bones | undefined = bones.get(seconds);
      if (known !== undefined) return known;
      const posed: Bones = shape(seconds);
      bones.set(seconds, posed);
      return posed;
    };
    const instants: Map<number, IAutoMovieIntegrateAirborneRotation.IInstant> =
      new Map();
    const momentum = (from: number, to: number): IAutoMovieVector3 =>
      resolveAutoMovieMomentum(model, read(from), read(to), to - from).angular;
    const relative = (seconds: number): IAutoMovieVector3 => {
      if (span === undefined) return momentum(seconds - DELTA, seconds + DELTA);
      const delta: number = Math.min(DELTA, (span.to - span.from) / 2);
      const centre: number = Math.max(
        span.from + delta,
        Math.min(span.to - delta, seconds),
      );
      const a: number = Math.max(span.from, centre - delta);
      const b: number = Math.min(span.to, centre + delta);
      const central: IAutoMovieVector3 = momentum(a, b);
      if (centre === seconds) return central;
      return Vector3.add(
        central,
        Vector3.scale(
          Vector3.subtract(momentum(centre, b), momentum(a, centre)),
          (2 * (seconds - centre)) / (b - a),
        ),
      );
    };
    return (seconds: number): IAutoMovieIntegrateAirborneRotation.IInstant => {
      const known: IAutoMovieIntegrateAirborneRotation.IInstant | undefined =
        instants.get(seconds);
      if (known !== undefined) return known;
      const instant: IAutoMovieIntegrateAirborneRotation.IInstant = {
        inertia: resolveAutoMovieMomentum.principal(
          resolveAutoMovieMomentum.inertia(model, read(seconds)),
        ),
        relative: relative(seconds),
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
    instant: IAutoMovieIntegrateAirborneRotation.IInstant,
    momentum: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return inverse(
      instant.inertia,
      Vector3.subtract(momentum, instant.relative),
    );
  }
}

/** Apply the inverse composite tensor through its principal frame. */
function inverse(
  frame: IAutoMovieResolveMomentum.IPrincipal,
  vector: IAutoMovieVector3,
): IAutoMovieVector3 {
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    vector,
  );
  return Quaternion.rotateVector(frame.rotation, {
    x: local.x / frame.moments.x,
    y: local.y / frame.moments.y,
    z: local.z / frame.moments.z,
  });
}
