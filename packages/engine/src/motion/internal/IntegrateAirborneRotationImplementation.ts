import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMoviePrincipalTensorFrame,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import type { physicalInertiaFactor } from "../../physics/internal/physicalInertiaFactor";
import { AirborneConstantShapeHistory } from "./airborne/AirborneConstantShapeHistory";
import { AirborneMomentumDefect } from "./airborne/AirborneMomentumDefect";
import { AirborneRotationFlight } from "./airborne/AirborneRotationFlight";
import { AirborneShapeHistory } from "./airborne/AirborneShapeHistory";
import { AirborneShapeStatistics } from "./airborne/AirborneShapeStatistics";
import { AirborneTabulatedShapeHistory } from "./airborne/AirborneTabulatedShapeHistory";
import { AutoMovieEngineMotionTrajectory } from "../AutoMovieEngineMotionTrajectory";
import { AutoMovieEngineMotionTrajectoryFailure } from "../AutoMovieEngineMotionTrajectoryFailure";
import { solveAirborneInvariant } from "./solveAirborneInvariant";

/*
 * Private implementation bindings for the airborne rotation owner.
 */
export namespace IntegrateAirborneRotationImplementation {
  /*
   * The root orientation of a body in flight, from its angular momentum about the
   * centre of mass, constant while nothing touches it, and the shape the body
   * takes at each instant (#3426).
   *
   * A multi-segment body in torque-free flight keeps its whole-body angular
   * momentum `L` about the centre of mass. Split into the root's own rotation and
   * the segments' motion relative to the root, `L = R (I_b w_b + h_b)`, with `R`
   * the root's orientation, `I_b` the composite inertia about the centre in the
   * root's frame, `w_b` the root's angular velocity in that frame and `h_b` the
   * angular momentum of the segments' motion relative to the root, so the root
   * turns at `w_b = I_b⁻¹ (Rᵀ L - h_b)`: the angular momentum balance of a
   * multibody, the model #3416 attributes to Yeadon, Atha and Hales 1990 ("The
   * simulation of aerial movement IV", J Biomech 23(1)) and Yeadon 1993 ("The
   * biomechanics of twisting somersaults", J Sports Sci 11), neither yet read at
   * the source. `I_b` and `h_b` come from the shape's history
   * (`IntegrateAirborneRotationImplementation.history`), and the orientation is
   * integrated by the engine's trajectory integrator on its quaternion block
   * (`integrateMotionTrajectory`), so the result is a value read by time,
   * independent of the times read.
   *
   * The centre of mass is not integrated: in flight it follows the parabola the
   * take-off gives in closed form, and a caller places the root so the shape's
   * centre, turned by `orientation`, lies on it. The shape's bones are in the
   * root's own frame (root at the origin, unturned), so the result does not
   * depend on where in the world or at which heading the flight happens.
   * Requested momentum variations are integrated alongside it as body-frame
   * rotation tangents: the forward sensitivity equations `s' = f_y s + f_p`
   * (SUNDIALS CVODES,
   * https://sundials.readthedocs.io/en/latest/cvodes/Mathematics_link.html).
   * Their 3-by-k same-unit matrix uses a Frobenius error block, independently of
   * the orientation's original three-component RMS. Taking the larger normalized
   * error keeps the physical orientation budget unchanged. For zero absolute
   * tolerance this block is invariant under orthogonal body or parameter-basis
   * changes and a common parameter-unit rescaling. Independent rescaling of
   * different columns has no such guarantee. The embedded local estimate does not
   * certify a global Jacobian error or Newton convergence. An explicit
   * momentumTolerance additionally controls sampled dense angular momentum
   * directly in kg m²/s, independently of the orientation's RMS. A
   * constructor-proved constant history may instead use its supported exact
   * commuting solution. Unsupported controls and derivative requests retain the
   * numerical integrator, including explicit dense physical admission.
   * Parameter props: The shape's history, the flight and the momentum.
   * Returns: The flight's orientation, read by time.
   * For an invalid failure scope or error budget, a refused
   * trajectory interval or step, or a shape/history reduction failure.
   */
  export function integrateAirborneRotation(
    props: IAutoMovieIntegrateAirborneRotation.IProps,
  ): IAutoMovieIntegrateAirborneRotation.IFlight {
    const { history, momentum } = props;
    const requestedScope: symbol | undefined = props.errorScope;
    const errorScope: symbol = requestedScope ?? Symbol("airborne trajectory");
    const variations: readonly IAutoMovieVector3[] = props.variations ?? [];
    if (props.momentumTolerance !== undefined && props.tolerance === undefined)
      throw new Error(
        "Airborne momentum error control requires adaptive integration",
      );

    // Native construction alone is insufficient: the exact solver additionally
    // requires its history owner's whole-curve constant proof. Unsupported
    // controls, tangents and physical classes keep the original numeric path.
    if (AirborneShapeHistory.owned(history)) {
      const invariant: IAutoMovieIntegrateAirborneRotation.IFlight | undefined =
        solveAirborneInvariant(props);
      if (invariant !== undefined) return invariant;
    }

    /*
     * The previous principal rotation's copied numeric key and inverse.
     */
    let previous:
      | {
          rotation: IAutoMovieQuaternion;
          back: IAutoMovieQuaternion;
        }
      | undefined;

    /*
     * Reuse only exact component values, even when a history mutates a record.
     */
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
        previous.back = AutoMovieEngineQuaternion.inverse(previous.rotation);
        return previous.back;
      }
      const current: IAutoMovieQuaternion = {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        w: rotation.w,
      };
      const back: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(current);
      previous = { rotation: current, back };
      return back;
    };

    // Sensitivities guide Newton but do not feed the physical orientation.
    // A same-unit matrix block controls their Frobenius error independently;
    // the maximum with q's original RMS can never dilute its physical budget.
    const tolerance:
      | IAutoMovieIntegrateMotionTrajectory.ITolerance
      | undefined =
      props.tolerance === undefined
        ? undefined
        : {
            ...props.tolerance,
            blocks: variations.length === 0 ? [] : [3 * variations.length],
          };
    let trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory;
    try {
      trajectory = AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
        f: (
          t: number,
          x: readonly number[],
          q: IAutoMovieQuaternion | null,
        ): IAutoMovieIntegrateMotionTrajectory.IRate => {
          const instant: IAutoMovieIntegrateAirborneRotation.IInstant =
            history(t);
          const back: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(q!);
          const carried: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
            back,
            momentum,
          );

          // Owned unobserved tensors need no principal axes. A public or foreign
          // instant keeps its original mutable-principal semantics.
          const factor: physicalInertiaFactor.IPrepared | undefined =
            AirborneShapeHistory.factor(instant);
          const principalBack: IAutoMovieQuaternion | undefined =
            factor === undefined
              ? (AirborneShapeHistory.inverse(instant) ??
                principalInverse(instant.inertia.rotation))
              : undefined;
          const rootMomentum: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
            carried,
            instant.relative,
          );
          const w: IAutoMovieVector3 =
            factor === undefined
              ? inverse(instant.inertia, rootMomentum, principalBack)
              : factor.solve(rootMomentum);

          // Forward sensitivity, q(L + dL) = q(L) exp(eta / 2): differentiating
          // q' = q w / 2 gives eta' = -w x eta + I^-1((R^T L) x eta + R^T dL).
          const dx: number[] = [];
          for (let i: number = 0; i < variations.length; i++) {
            const offset: number = 3 * i;
            const etaX: number = x[offset]!;
            const etaY: number = x[offset + 1]!;
            const etaZ: number = x[offset + 2]!;
            const forcing: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
              back,
              variations[i]!,
            );
            const tangentMomentum: IAutoMovieVector3 = {
              x: carried.y * etaZ - carried.z * etaY + forcing.x,
              y: carried.z * etaX - carried.x * etaZ + forcing.y,
              z: carried.x * etaY - carried.y * etaX + forcing.z,
            };
            const changed: IAutoMovieVector3 =
              factor === undefined
                ? inverse(instant.inertia, tangentMomentum, principalBack)
                : factor.solve(tangentMomentum);
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
        partition: props.partition,
        rotationDefect:
          props.momentumTolerance === undefined
            ? undefined
            : AirborneMomentumDefect(
                history,
                momentum,
                props.momentumTolerance,
              ),
      });
    } catch (error) {
      if (
        error instanceof AutoMovieEngineMotionTrajectoryFailure &&
        error.scope === errorScope
      )
        throw AirborneMomentumDefect.failure(
          error,
          history,
          momentum,
          props.momentumTolerance,
        );
      throw error;
    }
    return AirborneRotationFlight(trajectory, variations.length);
  }

  /*
   * Construct a constant root-frame history from the physical owner's copied
   * fixed rig and fully resolved bones, preserving their actual clinical frames.
   * The actual constructor admits whole-curve ownership, zero local kinematic
   * rates and zero relative momentum; unsupported inputs return undefined so the
   * consumer retains its ordinary shape history. Snapshots and explicit release
   * belong to that same constructor. This direct alias shares its exact
   * input/output types and performs no sampling equality inference or separate
   * numerical implementation.
   */
  export const fixed: typeof AirborneConstantShapeHistory =
    AirborneConstantShapeHistory;

  /*
   * Create an optional callback-free observer for physical history costs. Pass it
   * explicitly to history(); read returns independent numeric totals. Replacing
   * public members cannot install code in physical evaluation.
   * Returns: A privately issued numeric observation handle.
   *
   * States explicit operation wiring, numeric counters and independent snapshots.
   * Delegates to the native observation owner; histories borrow only its
   * private counter storage and never invoke a caller method. One factory
   * forwards observation ownership without an ambient context or altered
   * physical input. No monkeypatch, callback notification, trusted caller flag
   * or default instrumentation is introduced. Allocates one fixed-size counter
   * record only on this explicit request; ordinary histories allocate no
   * observation record. The same explicit handle can accumulate actual history
   * epochs; repeated reads copy totals rather than triggering physical work.
   * The caller owns the small handle; private weak registration retains no
   * observer after callers and histories release it. It contains no body, pose,
   * query log or process.
   */
  export function observe(): AirborneShapeStatistics.IObserver {
    return AirborneShapeStatistics();
  }

  /*
   * The half-interval of the shape's central difference, seconds: a millisecond.
   * The stencil is second order for a sufficiently smooth shape; its error
   * depends on that shape's derivatives and is separate from the orientation
   * integrator's budget. Without a span, the shape is read on `[t0
   *
   * - DELTA, t1 + DELTA]`.
   */
  export const DELTA: number = 1e-3;

  /*
   * A shape history with an explicitly owned numeric memo.
   *
   * It is the same seconds-to-root-frame-instant reader, with a clear operation
   * for its numeric memo. Extends the history callback with cache lifetime
   * ownership; clear forgets computed values without changing the pure shape or
   * the values a new read computes. The history factory produces it and
   * HumanPerformanceFlight clears it in finally after solving or refusal; general
   * uncached IHistory callbacks remain unchanged. Shares IHistory instead of
   * duplicating the callback contract; exact I/h and numeric mass nodes have no
   * eviction cap or rounded time grid and belong only to this pure history
   * operation.
   */
  export type ICachedHistory = IAutoMovieIntegrateAirborneRotation.IHistory & {
    /*
     * Release all I/h instants, numeric mass nodes and their rated
     * tensor/derivative packets, boundary moments and inverse preparation; a new
     * query recomputes them while completed flights remain valid.
     */
    clear(): void;
  };

  /*
   * A shape's history: at each second, the composite inertia of the posed bones
   * and the relative momentum from the bones `DELTA` either side, second order in
   * `DELTA` for a sufficiently smooth shape. Each query's inertia and relative
   * momentum are computed once and kept by its exact second for the history's
   * lifetime. Each reduction poses the parts once at each distinct instant,
   * sharing their transformed centres with the mass-weighted centre. Exact nodes
   * share their sufficient numeric mass parts across all overlapping stencils,
   * stages and shooting trials of this history. The first demand reads the actual
   * pure shape; later exact-node demands use those same numbers without retaining
   * a full pose or raw bone map. The two fixed boundary stencils separately share
   * their numeric moments.
   *
   * Given the flight's span, the three-point stencil slides up to its boundary
   * and then stays inside it. At a requested instant `t` away from the stencil's
   * centre `s`, its central momentum is corrected by `(t-s)/δ` times the
   * difference of its right and left half-interval momenta: the derivative of a
   * quadratic interpolant, second order in `δ` for smooth trajectories (Fornberg
   * 1988, Mathematics of Computation 51:699-706). Its weights and nodes are
   * continuous at the centred switch. For continuous interval momenta this adds
   * no switch-induced value jump. An actual shape jump at a boundary can
   * propagate through this stencil.
   * Parameter model: The body's unchanged mass model for this reuse epoch, or an
   * admitted planning-owned snapshot released separately after this history is
   * cleared.
   * Parameter shape: The posed bones at a second, in the root's own frame (the root
   * at the origin, unturned): the composed shape without the flight's rotation.
   * Pure, and read up to `DELTA` outside the flight, or up to `2 DELTA` inside
   * it at its ends when `span` is given.
   * Parameter span: The flight's take-off and touchdown, seconds; the shape is read
   * across them when absent.
   * Parameter observer: Optional native callback-free work counter from observe();
   * omitted histories allocate no counter record and retain the ordinary
   * physical result/error behavior. Explicit handles accumulate across cache
   * clears.
   * Returns: The history.
   *
   * States root-frame shape, millisecond central difference, unchanged boundary
   * correction, exact-time memo and separate prepared-model ownership.
   * AirborneShapeHistory reduces the same physical tensor and two-pose momentum
   * with the unchanged stencil and quadratic boundary correction; only I and h
   * enter the flight ODE. The public history entry selects the established
   * DELTA and delegates memo, stencil and model reduction to one history owner.
   * Every first demanded exact mass node reads its actual pure shape; no time
   * grid, shape interpolation, stencil reduction or tolerance change is
   * introduced. A new query uses at most four distinct numeric nodes and O(S)
   * mass work. Each exact node performs shape/IK/FK only on its first demand,
   * even when other queries separate repeated endpoint reads; actual current
   * orbital terms, tensor sums and physical checks remain unchanged. Exact time
   * under one unchanged model, pure shape and span identifies equivalent I/h
   * and numeric mass parts across this operation. Fixed boundary moments are
   * separately shared; no time is rounded. A prepared token supplies both model
   * reducers without unrelated-model pairing, and no shooting target or IK
   * answer enters node storage. For N distinct I/h queries and S fixed model
   * parts, at most 3N+6 numeric nodes cost O(N*S), alongside O(N) I/h and two
   * boundary moments. Private moments share 3S numeric fields after exact
   * checks, leaving at most 8S+3 per node; exact unchanged principal
   * quaternions can additionally share their four fields. O(S) last-value
   * references and map keys/object/array overhead depend on runtime. clear
   * releases every node/shared-vector list/map/inverse registration; no raw
   * bone map/full pose is retained. The caller separately releases its borrowed
   * O(S) model.
   */
  export function history(
    model:
      | IAutoMovieResolveCenterOfMass.IModel
      | AutoMovieEngineKinematics.IPreparedMassModel,
    shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    span?: IAutoMovieIntegrateAirborneRotation.IHistorySpan,
    observer?: AirborneShapeStatistics.IObserver,
  ): ICachedHistory {
    return AirborneShapeHistory(model, shape, DELTA, span, observer);
  }

  /*
   * Build a history from actual simultaneous bone rates where the explicit
   * producer supplies them; unsupported instants retain the original millisecond
   * stencil and general history callbacks are unchanged. Every first numeric-node
   * construction calls the producer with that actual shape evaluation, including
   * stencil neighbors, and caches only numeric tensor/momentum or unavailability.
   * Revisited nodes never reread shape/rate callbacks, so query order cannot
   * select a different derivative path. The producer must derive rates for the
   * supplied current root-frame bones under unchanged model/curve prerequisites;
   * this data interface creates no constant/smoothness capability.
   */
  export function rated(
    model:
      | IAutoMovieResolveCenterOfMass.IModel
      | AutoMovieEngineKinematics.IPreparedMassModel,
    shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    analytic: AirborneShapeHistory.IRates,
    span?: IAutoMovieIntegrateAirborneRotation.IHistorySpan,
    observer?: AirborneShapeStatistics.IObserver,
  ): ICachedHistory {
    return AirborneShapeHistory(model, shape, DELTA, span, observer, analytic);
  }

  /*
   * Build a history tabulated once on uniform knots no farther apart than
   * `span.step` seconds and interpolated between them
   * (`AirborneTabulatedShapeHistory`): the shape is read at the knots only,
   * inside the span, where `history` reads it up to three times for each new
   * query second. With at least four uniform intervals and a finite `span.turn`,
   * an interval is subdivided whenever a mass part's measured endpoint turn
   * exceeds that bound in radians. Each child is measured again. The inertia and
   * relative momentum are fourth order in the knot spacing for a smooth shape
   * (second order under four intervals). The table is built at the first query;
   * the observer's counters keep their meaning, `uniqueNumericNodes` counting the
   * knots read.
   */
  export function tabulated(
    model:
      | IAutoMovieResolveCenterOfMass.IModel
      | AutoMovieEngineKinematics.IPreparedMassModel,
    shape: (
      seconds: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    span: { from: number; to: number; step: number; turn?: number },
    observer?: AirborneShapeStatistics.IObserver,
    uniformCentre?: (index: number, centre: IAutoMovieVector3) => void,
  ): ICachedHistory {
    return AirborneTabulatedShapeHistory(
      model,
      shape,
      span,
      observer,
      uniformCentre,
    );
  }

  /*
   * The root's angular velocity in its own frame, `I_b⁻¹ (L_b - h_b)`: the
   * momentum the root's own turn must carry once the segments' relative motion
   * has taken its share, divided by the composite inertia, applied through the
   * tensor's principal frame.
   * Parameter instant: The shape's inertia and relative momentum at the instant, root
   * frame.
   * Parameter momentum: The whole-body momentum `L_b`, root frame, kg m²/s.
   * Returns: The root's angular velocity in its own frame, radians per second.
   */
  export function rate(
    instant: IAutoMovieIntegrateAirborneRotation.IInstant,
    momentum: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const factor: physicalInertiaFactor.IPrepared | undefined =
      AirborneShapeHistory.factor(instant);
    const carried: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      momentum,
      instant.relative,
    );
    return factor === undefined
      ? inverse(instant.inertia, carried)
      : factor.solve(carried);
  }

  /*
   * Apply the inverse composite tensor through its principal frame. The first
   * rotation returns an exclusively owned local vector, so dividing it in place
   * preserves each component's arithmetic without another record.
   */
  function inverse(
    frame: IAutoMoviePrincipalTensorFrame,
    vector: IAutoMovieVector3,
    back: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(frame.rotation),
  ): IAutoMovieVector3 {
    const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(back, vector);
    local.x /= frame.moments.x;
    local.y /= frame.moments.y;
    local.z /= frame.moments.z;
    return AutoMovieEngineQuaternion.rotateVector(frame.rotation, local);
  }
}
