import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanFitGoals,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanFitBalance } from "./HumanFitBalance";
import { HumanFitGoals } from "./HumanFitGoals";
import { HumanFitPairs } from "./HumanFitPairs";
import { HumanFitVariables } from "./HumanFitVariables";
import { HumanFloorReading } from "./HumanFloorReading";
import { HumanSequentialConvex } from "./HumanSequentialConvex";
import { prepareHumanPoseResolution } from "./internal/prepareHumanPoseResolution";

/** The record of `IOfReadBearers`'s site. */
type IOfReadBearers = {
  points: IAutoMovieVector3[];
  owners: AutoMovieHumanoidBone[];
};

/** The record of `IOfSupportsResult`'s site. */
type IOfSupportsResult = {
  points: IAutoMovieVector3[];
  owners: AutoMovieHumanoidBone[];
};

/** The record of `IOfSupports`'s site. */
type IOfSupports = {
  points: IAutoMovieVector3[];
  owners: AutoMovieHumanoidBone[];
};

/** The alternatives of `Of`'s site. */
type Of =
  | "body"
  | "posture"
  | "variables"
  | "targets"
  | "bearing"
  | "pairs"
  | "key"
  | "price";

/** The alternatives of `Props`'s site. */
type Props = "body" | "posture" | "balance" | "centre";

/** The rows' violations as they are added: their sum and their greatest. */
interface ISummed {
  /** The sum, in the misses' units. */
  violation: number;

  /** The greatest single row's, in the same units. */
  greatest: number;
}

/**
 * The merit of a fit.
 *
 * @param props The fit's resolved inputs.
 * @returns Its evaluation and its feasibility.
 */
