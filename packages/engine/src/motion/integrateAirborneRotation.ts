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
import { AirborneRotationFlight } from "./AirborneRotationFlight";
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
 * Their 3-by-k same-unit matrix uses a Frobenius error block, independently
 * of the orientation's original three-component RMS. Taking the larger
 * normalized error keeps the physical orientation budget unchanged. For
 * zero absolute tolerance this block is invariant under orthogonal body or
 * parameter-basis changes and a common parameter-unit rescaling. Independent
 * rescaling of different columns has no such guarantee. The embedded local
 * estimate does not certify a global Jacobian error or Newton convergence.
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
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources AirborneRotationFlight constructs playback outside the right-hand side's scope from numeric trajectory records and a tangent count only. Accepted-step count remains unbounded under adaptation. The caller owns the history; its exact-query cache retains inertia and relative momentum, while each reduction releases its temporary bones.
 */
export function integrateAirborneRotation(
  props: integrateAirborneRotation.IProps,
): integrateAirborneRotation.IFlight {
  const { history, momentum } = props;
  const variations: readonly IAutoMovieVector3[] = props.variations ?? [];

  // Sensitivities guide Newton but do not feed the physical orientation.
  // A same-unit matrix block controls their Frobenius error independently;
  // the maximum with q's original RMS can never dilute its physical budget.
  const tolerance: integrateMotionTrajectory.ITolerance | undefined =
    props.tolerance === undefined
      ? undefined
      : {
          ...props.tolerance,
          blocks: variations.length === 0 ? [] : [3 * variations.length],
        };
  const trajectory: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        t: number,
        x: readonly number[],
        q: IAutoMovieQuaternion | null,
      ): integrateMotionTrajectory.IRate => {
        const instant: integrateAirborneRotation.IInstant = history(t);
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
  return AirborneRotationFlight(trajectory, variations.length);
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
   * What a torque-free flight and its optional momentum tangents are integrated from.
   *
   * Members state seconds, root/world frames, momentum units, integration budgets and body-frame tangent outputs.
   * The history supplies root-frame inertia and relative momentum; world momentum is constant and q0 is the takeoff attitude. Interval and state dimensions are admitted by the trajectory integrator; positive principal moments and a pure history remain caller premises.
   * The flight pass supplies physical inputs and the shooting solver additionally supplies same-unit momentum directions; this wrapper owns the internal tangent partition and accepts only relative/absolute budgets.
   * The optional matrix contains the requested directions without a second body model; its Frobenius budget does not promise invariance under independently rescaled parameter columns.
   */
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

    /** The integrator's step, seconds; its default when absent. Under a `tolerance`, the first step tried. */
    h?: number;

    /** Relative and absolute integration error budgets; fixed-step when absent. The physical orientation and the same-unit tangent matrix use independent norms. A nonzero absolute number acts in each block's own units, not a shared physical unit. */
    tolerance?: Pick<
      integrateMotionTrajectory.ITolerance,
      "relative" | "absolute"
    >;

    /** Momentum directions whose forward sensitivities are integrated with the orientation. Each returned tangent is in the instantaneous body's frame, radians per unit change of the corresponding direction. Absent, none are integrated. */
    variations?: readonly IAutoMovieVector3[];
  }

  /**
   * The shape's mass distribution at a second, in the root's own frame: its
   * composite inertia's principal frame and the relative angular momentum of
   * its segments' motion with respect to the root.
   */
  export type IHistory = (seconds: number) => IInstant;

  /**
   * A shape history with an explicitly owned numeric memo.
   *
   * It is the same seconds-to-root-frame-instant reader, with a clear operation for its numeric memo.
   * Extends the history callback with cache lifetime ownership; clear forgets computed values without changing the pure shape or the values a new read computes.
   * The history factory produces it and HumanPerformanceFlight clears it in finally after solving or refusal; general uncached IHistory callbacks remain unchanged.
   * Shares IHistory instead of duplicating the callback contract; no cache cap, time grid or approximate sample is introduced.
   */
  export type ICachedHistory = IHistory & {
    /** Release cached instants and boundary moments; the next query recomputes them, while already completed flights remain valid. */
    clear(): void;
  };

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

    /** The integrator's step, seconds; under a tolerance, its first step tried. */
    h: number;

    /** The integrator's knot count, the steps plus one; under a tolerance, its accepted steps plus one. */
    knots: number;

    /**
     * The root's world orientation at a second, held at the ends outside the flight.
     *
     */
    orientation: (seconds: number) => IAutoMovieQuaternion;

    /** Body-frame rotation tangents with respect to the requested momentum directions, in their input order; an empty array when none were requested. */
    variations: (seconds: number) => readonly IAutoMovieVector3[];
  }

  /**
   * A shape's history: at each second, the composite inertia of the posed
   * bones and the relative momentum from the bones `DELTA` either side,
   * second order in `DELTA`. Each query instant's inertia and relative
   * momentum are computed once and kept by its exact second for the
   * history's lifetime. Posed bones belong only to that reduction: at most
   * the query and three stencil nodes are held, then released. The two
   * fixed boundary stencils share their numeric moments across queries.
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
   *
   * States the root-frame shape, finite-difference stencil, exact query identity, sufficient statistics and temporary bone lifetime.
   * The same inertia tensor and three-point momentum formula are reduced to I and h, the only shape quantities the flight ODE reads; no shape interpolation, grid or precision change is introduced.
   * An exact-time numeric memo surrounds one scoped shape-to-momentum reduction; the two fixed boundary stencils have their own numeric memo.
   * Every new query reads its actual shape and preserves the existing stencil weights; no raw-bone cache cap replaces an evaluation.
   * A new query resolves at most four distinct posed instants and performs linear work in mass segments after shape evaluation. The shape owner may independently reuse its displayed poses; repeated query times read the numeric instant directly.
   * Equivalence is the same exact query time in this history's unchanged model, pure shape function and span. Boundary moments additionally share the identical fixed stencil nodes. A changed evaluation epoch requires a new history.
   * The callable owns O(N) numeric instants for N distinct queries and at most two numeric boundary records, with no fixed N bound. Each evaluate call owns at most four bone maps; none escapes in its numeric result. clear explicitly releases both numeric memos, and the caller drops the shape callback's history when its solve scope ends.
   */
  export function history(
    model: resolveAutoMovieCenterOfMass.IModel,
    shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    span?: { from: number; to: number },
  ): ICachedHistory {
    type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    const instants: Map<number, IInstant> = new Map();

    // Only the two boundary stencils recur at different query times.
    // Their numeric moments are sufficient; their bones need not survive.
    const boundaries: Map<
      number,
      { central: IAutoMovieVector3; change: IAutoMovieVector3 }
    > = new Map();
    const evaluate: (seconds: number) => IInstant = (
      seconds: number,
    ): IInstant => {
      // At most the query and three stencil nodes live for this reduction.
      // No returned value or closure refers to these bone maps.
      const bones: Map<number, Bones> = new Map();
      const read: (at: number) => Bones = (at: number): Bones => {
        const known: Bones | undefined = bones.get(at);
        if (known !== undefined) return known;
        const posed: Bones = shape(at);
        bones.set(at, posed);
        return posed;
      };
      const momentum: (from: number, to: number) => IAutoMovieVector3 = (
        from: number,
        to: number,
      ): IAutoMovieVector3 =>
        resolveAutoMovieMomentum(model, read(from), read(to), to - from)
          .angular;
      const inertia: IInstant["inertia"] = resolveAutoMovieMomentum.principal(
        resolveAutoMovieMomentum.inertia(model, read(seconds)),
      );
      if (span === undefined)
        return {
          inertia,
          relative: momentum(seconds - DELTA, seconds + DELTA),
        };
      const delta: number = Math.min(DELTA, (span.to - span.from) / 2);
      const centre: number = Math.max(
        span.from + delta,
        Math.min(span.to - delta, seconds),
      );
      const a: number = Math.max(span.from, centre - delta);
      const b: number = Math.min(span.to, centre + delta);
      if (centre === seconds) return { inertia, relative: momentum(a, b) };
      let boundary:
        | { central: IAutoMovieVector3; change: IAutoMovieVector3 }
        | undefined = boundaries.get(centre);
      if (boundary === undefined) {
        boundary = {
          central: momentum(a, b),
          change: Vector3.subtract(momentum(centre, b), momentum(a, centre)),
        };
        boundaries.set(centre, boundary);
      }
      return {
        inertia,
        relative: Vector3.add(
          boundary.central,
          Vector3.scale(boundary.change, (2 * (seconds - centre)) / (b - a)),
        ),
      };
    };
    const query: IHistory = (seconds: number): IInstant => {
      const known: IInstant | undefined = instants.get(seconds);
      if (known !== undefined) return known;
      const instant: IInstant = evaluate(seconds);
      instants.set(seconds, instant);
      return instant;
    };
    return Object.assign(query, {
      clear: (): void => {
        instants.clear();
        boundaries.clear();
      },
    });
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
    return inverse(
      instant.inertia,
      Vector3.subtract(momentum, instant.relative),
    );
  }
}

/** Apply the inverse composite tensor through its principal frame. */
function inverse(
  frame: resolveAutoMovieMomentum.IPrincipal,
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
