import { clampJointToSkeleton } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanFitGoals,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBodyFitMerit } from "./HumanBodyFitMerit";
import { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanFitGoals } from "./HumanFitGoals";
import { HumanFitPairs } from "./HumanFitPairs";
import { HumanFitVariables } from "./HumanFitVariables";
import { HumanJacobian } from "./HumanJacobian";
import type { HumanQuadraticInteriorSession } from "./HumanQuadraticInteriorSession";
import { HumanQuadraticProgram } from "./HumanQuadraticProgram";
import { HumanQuadraticValue } from "./HumanQuadraticValue";
import { HumanSequentialConvex } from "./HumanSequentialConvex";

/** The alternatives of `Fit`'s site. */
type Fit = "body" | "posture";

/**
 * A whole-body fit: the static posture nearest a preferred one in which points
 * of the body reach their goals, the parts that bear rest on the floor, nothing
 * passes under it, the centre of mass stands over the base of support and the
 * folded segments stay apart, all within the joint ranges and solved together:
 * the static multi-contact posture problem of Bouyarmane and Kheddar 2010 (IEEE
 * Humanoids, "Static multi-contact inverse problem for multiple humanoid robots
 * and manipulated objects") and Escande, Kheddar and Miossec 2013 (Robot Auton
 * Syst 61:428).
 *
 * The variables are any set of the posture's own (`HumanFitVariables`), the
 * whole body's when none is given, and the objective keeps them nearest the
 * preferred posture in joint space. A target brings a point riding a bone to a
 * world goal on the axes it names, a rotation to a goal, or, as a planar
 * contact, the contact frame's normal parallel to the surface's with its turn
 * about it free. Included angles between bone-carried landmarks and projections
 * of the physical centre of mass are constrained by the same fit, with their
 * own analytic Jacobians (`HumanFitGoals`). Goals may ride another bone, whose
 * frame and Jacobian move with the fit. A physical point radius is one distance
 * inequality, without widening it by the equality rows' numerical band
 * (`HumanFitTargets`). A bearing part touches the floor at its lowest point and
 * every other point of it stays out of the floor, so a rigid curved part rests
 * on one point and a planar contact's normal lays it flat. Every row is an
 * exact penalty at the merit coefficient (an elastic l1 sequential quadratic
 * program; Fletcher 1985) linearised by the analytic Jacobian of the posed body
 * (`HumanJacobian`), and the merit (`HumanBodyFitMerit`) prices exactly what
 * the rows do. The steps are taken by trajopt's sequential convex loop
 * (`HumanSequentialConvex`, the port of `sco::BasicTrustRegionSQP::optimize`)
 * at sco's defaults, each convex model solved inside the trust box, intersected
 * with the joint ranges as `setTrustBoxConstraints` intersects it, by the
 * interior-point method (`HumanQuadraticProgram.interior`, Mehrotra's
 * predictor-corrector as HPIPM implements it, Frison and Diehl 2020); a model
 * that method cannot solve ends the fit failed, as sco's ends where its convex
 * solver fails.
 */
export namespace HumanBodyFit {
  /**
   * The price a target's or an angle's own `price` is a share of: a row without
   * one weighs the merit coefficient itself.
   */
  export const PRICE: number = 100;

  /** The shared acceptance precision, metres or radians, owned by the merit. */
  export const TOLERANCE: number = HumanBodyFitMerit.TOLERANCE;

  /**
   * How far a row may miss unpriced, metres, in each step's rows and in the
   * merit alike; half the tolerance, so a step that meets its rows holds.
   */
  const BAND: number = HumanBodyFitRows.BAND;

  /** The rows are written in millimetres. */
  const MM: number = HumanBodyFitRows.MM;

  /**
   * A collider or a pair farther than this beyond contact is left out of a
   * step's rows, metres: trajopt's contact distance, the largest safety
   * distance plus 0.04 m (`problem_description.cpp` line 549 at commit
   * 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause; Schulman et al.
   * 2014, section IV-A, `d_check > d_safe`), these rows' safety distance being
   * contact itself.
   */
  const NEAR: number = 0.04;

