import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanSkill } from "./IAutoMovieMotionHumanSkill";

/**
 * The seeded offset of a symbolic slot: how one performance of an action
 * differs from the next.
 *
 * A slot is one authored value of a law: a place, a strike point, a direction,
 * an amount, a duration, a pause, an elbow place, an elbow bend or a path's
 * curvature. A symbolic owner resolves the slot to one value; a law passes that
 * value through the function of its slot type here with a slot key, and a
 * primitive reads the result. The result has the type of the input.
 *
 * The offset's spread at `variation` 1 is a row of `SPREADS`, read between its
 * novice and its elite value on the performer's `path` axis for a spatial slot
 * and on the `timing` axis for a temporal one; `variation` scales it linearly.
 * Every component is a normal truncated at `TRUNCATE` spreads. An offset is
 * bounded without clamping: the spread is multiplied by one factor of at most
 * 1, the largest for which the offset at `TRUNCATE` stays inside the slot's
 * bound, so no value piles up at a bound.
 *
 * A named value keeps its name. On an axis of names, the bound is `MARGIN` of
 * the distance from the value to the nearer edge of its name's cell, an edge
 * being the midpoint with the neighbouring name, so the varied value is still
 * nearer to its own name than to any other.
 *
 * The truncation, the margin and the draws are
 * `AutoMovieMotionHumanVariationDraw`'s. A place's offset is
 * `AutoMovieMotionHumanVariationPlace`'s; an amount's, an elbow's and a
 * curvature's are `AutoMovieMotionHumanVariationForm`'s.
 *
 * A slot's draws come from its own stream, keyed by the chain seed, the
 * performer, the action's id and the slot key, so adding or removing a slot
 * moves no other slot. The repeat of the action is the index into the slot's
 * low-discrepancy sequence, so consecutive repeats land apart. Without
 * variation every function returns its input and reads no draw.
 */
export namespace IAutoMovieMotionHumanVariation {
  /** What the slots of one action instance draw from. */
  export interface ISource {
    /**
     * The skill the spreads are read on; a stated proficiency replaces its
     * `path` and `timing` axes.
     */
    skill: IAutoMovieMotionHumanSkill;

    /** The factor on every spread, in (0, 1]. */
    variation: number;

    /**
     * The draws of one slot.
     *
     * @param key The slot key, a short stable string such as `reach.place`.
     * @returns The slot's stream and the repeat's index in it.
     */
    series(key: string): IAutoMovieMotionHumanActionContext.ISeries;
  }

  /** A point of a region's tangent plane, from the region's own point. */
  export interface ITangent {
    /** Along the region's bone toward the head, metres. */
    up: number;

    /** Toward the body's left, metres. */
    out: number;
  }

  /** What a strike point's spread is read from. */
  export interface IStrike {
    /**
     * The region's radius, metres: every point within it is nearer to this
     * region than to any other.
     */
    radius: number;

    /**
     * The end point scatter of the striking hand or foot, metres
     * (`HumanSkill.scatter`).
     */
    scatter: number;

    /**
     * The weapon's travel projected on the tangent plane; absent or zero, the
     * travel runs along the normal.
     */
    along?: IAutoMovieMotionHumanVariation.ITangent;
  }

  /** The spread of one quantity over seeds. */
  export interface IReport {
    /** How many seeds were read. */
    count: number;

    /** The mean. */
    mean: number;

    /** The standard deviation (population). */
    deviation: number;

    /** The least value and its seed. */
    minimum: IReportMinimum;

    /** The greatest value and its seed. */
    maximum: IReportMaximum;

    /** The deviation over the mean's magnitude; 0 when the mean is 0. */
    coefficient: number;

    /** How many distinct values were read, to a part in a million of the range. */
    distinct: number;
  }

  /** The maximum object of {@link IReport}. */
  export type IReportMaximum = {
    /**
     * Value drawn for the named variation variable, in that variable's
     * documented unit.
     */
    value: number;
    /**
     * Deterministic draw seed retained so this reported value can be
     * reproduced.
     */
    seed: string;
  };

  /** The minimum object of {@link IReport}. */
  export type IReportMinimum = {
    /**
     * Value drawn for the named variation variable, in that variable's
     * documented unit.
     */
    value: number;
    /**
     * Deterministic draw seed retained so this reported value can be
     * reproduced.
     */
    seed: string;
  };
}
