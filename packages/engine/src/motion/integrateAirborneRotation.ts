import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { prepareAutoMovieMassModel } from "../kinematics/prepareAutoMovieMassModel";
import type { resolveAutoMovieCenterOfMass } from "../kinematics/resolveAutoMovieCenterOfMass";
import type { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AirborneMomentumDefect } from "./AirborneMomentumDefect";
import { AirborneRotationFlight } from "./AirborneRotationFlight";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import { MotionTrajectoryFailure } from "./MotionTrajectoryFailure";
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
 * An explicit momentumTolerance additionally controls sampled dense angular
 * momentum directly in kg m²/s, independently of the orientation's RMS.
 *
 * @param props The shape's history, the flight and the momentum.
 * @returns The flight's orientation, read by time.
 * @throws {Error} For an invalid failure scope or error budget, a refused trajectory interval or step, or a shape/history reduction failure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States conservation, root/relative decomposition, sources, frames and translation/heading invariance. Namespace history documents pure root-frame bones, the unchanged millisecond central difference and quadratic boundary correction, exact I/h memo, four numeric nodes and separate raw/prepared-model lifetime; rate reads root-frame angular velocity and ICachedHistory.clear releases all transient numeric preparation.
 * @evidence contracts/development/implementation.md#principled-implementation Conservation of angular momentum about the centre of mass of a torque-free multibody, with the root's angular velocity solved from the composite inertia; the inverse is applied through its principal frame, exact for a symmetric positive-definite tensor. Forward sensitivity differentiates this same ODE, with eta' = -w cross eta + I^-1((R^T L) cross eta + R^T dL), in the instantaneous body's frame. An explicitly requested dense momentum defect reconstructs R(I omega+h), retaining actual inertia anisotropy and cancellation instead of inferring a physical budget from the local orientation error.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One right-hand side over the history, with the requested variations, handed to the existing trajectory integrator.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rate is clamped and no angle scripted: the orientation is whatever the momentum and the shape give. Only this operation's matching symbol scope permits enriching a numeric failure; foreign history errors retain their identity, message and metadata, even when they have the same error class.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed integration uses four new right-hand sides per step; adaptive cost follows the owning stepper's trial-stage and dense-probe populations. Each right-hand side reads one history instant and does linear work in requested variation directions, without a separately integrated derivative. Explicit dense physical control adds one history read and fixed-size momentum reconstruction per controller probe. One flat rate array receives tangent components directly; an indexed loop reads each tangent's scalar coordinates without a callback or tangent record, and cross terms keep their original association without intermediate cross/difference records. Inverse applications divide their exclusively owned local rotated vector in place before rotating it back.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The history keeps each exact instant's shape-only inertia and relative momentum across stages and shooting trials. Engine-created histories additionally share the principal inverse with dense reconstruction under private owner registration and copied Object.is quaternion checks. General histories retain one solve-local previous-value inverse. All tangent columns use the physical rate's same principal inverse, and changed times or actual coordinates still compute their own prerequisites.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources AirborneRotationFlight constructs playback outside the right-hand side's scope from numeric trajectory records and tangent count only. Accepted-step count remains unbounded under adaptation. A general history's fallback owns one copied quaternion/inverse record released on return or throw. Engine-created histories own O(N) exact-query I/h and lazy inverse numerics plus four O(S) numeric mass-part reductions until clear; raw bones and full canonical poses are released after posing and never enter those caches.
 */
