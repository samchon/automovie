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

/**
 * A whole-body fit: the static posture nearest a preferred one in which
 * points of the body reach their goals, the parts that bear rest on the
 * floor, nothing passes under it, the centre of mass stands over the base
 * of support and the folded segments stay apart, all within the joint
 * ranges and solved together: the static multi-contact posture problem of
 * Bouyarmane and Kheddar 2010 (IEEE Humanoids, "Static multi-contact
 * inverse problem for multiple humanoid robots and manipulated objects")
 * and Escande, Kheddar and Miossec 2013 (Robot Auton Syst 61:428).
 *
 * The variables are any set of the posture's own (`HumanFitVariables`), the
 * whole body's when none is given, and the objective keeps them nearest the
 * preferred posture in joint space. A target brings a point riding a bone
 * to a world goal on the axes it names, a rotation to a goal, or, as a
 * planar contact, the contact frame's normal parallel to the surface's with
 * its turn about it free. Included angles between bone-carried landmarks
 * and projections of the physical centre of mass are constrained by the
 * same fit, with their own analytic Jacobians (`HumanFitGoals`). Goals may
 * ride another bone, whose frame and Jacobian move with the fit. A physical
 * point radius is one distance inequality, without widening it by the
 * equality rows' numerical band (`HumanFitTargets`). A bearing part touches the floor at its lowest
 * point and every other point of it stays out of the floor, so a rigid
 * curved part rests on one point and a planar contact's normal lays it
 * flat. Every row is an exact penalty at its price (an elastic l1
 * sequential quadratic program; Fletcher 1985) linearised by the analytic
 * Jacobian of the posed body (`HumanJacobian`), and the merit
 * (`HumanBodyFitMerit`) prices exactly
 * what the rows do, so the model and the merit agree at every iterate
 * (Nocedal and Wright 2006, section 18.5). The steps are taken by the shared
 * penalty sequential convex loop (`HumanSequentialConvex`), its penalty
 * steered at each iterate (Byrd, Nocedal and Waltz 2008), each convex model
 * solved by the shared quadratic program (`HumanQuadraticProgram`) inside a
 * trust region, with one second-order correction of a rejected step
 * (Nocedal and Wright 2006, (15.36) and Algorithm 15.2).
 *
 * Each convex model is solved by the interior-point method
 * (`HumanQuadraticProgram.interior`, Mehrotra's predictor-corrector as HPIPM
 * implements it, Frison and Diehl 2020), whose iteration count does not grow
 * with the conditioning of the model's dense joint-space curvature, and by
 * the operator splitting (OSQP) only where the interior method does not
 * converge. Solved by the splitting first, a third of a rise's models ended
 * unfinished at its iteration guard, short of the minimiser, and their steps
 * were rejected by the trust region for the error (measured on the get-up's
 * supine rise: 24 of 72 programs, 8.0 s of a 9.4 s fit, against 0.7 s by
 * the interior method, which met the splitting's polished minimisers to
 * 1e-9).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the problem with its sources, the variables, the objective, the rows, the merit and the loop.
 * @evidence contracts/development/design.md#principled-representation Goals and contacts are the priced rows of one quadratic program over the posture's own variables, the static multi-contact posture problem's representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The target, the props, the result, the price and one fit, read by every law that fits a whole body to its contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The floor is read on the body's colliders, the ranges on the shared table, the slopes on the shared Jacobian, the loop and the convex step are the shared ones.
 */
export namespace HumanBodyFit {
  /** The price of a millimetre a contact misses by, in the merit and in each step's rows: an exact penalty above what the objective trades a millimetre of a contact for (a degree of a joint moves a contact a few millimetres, and weighs one). */
  export const PRICE: number = 100;

  /** The shared acceptance precision, metres or radians, owned by the merit. */
  export const TOLERANCE: number = HumanBodyFitMerit.TOLERANCE;

  /** How far a row may miss unpriced, metres, in each step's rows and in the merit alike; half the tolerance, so a step that meets its rows holds. */
  const BAND: number = HumanBodyFitRows.BAND;

