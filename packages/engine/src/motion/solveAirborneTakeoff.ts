import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AirborneTakeoffJacobian } from "./AirborneTakeoffJacobian";
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
 * zero. The returned residual at touchdown is always against the full request,
 * `[φ - 2π somersault, θ, ψ - 2π twist]`, even when continuation stops early.
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
 * @evidence contracts/development/implementation.md#principled-implementation Newton's method with integrated sensitivity and analytic Euler-angle derivatives, actual-residual step-halving and continuation. The three momentum directions are an orthogonal unit basis with one physical unit. Sensitivity has a local matrix-error estimate, not a global Jacobian certificate; chart singularity, inaccurate derivatives or the finite iteration budget can still miss a feasible request.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A residual over one integration, a linearized start, then a fixed loop of Jacobian, solve and backtrack.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A request the flight cannot meet is reported as a miss with its residual; the caller refuses it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One flight with nine sensitivity states per uncached momentum evaluation, at most ITERATIONS Newton steps and HALVINGS backtracks per stage. Continuation adds stages until the request is reached or its increment falls below the angular tolerance; different adaptive trial meshes can still require new shape evaluations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed flight and history make endpoint angles and Jacobian independent of the turn target. Reuses the current or last rejected evaluation only when every projected momentum component is Object.is equal, subtracting the new target from the original unwrapped endpoint rather than reconstructing it from an old residual. Different points still integrate independently.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reuse checks only the call-local current or starting point and one last rejected trial; continuation also owns its accepted and last solved stage until replacement. There is no point map or cross-call cache. The returned flight escapes for playback; other evaluations lose their references on return. The caller owns the history's lifetime; HumanPerformanceFlight clears its exact-time statistics after solving and preparing playback.
 */
