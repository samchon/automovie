import type {
  AutoMovieVector3Tuple,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieSolidVector } from "../geometry/construction/AutoMovieSolidVector";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AirborneTakeoffLinear } from "./AirborneTakeoffLinear";
import { integrateAirborneRotation } from "./integrateAirborneRotation";
import { integrateMotionTrajectory } from "./integrateMotionTrajectory";

/**
 * The take-off angular momentum that turns a body in flight through the
 * requested somersault and twist and lands it with no tilt (#3426), for a
 * given shape history and flight.
 *
 * The flight's attitude is read as somersault, tilt and twist angles, the
 * convention #3416 names after Yeadon 1993 ("The biomechanics of twisting
 * somersaults", J Sports Sci 11, not yet read at the source; the order here
 * is this module's own): the body's attitude seen in the frame's axes `F`
 * relative to its take-off, `(q0 F)⁻¹ q(t) F`, the identity at take-off
 * whatever the frame, is `Rx(φ) Rz(θ) Ry(ψ)`, a somersault `φ` about the frame's
 * lateral axis X, then a tilt `θ` about its forward axis Z, then a twist `ψ`
 * about the body's long axis Y (`angles`). The somersault and the twist are
 * unwrapped across the integrator's knots, so a whole turn reads 2π and not
 * zero. The residual at touchdown is `[φ - 2π somersault, θ, ψ - 2π twist]`.
 *
 * The linearized start is `(∫ I⁻¹ dt)⁻¹ (turns + ∫ I⁻¹ h dt)`, the
 * integrals by Simpson's rule on the integration grid. Newton's Jacobian
 * is the forward sensitivity of that same flight, integrated with the
 * orientation (`s' = f_y s + f_p`, SUNDIALS CVODES, section 4.2.6,
 * https://sundials.readthedocs.io/en/latest/cvodes/Mathematics_link.html),
 * carried into the derivatives of Yeadon's angles. It does not difference
 * separately adapted integrations at machine-epsilon momentum offsets.
 * Continuation scales the whole turn request: a missed stage is halved,
 * an accepted stage advances and doubles the next increment (Allgower and
 * Georg, Introduction to Numerical Continuation Methods), down to the
 * request's angular tolerance. Newton's starts and trial steps are projected
 * onto the momentum ball when a ceiling is given, and a projected trial is
 * accepted only if it lowers the residual (projected search, Bertsekas 1982,
 * https://web.mit.edu/dimitrib/www/ProjectedNewton.pdf). The ceiling bounds
 * the search as well as the answer; a projected point outside the angular
 * tolerance remains a miss. The returned flight
 * is the one whose residual was judged, so playback never reintegrates the
 * answer on a different adaptive mesh.
 *
 * @param props The shape's history, the flight, the take-off frame, the request and its bounds.
 * @returns The momentum, its residual and whether the request is met.
 * @throws {Error} When the flight is not positive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the angle convention with its source, the unwrapping, the residual, the start, the iteration with its globalization, determinism and the miss.
 * @evidence contracts/development/implementation.md#principled-implementation Newton's method with the flight's forward sensitivity and analytic Euler-angle derivatives, step-halving line search (Dennis and Schnabel, ch. 6), and continuation in both requested turns; an Euler-angle singularity can still prevent a solve and is reported as a miss.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A residual over one integration, a linearized start, then a fixed loop of Jacobian, solve and backtrack.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A request the flight cannot meet is reported as a miss with its residual; the caller refuses it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One flight with nine sensitivity states per residual, at most ITERATIONS Newton steps and HALVINGS backtracks per stage. Continuation adds stages until the request is reached or its increment falls below the angular tolerance; adaptive trial meshes can require distinct full-body history evaluations, and real-body completion cost remains unresolved.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shape does not depend on momentum, so every trial reads the same history. Only exactly equal times reuse a cached instant; different adaptive meshes add new instants.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps the current and last accepted trial flights during the search; the returned flight escapes for playback and other trials lose their references. The caller's history retains every distinct evaluation instant across those trials with no fixed population bound.
 */