  /** The share of a variable's resolution under which a step is no step: nearby postures are then solved alike. */
  const SETTLED: number = 0.01;

  /** The share of its predicted reduction a step must make to be taken (Nocedal and Wright 2006, Algorithm 18.4's eta). */
  const ACCEPTED: number = 1e-4;

  /** Below this share of its predicted reduction a taken step halves the next region (the textbook quarter, Nocedal and Wright 2006, Algorithm 4.1). */
  const POOR: number = 0.25;

  /** Above this share, at the region's edge, a taken step doubles it (the textbook three quarters, Algorithm 4.1). */
  const GOOD: number = 0.75;

  /** The share of the merit under which a predicted reduction is no step worth taking. */
  const CONVERGED: number = 1e-6;

  /** How many times a step's trust region is halved before the round stops. */
  const HALVINGS: number = 4;

  /** Convexifications at most: a guard whose hit is reported (`IResult.reason`, `rounds`) and never taken as converged. */
  const ROUNDS: number = 400;

  /** The rows are written in millimetres. */
  const MM: number = HumanBodyFitRows.MM;

  /** A collider or a pair farther than this from contact is left out of a step's rows, metres, unless a tried step puts it there. */
  const NEAR: number = 0.08;

  /**
   * The fit and what it misses by.
   *
   * @param props The fit.
   * @returns The fitted posture, its constraint residuals and feasibility, whether the loop converged and why it stopped.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Sequential quadratic programming on the l1 merit: each convexification linearises the rows at the iterate (each bearing part's lowest point, the floor under every collider near it, the targets, the balance's edges, the pairs near contact), all re-selected at that iterate, and the merit prices the same rows, so the model and the merit agree at the iterate they are taken about.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading/merit and shared loop; each fixed linearization owns fresh price shells. A selected step's trial getter selects its captured SOC solve/delta, so a later discarded steering solve cannot replace the correction's basis.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every goal is a priced row and every collider near the floor a row; a residual is measured on the fitted posture, never taken from the model.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds the owning FK/Jacobian and sequential-convex/QP costs with actual projections per candidate. Each subproblem is solved by the interior method in a bounded number of dense factorisations of the n-variable system, independent of the curvature's conditioning; the splitting, whose iteration count grows with it (a third of a supine rise's programs ended unfinished at its 4000-iteration guard), runs only on a program the interior method leaves unsolved. Measured on the get-up's supine rise: 0.7 s of interior solves against 8.0 s of splitting. When all soft prices are implicit, steering reprices O(m) rows without another Jacobian/geometry pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A fit-local canonical factory shares skeleton metadata. At fixed x/e/objective, only default soft prices depend on mu; absent every explicit target/angle/centre price, fresh row identities carry exact new weights. One interior session per linearisation shares its scales, scratch and last converged point across its regions, reprices and correction, a start that decides no answer; a new linearisation clears them. The splitting's fallback keeps its same-row warm iterates and keyed duals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call owns indices, at most two curvatures, canonical metadata, one interior session (one scaling, one scratch set and one point) and current models/iterates/evaluations. A fallback convexification's splitting model holds copied fixed rows and bounded solver scratch until replacement or return; final written posture ownership transfers to the result, without a global result/body cache.
   */
  export function fit(props: IAutoMovieMotionHumanBodyFitTypes.IProps): IAutoMovieMotionHumanBodyFitTypes.IResult {
    const { body, posture }: Pick<IAutoMovieMotionHumanBodyFitTypes.IProps, "body" | "posture"> = props;
    const variables: readonly IAutoMovieMotionHumanJacobian.IVariable[] =
      props.variables ?? HumanFitVariables.BODY;
    const targets: readonly IAutoMovieMotionHumanBodyFitTypes.ITarget[] = props.targets ?? [];
    const angles: readonly IAutoMovieMotionHumanFitGoals.IAngle[] = props.angles ?? [];
    const repriced: boolean = targets.every((t: IAutoMovieMotionHumanBodyFitTypes.ITarget): boolean => t.price === undefined)
      && angles.every((a: IAutoMovieMotionHumanFitGoals.IAngle): boolean => a.price === undefined)
      && props.centre?.price === undefined;
    const bearing: readonly RegExp[] = props.bearing ?? [];
    const pairs: HumanFitPairs.IPair[] = HumanFitPairs.of(body);
    const n: number = variables.length;
    const hasJointVariables: boolean = variables.some(
      (variable: IAutoMovieMotionHumanJacobian.IVariable): boolean => variable.kind === "angle",
    );
    const key: Float64Array = HumanFitVariables.vector(variables, posture);
    const units: number[] = variables.map(
      (v: IAutoMovieMotionHumanJacobian.IVariable): number => HumanFitVariables.unit(v),
    );
    const index: readonly number[] = Array.from(
      { length: n },
      (_: unknown, i: number): number => i,
    );

    // A step under a variable's resolution share, in the widest region's
    // terms, moves no variable by what a film shows.
    const least: number = Math.min(
      ...variables.map(
        (v: IAutoMovieMotionHumanJacobian.IVariable): number =>
          (HumanFitVariables.resolution(v) * SETTLED) /
          HumanFitVariables.reach(v),
      ),
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

    // The selected trial's model, which its rejected second-order correction
    // re-solves with each row shifted by the trial's miss from its linear model
    // (Nocedal and Wright 2006, (15.36), p. 443, and Algorithm 15.2).
    let last: ILast | null = null;

    // Variables, solved units and the pure table weights are fixed for this
    // fit. Neither QP admission nor SOC changes these raw curvature buffers.
    let objectiveP: Float64Array[] | undefined;
    let steeringP: Float64Array[] | undefined;

    // Only canonical metadata crosses models; every candidate is projected.
    let projection: ReturnType<typeof clampJointToSkeleton.prepare> | undefined;

    // The last quadratic program solved and its iterates, from which the next
    // solve starts: the same model at another radius from its iterates, a new
    // convexification from its multipliers by row key, the constraints the
    // rows linearise being the same (warm-started SQP, Nocedal and Wright
    // 2006, section 18.7).
    let previous: {
      qp: IAutoMovieMotionHumanQuadraticProgram.IProblem;
      state: IAutoMovieMotionHumanQuadraticProgram.IState;
      rows: IRead[];
    } | null = null;

    // The interior-point solves of one linearisation share a session: its
    // scales, its scratch, and its last converged point as the start of the
    // next program of the same rows (a smaller region, a reprice, the
    // correction's shifted bounds). A new linearisation has other rows and is
    // scaled on its own.
    const session: HumanQuadraticInteriorSession.ISession = {};
    const problem: IAutoMovieMotionHumanSequentialConvex.IProblem<Float64Array, IEvaluation> = {
      evaluate: merit.evaluate,
      feasible: (e: IEvaluation): boolean => merit.holds(e.misses),
      correct: (
        x: Float64Array,
        _step: IAutoMovieMotionHumanSequentialConvex.IStep<Float64Array>,
        trial: IEvaluation,
      ): Float64Array | null => {
        if (last === null || last.x !== x) return null;
        const l: ILast = last;
        const shifted: IAutoMovieMotionHumanQuadraticProgram.IRow[] = l.rows.map(
          (r: IRead): IAutoMovieMotionHumanQuadraticProgram.IRow => {
            let model: number = 0;
            for (let a: number = 0; a < r.row.index.length; a++)
              model += r.row.coef[a]! * l.moved[r.row.index[a]!]!;
            const miss: number = (r.f(trial.r) - r.f(l.at)) * MM - model;
            return { ...r.row, l: r.row.l - miss, u: r.row.u - miss };
          },
        );
        const state: IAutoMovieMotionHumanQuadraticProgram.IState = l.solve([
          ...shifted,
          ...HumanFitVariables.bounds(variables, x, l.radius),
        ]);
        return moved(x, state.x);
      },
      convexify: (
        x: Float64Array,
        e: IEvaluation,
        mu: number,
        _radius: number,
        objective: boolean,
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
            hasJointVariables
              ? (projection ??= clampJointToSkeleton.prepare(body.skeleton))
              : undefined,
          ).motions,
          units,
          index,
          targets,
          angles,
          ...(props.centre === undefined ? {} : { centre: props.centre }),
          price: mu,
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
        const rows: IRead[] = [
          ...HumanBodyFitRows.of(step),
          ...HumanBodyFitRows.floor(step, rowed),
        ];

        // Misses holds actual negative gaps for this same ordered pair list.
        pairs.forEach((pair: HumanFitPairs.IPair, k: number): void => {
          if (-e.misses.pairs[k]! <= NEAR)
            rows.push(HumanFitPairs.row(step, pair, BAND, MM, e.gaps[k]!));
        });

        // The objective's curvature and slope in solved units; none for the
        // steering's model of the violation alone.
        const retained: Float64Array[] | undefined = objective
          ? objectiveP
          : steeringP;
        const p: Float64Array[] =
          retained ??
          Array.from(
            { length: n },
            (_: unknown, i: number): Float64Array => new Float64Array(n - i),
          );
        const q: Float64Array = new Float64Array(n);
        if (objective)
          for (let i: number = 0; i < n; i++) {
            const w: number = HumanFitVariables.weight(variables[i]!);
            if (retained === undefined) p[i]![0] = w * units[i]! ** 2;
            q[i] = w * units[i]! * (x[i]! - key[i]!);
          }
        if (objective) objectiveP = p;
        else steeringP = p;

        // Radius trials change only hard bounds, not this model's objective.
        // Compute its zero value lazily, after the first QP admission. The
        // splitting's prepared model is built only for a program the
        // interior method leaves unsolved.
        let model: ReturnType<typeof HumanQuadraticProgram.prepare> | undefined;
        const solveRows: (
          rows: readonly IAutoMovieMotionHumanQuadraticProgram.IRow[],
          warm?: IAutoMovieMotionHumanQuadraticProgram.IState,
          duals?: ReadonlyMap<string, number>,
        ) => IAutoMovieMotionHumanQuadraticProgram.IState = (
          rows: readonly IAutoMovieMotionHumanQuadraticProgram.IRow[],
          warm?: IAutoMovieMotionHumanQuadraticProgram.IState,
          duals?: ReadonlyMap<string, number>,
        ): IAutoMovieMotionHumanQuadraticProgram.IState => {
          const qp: IAutoMovieMotionHumanQuadraticProgram.IProblem = { n, band: n - 1, p, q, rows };
          return HumanQuadraticProgram.interior(qp, session) ??
            (model ??= HumanQuadraticProgram.prepare(qp)).solve(rows, warm, duals);
        };
        const priced: (price: number, current: IRead[]) => IAutoMovieMotionHumanSequentialConvex.IModel<Float64Array> = (
          price: number,
          current: IRead[],
        ): IAutoMovieMotionHumanSequentialConvex.IModel<Float64Array> => {
          let zero: number | undefined;
          let fixedRows: IAutoMovieMotionHumanQuadraticProgram.IRow[] | undefined;
          return {
            ...(repriced ? {
              reprice: (next: number): IAutoMovieMotionHumanSequentialConvex.IModel<Float64Array> =>
                priced(next, current.map((r: IRead): IRead => ({ ...r, row: { ...r.row, weight: next } }))),
            } : {}),
            solve: (
              radius: number,
            ): IAutoMovieMotionHumanSequentialConvex.IStep<Float64Array> => {
              const qp: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
                n,
                band: n - 1,
                p,
                q,
                rows: [
                  ...(fixedRows ??= current.map(
                    (r: IRead): IAutoMovieMotionHumanQuadraticProgram.IRow => r.row,
                  )),
                  ...HumanFitVariables.bounds(variables, x, radius),
                ],
              };

              // The splitting, where it solves, starts from the last solve
              // of these rows or from the last solve's multipliers by key.
              const state: IAutoMovieMotionHumanQuadraticProgram.IState =
                previous !== null && previous.rows === current
                  ? solveRows(qp.rows, previous.state)
                  : solveRows(
                      qp.rows,
                      undefined,
                      previous === null
                        ? undefined
                        : HumanQuadraticProgram.multipliers(
                            previous.qp,
                            previous.state,
                          ),
                    );
              previous = { qp, state, rows: current };
              const solved: Float64Array = state.x;
              const selected: ILast = { x, at, rows: current, solve: solveRows, radius, moved: solved };
              let linear: number = 0;
              let met: boolean = true;
  
              // Model rows are all priced; appended variable bounds are hard.
              // One actual soft-row product serves objective and diagnostics.
              // Both owned curvatures are diagonal; the QP row band stays full.
              const value: number = HumanQuadraticValue(
                qp,
                solved,
                (row: IAutoMovieMotionHumanQuadraticProgram.IRow, miss: number): void => {
                  linear += ((row.weight ?? price) / price) * miss;
                  if (miss > BAND * MM) met = false;
                },
                0,
              );
              let trial: Float64Array | undefined;
              return {
                get trial(): Float64Array {
                  // Steering may solve a discarded model after this step.
                  last = selected;
                  return (trial ??= moved(x, solved));
                },
                predicted:
                  (zero ??= HumanQuadraticValue(qp)) - value,
                length: length(solved),
                full: HumanFitVariables.edge(variables, solved, radius),
                violation: linear,
                met,
              };
            },
          };
          };
        return priced(mu, rows);
      },
    };
    const moved: (x: Float64Array, s: Float64Array) => Float64Array = (
      x: Float64Array,
      s: Float64Array,
    ): Float64Array =>
      Float64Array.from(
        x,
        (v: number, i: number): number => v + s[i]! * units[i]!,
      );

