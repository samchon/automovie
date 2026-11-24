import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AirborneTakeoffAngles } from "./AirborneTakeoffAngles";
import { AirborneTakeoffLinear } from "./AirborneTakeoffLinear";
import { AirborneTakeoffTrial } from "./AirborneTakeoffTrial";

/**
 * The take-off angular momentum that turns a body in flight through the
 * requested somersault and twist and lands it with no tilt (#3426), for a given
 * shape history and flight.
 *
 * The flight uses Yeadon's somersault, tilt and twist terminology
 * (https://www.lboro.ac.uk/microsites/ssehs/biomechanics/papers/nutation.pdf).
 * In this module's coordinate convention the body's attitude in the frame's
 * axes `F` relative to its take-off, `(q0 F)⁻¹ q(t) F`, the identity at
 * take-off whatever the frame, is `Rx(φ) Rz(θ) Ry(ψ)`, a somersault `φ` about
 * the frame's lateral axis X, then a tilt `θ` about its forward axis Z, then a
 * twist `ψ` about the body's long axis Y (`angles`). The somersault and the
 * twist are unwrapped across the integrator's default step, so a whole turn
 * reads 2π and not zero. The returned residual at touchdown is always against
 * the full request, `[φ - 2π somersault, θ, ψ - 2π twist]`, even when
 * continuation stops early.
 *
 * The linearized start is `(∫ I⁻¹ dt)⁻¹ (turns + ∫ I⁻¹ h dt)`, the integrals by
 * Simpson's rule: the fixed integration grid in fixed mode, or adaptive
 * quadrature against the shooting angular budget in adaptive mode. That seed
 * estimate does not certify the nonlinear flight. Newton's Jacobian is the
 * forward sensitivity of that same flight, integrated with the orientation (`s'
 * = f_y s + f_p`, SUNDIALS CVODES, section 4.2.6,
 * https://sundials.readthedocs.io/en/latest/cvodes/Mathematics_link.html),
 * carried into the derivatives of Yeadon's angles. It does not difference
 * separately adapted integrations at machine-epsilon momentum offsets.
 * Continuation scales the whole turn request: a missed stage is halved, an
 * accepted stage advances and doubles the next increment (Allgower and Georg,
 * Introduction to Numerical Continuation Methods), down to the request's
 * angular tolerance. Newton's starts and trial steps are projected onto the
 * momentum ball when a ceiling is given, and a projected trial is accepted only
 * if it lowers the residual (projected search, Bertsekas 1982,
 * https://web.mit.edu/dimitrib/www/ProjectedNewton.pdf). The ceiling bounds the
 * search as well as the answer; a projected point outside the angular tolerance
 * remains a miss. The search's flights are integrated under the embedded error
 * estimate alone; given a momentum budget, the solution's momentum is then
 * integrated once more under it, with its sensitivity, and that judged flight
 * is the one returned, played back and whose residual decides the miss, so the
 * momentum control is paid once, by the flight that is shown; without one the
 * search's own solution is that flight.
 *
 * @param props The shape's history, the flight, the take-off frame, the request
 *   and its bounds.
 * @returns The momentum, its residual and whether the request is met.
 * @throws {Error} When the flight is not positive and finite, the tolerance is
 *   not positive and finite, the somersault or twist request is not finite, or
 *   a supplied failure scope is not a symbol.
 */