export function HumanBodyFitMerit(
  props: HumanBodyFitMerit.IProps,
): HumanBodyFitMerit.IMerit {
  const {
    body,
    posture,
    variables,
    targets,
    bearing,
    pairs,
    key,
    price,
  }: Pick<HumanBodyFitMerit.IProps, Of> = props;
  const n: number = variables.length;
  const BAND: number = HumanBodyFitRows.BAND;
  const MM: number = HumanBodyFitRows.MM;
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();

  // The points the named bearing parts bear on at a reading: each of their
  // support candidates within the bearing margin of the part's lowest,
  // with the bone each rides, so the base moves with them in the rows.
  const named: Set<string> = new Set(
    typeof props.balance === "object"
      ? props.balance.parts.map((p: RegExp): string => p.source)
      : [],
  );
  const supports: (r: HumanFloorReading.IReading) => IOfSupports = (
    r: HumanFloorReading.IReading,
  ): IOfSupportsResult => {
    const out: IAutoMovieVector3[] = [];
    const owners: AutoMovieHumanoidBone[] = [];
    bearing.forEach((part: RegExp, k: number): void => {
      if (!named.has(part.source)) return;
      const mine: Set<number> = new Set(r.members[k] ?? []);
      r.heights.forEach((h: number, c: number): void => {
        if (mine.has(r.of[c]!) && h <= r.parts[k]! + HumanBodyFitRows.MARGIN) {
          out.push(r.spots[c]!);
          owners.push(r.owners[r.of[c]!]!);
        }
      });
    });
    return { points: out, owners };
  };
  const read: (x: Float64Array) => HumanBodyFitRows.IReading = (
    x: Float64Array,
  ): HumanBodyFitRows.IReading => {
    const written: IAutoMovieMotionHumanPosture = HumanFitVariables.written(
      variables,
      posture,
      x,
    );
    const r: HumanFloorReading.IReading = HumanFloorReading(
      body,
      written,
      bearing,
      targets,
      resolution,
    );
    const measured: HumanBodyFitRows.IReading = {
      ...r,
      ...HumanFitGoals.read(body, r.bones, props.angles, props.centre),
      written,
    };
    if (props.balance === undefined || props.balance === false) return measured;
    if (props.balance === true)
      return {
        ...measured,
        balance: HumanFitBalance(body, r.bones, undefined, measured.centre),
      };
    const bearers: IOfReadBearers = supports(r);
    return {
      ...measured,
      balance: HumanFitBalance(
        body,
        r.bones,
        bearers.points,
        measured.centre,
        bearers.owners,
      ),
    };
  };
  const beyond: (miss: number) => number = (miss: number): number =>
    Math.max(0, miss - BAND);

  // What a reading misses by, row by row: the merit's and the feasibility's
  // one reading of the rows the model linearises.
  const misses: (
    r: HumanBodyFitRows.IReading,
    lowest: ReadonlySet<number>,
    gaps: HumanFitPairs.IGap[],
  ) => HumanBodyFitMerit.IMisses = (
    r: HumanBodyFitRows.IReading,
    lowest: ReadonlySet<number>,
    gaps: HumanFitPairs.IGap[],
  ): HumanBodyFitMerit.IMisses => {
    let centreDelta: IAutoMovieVector3 | undefined;
    const floor: number[] = r.heights.map((h: number, c: number): number =>
      lowest.has(c) ? Math.abs(h) : -h,
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
                  (centreDelta ??= Vector3.subtract(
                    r.centre!,
                    props.centre!.point,
                  )),
                  axis,
                ),
            ),
      pairs: pairs.map((pair: HumanFitPairs.IPair, k: number): number => {
        const gap: HumanFitPairs.IGap = HumanFitPairs.gap(r.bones, pair);
        gaps[k] = gap;
        return -gap.distance;
      }),
    };
  };

  /**
   * The original one-sided feasibility predicate, shared across its separate
   * row families.
   */
  const inside: (d: number) => boolean = (d: number): boolean =>
    d <= HumanBodyFitMerit.TOLERANCE;

  /**
   * The original two-sided feasibility predicate, with the same absolute
   * tolerance.
   */
  const close: (d: number) => boolean = (d: number): boolean =>
    Math.abs(d) <= HumanBodyFitMerit.TOLERANCE;

  /**
   * Visit array iterators in order, preserving the original spread's treatment
   * of sparse holes.
   */
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
    evaluate: (x: Float64Array): HumanBodyFitMerit.IEvaluation => {
      const r: HumanBodyFitRows.IReading = read(x);
      const touching: number[] = HumanBodyFitRows.lowest(r);
      const touchingSet: ReadonlySet<number> = new Set(touching);
      const gaps: HumanFitPairs.IGap[] = new Array(pairs.length);
      const m: HumanBodyFitMerit.IMisses = misses(r, touchingSet, gaps);
      let pull: number = 0;
      for (let i: number = 0; i < n; i++)
        pull +=
          0.5 *
          HumanFitVariables.weight(variables[i]!) *
          (x[i]! - key[i]!) ** 2;
      // Each row's violation is one of sco's `cnt_viols`: the loop reads
      // their sum and their greatest.
      const summed: ISummed = { violation: 0, greatest: 0 };
      const add: (term: number) => void = (term: number): void => {
        summed.violation += term;
        summed.greatest = Math.max(summed.greatest, term);
      };
      for (const d of m.floor) add(beyond(d));
      for (const d of m.balance) add(beyond(d));
      for (const d of m.pairs) add(beyond(d));
      m.goals.forEach((g: number[], k: number): void => {
        const target: IAutoMovieMotionHumanBodyFitTypes.ITarget = targets[k]!;
        const share: number =
          target.required === true ? 1 : (target.price ?? price) / price;
        g.forEach((d: number, j: number): void => {
          // A physical maximum distance has no extra numerical radius.
          add(
            share *
              (target.bound !== undefined && j === 0
                ? Math.max(0, d)
                : target.required === true
                  ? Math.abs(d)
                  : beyond(Math.abs(d))),
          );
        });
      });
      m.angles.forEach((d: number, k: number): void => {
        // A measured interval is held to its own ends, with no numerical
        // band beyond them (`HumanBodyFitRows.rows`); one value keeps it.
        const [lo, hi]: readonly [number, number] = HumanFitGoals.bounds(
          props.angles[k]!,
        );
        add(
          ((props.angles[k]!.price ?? price) / price) *
            (hi > lo ? Math.abs(d) : beyond(Math.abs(d))),
        );
      });
      for (const d of m.centre)
        add(((props.centre?.price ?? price) / price) * beyond(Math.abs(d)));
      return {
        objective: pull,
        violation: summed.violation * MM,
        greatest: summed.greatest * MM,
        r,
        misses: m,
        touching,
        touchingSet,
        gaps,
      };
    },
    holds: (m: HumanBodyFitMerit.IMisses): boolean =>
      all(m.floor, inside) &&
      all(m.balance, inside) &&
      all(m.pairs, inside) &&
      all(m.angles, close) &&
      all(m.centre, close) &&
      m.goals.every((g: number[], k: number): boolean => {
        const target: IAutoMovieMotionHumanBodyFitTypes.ITarget = targets[k]!;
        const tolerance: number =
          target.required === true
            ? HumanBodyFitMerit.REQUIRED_TOLERANCE
            : HumanBodyFitMerit.TOLERANCE;
        return g.every((d: number, j: number): boolean =>
          target.bound !== undefined && j === 0
            ? d <= 0
            : Math.abs(d) <= tolerance,
        );
      }),
  };
}