    /** Reduce in solved-coordinate order without a temporary vector or changed unit arithmetic. */
    const length: (s: Float64Array) => number = (s: Float64Array): number => {
      let out: number = -Infinity;
      for (let i: number = 0; i < s.length; ++i)
        out = Math.max(
          out,
          Math.abs(s[i]! * units[i]!) / HumanFitVariables.reach(variables[i]!),
        );
      return out;
    };

    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<Float64Array, IEvaluation> =
      HumanSequentialConvex.minimise(
        problem,
        HumanFitVariables.vector(variables, props.start ?? posture),
        {
          schedule: {
            eta: ACCEPTED,
            low: POOR,
            high: GOOD,
            shrink: 0.5,
            expand: 2,
            boundary: true,
            widest: 1,
            trust: 1,
            least,
            tries: HALVINGS + 1,
            improved: (merit: number): number => merit * CONVERGED,
          },
          penalties: [PRICE],
          rounds: ROUNDS,
          steer: true,
        },
      );
    const r: IReading = solved.evaluation.r;
    const feasible: boolean = merit.holds(solved.evaluation.misses);
    return {
      posture: r.written,
      residuals: targets.map(
        (t: IAutoMovieMotionHumanBodyFitTypes.ITarget, k: number): { point: number; turn: number } =>
          HumanBodyFitRows.residual(t, r, k),
      ),
      angles: angles.map((target: IAutoMovieMotionHumanFitGoals.IAngle, k: number): number => {
        const [lo, hi]: readonly [number, number] =
          HumanFitGoals.bounds(target);
        return (
          (Math.max(0, lo - r.angles[k]!, r.angles[k]! - hi) * 180) / Math.PI
        );
      }),
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
      converged: solved.settled && feasible,
      reason: solved.reason,
    };
  }

  /** A posture's reading for the fit. */
  type IReading = HumanBodyFitRows.IReading;
  /** A row of a step and the reading it linearises. */
  type IRead = HumanBodyFitRows.IRead;

  /** An iterate's reading for the loop (`HumanBodyFitMerit`). */
  type IEvaluation = HumanBodyFitMerit.IEvaluation;

  /** The selected trial's convex model: what its second-order correction re-solves. */
  interface ILast {
    x: Float64Array;
    at: IReading;
    rows: IRead[];
    /** The model's solve of its own rows at other intervals. */
    solve: (rows: IAutoMovieMotionHumanQuadraticProgram.IRow[]) => IAutoMovieMotionHumanQuadraticProgram.IState;
    radius: number;
    moved: Float64Array;
  }
}
