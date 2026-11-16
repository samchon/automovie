import {
  clampJointToSkeleton,
  cubicHermiteValue,
  integrateMotionTrajectory,
  physicalSingularBudget,
  solvePhysicalTargetStep,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBodyFit } from "./HumanBodyFit";
import { HumanBodyFitMerit } from "./HumanBodyFitMerit";
import { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanFitPairs } from "./HumanFitPairs";
import { HumanFitVariables } from "./HumanFitVariables";
import { HumanJacobian } from "./HumanJacobian";
import type { HumanQuadraticProgram } from "./HumanQuadraticProgram";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * A human configuration path projected onto its simultaneous contacts and
 * geometric goals. The keys of a contact-set planner are not a continuous
 * motion (Escande, Kheddar and Miossec 2013, conclusion). This is the
 * kinematic closed-loop alternative: correct the actual task error with its
 * Jacobian, rather than replaying a joint-space curve as if it held contacts
 * (Sciavicco and Siciliano 1988, IEEE J Robot Autom 4:403).
 *
 * Continuation knots choose the local branch, not a certificate between
 * samples. Every read projects and admits its actual FK against the existing
 * whole-body fit's contact, floor, balance and self-pair precision. This is
 * kinematic; it neither solves contact forces nor certifies dynamic balance.
 * The support law and its final displayed-pose contact stage have not yet
 * been connected, and no whole-path regression has run on this module.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the contact-manifold construction, sources, admission and dynamic limitation.
 * @evidence contracts/development/design.md#principled-representation A reference configuration and time-dependent existing whole-body goals define one local constrained path.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One builder and its posture and final-contact projections, consumed by support and contact-preserving action courses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Goal, Jacobian, variable, residual and bounded differential-step representations remain at their existing owners.
 */
export namespace HumanBodyContactPath {
  /**
   * Existing whole-body geometric goals at one share of the path.
   * @evidence contracts/development/common.md#meaningful-documentation Retains the fit's units, absence conventions and supported constraint families.
   * @evidence contracts/development/design.md#principled-representation A selection of the existing static fit's physical constraints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The constraint families actually linearised by the shared rows.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No duplicate goal declaration.
   */
  export type IGoals = Pick<
    HumanBodyFit.IProps,
    "targets" | "bearing" | "balance" | "angles" | "centre"
  >;

  /**
   * One path's body, reference and physical demands.
   * @evidence contracts/development/common.md#meaningful-documentation Names normalized share, duration in seconds, the body and the diagnostic label.
   * @evidence contracts/development/design.md#principled-representation Time-dependent demands are read again at every evaluation; no target is frozen by a cache key.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only inputs used to construct or evaluate the path.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the body, posture and fit goal types.
   */
  export interface IProps {
    /** The immutable body this plan was made for. */
    body: IHumanBody;
    /** Duration, positive seconds. */
    duration: number;
    /** Preferred posture at normalized share in [0, 1], by joint angles alone. */
    reference(share: number): IHumanPosture;
    /** Actual world demands at that share, including moving supports. */
    goals(share: number): IGoals;
    /** The action and span named in a refusal. */
    label: string;
  }

  /**
   * A contact-constrained course and the same projection after composition.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a course read from projection of the final displayed posture.
   * @evidence contracts/development/design.md#principled-representation Both operations admit the actual nonlinear constraints at the requested share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The course and final projection are the two current consumers' operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Additional planted goals enter the same projection, rather than being re-fitted afterwards.
   */
  export interface IPath {
    /** The course at a normalized share; out-of-range shares hold the nearer end. */
    posture(share: number): IHumanPosture;
    /** Project a composed posture with its other hard goals, in the same world frame. */
    project(
      posture: IHumanPosture,
      share: number,
      held?: readonly HumanBodyFit.ITarget[],
    ): IHumanPosture;
  }

