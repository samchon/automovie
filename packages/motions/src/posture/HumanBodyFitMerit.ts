import type {
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanFitGoals,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "@automovie/engine";
import { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanFitBalance } from "./HumanFitBalance";
import { HumanFitGoals } from "./HumanFitGoals";
import { HumanFitPairs } from "./HumanFitPairs";
import { HumanFitVariables } from "./HumanFitVariables";
import { HumanFloorReading } from "./HumanFloorReading";

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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tolerance, the misses, the evaluation, the merit's inputs and its builder, read by the fit alone.
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
   * @evidence contracts/development/design.md#principled-representation The loop's evaluation with the reading and misses the step's rows and its correction read.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members over the loop's.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The loop's own evaluation extended, not restated.
   */
  export interface IEvaluation
    extends IAutoMovieMotionHumanSequentialConvex.IEvaluation {
    /** The reading. */
    r: HumanBodyFitRows.IReading;

    /** Its misses. */
    misses: IMisses;
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
    IAutoMovieMotionHumanBodyFitTypes.IProps,
    "body" | "posture" | "balance" | "centre"
  > {
    /** The variables moved. */
    variables: readonly IAutoMovieMotionHumanJacobian.IVariable[];

    /** The goals. */
    targets: readonly IAutoMovieMotionHumanBodyFitTypes.ITarget[];

    /** The geometric included-angle goals. */
    angles: readonly IAutoMovieMotionHumanFitGoals.IAngle[];

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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by the fit's loop and its result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One reading serves the merit and the feasibility.
   */
  export interface IMerit {
    /** The iterate's reading, misses and merit terms. */
    evaluate(x: Float64Array): IEvaluation;

    /** Whether every row holds to the tolerance. */
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics per evaluation, linear in the rows.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the floor reading, the balance, the pairs' gap and the rows' misses.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The closures hold the fit's inputs only.
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
        return { ...measured, balance: HumanFitBalance.of(body, r.bones) };
      return {
        ...measured,
        balance: HumanFitBalance.of(body, r.bones, supports(r)),
      };
    };
    const beyond: (miss: number) => number = (miss: number): number =>
      Math.max(0, miss - BAND);

    // What a reading misses by, row by row: the merit's and the feasibility's
    // one reading of the rows the model linearises.
    const misses: (r: HumanBodyFitRows.IReading) => IMisses = (
      r: HumanBodyFitRows.IReading,
    ): IMisses => {
      const lowest: number[] = HumanBodyFitRows.lowest(r);
      const floor: number[] = r.heights.map((h: number, c: number): number =>
        lowest.includes(c) ? Math.abs(h) : -h,
      );
      const goals: number[][] = targets.map(
        (t: IAutoMovieMotionHumanBodyFitTypes.ITarget, k: number): number[] =>
          HumanBodyFitRows.misses(t, r, k),
      );
      return {
        floor,
        balance: (r.balance?.inside ?? []).map((d: number): number => -d),
        goals,
        angles: props.angles.map(
          (target: IAutoMovieMotionHumanFitGoals.IAngle, k: number): number => {
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
                    Vector3.subtract(r.centre!, props.centre!.point),
                    axis,
                  ),
              ),
        pairs: pairs.map(
          (pair: HumanFitPairs.IPair): number =>
            -HumanFitPairs.gap(r.bones, pair).distance,
        ),
      };
    };
    return {
      evaluate: (x: Float64Array): IEvaluation => {
        const r: HumanBodyFitRows.IReading = read(x);
        const m: IMisses = misses(r);
        let pull: number = 0;
        for (let i: number = 0; i < n; i++)
          pull +=
            0.5 *
            HumanFitVariables.weight(variables[i]!) *
            (x[i]! - key[i]!) ** 2;
        let violation: number = 0;
        for (const d of [...m.floor, ...m.balance, ...m.pairs])
          violation += beyond(d);
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
        return { objective: pull, violation: violation * MM, r, misses: m };
      },
      holds: (m: IMisses): boolean =>
        [...m.floor, ...m.balance, ...m.pairs].every(
          (d: number): boolean => d <= TOLERANCE,
        ) &&
        [...m.angles, ...m.centre].every(
          (d: number): boolean => Math.abs(d) <= TOLERANCE,
        ) &&
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