  /**
   * The fit and what it misses by.
   *
   * @param props The fit.
   * @returns The fitted posture, its constraint residuals and feasibility,
   *   whether the loop converged and how it ended.
   */
  export function fit(
    props: IAutoMovieMotionHumanBodyFitTypes.IProps,
  ): IAutoMovieMotionHumanBodyFitTypes.IResult {
    const {
      body,
      posture,
    }: Pick<IAutoMovieMotionHumanBodyFitTypes.IProps, Fit> = props;
    const variables: readonly IAutoMovieMotionHumanJacobian.IVariable[] =
      props.variables ?? HumanFitVariables.BODY;
    const targets: readonly IAutoMovieMotionHumanBodyFitTypes.ITarget[] =
      props.targets ?? [];
    const angles: readonly IAutoMovieMotionHumanFitGoals.IAngle[] =
      props.angles ?? [];
    const bearing: readonly RegExp[] = props.bearing ?? [];
    const pairs: HumanFitPairs.IPair[] = HumanFitPairs.of(body);
    const n: number = variables.length;
    const hasJointVariables: boolean = variables.some(
      (variable: IAutoMovieMotionHumanJacobian.IVariable): boolean =>
        variable.kind === "angle",
    );
    const key: Float64Array = HumanFitVariables.vector(variables, posture);
    const units: number[] = variables.map(
      (v: IAutoMovieMotionHumanJacobian.IVariable): number =>
        HumanFitVariables.unit(v),
    );
    const index: readonly number[] = Array.from(
      { length: n },
      (_: unknown, i: number): number => i,
    );

    // The merit and the feasibility of an iterate (`HumanBodyFitMerit`).
    const merit: HumanBodyFitMerit.IMerit = HumanBodyFitMerit.of({
      body,
      posture,
      ...(props.balance === undefined ? {} : { balance: props.balance }),
      variables,
      targets,
      angles,
      ...(props.centre === undefined ? {} : { centre: props.centre }),
      bearing,
      pairs,
      key,
      price: PRICE,
    });

    // The objective's curvature in solved units, the same at every iterate:
    // diagonal, each variable's weight times its unit squared.
    const curvature: Float64Array[] = Array.from(
      { length: n },
      (_: unknown, i: number): Float64Array => {
        const row: Float64Array = new Float64Array(n - i);
        row[0] = HumanFitVariables.weight(variables[i]!) * units[i]! ** 2;
        return row;
      },
    );

    // The joints' projection, prepared once for the fit's whole solve.
    const projection: ReturnType<typeof clampJointToSkeleton.prepare> | null =
      hasJointVariables ? clampJointToSkeleton.prepare(body.skeleton) : null;

    // The interior-point solves of one linearisation share a session: its
    // scales, its scratch, and its last converged point as the start of the
    // next program of the same rows (a smaller box). A new linearisation has
    // other rows and is scaled on its own.
    const session: HumanQuadraticInteriorSession.ISession = {};

    const moved: (x: Float64Array, s: Float64Array) => Float64Array = (
      x: Float64Array,
      s: Float64Array,
    ): Float64Array =>
      Float64Array.from(
        x,
        (v: number, i: number): number => v + s[i]! * units[i]!,
      );

    const problem: IAutoMovieMotionHumanSequentialConvex.IProblem<
      Float64Array,
      IEvaluation
    > = {
      // getClosestFeasiblePoint: each variable brought into its range by the
      // least step its range rows allow from it.
      closest: (x: Float64Array): Float64Array =>
        moved(
          x,
          Float64Array.from(
            HumanFitVariables.bounds(variables, x, Infinity),
            (row: IAutoMovieMotionHumanQuadraticProgram.IRow): number =>
              Math.min(row.u, Math.max(row.l, 0)),
          ),
        ),
      evaluate: merit.evaluate,
      convexify: (
        x: Float64Array,
        e: IEvaluation,
        coefficient: number,
      ): IAutoMovieMotionHumanSequentialConvex.IModel<Float64Array> => {
        const at: IReading = e.r;

        // A new linearisation has other rows: its interior solves are scaled
        // and started on their own.
        session.scaling = undefined;
        session.point = undefined;
        const step: HumanBodyFitRows.IStep = {
          body,
          at,
          motions: HumanJacobian.read(
            body,
            at.written,
            at.bones,
            variables,
            projection ?? undefined,
          ).motions,
          units,
          index,
          targets,
          angles,
          ...(props.centre === undefined ? {} : { centre: props.centre }),
          price: coefficient,
          touching: e.touching,
        };
        const rowed: Set<number> = new Set();
        at.heights.forEach((h: number, c: number): void => {
          const low: number = at.lows[at.of[c]!]!;
          if (
            !e.touchingSet.has(c) &&
            (h < 0 || (low <= NEAR && h <= low + HumanBodyFitRows.MARGIN))
          )
            rowed.add(c);
        });
        const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [
          ...HumanBodyFitRows.of(step),
          ...HumanBodyFitRows.floor(step, rowed),
        ].map((r: IRead): IAutoMovieMotionHumanQuadraticProgram.IRow => r.row);

        // Misses holds actual negative gaps for this same ordered pair list.
        pairs.forEach((pair: HumanFitPairs.IPair, k: number): void => {
          if (-e.misses.pairs[k]! <= NEAR)
            rows.push(HumanFitPairs.row(step, pair, BAND, MM, e.gaps[k]!).row);
        });

        // The objective's slope at the iterate, in solved units.
        const q: Float64Array = Float64Array.from(
          variables,
          (v: IAutoMovieMotionHumanJacobian.IVariable, i: number): number =>
            HumanFitVariables.weight(v) * units[i]! * (x[i]! - key[i]!),
        );
        return {
          solve: (
            box: number,
          ): IAutoMovieMotionHumanSequentialConvex.IStep<Float64Array> => {
            // setTrustBoxConstraints: the box intersected with the ranges.
            const qp: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
              n,
              band: n - 1,
              p: curvature,
              q,
              rows: [...rows, ...HumanFitVariables.bounds(variables, x, box)],
            };
            const solved: Float64Array | undefined =
              HumanQuadraticProgram.interior(qp, session)?.x;
            if (solved === undefined)
              return { trial: x, merit: Infinity, failed: true };

            // The model merit: the pull's quadratic about the iterate and the
            // priced linearised rows at the solution, plus the pull's value at
            // the iterate, the constant the model omits.
            return {
              trial: moved(x, solved),
              merit:
                e.objective + HumanQuadraticValue(qp, solved, undefined, 0),
              failed: false,
            };
          },
        };
      },
    };

    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<
      Float64Array,
      IEvaluation
    > = HumanSequentialConvex.minimise(
      problem,
      HumanFitVariables.vector(variables, props.start ?? posture),
      HumanSequentialConvex.DEFAULTS,
    );
    const r: IReading = solved.evaluation.r;
    const feasible: boolean = merit.holds(solved.evaluation.misses);
    return {
      posture: r.written,
      residuals: targets.map(
        (
          t: IAutoMovieMotionHumanBodyFitTypes.ITarget,
          k: number,
        ): IAutoMovieMotionHumanBodyFitTypes.IResidual =>
          HumanBodyFitRows.residual(t, r, k),
      ),
      angles: angles.map(
        (target: IAutoMovieMotionHumanFitGoals.IAngle, k: number): number => {
          const [lo, hi]: readonly [number, number] =
            HumanFitGoals.bounds(target);
          return (
            (Math.max(0, lo - r.angles[k]!, r.angles[k]! - hi) * 180) / Math.PI
          );
        },
      ),
      centre:
        props.centre === undefined
          ? 0
          : Math.hypot(
              ...HumanFitGoals.directions(props.centre).map(
                (axis: IAutoMovieVector3): number =>
                  (r.centre!.x - props.centre!.point.x) * axis.x +
                  (r.centre!.y - props.centre!.point.y) * axis.y +
                  (r.centre!.z - props.centre!.point.z) * axis.z,
              ),
            ) * MM,
      balance:
        Math.max(
          0,
          ...(r.balance?.inside ?? []).map((d: number): number => -d),
        ) * MM,
      feasible,
      converged: solved.status === "converged" && feasible,
      reason: solved.status,
    };
  }

  /** A posture's reading for the fit. */
  type IReading = HumanBodyFitRows.IReading;

  /** A row of a step and the reading it linearises. */
  type IRead = HumanBodyFitRows.IRead;

  /** An iterate's reading for the loop (`HumanBodyFitMerit`). */
  type IEvaluation = HumanBodyFitMerit.IEvaluation;
}