  /**
   * Construct branch seeds by continuation and retain their cubic Hermite
   * interpolant. The engine's integration step is only a seed spacing. A
   * chord larger than one existing fit step is bisected, as is a failed local
   * correction, until the existing visible variable resolution is reached.
   *
   * @param props The reference and geometric demands.
   * @returns A pure path, independent of evaluation order.
   * @throws {HumanRefusal} If endpoints violate the demands, a local branch cannot continue at variable resolution, or retained scalar seeds exhaust the existing numerical workspace budget.
   * @evidence contracts/development/common.md#meaningful-documentation States the local continuation, finite guards and refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Predictor-corrector continuation follows one local contact manifold; cubic Hermite seeds never substitute for the FK admission on each read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Build ordered seeds, interpolate a seed, then use the same local projector as final composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No full static SQP at evaluation, no sample-based feasibility certificate and no floor translation after contact correction.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two differential IK corrections per read. Each uses the existing bounded SVD and up to 53 FK backtracking trials, stopping at floating-point no-progress; no real-time bound has been measured. Plan-time bisection stops at variable resolution or the scalar retention budget.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Seeds belong to this exact body, reference and goal closure only. Goals and actual FK are reread after changes; no cross-plan or frame-order cache exists.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned path owns at most the existing numerical workspace budget of vector components, plus one posture and one share per seed. These arrays and postures release with the path; the consumer has not yet wired settlement invalidation.
   */
  export function of(props: IProps): IPath {
    if (!(props.duration > 0) || !Number.isFinite(props.duration))
      throw new Error("A contact path needs a finite positive duration");
    const variables: readonly HumanJacobian.IVariable[] =
      HumanFitVariables.BODY;
    const n: number = variables.length;
    const pairs: HumanFitPairs.IPair[] = HumanFitPairs.of(props.body);
    const knots: IKnot[] = [];
    const count: number = Math.ceil(
      props.duration / integrateMotionTrajectory.STEP,
    );
    if (
      !Number.isSafeInteger(count) ||
      (count + 1) * n > physicalSingularBudget.maxEntries
    )
      refuse(
        props.label,
        "the contact path exceeds its retained numerical workspace",
        count,
      );

    const project = (
      posture: IHumanPosture,
      share: number,
      held: readonly HumanBodyFit.ITarget[] = [],
    ): IHumanPosture => corrected(props, posture, share, held, pairs);
    const first: IHumanPosture = props.reference(0);
    const last: IHumanPosture = props.reference(1);

    // Endpoints are the planner's keys. A path cannot repair an invalid key
    // without changing the contact schedule it was asked to connect.
    admitted(props, first, 0, [], pairs);
    admitted(props, last, 1, [], pairs);
    knots.push({
      share: 0,
      posture: first,
      values: HumanFitVariables.vector(variables, first),
    });

    const append = (end: number): void => {
      const a: IKnot = knots[knots.length - 1]!;
      const reference: IHumanPosture = props.reference(end);
      const predicted: IHumanPosture = HumanFitVariables.shifted(
        variables,
        reference,
        props.reference(a.share),
        a.posture,
        1,
      );
      let result: IHumanPosture | undefined;
      let failure: unknown;
      try {
        result = end === 1 ? last : project(predicted, end);
      } catch (error) {
        if (!(error instanceof HumanRefusal)) throw error;
        failure = error;
      }
      const values: Float64Array = HumanFitVariables.vector(
        variables,
        result ?? predicted,
      );
      const wide: boolean = variables.some(
        (v: HumanJacobian.IVariable, i: number): boolean =>
          Math.abs(values[i]! - a.values[i]!) > HumanFitVariables.reach(v),
      );
      if (result !== undefined && !wide) {
        if ((knots.length + 1) * n > physicalSingularBudget.maxEntries)
          refuse(
            props.label,
            "contact continuation exhausted its retained scalar budget",
            knots.length,
          );
        knots.push({ share: end, posture: result, values });
        return;
      }
      const middle: number = (a.share + end) / 2;
      const small: boolean = variables.every(
        (v: HumanJacobian.IVariable, i: number): boolean =>
          Math.abs(values[i]! - a.values[i]!) <=
          HumanFitVariables.resolution(v),
      );
      if (small || middle === a.share || middle === end)
        refuse(
          props.label,
          `contact continuation cannot advance at variable resolution${failure instanceof Error ? `: ${failure.message}` : ""}`,
          end,
        );
      append(middle);
      append(end);
    };
    for (let i: number = 1; i <= count; i++) append(i / count);

    return {
      project,
      posture: (share: number): IHumanPosture => {
        const s: number = Math.min(1, Math.max(0, share));
        let k: number = 0;
        while (k + 2 < knots.length && knots[k + 1]!.share <= s) k++;
        const a: IKnot = knots[k]!;
        const b: IKnot = knots[k + 1]!;
        const h: number = b.share - a.share;
        const tangent = (at: number, d: number): number => {
          const lo: IKnot = knots[Math.max(0, at - 1)]!;
          const hi: IKnot = knots[Math.min(knots.length - 1, at + 1)]!;
          return (hi.values[d]! - lo.values[d]!) / (hi.share - lo.share);
        };
        const x: Float64Array = Float64Array.from(
          a.values,
          (v: number, d: number): number =>
            cubicHermiteValue(
              v,
              tangent(k, d),
              b.values[d]!,
              tangent(k + 1, d),
              h,
              (s - a.share) / h,
            ),
        );
        return project(
          HumanFitVariables.written(variables, props.reference(s), x),
          s,
        );
      },
    };
  }
}