export function solveAirborneTakeoff(
  props: IAutoMovieSolveAirborneTakeoff.IProps,
): IAutoMovieSolveAirborneTakeoff.ISolution {
  const flight: number = props.t1 - props.t0;
  if (!(flight > 0))
    throw new Error(
      `The take-off needs a positive finite flight, got ${flight}`,
    );
  if (props.errorScope !== undefined && typeof props.errorScope !== "symbol")
    throw new Error("The take-off error scope must be a symbol");
  const tolerance: number = props.tolerance ?? solveAirborneTakeoff.TOLERANCE;

  // The continuation halves a missed stage down to the share the tolerance
  // resolves, tolerance / |request|; a tolerance or request that is not a
  // positive finite number leaves no such share to stop at.
  if (!(tolerance > 0))
    throw new Error(
      `The take-off needs a positive finite tolerance, got ${tolerance}`,
    );

  const axes: IAutoMovieQuaternion = props.frame ?? Quaternion.identity();
  const frame: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(props.q0, axes),
  );

  /** The actual physical point, optionally promoted to integrated sensitivities. */
  type IPoint = AirborneTakeoffTrial.IPoint;
  const operation: AirborneTakeoffTrial.IOperation = AirborneTakeoffTrial(
    props,
    axes,
    frame,
  );
  const norm: (r: readonly number[]) => number = (
    r: readonly number[],
  ): number => Math.hypot(...r);

  /**
   * Euclidean projection onto the admitted momentum ball, used only for search
   * points.
   */
  const projected: (values: readonly number[]) => number[] = (
    values: readonly number[],
  ): number[] => {
    const magnitude: number = norm(values);
    const maximum: number = props.maximum ?? Number.POSITIVE_INFINITY;
    const scale: number = magnitude > maximum ? maximum / magnitude : 1;
    return values.map((v: number): number => scale * v);
  };

  // Newton from a start toward one request, backtracking by halves.
  const newton: (
    start: readonly number[],
    target: readonly number[],
    known?: IPoint,
  ) => IPoint = (
    start: readonly number[],
    target: readonly number[],
    known?: IPoint,
  ): IPoint => {
    let local: number[] = projected(start);
    let evaluated: IPoint = operation.evaluate(local, target, true, known);
    let error: number = norm(evaluated.r);
    let rejected: IPoint | undefined;
    for (
      let k: number = 0;
      k < solveAirborneTakeoff.ITERATIONS && error > tolerance;
      k++
    ) {
      const delta: number[] | null = AirborneTakeoffLinear.solve(
        evaluated.jacobian!,
        evaluated.r,
      );
      if (delta === null) break;

      // Backtrack: halve the step until it lowers the residual.
      let scale: number = 1;
      let next: number[] = local;
      let after: IPoint = evaluated;
      for (let h: number = 0; h <= solveAirborneTakeoff.HALVINGS; h++) {
        const trial: number[] = projected(
          local.map((v: number, i: number): number => v - scale * delta[i]!),
        );
        // One integration a trial, with its sensitivity: an accepted trial is
        // the next Newton point and needs its Jacobian, and a full step is
        // the usual outcome, so a trial is not integrated twice.
        const tr: IPoint = operation.evaluate(
          trial,
          target,
          true,
          evaluated,
          rejected,
        );
        const trialError: number = norm(tr.r);
        if (trialError < error) {
          next = trial;
          after = tr;
          error = trialError;
          break;
        }
        rejected = tr;
        scale /= 2;
      }
      if (next === local) break;
      local = next;
      evaluated = after;
    }
    return evaluated;
  };

  try {
    const { turning, lagging } = AirborneTakeoffLinear(
      props,
      Quaternion.inverse(axes),
      props.integration === undefined ? undefined : tolerance,
    );

    // Continue the whole request, since even a plain somersault can couple to tilt.
    const linearized: (share: number) => number[] = (
      share: number,
    ): number[] => {
      const start: number[] | null = AirborneTakeoffLinear.solve(turning, [
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
    const request: (share: number) => number[] = (share: number): number[] => [
      2 * Math.PI * props.somersault * share,
      0,
      2 * Math.PI * props.twist * share,
    ];
    const smallest: number = tolerance / Math.max(tolerance, norm(request(1)));
    let reached: number = 0;
    let accepted: IPoint | null = null;
    let stage: number = 1;
    let solved: IPoint = newton(linearized(stage), request(stage));
    for (;;) {
      if (norm(solved.r) <= tolerance) {
        accepted = solved;
        reached += stage;
        const left: number = 1 - reached;
        if (Math.abs(left) <= 0) break;
        stage = Math.sign(left) * Math.min(Math.abs(left), 2 * Math.abs(stage));
      } else {
        stage /= 2;

        // Below the share the tolerance resolves, or below the resolution of
        // the share already reached (reached + stage === reached), a stage
        // moves no request. The second test bounds the halvings by binary64's
        // precision and exponent range (at most 1075 from a whole stage, when
        // it underflows to zero) where a tiny tolerance underflows `smallest`
        // itself to zero.
        if (Math.abs(stage) < smallest || reached + stage === reached) {
          solved = accepted ?? solved;
          break;
        }
      }
      solved = newton(
        accepted === null ? linearized(reached + stage) : accepted.local,
        request(reached + stage),
        accepted ?? solved,
      );
    }
    // The solution's flight judged once under the momentum budget: the
    // flight that is played back and whose residual is reported.
    const { local } = solved;
    // Without a momentum budget the search's own control is the judged one,
    // so its solution is the judged flight and is not integrated again.
    const judged: IPoint =
      props.momentumTolerance === undefined
        ? operation.retarget(solved, request(1))
        : operation.evaluate(
            local,
            request(1),
            true,
            undefined,
            undefined,
            true,
          );
    const { r } = judged;
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
      flight: judged.flight,
    };
  } finally {
    operation.clear();
  }
}

/**
 * Companion types, constants and attitude readings of
 * {@link solveAirborneTakeoff}.
 */
export namespace solveAirborneTakeoff {
  /**
   * Newton iterations, at most: a work budget, not a physical value; from an
   * in-basin start Newton's quadratic convergence meets the tolerance in a
   * handful, and the search stops as soon as it does.
   */
  export const ITERATIONS: number = 12;

  /**
   * Step halvings of the backtracking per iteration, at most: a work budget,
   * shrinking a step to a thousandth before the search gives up on it.
   */
  export const HALVINGS: number = 10;

  /**
   * The default angular residual norm is 0.01 revolution, expressed in radians.
   * Yeadon, Atha and Hales compared their model with nine filmed somersaults.
   * Their largest differences were 0.04 revolution in somersault, 7 degrees in
   * tilt and 0.12 revolution in twist. This solver uses one quarter of their
   * somersault discrepancy as its numerical target.
   * https://doi.org/10.1016/0021-9290(90)90372-A
   */
  export const TOLERANCE: number = 2 * Math.PI * 0.01;
  /**
   * Yeadon's somersault, tilt and twist of an orientation relative to a frame,
   * radians, from `M = frame⁻¹ q = Rx(φ) Rz(θ) Ry(ψ)`: the long axis `M Y =
   * (-sin θ, cos θ cos φ, cos θ sin φ)` gives the tilt and the somersault, and
   * the lateral axis turned back by `(Rx(φ) Rz(θ))⁻¹` gives the twist.
   * Somersault and twist retain atan2's principal branches; the tilt lies in
   * [-π/2, π/2].
   *
   * @param frame The reference frame, unit.
   * @param q The orientation, unit.
   * @returns The angles, radians.
   */
  export function angles(
    frame: IAutoMovieQuaternion,
    q: IAutoMovieQuaternion,
  ): IAutoMovieSolveAirborneTakeoff.IAngles {
    return AirborneTakeoffAngles(Quaternion.inverse(frame), q);
  }

  /**
   * A flight's attitude at touchdown with the somersault and the twist
   * unwrapped across the integrator's default step from take-off, read between
   * knots as the flight reads itself, radians, so whole turns accumulate: each
   * instant's angle is taken on the branch nearest the previous one, which
   * holds while a turn between instants stays under half a revolution (under 30
   * revolutions a second at a sixtieth of a second), however long an
   * error-controlled step is. The unchanged reference frame is inverted once
   * for the whole pass.
   *
   * @param flight The flight.
   * @param frame The reference frame the angles are read in.
   * @returns The touchdown angles, radians.
   */
  export function unwrapped(
    flight: IAutoMovieIntegrateAirborneRotation.IFlight,
    frame: IAutoMovieQuaternion,
  ): IAutoMovieSolveAirborneTakeoff.IAngles {
    return AirborneTakeoffAngles.unwrapped(flight, frame);
  }
}
