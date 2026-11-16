import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanBodyFit } from "./HumanBodyFit";
import { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanFitBalance } from "./HumanFitBalance";
import { HumanFitGoals } from "./HumanFitGoals";
import { HumanFitPairs } from "./HumanFitPairs";
import { HumanFitVariables } from "./HumanFitVariables";
import { HumanFloorReading } from "./HumanFloorReading";
import type { HumanJacobian } from "./HumanJacobian";
import type { HumanSequentialConvex } from "./HumanSequentialConvex";

/**
 * The whole-body fit's merit (`HumanBodyFit`): an iterate read on the body,
 * what it misses each row by, the l1 merit of those misses (the objective's
 * pull toward the preferred posture plus each row's miss beyond the band at
 * its price, Fletcher 1985) and whether every row holds. The same reading
 * is what each step's rows linearise, so the model and the merit price the
 * same rows (Nocedal and Wright 2006, section 18.5).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the merit reads, prices and decides, with its sources.
 * @evidence contracts/development/design.md#principled-representation An iterate's reading and its misses row by row, the l1 merit's terms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fit and support seed selection consume the tolerance, actual misses, evaluation and merit builder; selected support indices also feed the fit's next model.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The floor, the balance and the pairs are read by their owners; the band and the unit are the rows'.
 */
export namespace HumanBodyFitMerit {
  /** The tolerance under which a row holds, metres or radians. */
  export const TOLERANCE: number = 5e-4;

  /**
   * What a reading misses each row by, metres or radians: positive where a
   * one-sided row is violated, signed for a goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its row and sign.
   * @evidence contracts/development/design.md#principled-representation One list per kind of row.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every constraint family, all read by the merit and the feasibility.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Distances in the reading's units, never pre-priced.
   */
  export interface IMisses {
    /** Each support candidate: a lowest one's distance from the floor, any other's depth under it. */
    floor: number[];

    /** The centre's distance outside each edge of the base. */
    balance: number[];

    /** Each target's misses on its rows. */
    goals: number[][];

    /** Included-angle misses, radians, in goal order. */
    angles: number[];

    /** Centre-position misses on its selected axes, metres. */
    centre: number[];

    /** Each pair's overlap. */
    pairs: number[];
  }

  /**
   * An iterate's reading for the loop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds.
   * @evidence contracts/development/design.md#principled-representation The loop's evaluation carries actual reading-specific misses and selected support indices, preserving part order and overlapping-part multiplicity for the step and its correction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries the reading, misses and same-reading selected support indices read by the merit and the next convexification.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The loop's own evaluation extended, not restated.
   */
  export interface IEvaluation extends HumanSequentialConvex.IEvaluation {
    /** The reading. */
    r: HumanBodyFitRows.IReading;

    /** Its misses. */
    misses: IMisses;

    /** The selected lowest candidate for each bearing part with candidates, preserving part order and repeated indices for overlapping parts. */
    touching: readonly number[];
  }

  /**
   * The merit's inputs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The fit's own inputs, resolved.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members the merit reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fit's props are read by `Pick`, not restated.
   */
  export interface IProps extends Pick<
    HumanBodyFit.IProps,
    "body" | "posture" | "balance" | "centre"
  > {
    /** The variables moved. */
    variables: readonly HumanJacobian.IVariable[];

    /** The goals. */
    targets: readonly HumanBodyFit.ITarget[];

    /** The geometric included-angle goals. */
    angles: readonly HumanFitGoals.IAngle[];

    /** Each part that bears on the floor. */
    bearing: readonly RegExp[];

    /** The fold pairs kept apart. */
    pairs: readonly HumanFitPairs.IPair[];

    /** The preferred posture's variables, the objective's centre. */
    key: Float64Array;

    /** The price of a millimetre a contact misses by (`HumanBodyFit.PRICE`). */
    price: number;
  }

  /**
   * The merit of a fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it reads and returns.
   * @evidence contracts/development/design.md#principled-representation The reading, the merit and the feasibility of one fit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Evaluation serves the fit and support seed selection; feasibility serves the fit's loop and final result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One reading serves the merit and the feasibility.
   */
  export interface IMerit {
    /**
     * The iterate's actual reading, misses, selected supports and merit terms.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines the current-coordinate input and actual-reading evaluation result.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the evaluator signature; of owns the physical reading and exact l1 merit body.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared here; of assembles the evaluator from the owning floor, goal and balance readers.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature executes no shortcuts; of preserves the actual row measurements and prices.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The declaration performs no work; of documents per-evaluation kinematics and row-reader costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration computes no shared result; of owns same-reading support and centre-displacement reuse.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The declaration allocates nothing; of defines closure inputs and evaluation result ownership.
     */
    evaluate(x: Float64Array): IEvaluation;