/** One retained branch seed; its share is independent of evaluation order. */
interface IKnot {
  share: number;
  posture: IHumanPosture;
  values: Float64Array;
}

/** Existing fit readings and feasibility, constructed for the current world goals. */
function meritOf(
  props: HumanBodyContactPath.IProps,
  posture: IHumanPosture,
  goals: HumanBodyContactPath.IGoals,
  held: readonly HumanBodyFit.ITarget[],
  pairs: readonly HumanFitPairs.IPair[],
): HumanBodyFitMerit.IMerit {
  return HumanBodyFitMerit.of({
    ...goals,
    body: props.body,
    posture,
    variables: HumanFitVariables.BODY,
    targets: [...(goals.targets ?? []), ...held],
    angles: goals.angles ?? [],
    bearing: goals.bearing ?? [],
    pairs,
    key: HumanFitVariables.vector(HumanFitVariables.BODY, posture),
    price: HumanBodyFit.PRICE,
  });
}

/** Refuse an invalid planner key rather than change the endpoint silently. */
function admitted(
  props: HumanBodyContactPath.IProps,
  posture: IHumanPosture,
  share: number,
  held: readonly HumanBodyFit.ITarget[],
  pairs: readonly HumanFitPairs.IPair[],
): void {
  const merit: HumanBodyFitMerit.IMerit = meritOf(
    props,
    posture,
    props.goals(share),
    held,
    pairs,
  );
  const at: HumanBodyFitMerit.IEvaluation = merit.evaluate(
    HumanFitVariables.vector(HumanFitVariables.BODY, posture),
  );
  if (!merit.holds(at.misses))
    refuse(
      props.label,
      `an endpoint violates its physical demands at share ${share}`,
      at.violation,
    );
}

/**
 * Two closed-loop Newton corrections, followed by actual admission. DLS is
 * the engine's bounded target step. Columns use the fit's cm/degree units
 * and objective metric. Lambda is sqrt(epsilon) times the design's Frobenius
 * norm: lambda squared is an arithmetic-scale ridge on JJ^T, limiting the
 * amplification of unresolved directions, not a bound on nonlinear FK error.
 * Backtracking accepts only an actual reduction of the existing violation.
 */
