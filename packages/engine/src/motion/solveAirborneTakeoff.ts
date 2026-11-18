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
 * unwrapped across the integrator's default step, so a whole turn reads 2π and not
 * zero. The returned residual at touchdown is always against the full request,
 * `[φ - 2π somersault, θ, ψ - 2π twist]`, even when continuation stops early.
 *
 * The linearized start is `(∫ I⁻¹ dt)⁻¹ (turns + ∫ I⁻¹ h dt)`, the
 * integrals by Simpson's rule: the fixed integration grid in fixed mode,
 * or adaptive quadrature against the shooting angular budget in adaptive
 * mode. That seed estimate does not certify the nonlinear flight. Newton's Jacobian
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
 * tolerance remains a miss. The search's flights are integrated under the
 * embedded error estimate alone; the solution's momentum is then integrated
 * once more under the sampled dense momentum budget, and that judged flight
 * is the one returned, played back and whose residual decides the miss, so
 * the momentum control is paid once, by the flight that is shown.
 *
 * @param props The shape's history, the flight, the take-off frame, the request and its bounds.
 * @returns The momentum, its residual and whether the request is met.
 * @throws {Error} When the flight is not positive and finite, the tolerance is not positive and finite, the somersault or twist request is not finite, or a supplied failure scope is not a symbol.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the angle convention with its source, the unwrapping, the residual, the start, the iteration with its globalization, determinism and the miss.
 * @evidence contracts/development/implementation.md#principled-implementation Newton's method with integrated sensitivity and analytic Euler-angle derivatives, actual-residual step-halving and continuation. The three momentum directions are an orthogonal unit basis with one physical unit. Sensitivity has a local matrix-error estimate, not a global Jacobian certificate; chart singularity, inaccurate derivatives or the finite iteration budget can still miss a feasible request.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A residual over one integration, a linearized start, then a fixed loop of Jacobian, solve and backtrack.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A request the flight cannot meet is reported as a miss with its residual; the caller refuses it.
 * @evidence contracts/development/implementation.md#efficient-algorithms The adaptive linear seed starts with five history samples and refines only its estimated angular error; fixed mode retains the integration grid. Every Newton point and backtracking trial is one integration with its nine sensitivity states, so an accepted trial, the usual full step, is never integrated twice; search flights skip the dense momentum probes, which only the one judged flight of the solution pays. Factory histories share error-checked exact time partitions across trials; their finest retained mesh can increase later stage counts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed flight and history make endpoint angles and Jacobian independent of the turn target. Reuses the current or last rejected evaluation only when every projected momentum component is Object.is equal, subtracting the new target from the original unwrapped endpoint rather than reconstructing it from an old residual. Different points still integrate independently. Each Newton point's unchanged residual norm serves all of its backtracking comparisons. Each unwrapping pass shares its unchanged reference-frame inverse through the same angle owner as the public single-angle reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reuse checks only the call-local current or starting point and one last rejected trial; continuation also owns its accepted and last solved stage until replacement. A factory history additionally gives this solve one numeric time partition, cleared in finally on success or failure. There is no point map or cross-call cache. Playback retains the actual accepted numeric flight, never the partition or history. The caller separately clears the history after solving and preparing playback.
 */
export function solveAirborneTakeoff(
  props: IAutoMovieSolveAirborneTakeoff.IProps,
): IAutoMovieSolveAirborneTakeoff.ISolution {
  const flight: number = props.t1 - props.t0;
  if (!(Number.isFinite(flight) && flight > 0))
    throw new Error(`The take-off needs a positive finite flight, got ${flight}`);
  if (props.errorScope !== undefined && typeof props.errorScope !== "symbol")
    throw new Error("The take-off error scope must be a symbol");
  const tolerance: number = props.tolerance ?? solveAirborneTakeoff.TOLERANCE;

  // The continuation halves a missed stage down to the share the tolerance
  // resolves, tolerance / |request|; a tolerance or request that is not a
  // positive finite number leaves no such share to stop at.
  if (!(Number.isFinite(tolerance) && tolerance > 0))
    throw new Error(`The take-off needs a positive finite tolerance, got ${tolerance}`);
  if (!(Number.isFinite(props.somersault) && Number.isFinite(props.twist)))
    throw new Error("The take-off needs a finite somersault and twist request");
  const axes: IAutoMovieQuaternion = props.frame ?? Quaternion.identity();
  const frame: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(props.q0, axes),
  );

  /** The actual physical point, optionally promoted to integrated sensitivities. */
  type IPoint = AirborneTakeoffTrial.IPoint;
  const operation: AirborneTakeoffTrial.IOperation = AirborneTakeoffTrial(props, axes, frame);
  const norm: (r: readonly number[]) => number = (
    r: readonly number[],
  ): number => Math.hypot(...r);

  /** Euclidean projection onto the admitted momentum ball, used only for search points. */
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
        const tr: IPoint = operation.evaluate(trial, target, true, evaluated, rejected);
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
    const linearized: (share: number) => number[] = (share: number): number[] => {
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
    const judged: IPoint = operation.evaluate(local, request(1), false, undefined, undefined, true);
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
   * the twist. Somersault and twist retain atan2's principal branches;
   * the tilt lies in [-π/2, π/2].
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
   * unwrapped across the integrator's default step from take-off, read
   * between knots as the flight reads itself, radians, so whole turns
   * accumulate: each instant's angle is taken on the branch nearest the
   * previous one, which holds while a turn between instants stays under half
   * a revolution (under 30 revolutions a second at a sixtieth of a second),
   * however long an error-controlled step is.
   * The unchanged reference frame is inverted once for the whole pass.
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