/**
 * The whole-body fit's merit (`HumanBodyFit`): an iterate read on the body,
 * what it misses each row by, the l1 merit of those misses (the objective's
 * pull toward the preferred posture plus each row's miss beyond the band at its
 * price, Fletcher 1985) and whether every row holds. The same reading is what
 * each step's rows linearise, so the model and the merit price the same rows
 * (Nocedal and Wright 2006, section 18.5).
 */
export namespace HumanBodyFitMerit {
  /** The tolerance under which a row holds, metres or radians. */
  export const TOLERANCE: number = 5e-4;

  /** A hard equality's numerical acceptance, from SCO's solved row units. */
  export const REQUIRED_TOLERANCE: number =
    HumanSequentialConvex.DEFAULTS.cntTolerance / HumanBodyFitRows.MM;

  /**
   * What a reading misses each row by, metres or radians: positive where a
   * one-sided row is violated, signed for a goal.
   */
  export interface IMisses {
    /**
     * Each support candidate: a lowest one's distance from the floor, any
     * other's depth under it.
     */
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

  /** An iterate's reading for the loop. */
  export interface IEvaluation
    extends IAutoMovieMotionHumanSequentialConvex.IEvaluation {
    /** The reading. */
    r: HumanBodyFitRows.IReading;

    /** Its misses. */
    misses: IMisses;

    /**
     * The selected lowest candidate for each bearing part with candidates,
     * preserving part order and repeated indices for overlapping parts.
     */
    touching: readonly number[];

    /**
     * Membership of those same selected indices, shared read-only by floor
     * misses and convexification without changing the ordered touching rows.
     */
    touchingSet: ReadonlySet<number>;

    /**
     * Actual gap and both current closest witnesses in the fit's unchanged pair
     * order; shared read-only by active pair-row construction.
     */
    gaps: readonly HumanFitPairs.IGap[];
  }

  /** The merit's inputs. */
  export interface IProps extends Pick<
    IAutoMovieMotionHumanBodyFitTypes.IProps,
    Props
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

  /** The merit of a fit. */
  export interface IMerit {
    /** The iterate's actual reading, misses, selected supports and merit terms. */
    evaluate(x: Float64Array): IEvaluation;

    /**
     * Whether every actual miss holds to its existing physical or numerical
     * bound, with physical point radii receiving no extra distance allowance.
     */
    holds(misses: IMisses): boolean;
  }
}