export function solveAirborneTakeoff(
  props: solveAirborneTakeoff.IProps,
): solveAirborneTakeoff.ISolution {
  const flight: number = props.t1 - props.t0;
  if (!(flight > 0))
    throw new Error(`The take-off needs a positive flight, got ${flight}`);
  const axes: IAutoMovieQuaternion = props.frame ?? Quaternion.identity();
  const frame: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(props.q0, axes),
  );
  const tolerance: number = props.tolerance ?? solveAirborneTakeoff.TOLERANCE;

  /** A shooting residual and integrated sensitivity on the evaluated flight. */
  interface IEvaluation {
    end: solveAirborneTakeoff.IAngles;
    r: number[];
    jacobian: number[][];
    flight: integrateAirborneRotation.IFlight;
  }

  /** An evaluation at its projected momentum in the fixed take-off frame. */
  type IPoint = IEvaluation & { local: number[] };
  const directions: IAutoMovieVector3[] = [0, 1, 2].map(
    (i: number): IAutoMovieVector3 =>
      Quaternion.rotateVector(frame, {
        x: i === 0 ? 1 : 0,
        y: i === 1 ? 1 : 0,
        z: i === 2 ? 1 : 0,
      }),
  );

  const retarget: (
    value: Omit<IEvaluation, "r">,
    target: readonly number[],
  ) => IEvaluation = (
    value: Omit<IEvaluation, "r">,
    target: readonly number[],
  ): IEvaluation => ({
    end: value.end,
    r: [
      value.end.somersault - target[0]!,
      value.end.tilt - target[1]!,
      value.end.twist - target[2]!,
    ],
    jacobian: value.jacobian,
    flight: value.flight,
  });

  // Target-independent flight data is reusable only at the same projected point.
  const residual = (
    local: readonly number[],
    target: readonly number[],
    current?: IPoint,
    rejected?: IPoint,
  ): IEvaluation => {
    const known: IPoint | undefined = [current, rejected].find(
      (value: IPoint | undefined): boolean =>
        value !== undefined &&
        value.local.length === local.length &&
        local.every((v: number, i: number): boolean =>
          Object.is(v, value.local[i]),
        ),
    );
    if (known !== undefined) return retarget(known, target);
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
        tolerance: props.integration,
        variations: directions,
      },
    );
    // The body seen in the frame's axes, `q F`, so the take-off reads zero.
    const end: solveAirborneTakeoff.IAngles = solveAirborneTakeoff.unwrapped(
      {
        ...turned,
        orientation: (t: number): IAutoMovieQuaternion =>
          Quaternion.multiply(turned.orientation(t), axes),
      },
      frame,
    );
    return retarget(
      {
        end,
        jacobian: AirborneTakeoffJacobian(
          end,
          axes,
          turned.variations(props.t1),
        ),
        flight: turned,
      },
      target,
    );
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
    known?: IPoint,
  ): IPoint => {
    let local: number[] = projected(start);
    let evaluated: IEvaluation = residual(local, target, known);
    let rejected: IPoint | undefined;
    for (
      let k: number = 0;
      k < solveAirborneTakeoff.ITERATIONS && norm(evaluated.r) > tolerance;
      k++
    ) {
      const delta: number[] | null = AirborneTakeoffLinear.solve(
        evaluated.jacobian,
        evaluated.r,
      );
      if (delta === null) break;

      // Backtrack: halve the step until it lowers the residual.
      let scale: number = 1;
      let next: number[] = local;
      let after: IEvaluation = evaluated;
      for (let h: number = 0; h <= solveAirborneTakeoff.HALVINGS; h++) {
        const trial: number[] = projected(
          local.map((v: number, i: number): number => v - scale * delta[i]!),
        );
        const tr: IEvaluation = residual(
          trial,
          target,
          { local, ...evaluated },
          rejected,
        );
        if (norm(tr.r) < norm(evaluated.r)) {
          next = trial;
          after = tr;
          break;
        }
        rejected = { local: trial, ...tr };
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
  const request = (share: number): number[] => [
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
      if (Math.abs(stage) < smallest) {
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
  const { local } = solved;
  const { r } = retarget(solved, request(1));
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
   * The fixed shape history, physical request and numerical budgets of a takeoff solve.
   *
   * Members state flight seconds, quaternion frames, turns, world angular momentum and angular/integration tolerances.
   * A whole-body turn request and momentum ball over a positive flight share one unchanged root-frame history; the solve checks the interval and its flight integrator admits numerical budgets.
   * HumanPerformanceFlight supplies the request and physical ceiling; numerical consumers can additionally supply step and relative/absolute budgets, while the flight owns its tangent partition.
   * Imports the trajectory's budget fields and the history's type without introducing a second state model, guessed rate or per-body exception.
   */
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

    /** The integrator's error control, as the flight that reads the momentum integrates it; the fixed step when absent. */
    integration?: Pick<
      integrateMotionTrajectory.ITolerance,
      "relative" | "absolute"
    >;
  }

  /** A solved take-off. */
  export interface ISolution {
    /** The whole-body angular momentum about the centre of mass, world, kg m²/s. */
    momentum: IAutoMovieVector3;

    /** What the flight misses at touchdown, revolutions: somersault, tilt and twist. */
    residual: IAngles;

    /** Whether the residual is within the tolerance and the momentum within the maximum. */
    met: boolean;

    /** The evaluated flight whose residual was judged; a consumer uses this value for playback instead of reintegrating the momentum on a different adaptive mesh. */
    flight: integrateAirborneRotation.IFlight;
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
    flight: integrateAirborneRotation.IFlight,
    frame: IAutoMovieQuaternion,
  ): IAngles {
    let somersault: number = 0;
    let twist: number = 0;
    let tilt: number = 0;
    const step: number = integrateMotionTrajectory.STEP;
    const instants: number = Math.ceil((flight.t1 - flight.t0) / step) + 1;
    for (let k: number = 0; k < instants; k++) {
      const t: number = k === instants - 1 ? flight.t1 : flight.t0 + k * step;
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