function corrected(
  props: HumanBodyContactPath.IProps,
  posture: IHumanPosture,
  share: number,
  held: readonly HumanBodyFit.ITarget[],
  pairs: readonly HumanFitPairs.IPair[],
): IHumanPosture {
  // A cubic seed may overshoot a range. Start from the actual clamped joint
  // values the resolver displays, before reading its Jacobian or bounds.
  posture = {
    ...posture,
    joints: Object.fromEntries(
      Object.entries(posture.joints).map(
        ([bone, q]): [
          AutoMovieHumanoidBone,
          readonly [number, number, number],
        ] => {
          const joint: IAutoMovieJointPose = clampJointToSkeleton(
            {
              bone: bone as AutoMovieHumanoidBone,
              flexion: q![0],
              abduction: q![1],
              twist: q![2],
            },
            props.body.skeleton,
          );
          return [
            joint.bone,
            [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0],
          ];
        },
      ),
    ),
  };
  const variables: readonly HumanJacobian.IVariable[] = HumanFitVariables.BODY;
  const goals: HumanBodyContactPath.IGoals = props.goals(share);
  const targets: readonly HumanBodyFit.ITarget[] = [
    ...(goals.targets ?? []),
    ...held,
  ];
  const units: number[] = variables.map((v: HumanJacobian.IVariable): number =>
    HumanFitVariables.unit(v),
  );
  const metric: number[] = variables.map(
    (v: HumanJacobian.IVariable, i: number): number =>
      Math.sqrt(HumanFitVariables.weight(v)) * units[i]!,
  );
  const merit: HumanBodyFitMerit.IMerit = meritOf(
    props,
    posture,
    goals,
    held,
    pairs,
  );
  let x: Float64Array = HumanFitVariables.vector(variables, posture);
  let at: HumanBodyFitMerit.IEvaluation = merit.evaluate(x);
  for (let correction: number = 0; correction < 2; correction++) {
    if (merit.holds(at.misses))
      return HumanFitVariables.written(variables, posture, x);
    const shaped: IHumanPosture = HumanFitVariables.written(
      variables,
      posture,
      x,
    );
    const step: HumanBodyFitRows.IStep = {
      ...goals,
      body: props.body,
      at: at.r,
      motions: HumanJacobian.of(props.body, shaped, at.r.bones, variables),
      units,
      targets,
      angles: goals.angles ?? [],
      price: HumanBodyFit.PRICE,
      touching: HumanBodyFitRows.lowest(at.r),
    };
    const reads: HumanBodyFitRows.IRead[] = [
      ...HumanBodyFitRows.of(step),
      ...HumanBodyFitRows.floor(
        step,
        new Set(at.r.heights.map((_: number, i: number): number => i)),
      ),
      ...pairs.map(
        (pair: HumanFitPairs.IPair): HumanBodyFitRows.IRead =>
          HumanFitPairs.row(
            step,
            pair,
            HumanBodyFitRows.BAND,
            HumanBodyFitRows.MM,
          ),
      ),
    ];
    const rows: HumanQuadraticProgram.IRow[] = reads
      .map((r: HumanBodyFitRows.IRead): HumanQuadraticProgram.IRow => r.row)
      .filter(
        (r: HumanQuadraticProgram.IRow): boolean =>
          (Number.isFinite(r.l) && Number.isFinite(r.u)) || r.l > 0 || r.u < 0,
      );
    const errors: number[] = rows.map(
      (r: HumanQuadraticProgram.IRow): number =>
        -(Number.isFinite(r.l) && Number.isFinite(r.u)
          ? (r.l + r.u) / 2
          : r.l > 0
            ? r.l
            : r.u),
    );
    const columns: number[][] = variables.map(
      (_: HumanJacobian.IVariable, d: number): number[] =>
        rows.map((r: HumanQuadraticProgram.IRow): number => {
          const i: number = r.index.indexOf(d);
          return i < 0 ? 0 : r.coef[i]! / metric[d]!;
        }),
    );
    const norm: number = Math.hypot(...columns.flat());
    if (errors.length === 0 || !(norm > 0)) break;
    const bounds: HumanQuadraticProgram.IRow[] = HumanFitVariables.bounds(
      variables,
      x,
      1,
    );
    const delta: number[] = solvePhysicalTargetStep({
      columns,
      errors,
      damping: norm * Math.sqrt(Number.EPSILON),
      coordinates: bounds.map(
        (
          r: HumanQuadraticProgram.IRow,
          d: number,
        ): { value: number; minimum: number; maximum: number } => ({
          value: 0,
          minimum: r.l * metric[d]!,
          maximum: r.u * metric[d]!,
        }),
      ),
    }).map((v: number, d: number): number => v / metric[d]!);
    let fraction: number = 1;
    delta.forEach((v: number, d: number): void => {
      if (v !== 0)
        fraction = Math.min(
          fraction,
          (v > 0 ? bounds[d]!.u : bounds[d]!.l) / v,
        );
    });
    let moved: boolean = false;
    while (fraction >= Number.EPSILON) {
      const trial: Float64Array = Float64Array.from(
        x,
        (v: number, d: number): number => v + fraction * delta[d]! * units[d]!,
      );
      if (trial.every((v: number, d: number): boolean => v === x[d])) break;
      const read: HumanBodyFitMerit.IEvaluation = merit.evaluate(trial);
      if (merit.holds(read.misses) || read.violation < at.violation) {
        x = trial;
        at = read;
        moved = true;
        break;
      }
      fraction /= 2;
    }
    if (!moved) break;
  }
  if (merit.holds(at.misses))
    return HumanFitVariables.written(variables, posture, x);
  refuse(
    props.label,
    `contact projection cannot meet its demands at share ${share}`,
    at.violation,
  );
}

/** A measured local continuation failure, never a silently changed contact. */
function refuse(label: string, reason: string, value: number): never {
  throw new HumanRefusal({
    kind: "reach",
    axis: "stances",
    value,
    reason: `${label}: ${reason}; summed violation ${value}`,
    fix: "change the contacts or add a reachable intermediate stance",
  });
}