export function integrateAirborneRotation(
  props: integrateAirborneRotation.IProps,
): integrateAirborneRotation.IFlight {
  const { history, momentum } = props;
  const requestedScope: symbol | undefined = props.errorScope;
  if (requestedScope !== undefined && typeof requestedScope !== "symbol")
    throw new Error("An airborne failure scope must be a symbol");
  const errorScope: symbol = requestedScope ?? Symbol("airborne trajectory");
  const variations: readonly IAutoMovieVector3[] = props.variations ?? [];
  if (props.momentumTolerance !== undefined && props.tolerance === undefined)
    throw new Error("Airborne momentum error control requires adaptive integration");

  /** The previous principal rotation's copied numeric key and inverse. */
  let previous: {
    rotation: IAutoMovieQuaternion;
    back: IAutoMovieQuaternion;
  } | undefined;

  /** Reuse only exact component values, even when a history mutates a record. */
  const principalInverse: (
    rotation: IAutoMovieQuaternion,
  ) => IAutoMovieQuaternion = (
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => {
    if (
      previous !== undefined &&
      Object.is(previous.rotation.x, rotation.x) &&
      Object.is(previous.rotation.y, rotation.y) &&
      Object.is(previous.rotation.z, rotation.z) &&
      Object.is(previous.rotation.w, rotation.w)
    )
      return previous.back;
    if (previous !== undefined) {
      previous.rotation.x = rotation.x;
      previous.rotation.y = rotation.y;
      previous.rotation.z = rotation.z;
      previous.rotation.w = rotation.w;
      previous.back = Quaternion.inverse(previous.rotation);
      return previous.back;
    }
    const current: IAutoMovieQuaternion = {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
      w: rotation.w,
    };
    const back: IAutoMovieQuaternion = Quaternion.inverse(current);
    previous = { rotation: current, back };
    return back;
  };

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
  let trajectory: integrateMotionTrajectory.ITrajectory;
  try {
    trajectory = integrateMotionTrajectory({
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

        // The physical rate and every tangent use this same principal frame.
        const principalBack: IAutoMovieQuaternion = AirborneShapeHistory.inverse(instant)
          ?? principalInverse(instant.inertia.rotation);
        const w: IAutoMovieVector3 = inverse(
          instant.inertia,
          Vector3.subtract(carried, instant.relative),
          principalBack,
        );

        // Forward sensitivity, q(L + dL) = q(L) exp(eta / 2): differentiating
        // q' = q w / 2 gives eta' = -w x eta + I^-1((R^T L) x eta + R^T dL).
        const dx: number[] = [];
        for (let i: number = 0; i < variations.length; i++) {
          if (!(i in variations)) continue;
          const offset: number = 3 * i;
          const etaX: number = x[offset]!;
          const etaY: number = x[offset + 1]!;
          const etaZ: number = x[offset + 2]!;
          const forcing: IAutoMovieVector3 = Quaternion.rotateVector(
            back,
            variations[i]!,
          );
          const changed: IAutoMovieVector3 = inverse(
            instant.inertia,
            {
              x: (carried.y * etaZ - carried.z * etaY) + forcing.x,
              y: (carried.z * etaX - carried.x * etaZ) + forcing.y,
              z: (carried.x * etaY - carried.y * etaX) + forcing.z,
            },
            principalBack,
          );
          dx.push(
            changed.x - (w.y * etaZ - w.z * etaY),
            changed.y - (w.z * etaX - w.x * etaZ),
            changed.z - (w.x * etaY - w.y * etaX),
          );
        }
        return { dx, w };
      },
      x0: Array.from({ length: 3 * variations.length }, (): number => 0),
      q0: props.q0,
      t0: props.t0,
      t1: props.t1,
      h: props.h,
      tolerance,
      errorScope,
      rotationDefect: props.momentumTolerance === undefined
        ? undefined
        : AirborneMomentumDefect(history, momentum, props.momentumTolerance),
    });
  } catch (error) {
    if (error instanceof MotionTrajectoryFailure && error.scope === errorScope)
      throw AirborneMomentumDefect.failure(error, history, momentum, props.momentumTolerance);
    throw error;
  }
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
   * millisecond. The stencil is second order for a sufficiently smooth shape;
   * its error depends on that shape's derivatives and is separate from the
   * orientation integrator's budget. Without a span, the shape is read on
   * `[t0 - DELTA, t1 + DELTA]`.
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

    /** Optional dense angular-momentum error control, requiring adaptive integration. Relative is a share of the requested world momentum and absolute is kg m²/s; they are separate from the orientation budget. A zero resulting scale admits only zero defect. Sampled dense control does not certify a separate finite-difference pose observation. */
    momentumTolerance?: Pick<integrateMotionTrajectory.ITolerance, "relative" | "absolute">;

    /** Optional caller-owned unique token correlating this flight's trajectory failures with its caller. Omitted, this integration creates its own token. Histories receive no token; nested failures with another scope pass through unchanged. */
    errorScope?: symbol;

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
   * Shares IHistory instead of duplicating the callback contract; the exact I/h memo has no cap or time grid, while posed numeric parts have one four-node stencil bound.
   */
  export type ICachedHistory = IHistory & {
    /** Release I/h instants, four numeric mass nodes, boundary moments and inverse preparation; a new query recomputes them while completed flights remain valid. */
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
   * second order in `DELTA` for a sufficiently smooth shape. Each query's
   * inertia and relative
   * momentum are computed once and kept by its exact second for the
   * history's lifetime. Each reduction poses the parts once at each distinct
   * instant, sharing their transformed centres with the mass-weighted centre.
   * The four most recently read exact nodes share their posed mass parts
   * across overlapping stencils. This is one boundary stencil's maximum
   * numeric footprint, with no full pose or raw bone map retained. Evicted
   * nodes are recomputed normally. The two fixed boundary stencils separately
   * share their numeric moments across queries.
   *
   * Given the flight's span, the three-point stencil slides up to its
   * boundary and then stays inside it. At a requested instant `t` away
   * from the stencil's centre `s`, its central momentum is corrected by
   * `(t-s)/δ` times the difference of its right and left half-interval
   * momenta: the derivative of a quadratic interpolant, second order in
   * `δ` for smooth trajectories (Fornberg 1988, Mathematics of Computation
   * 51:699-706). Its weights and nodes are continuous at the centred switch.
   * For continuous interval momenta this adds no switch-induced value jump.
   * An actual shape jump at a boundary can propagate through this stencil.
   *
   * @param model The body's mass model, or an admitted planning-owned mass snapshot released separately after this history is cleared.
   * @param shape The posed bones at a second, in the root's own frame (the root at the origin, unturned): the composed shape without the flight's rotation. Pure, and read up to `DELTA` outside the flight, or up to `2 DELTA` inside it at its ends when `span` is given.
   * @param span The flight's take-off and touchdown, seconds; the shape is read across them when absent.
   * @returns The history.
   *
   * States root-frame shape, millisecond central difference, unchanged boundary correction, exact-time memo and separate prepared-model ownership.
   * AirborneShapeHistory reduces the same physical tensor and two-pose momentum with the unchanged stencil and quadratic boundary correction; only I and h enter the flight ODE.
   * The public history entry selects the established DELTA and delegates memo, stencil and model reduction to one history owner.
   * Every new exact query reads its actual pure shape; no time grid, shape interpolation, stencil reduction or tolerance change is introduced.
   * A new query needs at most four posed nodes and O(S) mass work. A bounded exact-node hit avoids its shape/IK/FK read, and a prepared model reuses unchanged intrinsic transforms and quaternion differences. Every new/evicted time and every current orbital term and tensor sum remains evaluated.
   * Exact time under one unchanged model, pure shape and span identifies equivalent I/h and numeric mass parts. Four recent exact nodes share overlapping stencils and fixed boundary moments are separately shared; no time is rounded. A prepared token supplies both model reducers without unrelated-model pairing.
   * The history owns O(N) numeric I/h instants, at most two boundary moments and four O(S) numeric mass-part reductions. clear explicitly releases all and unregisters lazy inverse records; raw bone maps and full canonical poses are never retained. An optional prepared model is borrowed and its caller separately releases its O(S) state.
   */
  export function history(
    model: resolveAutoMovieCenterOfMass.IModel | prepareAutoMovieMassModel.IPrepared,
    shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    span?: { from: number; to: number },
  ): ICachedHistory {
    return AirborneShapeHistory(model, shape, DELTA, span);
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

/**
 * Apply the inverse composite tensor through its principal frame.
 * The first rotation returns an exclusively owned local vector, so dividing
 * it in place preserves each component's arithmetic without another record.
 */
function inverse(
  frame: resolveAutoMovieMomentum.IPrincipal,
  vector: IAutoMovieVector3,
  back: IAutoMovieQuaternion = Quaternion.inverse(frame.rotation),
): IAutoMovieVector3 {
  const local: IAutoMovieVector3 = Quaternion.rotateVector(back, vector);
  local.x /= frame.moments.x;
  local.y /= frame.moments.y;
  local.z /= frame.moments.z;
  return Quaternion.rotateVector(frame.rotation, local);
}


