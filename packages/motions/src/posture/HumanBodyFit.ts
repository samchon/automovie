import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanBodyFitMerit } from "./HumanBodyFitMerit";
import { HumanBodyFitRows } from "./HumanBodyFitRows";
import type { HumanBodyFitTypes } from "./HumanBodyFitTypes";
import { HumanFitGoals } from "./HumanFitGoals";
import { HumanFitPairs } from "./HumanFitPairs";
import { HumanFitVariables } from "./HumanFitVariables";
import { HumanJacobian } from "./HumanJacobian";
import { HumanQuadraticProgram } from "./HumanQuadraticProgram";
import { HumanSequentialConvex } from "./HumanSequentialConvex";
import type { IHumanPosture } from "./IHumanPosture";

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
 * @evidence contracts/development/common.md#meaningful-documentation States the problem with its sources, the variables, the objective, the rows, the merit and the loop.
 * @evidence contracts/development/design.md#principled-representation Goals and contacts are the priced rows of one quadratic program over the posture's own variables, the static multi-contact posture problem's representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The target, the props, the result, the price and one fit, read by every law that fits a whole body to its contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The floor is read on the body's colliders, the ranges on the shared table, the slopes on the shared Jacobian, the loop and the convex step are the shared ones.
 */
export namespace HumanBodyFit {
  /**
   * The bone-carried point and orientation goal, owned by HumanBodyFitTypes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the underlying goal owner.
   * @evidence contracts/development/design.md#principled-representation The existing public name aliases the same rigid-effector record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Preserves the public type used by contact laws.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second type definition.
   */
  export type ITarget = HumanBodyFitTypes.ITarget;

  /**
   * The fitted posture and measured residuals, owned by HumanBodyFitTypes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the underlying result owner.
   * @evidence contracts/development/design.md#principled-representation The existing public name aliases the measured result.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps callers on the same result type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copied result shape.
   */
  export type IResult = HumanBodyFitTypes.IResult;