export function solveAirborneTakeoff(
  props: IAutoMovieSolveAirborneTakeoff.IProps,
): IAutoMovieSolveAirborneTakeoff.ISolution {
  const flight: number = props.t1 - props.t0;
  if (!(flight > 0))
    throw new Error(`The take-off needs a positive flight, got ${flight}`);
  const axes: IAutoMovieQuaternion = props.frame ?? Quaternion.identity();
  const frame: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(props.q0, axes),
  );
  const tolerance: number = props.tolerance ?? solveAirborneTakeoff.TOLERANCE;
  /** A shooting residual and its exact-ODE Jacobian on the evaluated flight. */
  interface IEvaluation {
    r: number[];
    jacobian: number[][];
    flight: IAutoMovieIntegrateAirborneRotation.IFlight;
  }
  const directions: IAutoMovieVector3[] = [0, 1, 2].map(
    (i: number): IAutoMovieVector3 =>
      Quaternion.rotateVector(frame, {
        x: i === 0 ? 1 : 0,
        y: i === 1 ? 1 : 0,
        z: i === 2 ? 1 : 0,
      }),
  );

  // The touchdown residual of a momentum given in the frame's axes, against
  // a request of somersault and twist turns.
  const residual = (
    local: readonly number[],
    target: readonly number[],
  ): IEvaluation => {
    const turned: IAutoMovieIntegrateAirborneRotation.IFlight =
      integrateAirborneRotation({
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
        tolerance: props.integration,
        variations: directions,
      });
    // The body seen in the frame's axes, `q F`, so the take-off reads zero.
    const end: IAutoMovieSolveAirborneTakeoff.IAngles =
      solveAirborneTakeoff.unwrapped(
        {
          ...turned,
          orientation: (t: number): IAutoMovieQuaternion =>
            Quaternion.multiply(turned.orientation(t), axes),
        },
        frame,
      );
    const columns: number[][] = turned
      .variations(props.t1)
      .map((eta: IAutoMovieVector3): number[] => {
        const v: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.inverse(axes),
          eta,
        );
        const phi: number =
          (Math.cos(end.twist) * v.x + Math.sin(end.twist) * v.z) /
          Math.cos(end.tilt);
        return [
          phi,
          -Math.sin(end.twist) * v.x + Math.cos(end.twist) * v.z,
          v.y + Math.sin(end.tilt) * phi,
        ];
      });
    return {
      r: [
        end.somersault - target[0]!,
        end.tilt - target[1]!,
        end.twist - target[2]!,
      ],
      jacobian: [0, 1, 2].map((i: number): number[] =>
        columns.map((column: number[]): number => column[i]!),
      ),
      flight: turned,
    };
  };
  const norm = (r: readonly number[]): number => Math.hypot(...r);
  /** Euclidean projection onto the admitted momentum ball, used only for search points. */
  const projected = (values: readonly number[]): number[] => {
    const magnitude: number = norm(values);
    const maximum: number = props.maximum ?? Number.POSITIVE_INFINITY;
    const scale: number = magnitude > maximum ? maximum / magnitude : 1;
    return values.map((v: number): number => scale * v);
  };

  // Newton from a start toward one request, backtracking by halves.
  const newton = (
    start: readonly number[],
    target: readonly number[],
  ): IEvaluation & { local: number[] } => {
    let local: number[] = projected(start);
    let evaluated: IEvaluation = residual(local, target);
    for (
      let k: number = 0;
      k < solveAirborneTakeoff.ITERATIONS && norm(evaluated.r) > tolerance;
      k++
    ) {
      const delta: number[] | null = solve3(evaluated.jacobian, evaluated.r);
      if (delta === null) break;

      // Backtrack: halve the step until it lowers the residual.
      let scale: number = 1;
      let next: number[] = local;
      let after: IEvaluation = evaluated;
      for (let h: number = 0; h <= solveAirborneTakeoff.HALVINGS; h++) {
        const trial: number[] = projected(
          local.map((v: number, i: number): number => v - scale * delta[i]!),
        );
        const tr: IEvaluation = residual(trial, target);
        if (norm(tr.r) < norm(evaluated.r)) {
          next = trial;
          after = tr;
          break;
        }
        scale /= 2;
      }
      if (next === local) break;
      local = next;
      evaluated = after;
    }
    return { local, ...evaluated };
  };

  const { turning, lagging } = AirborneTakeoffLinear(
    props,
    Quaternion.inverse(axes),
  );

  // Continue the whole request, since even a plain somersault can couple to tilt.
  const linearized = (share: number): number[] => {
    const start: number[] | null = solve3(turning, [
      2 * Math.PI * props.somersault * share + lagging[0]!,
      2 * Math.PI * props.twist * share + lagging[1]!,
      lagging[2]!,
    ]);
    if (start === null)
      throw new Error(
        "The take-off's shape history gives no finite inertia over the flight",
      );
    return start;
  };
  const request = (share: number): number[] => [
    2 * Math.PI * props.somersault * share,
    0,
    2 * Math.PI * props.twist * share,
  ];
  const smallest: number = tolerance / Math.max(tolerance, norm(request(1)));
  let reached: number = 0;
  let accepted: (IEvaluation & { local: number[] }) | null = null;
  let stage: number = 1;
  let solved: IEvaluation & { local: number[] } = newton(
    linearized(stage),
    request(stage),
  );
  for (;;) {
    if (norm(solved.r) <= tolerance) {
      accepted = solved;
      reached += stage;
      const left: number = 1 - reached;
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
      accepted === null ? linearized(reached + stage) : accepted.local,
      request(reached + stage),
    );
  }
  if (accepted !== null && Math.abs(1 - reached) > 0)
    solved = {
      ...accepted,
      local: accepted.local,
      r: accepted.r.map(
        (v: number, i: number): number =>
          v + request(reached)[i]! - request(1)[i]!,
      ),
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
    flight: solved.flight,
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

  /**
   * The default tolerance on the residual's norm, radians: a hundredth of a
   * revolution, a quarter of the 0.04 revolution of somersault by which
   * #3416 reports Yeadon, Atha and Hales (1990) found their simulation model
   * to differ from recorded performances (the paper not yet read at the
   * source), so the solver's miss stays below the model's own error.
   */
  export const TOLERANCE: number = 2 * Math.PI * 0.01;

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
  ): IAutoMovieSolveAirborneTakeoff.IAngles {
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
   * unwrapped across the integrator's default step from take-off, read
   * between knots as the flight reads itself, radians, so whole turns
   * accumulate: each instant's angle is taken on the branch nearest the
   * previous one, which holds while a turn between instants stays under half
   * a revolution (under 30 revolutions a second at a sixtieth of a second),
   * however long an error-controlled step is.
   *
   * @param flight The flight.
   * @param frame The reference frame the angles are read in.
   * @returns The touchdown angles, radians.
   */
  export function unwrapped(
    flight: IAutoMovieIntegrateAirborneRotation.IFlight,
    frame: IAutoMovieQuaternion,
  ): IAutoMovieSolveAirborneTakeoff.IAngles {
    let somersault: number = 0;
    let twist: number = 0;
    let tilt: number = 0;
    const step: number = integrateMotionTrajectory.STEP;
    const instants: number = Math.ceil((flight.t1 - flight.t0) / step) + 1;
    for (let k: number = 0; k < instants; k++) {
      const t: number = k === instants - 1 ? flight.t1 : flight.t0 + k * step;
      const a: IAutoMovieSolveAirborneTakeoff.IAngles = angles(
        frame,
        flight.orientation(t),
      );
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
 * Adapt row arrays to the engine's existing three-column linear solver.
 *
 * @param a The matrix's rows.
 * @param b The right-hand side.
 * @returns The solution, or null for a singular or non-finite matrix.
 */
function solve3(a: readonly number[][], b: readonly number[]): number[] | null {
  if (!a.flat().every(Number.isFinite) || !b.every(Number.isFinite))
    return null;
  const column = (c: number): AutoMovieVector3Tuple => [
    a[0]![c]!,
    a[1]![c]!,
    a[2]![c]!,
  ];
  return AutoMovieSolidVector.solve3(column(0), column(1), column(2), [
    b[0]!,
    b[1]!,
    b[2]!,
  ]);
}
