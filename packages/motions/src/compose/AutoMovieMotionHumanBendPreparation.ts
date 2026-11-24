import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBend,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import type { AutoMovieMotionHumanBendRepeat } from "./AutoMovieMotionHumanBendRepeat";
import { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";
import { AutoMovieMotionHumanBendSide } from "./AutoMovieMotionHumanBendSide";

/** The alternatives of `BothFixed`'s site. */
type BothFixed = "body" | "posture";

/** The alternatives of `DefaultBendTrial`'s site. */
type DefaultBendTrial = 0 | 1;

/** The alternatives of `OfFound2`'s site. */
type OfFound2 = AutoMovieMotionHumanBendSearch.ICandidate | string;

/** The alternatives of `OfFound`'s site. */
type OfFound = AutoMovieMotionHumanBendSearch.ICandidate | string;

/** The alternatives of `OfTrial`'s site. */
type OfTrial = 0 | 1;

/** The alternatives of `OfFixed`'s site. */
type OfFixed = "body" | "posture" | "side";

/** The alternatives of `Goal`'s site. */
type Goal = "point" | "rotation" | "fallback";

/**
 * Actual solve/strain sweeps sharing fixed arm geometry and optional paired
 * trunk preparation.
 */
export namespace AutoMovieMotionHumanBendPreparation {
  /**
   * Variable fields of the existing bend request, after body/trunk/side are
   * fixed.
   */
  export type IGoal = Pick<IAutoMovieMotionHumanBend.ISolve, Goal>;

  /** Two original numerical queries on one fixed body/trunk/side geometry. */
  export interface IPrepared {
    /** Run the original legality-first then least-strain sweep for this wrist. */
    solve: (goal: IGoal) => IAutoMovieVector3;

    /** Run the original elbow-side-ranked sweep and report its legal strain. */
    strain: (goal: IGoal, bend: IAutoMovieVector3) => number;
  }

  /**
   * Prepare one actual unchanged body/trunk/side for all of its requested
   * sweeps.
   */
  export function of(
    fixed: Pick<IAutoMovieMotionHumanBend.ISolve, OfFixed>,
    source?: AutoMovieMotionHumanBendChain.IPrepared,
    trial?: readonly [AutoMovieMotionHumanBendRepeat.IRead, OfTrial],
  ): IPrepared {
    const search: ReturnType<typeof AutoMovieMotionHumanBendSearch.prepare> =
      AutoMovieMotionHumanBendSearch.prepare(fixed, source);
    return {
      solve: (goal: IGoal): IAutoMovieVector3 => {
        const found: OfFound = search(
          goal,
          (): ((
            candidate: AutoMovieMotionHumanBendSearch.ICandidate,
          ) => AutoMovieMotionHumanBendSearch.IScore) =>
            // A trial's witness compares the first score's exact strain, so
            // only a search without one defers it.
            trial === undefined
              ? AutoMovieMotionHumanBendSearch.strained
              : (
                  candidate: AutoMovieMotionHumanBendSearch.ICandidate,
                ): AutoMovieMotionHumanBendSearch.IScore => ({
                  overshoot: candidate.overshoot,
                  deviation: candidate.strain,
                }),
          trial,
        );
        if (typeof found !== "string" && found.overshoot === 0)
          return found.elbow;
        if (goal.fallback !== undefined)
          return AutoMovieMotionHumanBend.arm(
            fixed.body,
            fixed.posture,
            fixed.side,
            goal.fallback,
          );
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: fixed.side,
          reason: `AutoMovieMotionHumanBend.solve found no elbow place for the ${fixed.side} hand: ${typeof found === "string" ? found : "every place leaves a joint out of range or the forearm inside the body"}`,
          fix: "move the target to where the arm can bend to it: nearer the shoulder's side and off the body",
        });
      },
      strain: (goal: IGoal, bend: IAutoMovieVector3): number => {
        const found: OfFound2 = search(
          goal,
          (
            chain: Parameters<
              Parameters<typeof AutoMovieMotionHumanBendSearch.search>[1]
            >[0],
          ): ((
            candidate: AutoMovieMotionHumanBendSearch.ICandidate,
          ) => AutoMovieMotionHumanBendSearch.IScore) =>
            AutoMovieMotionHumanBendSide.prepare(
              chain.shoulder,
              goal.point,
              bend,
            ),
        );
        return typeof found === "string" || found.overshoot !== 0
          ? Infinity
          : found.strain;
      },
    };
  }

  /** Select the original default elbow ranking for a current moving hand. */
  export function defaultBend(
    goal: IAutoMovieMotionHumanBend.ISolve,
    trial?: readonly [AutoMovieMotionHumanBendRepeat.IRead, DefaultBendTrial],
  ): IAutoMovieVector3 {
    return trial === undefined
      ? AutoMovieMotionHumanBend.solve(goal)
      : of(goal, undefined, trial).solve(goal);
  }
  /**
   * Prepare actual sides of one fixed trunk within one synchronous person
   * operation.
   */
  export function both(
    fixed: Pick<IAutoMovieMotionHumanBend.ISolve, BothFixed>,
    resolution?: Parameters<typeof AutoMovieMotionHumanBendChain.prepare>[2],
  ): (side: AutoMovieHumanSide) => IPrepared {
    let source: AutoMovieMotionHumanBendChain.IPrepared | undefined;
    const sides: Partial<Record<AutoMovieHumanSide, IPrepared>> = {};
    return (side: AutoMovieHumanSide): IPrepared => {
      let current: IPrepared | undefined = sides[side];
      if (current === undefined) {
        source ??= AutoMovieMotionHumanBendChain.prepare(
          fixed.body,
          fixed.posture,
          resolution,
        );
        current = of({ ...fixed, side }, source);
        sides[side] = current;
      }
      return current;
    };
  }
}