    /**
     * Whether every actual miss holds to its existing physical or numerical
     * bound, with physical point radii receiving no extra distance allowance.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the actual-miss input, all-row verdict and physical-radius convention.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a feasibility signature; of owns the exact one-sided, two-sided and physical-radius predicates.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared here; of provides the ordered row-family checks.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The declaration changes no acceptance rule; of retains each existing tolerance and the zero excess required by a physical radius.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The declaration performs no scan; of owns the short-circuit traversal of current misses.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration retains no verdict; of evaluates the supplied misses anew without copied concatenations.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The declaration allocates nothing; of supplies a boolean operation without retained misses.
     */
    holds(misses: IMisses): boolean;
  }

  /**
   * The merit of a fit.
   *
   * @param props The fit's resolved inputs.
   * @returns Its evaluation and its feasibility.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result; the namespace gives the merit.
   * @evidence contracts/development/implementation.md#principled-implementation The l1 merit: the objective's pull plus each row's miss beyond the band at its share of the price; the named bearing parts' points within the bearing margin of their lowest form the balance's base.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading, one pass of misses, one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every row is priced in the merit as the step's model prices it.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics per evaluation plus the floor, pair and selected-goal readers' costs; merit summation and feasibility scan the current misses without concatenated copies, and one centre displacement serves all selected axes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the current reading's lowest indices with convexification and its actual positional mass centre with balance; pair gaps and misses stay reading-specific, and a lazy centre displacement is reused only within that same reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closures retain the supplied fit inputs and bounded bearing-name set until their owner releases them; each evaluation owns its reading, misses and selected-index array, without a global or previous-reading cache.
   */
  export function of(props: IProps): IMerit {
    const {
      body,
      posture,
      variables,
      targets,
      bearing,
      pairs,
      key,
      price,
    }: Pick<
      IProps,
      | "body"
      | "posture"
      | "variables"
      | "targets"
      | "bearing"
      | "pairs"
      | "key"
      | "price"
    > = props;
    const n: number = variables.length;
    const BAND: number = HumanBodyFitRows.BAND;
    const MM: number = HumanBodyFitRows.MM;

    // The points the named bearing parts bear on at a reading: each of their
    // support candidates within the bearing margin of the part's lowest.
    const named: Set<string> = new Set(
      typeof props.balance === "object"
        ? props.balance.parts.map((p: RegExp): string => p.source)
        : [],
    );
    const supports: (r: HumanFloorReading.IReading) => IAutoMovieVector3[] = (
      r: HumanFloorReading.IReading,
    ): IAutoMovieVector3[] => {
      const out: IAutoMovieVector3[] = [];
      bearing.forEach((part: RegExp, k: number): void => {
        if (!named.has(part.source)) return;
        const mine: Set<number> = new Set(r.members[k] ?? []);
        r.heights.forEach((h: number, c: number): void => {
          if (mine.has(r.of[c]!) && h <= r.parts[k]! + HumanBodyFitRows.MARGIN)
            out.push(r.spots[c]!);
        });
      });
      return out;
    };
    const read: (x: Float64Array) => HumanBodyFitRows.IReading = (
      x: Float64Array,
    ): HumanBodyFitRows.IReading => {
      const r: HumanFloorReading.IReading = HumanFloorReading.of(
        body,
        HumanFitVariables.written(variables, posture, x),
        bearing,
        targets,
      );
      const measured: HumanBodyFitRows.IReading = {
        ...r,
        ...HumanFitGoals.read(body, r.bones, props.angles, props.centre),
      };
      if (props.balance === undefined || props.balance === false)
        return measured;
      if (props.balance === true)
        return {
          ...measured,
          balance: HumanFitBalance.of(
            body,
            r.bones,
            undefined,
            measured.centre,
          ),
        };
      return {
        ...measured,
        balance: HumanFitBalance.of(
          body,
          r.bones,
          supports(r),
          measured.centre,
        ),
      };
    };
    const beyond: (miss: number) => number = (miss: number): number =>
      Math.max(0, miss - BAND);

    // What a reading misses by, row by row: the merit's and the feasibility's
    // one reading of the rows the model linearises.
    const misses: (
      r: HumanBodyFitRows.IReading,
      touching: readonly number[],
    ) => IMisses = (
      r: HumanBodyFitRows.IReading,
      touching: readonly number[],
    ): IMisses => {
      const lowest: ReadonlySet<number> = new Set(touching);
      let centreDelta: IAutoMovieVector3 | undefined;
      const floor: number[] = r.heights.map((h: number, c: number): number =>
        lowest.has(c) ? Math.abs(h) : -h,
      );
      const goals: number[][] = targets.map(
        (t: HumanBodyFit.ITarget, k: number): number[] =>
          HumanBodyFitRows.misses(t, r, k),
      );
      return {
        floor,
        balance: (r.balance?.inside ?? []).map((d: number): number => -d),
        goals,
        angles: props.angles.map(
          (target: HumanFitGoals.IAngle, k: number): number => {
            const [lo, hi]: readonly [number, number] =
              HumanFitGoals.bounds(target);
            return r.angles[k]! - Math.min(hi, Math.max(lo, r.angles[k]!));
          },
        ),
        centre:
          props.centre === undefined
            ? []
            : HumanFitGoals.directions(props.centre).map(
                (axis: IAutoMovieVector3): number =>
                  Vector3.dot(
                    (centreDelta ??= Vector3.subtract(
                      r.centre!,
                      props.centre!.point,
                    )),
                    axis,
                  ),
              ),
        pairs: pairs.map(
          (pair: HumanFitPairs.IPair): number =>
            -HumanFitPairs.gap(r.bones, pair).distance,
        ),
      };
    };

    /** The original one-sided feasibility predicate, shared across its separate row families. */
    const inside: (d: number) => boolean = (d: number): boolean =>
      d <= TOLERANCE;

    /** The original two-sided feasibility predicate, with the same absolute tolerance. */
    const close: (d: number) => boolean = (d: number): boolean =>
      Math.abs(d) <= TOLERANCE;

    /** Visit array iterators in order, preserving the original spread's treatment of sparse holes. */
    const all: (
      values: readonly number[],
      test: (d: number) => boolean,
    ) => boolean = (
      values: readonly number[],
      test: (d: number) => boolean,
    ): boolean => {
      for (const value of values) if (!test(value)) return false;
      return true;
    };
    return {
      evaluate: (x: Float64Array): IEvaluation => {
        const r: HumanBodyFitRows.IReading = read(x);
        const touching: number[] = HumanBodyFitRows.lowest(r);
        const m: IMisses = misses(r, touching);
        let pull: number = 0;
        for (let i: number = 0; i < n; i++)
          pull +=
            0.5 *
            HumanFitVariables.weight(variables[i]!) *
            (x[i]! - key[i]!) ** 2;
        let violation: number = 0;
        for (const d of m.floor) violation += beyond(d);
        for (const d of m.balance) violation += beyond(d);
        for (const d of m.pairs) violation += beyond(d);
        m.goals.forEach((g: number[], k: number): void => {
          const share: number = (targets[k]!.price ?? price) / price;
          g.forEach((d: number, j: number): void => {
            // A physical maximum distance has no extra numerical radius.
            violation +=
              share *
              (targets[k]!.bound !== undefined && j === 0
                ? Math.max(0, d)
                : beyond(Math.abs(d)));
          });
        });
        m.angles.forEach((d: number, k: number): void => {
          violation +=
            ((props.angles[k]!.price ?? price) / price) * beyond(Math.abs(d));
        });
        for (const d of m.centre)
          violation +=
            ((props.centre?.price ?? price) / price) * beyond(Math.abs(d));
        return {
          objective: pull,
          violation: violation * MM,
          r,
          misses: m,
          touching,
        };
      },
      holds: (m: IMisses): boolean =>
        all(m.floor, inside) &&
        all(m.balance, inside) &&
        all(m.pairs, inside) &&
        all(m.angles, close) &&
        all(m.centre, close) &&
        m.goals.every((g: number[], k: number): boolean =>
          g.every((d: number, j: number): boolean =>
            targets[k]!.bound !== undefined && j === 0
              ? d <= 0
              : Math.abs(d) <= TOLERANCE,
          ),
        ),
    };
  }
}
