import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanSkill } from "../skill/IAutoMovieMotionHumanSkill";

/**
 * The seeded offset of a symbolic slot: how one performance of an action
 * differs from the next.
 *
 * A slot is one authored value of a law: a place, a strike point, a
 * direction, an amount, a duration, a pause, an elbow place, an elbow bend or
 * a path's curvature. A symbolic owner resolves the slot to one value; a law
 * passes that value through the function of its slot type here with a slot
 * key, and a primitive reads the result. The result has the type of the
 * input.
 *
 * The offset's spread at `variation` 1 is a row of `SPREADS`, read between
 * its novice and its elite value on the performer's `path` axis for a
 * spatial slot and on the `timing` axis for a temporal one; `variation`
 * scales it linearly. Every component is a normal truncated at `TRUNCATE`
 * spreads. An offset is bounded without clamping: the spread is multiplied by
 * one factor of at most 1, the largest for which the offset at `TRUNCATE`
 * stays inside the slot's bound, so no value piles up at a bound.
 *
 * A named value keeps its name. On an axis of names, the bound is `MARGIN`
 * of the distance from the value to the nearer edge of its name's cell, an
 * edge being the midpoint with the neighbouring name, so the varied value is
 * still nearer to its own name than to any other.
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation up: Along the region's bone toward the head, metres. out: Toward the body's left, metres. radius: The region's radius, metres: every point within it is nearer to this region than to any other.
 * @evidence contracts/development/design.md#principled-representation up: Along the region's bone toward the head, metres. out: Toward the body's left, metres. radius: The region's radius, metres: every point within it is nearer to this region than to any other.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/HumanVariation.ts (HumanVariation.over, return); compose/AutoMovieMotionHumanVariation.ts (AutoMovieMotionHumanVariation.of, return); compose/AutoMovieMotionHumanVariation.ts (AutoMovieMotionHumanVariation.strike, source); compose/AutoMovieMotionHumanVariation.ts (AutoMovieMotionHumanVariation.direction, source); compose/AutoMovieMotionHumanVariation.ts (AutoMovieMotionHumanVariation.duration, source); compose/AutoMovieMotionHumanVariation.ts (AutoMovieMotionHumanVariation.pause, source).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSkill, IAutoMovieMotionHumanActionContext.ISeries identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanVariation {
  /**
   * What the slots of one action instance draw from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member states its range or its key.
   * @evidence contracts/development/design.md#principled-representation The three things a spread and a draw need: the skill that sets the spread, the factor on it and the action's seeded series.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, built by `of` and read by every slot function.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A source exists only when variation is positive, so "no variation" is the absent source and no function tests a zero.
   */
  export interface ISource {
    /** The skill the spreads are read on; a stated proficiency replaces its `path` and `timing` axes. */
    skill: IAutoMovieMotionHumanSkill;

    /** The factor on every spread, in (0, 1]. */
    variation: number;

    /**
     * The draws of one slot.
     *
     * @param key The slot key, a short stable string such as `reach.place`.
     * @returns The slot's stream and the repeat's index in it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what a key is and what the result holds.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature with no body; `of` builds the function and answers for it.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature with no body; it declares one read and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature with no body; nothing here can special-case a key.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature with no body; it chooses no algorithm.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature with no body; it coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature with no body; it holds nothing.
     */
    series(key: string): IAutoMovieMotionHumanActionContext.ISeries;
  }

  /**
   * A point of a region's tangent plane, from the region's own point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and each member's unit and direction.
   * @evidence contracts/development/design.md#principled-representation Two tangent coordinates in the region's own frame, which the engine puts back on the body's surface; depth is the contact owner's.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; returned by `strike` and read by the region's placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No normal component, so an offset can never lift a strike off the surface.
   */
  export interface ITangent {
    /** Along the region's bone toward the head, metres. */
    up: number;

    /** Toward the body's left, metres. */
    out: number;
  }

  /**
   * What a strike point's spread is read from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The region's radius bounds the point and scales the intent; the weapon's end point scatter and its direction on the tangent plane give the miss.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `strike`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The radius is derived from the body by its owner and passed in, never typed here.
   */
  export interface IStrike {
    /** The region's radius, metres: every point within it is nearer to this region than to any other. */
    radius: number;

    /** The end point scatter of the striking hand or foot, metres (`HumanSkill.scatter`). */
    scatter: number;

    /** The weapon's travel projected on the tangent plane; absent or zero, the travel runs along the normal. */
    along?: IAutoMovieMotionHumanVariation.ITangent;
  }

  /**
   * The spread of one quantity over seeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation count: How many seeds were read. mean: The mean. deviation: The standard deviation (population).
   * @evidence contracts/development/design.md#principled-representation count: How many seeds were read. mean: The mean. deviation: The standard deviation (population).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/HumanVariation.ts (HumanVariation.over, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanVariation.over.
   */
  export interface IReport {
    /** How many seeds were read. */
    count: number;

    /** The mean. */
    mean: number;

    /** The standard deviation (population). */
    deviation: number;

    /** The least value and its seed. */
    minimum: {
      /** Value drawn for the named variation variable, in that variable's documented unit. */
      value: number;
      /** Deterministic draw seed retained so this reported value can be reproduced. */
      seed: string;
    };

    /** The greatest value and its seed. */
    maximum: {
      /** Value drawn for the named variation variable, in that variable's documented unit. */
      value: number;
      /** Deterministic draw seed retained so this reported value can be reproduced. */
      seed: string;
    };

    /** The deviation over the mean's magnitude; 0 when the mean is 0. */
    coefficient: number;

    /** How many distinct values were read, to a part in a million of the range. */
    distinct: number;
  }
}
