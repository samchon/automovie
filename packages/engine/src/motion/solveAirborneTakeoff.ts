import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { determinantAutoMovieMatrix3 } from "../math/determinantAutoMovieMatrix3";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import { integrateAirborneRotation } from "./integrateAirborneRotation";

/**
 * The take-off angular momentum that turns a body in flight through the
 * requested somersault and twist and lands it with no tilt (#3426), for a
 * given shape history and flight.
 *
 * The flight's attitude is read as Yeadon's somersault, tilt and twist angles
 * (Yeadon 1993, "The biomechanics of twisting somersaults", J Sports Sci 11,
 * Part I pp. 187-198): relative to the take-off frame turned by `frame`, the
 * orientation is `Rx(φ) Rz(θ) Ry(ψ)`, a somersault `φ` about the frame's
 * lateral axis X, then a tilt `θ` about its forward axis Z, then a twist `ψ`
 * about the body's long axis Y (`angles`). The somersault and the twist are
 * unwrapped across the integrator's knots, so a whole turn reads 2π and not
 * zero. The residual at touchdown is `[φ - 2π somersault, θ, ψ - 2π twist]`.
 *
 * The momentum, in the frame's axes, starts at the rigid-body estimate
 * `L = I_mean w`, `I_mean` the mean of the shape's composite inertia at
 * take-off, mid-flight and touchdown and `w` the first stage's turns over
 * the flight time. The twist is reached by continuation with adaptive steps
 * (Allgower and Georg, Introduction to Numerical Continuation Methods): the
 * whole twist is tried first, a stage that misses is halved and one that
 * meets is accepted and the next doubled, each stage's search starting from
 * the last accepted momentum, until the request is reached or a stage falls
 * below the tolerance's size in turns. Each stage is refined by
 * `ITERATIONS` Newton steps with a forward-difference Jacobian on the
 * integrator. A step that does not lower
 * the residual's norm is halved, at most `HALVINGS` times (backtracking on
 * the step, which keeps Newton inside the basin of the requested turns on
 * this periodic map). The counts are fixed and the start is fixed, so the
 * search is deterministic. The search stops early once the residual is under
 * `tolerance`, and reports a miss, never a clamped answer, when it ends
 * outside it or when the momentum exceeds the caller's `maximum`.
 *
 * @param props The shape's history, the flight, the take-off frame, the request and its bounds.
 * @returns The momentum, its residual and whether the request is met.
 * @throws {Error} When the flight is not positive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the angle convention with its source, the unwrapping, the residual, the start, the iteration with its globalization, determinism and the miss.
 * @evidence contracts/development/implementation.md#principled-implementation Newton's method on the integrator's touchdown angles with a forward-difference Jacobian and step halving (Dennis and Schnabel, Numerical Methods for Unconstrained Optimization and Nonlinear Equations, ch. 6, backtracking line search); the attitude angles are Yeadon's somersault, tilt and twist.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A residual over one integration, a start, then a fixed loop of Jacobian, solve and backtrack.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A request the flight cannot meet is reported as a miss with its residual; the caller refuses it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Per continuation stage at most `ITERATIONS` times four integrations for the Jacobian plus `HALVINGS` for the backtrack, the stages as many as convergence asks, bounded by the halvings down to the tolerance's size; every integration reads the one history, so the shape is posed once per instant over the whole search.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The history is shared by every integration of the search, since the shape does not depend on the momentum.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps one flight per integration only while its residual is read; the history is the caller's.
 */