  /**
   * The static multi-contact problem, owned by HumanBodyFitTypes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the underlying input owner.
   * @evidence contracts/development/design.md#principled-representation The same constraints are the numerical fit's inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Preserves existing HumanBodyFit.IProps consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No duplicate parameter record.
   */
  export type IProps = HumanBodyFitTypes.IProps;
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
   * The fitted posture.
   *
   * @param props The fit.
   * @returns The posture, by joint angles alone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The posture `fit` solves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; a law that needs the residuals reads `fit`.
   * @evidence contracts/development/implementation.md#efficient-algorithms The cost of `fit`.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function solve(props: IProps): IHumanPosture {
    return fit(props).posture;
  }

  /**
   * The fit and what it misses by.
   *
   * @param props The fit.
   * @returns The fitted posture, each target's residual, the balance's, whether it converged and why the loop stopped.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Sequential quadratic programming on the l1 merit: each convexification linearises the rows at the iterate (each bearing part's lowest point, the floor under every collider near it, the targets, the balance's edges, the pairs near contact), all re-selected at that iterate, and the merit prices the same rows, so the model equals the merit at no step.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading, one merit, one model per convexification, the shared loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every goal is a priced row and every collider near the floor a row; a residual is measured on the fitted posture, never taken from the model.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics and one Jacobian per convexification, one forward kinematics per trial; a collider or pair far from contact is rowed only when a step brings it near.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
   */
  export function fit(props: IProps): IResult {
    const { body, posture }: Pick<IProps, "body" | "posture"> = props;
    const variables: readonly HumanJacobian.IVariable[] =
      props.variables ?? HumanFitVariables.BODY;
    const targets: readonly ITarget[] = props.targets ?? [];
    const angles: readonly HumanFitGoals.IAngle[] = props.angles ?? [];
    const bearing: readonly RegExp[] = props.bearing ?? [];
    const pairs: HumanFitPairs.IPair[] = HumanFitPairs.of(body);
    const n: number = variables.length;
    const key: Float64Array = HumanFitVariables.vector(variables, posture);
    const units: number[] = variables.map(
      (v: HumanJacobian.IVariable): number => HumanFitVariables.unit(v),
    );

    // A step under a variable's resolution share, in the widest region's
    // terms, moves no variable by what a film shows.
    const least: number = Math.min(
      ...variables.map(
        (v: HumanJacobian.IVariable): number =>
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

    // The last model solved, which a rejected trial's second-order correction
    // re-solves with each row shifted by the trial's miss from its linear model
    // (Nocedal and Wright 2006, (15.36), p. 443, and Algorithm 15.2).
    let last: ILast | null = null;

    // The last quadratic program solved and its iterates, from which the next
    // solve starts: the same model at another radius from its iterates, a new
    // convexification from its multipliers by row key, the constraints the
    // rows linearise being the same (warm-started SQP, Nocedal and Wright
    // 2006, section 18.7).
    let previous: {
      qp: HumanQuadraticProgram.IProblem;
      state: HumanQuadraticProgram.IState;
      rows: IRead[];
    } | null = null;
    const problem: HumanSequentialConvex.IProblem<Float64Array, IEvaluation> = {
      evaluate: merit.evaluate,
      feasible: (e: IEvaluation): boolean => merit.holds(e.misses),
      correct: (
        x: Float64Array,
        _step: HumanSequentialConvex.IStep<Float64Array>,
        trial: IEvaluation,
      ): Float64Array | null => {
        if (last === null || last.x !== x) return null;
        const l: ILast = last;
        const shifted: HumanQuadraticProgram.IRow[] = l.rows.map(
          (r: IRead): HumanQuadraticProgram.IRow => {
            let model: number = 0;
            for (let a: number = 0; a < r.row.index.length; a++)
              model += r.row.coef[a]! * l.moved[r.row.index[a]!]!;
            const miss: number = (r.f(trial.r) - r.f(l.at)) * MM - model;
            return { ...r.row, l: r.row.l - miss, u: r.row.u - miss };
          },
        );
        const state: HumanQuadraticProgram.IState = HumanQuadraticProgram.solve(
          {
            n,
            band: n - 1,
            p: l.p,
            q: l.q,
            rows: [
              ...shifted,
              ...HumanFitVariables.bounds(variables, x, l.radius),
            ],
          },
        );
        return moved(x, state.x);
      },
      convexify: (
        x: Float64Array,
        e: IEvaluation,
        mu: number,
        _radius: number,
        objective: boolean,
      ): HumanSequentialConvex.IModel<Float64Array> => {
        const at: IReading = e.r;
        const step: HumanBodyFitRows.IStep = {
          body,
          at,
          motions: HumanJacobian.of(
            body,
            HumanFitVariables.written(variables, posture, x),
            at.bones,
            variables,
          ),
          units,
          targets,
          angles,
          ...(props.centre === undefined ? {} : { centre: props.centre }),
          price: mu,
          touching: HumanBodyFitRows.lowest(at),
        };
        const rowed: Set<number> = new Set();
        at.heights.forEach((h: number, c: number): void => {
          const low: number = at.lows[at.of[c]!]!;
          if (
            !step.touching.includes(c) &&
            (h < 0 || (low <= NEAR && h <= low + HumanBodyFitRows.MARGIN))
          )
            rowed.add(c);
        });
        const rows: IRead[] = [
          ...HumanBodyFitRows.of(step),
          ...HumanBodyFitRows.floor(step, rowed),
          ...pairs
            .filter(
              (pair: HumanFitPairs.IPair): boolean =>
                HumanFitPairs.gap(at.bones, pair).distance <= NEAR,
            )
            .map(
              (pair: HumanFitPairs.IPair): IRead =>
                HumanFitPairs.row(step, pair, BAND, MM),
            ),
        ];

        // The objective's curvature and slope in solved units; none for the
        // steering's model of the violation alone.
        const p: Float64Array[] = Array.from(
          { length: n },
          (_: unknown, i: number): Float64Array => new Float64Array(n - i),
        );
        const q: Float64Array = new Float64Array(n);
        if (objective)
          for (let i: number = 0; i < n; i++) {
            const w: number = HumanFitVariables.weight(variables[i]!);
            p[i]![0] = w * units[i]! ** 2;
            q[i] = w * units[i]! * (x[i]! - key[i]!);
          }
        return {
          solve: (
            radius: number,
          ): HumanSequentialConvex.IStep<Float64Array> => {
            const qp: HumanQuadraticProgram.IProblem = {
              n,
              band: n - 1,
              p,
              q,
              rows: [
                ...rows.map((r: IRead): HumanQuadraticProgram.IRow => r.row),
                ...HumanFitVariables.bounds(variables, x, radius),
              ],
            };
            const state: HumanQuadraticProgram.IState =
              previous !== null && previous.rows === rows
                ? HumanQuadraticProgram.solve(qp, previous.state)
                : HumanQuadraticProgram.solve(
                    qp,
                    undefined,
                    previous === null
                      ? undefined
                      : HumanQuadraticProgram.multipliers(
                          previous.qp,
                          previous.state,
                        ),
                  );
            previous = { qp, state, rows };
            const solved: Float64Array = state.x;
            last = { x, at, rows, p, q, radius, moved: solved };
            let linear: number = 0;
            let met: boolean = true;
            for (const r of rows) {
              let s: number = 0;
              for (let a: number = 0; a < r.row.index.length; a++)
                s += r.row.coef[a]! * solved[r.row.index[a]!]!;
              const d: number = Math.max(0, r.row.l - s, s - r.row.u);
              linear += ((r.row.weight ?? mu) / mu) * d;
              if (d > BAND * MM) met = false;
            }
            return {
              trial: moved(x, solved),
              predicted:
                HumanQuadraticProgram.value(qp, new Float64Array(n)) -
                HumanQuadraticProgram.value(qp, solved),
              length: Math.max(
                ...Array.from(
                  solved,
                  (s: number, i: number): number =>
                    Math.abs(s * units[i]!) /
                    HumanFitVariables.reach(variables[i]!),
                ),
              ),
              full: HumanFitVariables.edge(variables, solved, radius),
              violation: linear,
              met,
            };
          },
        };
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

    const solved: HumanSequentialConvex.IResult<Float64Array, IEvaluation> =
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
    return {
      posture: HumanFitVariables.written(variables, posture, solved.x),
      residuals: targets.map(
        (t: ITarget, k: number): { point: number; turn: number } =>
          HumanBodyFitRows.residual(t, r, k),
      ),
      angles: angles.map((target: HumanFitGoals.IAngle, k: number): number => {
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
      converged: solved.settled && merit.holds(solved.evaluation.misses),
      reason: solved.reason,
    };
  }

  /** A posture's reading for the fit. */
  type IReading = HumanBodyFitRows.IReading;

  /** A row of a step and the reading it linearises. */
  type IRead = HumanBodyFitRows.IRead;

  /** An iterate's reading for the loop (`HumanBodyFitMerit`). */
  type IEvaluation = HumanBodyFitMerit.IEvaluation;

  /** The last convex model solved: what a second-order correction re-solves. */
  interface ILast {
    x: Float64Array;
    at: IReading;
    rows: IRead[];
    p: Float64Array[];
    q: Float64Array;
    radius: number;
    moved: Float64Array;
  }
}