export function solveAirborneTakeoff(
  props: solveAirborneTakeoff.IProps,
): solveAirborneTakeoff.ISolution {
  const flight: number = props.t1 - props.t0;
  if (!(flight > 0))
    throw new Error(`The take-off needs a positive flight, got ${flight}`);
  const frame: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(props.q0, props.frame ?? Quaternion.identity()),
  );
  const tolerance: number =
    props.tolerance ?? solveAirborneTakeoff.TOLERANCE;

  // The touchdown residual of a momentum given in the frame's axes, against
  // a request of somersault and twist turns.
  const residual = (
    local: readonly number[],
    target: readonly number[],
  ): number[] => {
    const turned: integrateAirborneRotation.IFlight = integrateAirborneRotation(
      {
        history: props.history,
        t0: props.t0,
        t1: props.t1,
        q0: props.q0,
        momentum: Quaternion.rotateVector(frame, {
          x: local[0]!,
          y: local[1]!,
          z: local[2]!,
        }),
        h: props.h,
      },
    );
    const end: solveAirborneTakeoff.IAngles = solveAirborneTakeoff.unwrapped(
      turned,
      frame,
    );
    return [
      end.somersault - target[0]!,
      end.tilt - target[1]!,
      end.twist - target[2]!,
    ];
  };
  const norm = (r: readonly number[]): number => Math.hypot(...r);

  // Newton from a start toward one request, backtracking by halves.
  const newton = (
    start: readonly number[],
    target: readonly number[],
  ): { local: number[]; r: number[] } => {
    let local: number[] = [...start];
    let r: number[] = residual(local, target);
    for (
      let k: number = 0;
      k < solveAirborneTakeoff.ITERATIONS && norm(r) > tolerance;
      k++
    ) {
      // Forward-difference Jacobian, its step scaled to the momentum.
      const step: number =
        solveAirborneTakeoff.JACOBIAN * Math.max(1, norm(local));
      const columns: number[][] = [0, 1, 2].map((c: number): number[] => {
        const probe: number[] = local.map(
          (v: number, i: number): number => v + (i === c ? step : 0),
        );
        return residual(probe, target).map(
          (v: number, i: number): number => (v - r[i]!) / step,
        );
      });
      const jacobian: number[][] = [0, 1, 2].map((i: number): number[] =>
        columns.map((column: number[]): number => column[i]!),
      );
      const delta: number[] | null = solve3(jacobian, r);
      if (delta === null) break;

      // Backtrack: halve the step until it lowers the residual.
      let scale: number = 1;
      let next: number[] = local;
      let after: number[] = r;
      for (let h: number = 0; h <= solveAirborneTakeoff.HALVINGS; h++) {
        const trial: number[] = local.map(
          (v: number, i: number): number => v - scale * delta[i]!,
        );
        const tr: number[] = residual(trial, target);
        if (norm(tr) < norm(r)) {
          next = trial;
          after = tr;
          break;
        }
        scale /= 2;
      }
      if (next === local) break;
      local = next;
      r = after;
    }
    return { local, r };
  };

  // The rigid-body start: the mean inertia in the frame's axes times the
  // first stage's requested rate.
  const mean: number[][] = [0, 0.5, 1]
    .map((share: number): number[][] =>
      tensorOf(
        props.history(props.t0 + share * flight).inertia,
        Quaternion.inverse(props.frame ?? Quaternion.identity()),
      ),
    )
    .reduce(
      (sum: number[][], t: number[][]): number[][] =>
        sum.map((row: number[], i: number): number[] =>
          row.map((v: number, j: number): number => v + t[i]![j]! / 3),
        ),
      [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
    );

  // Continuation in the twist with adaptive steps (Allgower and Georg,
  // Introduction to Numerical Continuation Methods, ch. 1 and 6): the whole
  // twist is tried first; a stage whose Newton search misses is halved, and
  // one that meets its request is accepted and the next stage doubled, so
  // the stage count follows from convergence. A stage before any accepted
  // one starts from the rigid-body estimate of its own request, a later one
  // from the last accepted momentum. A stage below the tolerance's own size
  // in turns cannot be told from its predecessor, so the search stops there
  // and reports the last accepted stage's miss.
  const rigid = (twist: number): number[] => {
    const l: IAutoMovieVector3 = resolveAutoMovieMomentum.apply(mean, {
      x: (2 * Math.PI * props.somersault) / flight,
      y: (2 * Math.PI * twist) / flight,
      z: 0,
    });
    return [l.x, l.y, l.z];
  };
  const request = (twist: number): number[] => [
    2 * Math.PI * props.somersault,
    0,
    2 * Math.PI * twist,
  ];
  const smallest: number = tolerance / (2 * Math.PI);
  let reached: number = 0;
  let accepted: { local: number[]; r: number[] } | null = null;
  let stage: number = props.twist;
  let solved: { local: number[]; r: number[] } = newton(
    rigid(stage),
    request(stage),
  );
  for (;;) {
    if (norm(solved.r) <= tolerance) {
      accepted = solved;
      reached += stage;
      const left: number = props.twist - reached;
      if (Math.abs(left) <= 0) break;
      stage = Math.sign(left) * Math.min(Math.abs(left), 2 * Math.abs(stage));
    } else {
      stage /= 2;
      if (Math.abs(stage) < smallest) {
        solved = accepted ?? solved;
        break;
      }
    }
    solved = newton(
      accepted === null ? rigid(reached + stage) : accepted.local,
      request(reached + stage),
    );
  }
  if (accepted !== null && Math.abs(props.twist - reached) > 0)
    solved = {
      local: accepted.local,
      r: residual(accepted.local, request(props.twist)),
    };
  const { local, r } = solved;
  const momentum: IAutoMovieVector3 = Quaternion.rotateVector(frame, {
    x: local[0]!,
    y: local[1]!,
    z: local[2]!,
  });
  const magnitude: number = Vector3.length(momentum);
  return {
    momentum,
    residual: {
      somersault: r[0]! / (2 * Math.PI),
      tilt: r[1]! / (2 * Math.PI),
      twist: r[2]! / (2 * Math.PI),
    },
    met:
      norm(r) <= tolerance &&
      magnitude <= (props.maximum ?? Number.POSITIVE_INFINITY),
  };
}

/**
 * Companion types, constants and attitude readings of
 * {@link solveAirborneTakeoff}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit, frame and basis.
 * @evidence contracts/development/design.md#principled-representation A request in turns about the take-off frame's axes, a momentum in world kg m²/s and a residual in revolutions; Yeadon's angles as the attitude.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the flight pass (#3427) and the airborne rows (#3428) read: the request, the solution, the attitude angles and the search's fixed counts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flight is `integrateAirborneRotation`'s and the history its, not restated.
 */
export namespace solveAirborneTakeoff {
  /** Newton iterations, at most: a work budget, not a physical value; from an in-basin start Newton's quadratic convergence meets the tolerance in a handful, and the search stops as soon as it does. */
  export const ITERATIONS: number = 12;

  /** Step halvings of the backtracking per iteration, at most: a work budget, shrinking a step to a thousandth before the search gives up on it. */
  export const HALVINGS: number = 10;

  /** The forward-difference Jacobian's step, as a share of the momentum's magnitude (or of 1 kg m²/s below it): the square root of the machine epsilon, which balances a forward difference's truncation against its rounding (Dennis and Schnabel, section 5.4). */
  export const JACOBIAN: number = Math.sqrt(Number.EPSILON);

  /**
   * The default tolerance on the residual's norm, radians: a hundredth of a
   * revolution, a quarter of the 0.04 revolution of somersault by which
   * Yeadon, Atha and Hales (1990) found their simulation model to differ from
   * recorded performances, so the solver's miss stays below the model's own
   * error.
   */
  export const TOLERANCE: number = 2 * Math.PI * 0.01;

  /** What a take-off is solved from. */
  export interface IProps {
    /** The shape's history (`integrateAirborneRotation.history`). */
    history: integrateAirborneRotation.IHistory;

    /** Take-off, seconds. */
    t0: number;

    /** Touchdown, seconds. */
    t1: number;

    /** The root's world orientation at take-off. */
    q0: IAutoMovieQuaternion;

    /**
     * The somersault frame in the root's frame at take-off: its X the
     * somersault axis, its Y the long axis, its Z the tilt axis. The root's
     * own axes when absent (a forward or backward salto); a side salto turns
     * it a quarter about the long axis.
     */
    frame?: IAutoMovieQuaternion;

    /** Somersault turns about the frame's X, signed (positive tips the head toward the frame's +Z). */
    somersault: number;

    /** Twist turns about the long axis, signed by the right-hand rule about +Y. */
    twist: number;

    /** The largest momentum the take-off can give, kg m²/s; unbounded when absent. */
    maximum?: number;

    /** The residual norm accepted, radians; `TOLERANCE` when absent. */
    tolerance?: number;

    /** The integrator's step, seconds. */
    h?: number;
  }

  /** A solved take-off. */
  export interface ISolution {
    /** The whole-body angular momentum about the centre of mass, world, kg m²/s. */
    momentum: IAutoMovieVector3;

    /** What the flight misses at touchdown, revolutions: somersault, tilt and twist. */
    residual: IAngles;

    /** Whether the residual is within the tolerance and the momentum within the maximum. */
    met: boolean;
  }

  /** Yeadon's attitude angles, in the unit their reader states. */
  export interface IAngles {
    /** About the frame's lateral axis X. */
    somersault: number;

    /** About its forward axis Z. */
    tilt: number;

    /** About the body's long axis Y. */
    twist: number;
  }

  /**
   * Yeadon's somersault, tilt and twist of an orientation relative to a
   * frame, radians, from `M = frame⁻¹ q = Rx(φ) Rz(θ) Ry(ψ)`: the long axis
   * `M Y = (-sin θ, cos θ cos φ, cos θ sin φ)` gives the tilt and the
   * somersault, and the lateral axis turned back by `(Rx(φ) Rz(θ))⁻¹` gives
   * the twist. Each angle is in (-π, π]; the tilt in [-π/2, π/2].
   *
   * @param frame The reference frame, unit.
   * @param q The orientation, unit.
   * @returns The angles, radians.
   */
  export function angles(
    frame: IAutoMovieQuaternion,
    q: IAutoMovieQuaternion,
  ): IAngles {
    const m: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(frame),
      q,
    );
    const long: IAutoMovieVector3 = Quaternion.rotateVector(m, {
      x: 0,
      y: 1,
      z: 0,
    });
    const tilt: number = -Math.asin(Math.max(-1, Math.min(1, long.x)));
    const somersault: number = Math.atan2(long.z, long.y);
    const degrees: number = 180 / Math.PI;
    const back: IAutoMovieQuaternion = Quaternion.inverse(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, somersault * degrees),
        Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, tilt * degrees),
      ),
    );
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(back, m),
      { x: 1, y: 0, z: 0 },
    );
    return { somersault, tilt, twist: Math.atan2(-lateral.z, lateral.x) };
  }

  /**
   * A flight's attitude at touchdown with the somersault and the twist
   * unwrapped across its knots, radians, so whole turns accumulate: each
   * knot's angle is taken on the branch nearest the previous one, which holds
   * while a turn between knots stays under half a revolution (at the default
   * sixtieth-of-a-second step, under 30 revolutions a second).
   *
   * @param flight The flight.
   * @param frame The reference frame the angles are read in.
   * @returns The touchdown angles, radians.
   */
  export function unwrapped(
    flight: integrateAirborneRotation.IFlight,
    frame: IAutoMovieQuaternion,
  ): IAngles {
    let somersault: number = 0;
    let twist: number = 0;
    let tilt: number = 0;
    for (let k: number = 0; k < flight.knots; k++) {
      const t: number =
        k === flight.knots - 1 ? flight.t1 : flight.t0 + k * flight.h;
      const a: IAngles = angles(frame, flight.orientation(t));
      somersault = near(a.somersault, somersault);
      twist = near(a.twist, twist);
      tilt = a.tilt;
    }
    return { somersault, tilt, twist };
  }

  /**
   * The branch of an angle nearest a reference, radians.
   *
   * @param angle The angle.
   * @param reference The previous unwrapped angle.
   * @returns `angle` plus the whole turns that bring it nearest `reference`.
   */
  function near(angle: number, reference: number): number {
    return (
      angle + 2 * Math.PI * Math.round((reference - angle) / (2 * Math.PI))
    );
  }
}

/**
 * A principal frame's tensor seen in another frame, `B R diag(I) Rᵀ Bᵀ`,
 * through the engine's one rotated-tensor sum (a massless part, so no
 * parallel-axis term enters).
 *
 * @param principal The tensor's principal frame.
 * @param into The rotation into the frame it is read in.
 * @returns The tensor's rows.
 */
function tensorOf(
  principal: resolveAutoMovieMomentum.IPrincipal,
  into: IAutoMovieQuaternion,
): number[][] {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  return physicalInertiaTensor(
    [
      {
        mass: 0,
        centerOfMass: origin,
        inertia: principal.moments,
        inertiaRotation: Quaternion.multiply(into, principal.rotation),
      },
    ],
    origin,
  );
}

/**
 * Solve a 3x3 linear system by Cramer's rule over the engine's determinant.
 *
 * @param a The matrix's rows.
 * @param b The right-hand side.
 * @returns The solution, or null for a singular or non-finite matrix.
 */
function solve3(a: readonly number[][], b: readonly number[]): number[] | null {
  if (!a.flat().every(Number.isFinite) || !b.every(Number.isFinite))
    return null;
  const d: number = determinantAutoMovieMatrix3(a.flat());
  if (d === 0) return null;
  return [0, 1, 2].map(
    (c: number): number =>
      determinantAutoMovieMatrix3(
        a.flatMap((row: number[], i: number): number[] =>
          row.map((v: number, j: number): number => (j === c ? b[i]! : v)),
        ),
      ) / d,
  );
}
