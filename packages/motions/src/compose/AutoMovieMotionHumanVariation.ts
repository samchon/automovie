import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanSkill } from "../skill/HumanSkill";
import { AutoMovieMotionHumanTiming } from "./AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanVariationDraw } from "./AutoMovieMotionHumanVariationDraw";
import type { AutoMovieMotionManner } from "./AutoMovieMotionManner";

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
 * @evidence contracts/development/common.md#meaningful-documentation States what a slot is, where the owner sits, how a spread is read and bounded, how a name is kept and how draws are keyed.
 * @evidence contracts/development/design.md#principled-representation Movement variability as the motor control literature models it: a spread that narrows with skill (Schmidt et al. 1979; Wing and Kristofferson 1973), an end point ellipse along the arrival (Gordon et al. 1994; van Beers et al. 2004), and task-relevant slots narrowing more than the rest (Scholz and Schoner 1999; Todorov and Jordan 2002).
 * @evidence contracts/development/design.md#minimal-and-owned-surface One source record, the spread table, the fixed bounds and the functions of a strike point, a direction, a duration and a pause; the other slot types and the draws have their own files. `HumanSkill` keeps the skill quantities and the engine the streams.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A law never writes an offset and no attribute is added: `IManner.variation` is the only switch, and a bound is a rule over the names and the body, never a clamp.
 */
export namespace AutoMovieMotionHumanVariation {
  /**
   * The spread across a movement's arrival direction as a share of the
   * spread along it (provisional ratio; the ellipse's direction is from
   * Gordon et al. 1994, Exp Brain Res 99:97, and van Beers et al. 2004, J
   * Neurophysiol 91:1050).
   */
  export const ACROSS: number = 0.5;

  /**
   * The spread of each slot type at `variation` 1, for a novice and for an
   * elite:
   *
   * - `place`: where a performer means to put a hand within what the name
   *   allows, arm lengths (provisional, checked by the visibility check of
   *   `test_motion_compose_variation_place`);
   * - `strike`: where a performer means to land within a region, a share of
   *   the region's radius (provisional, checked by
   *   `test_motion_compose_variation_strike`);
   * - `direction`: degrees about the named direction (provisional);
   * - `amount`: a factor on a level's share (provisional);
   * - `duration`: seconds, the motor term of `HumanSkill.jitter` (Wing and
   *   Kristofferson 1973);
   * - `pause`: a factor on the pause, the coefficient of variation of
   *   `HumanSkill.jitter` (Grondin and Killeen 2009);
   * - `swivel`: degrees about the shoulder-to-wrist line (provisional);
   * - `bend`: a share of the upper arm added to a preset's outward share
   *   (provisional);
   * - `curvature`: a share of the path's length (provisional).
   *
   * A slot the action's goal depends on narrows by about 3 from novice to
   * elite, the ratio of `HumanSkill.scatter` and of dart throwers' error
   * variability (65.0 mm to 21.3 mm; Nasu, Matsuo and Kadota 2014, PLoS ONE
   * 9:e88536). A slot it does not depend on narrows by at most 1.5
   * (provisional).
   */
  export const SPREADS: Readonly<
    Record<
      | "place"
      | "strike"
      | "direction"
      | "amount"
      | "duration"
      | "pause"
      | "swivel"
      | "bend"
      | "curvature",
      readonly [novice: number, elite: number]
    >
  > = {
    place: [0.04, 0.013],
    strike: [0.5, 0.2],
    direction: [5, 2],
    amount: [0.05, 0.02],
    duration: [0.025, 0.01],
    pause: [0.07, 0.025],
    swivel: [8, 6],
    bend: [0.05, 0.04],
    curvature: [0.02, 0.015],
  };

  /**
   * The largest offset of a slot type whose bound is a fixed size: a
   * direction in degrees, a preset bend as a share of the upper arm and a
   * curvature as a share of the path's length (provisional; twice the
   * novice's spread, so a full variation is not shrunk).
   */
  export const BOUNDS: Readonly<
    Record<"direction" | "bend" | "curvature", number>
  > = {
    direction: 10,
    bend: 0.1,
    curvature: 0.04,
  };

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
    skill: HumanSkill.ISkill;

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
    series(key: string): IHumanActionContext.ISeries;
  }

  /**
   * The source of an action's variation.
   *
   * @param context The action's skill and series.
   * @param manner The manner; its `variation` and `proficiency` are read.
   * @returns The source, or `undefined` when the variation is absent or 0.
   * @throws {Error} When the variation or the proficiency lies outside [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, the absent result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A stated proficiency is the skill of this action, so it replaces the two axes the spreads read; each slot's stream is the action's series on the channel `variation` and the slot key.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two range checks and one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A value outside its range throws, a non-number included; no variation builds no source, so no draw can be read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `IHumanActionContext.series`, the owner of the action's keyed streams.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The source holds the context's own series function and nothing else.
   */
  export function of(
    context: Pick<IHumanActionContext, "skill" | "series">,
    manner:
      | Pick<AutoMovieMotionManner.IManner, "variation" | "proficiency">
      | undefined,
  ): ISource | undefined {
    const variation: number = manner?.variation ?? 0;
    HumanBound.within("manner.variation", variation, 0, 1);
    if (variation === 0) return undefined;
    const proficiency: number | undefined = manner?.proficiency;
    if (proficiency !== undefined)
      HumanBound.within("manner.proficiency", proficiency, 0, 1);
    return {
      skill:
        proficiency === undefined
          ? context.skill
          : {
              ...context.skill,
              axes: {
                ...context.skill.axes,
                path: proficiency,
                timing: proficiency,
              },
            },
      variation,
      series: (key: string): IHumanActionContext.ISeries =>
        context.series(`variation/${key}`),
    };
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

  /** The tangent offset of no variation: the region's own point. */
  export const CENTRE: ITangent = { up: 0, out: 0 };

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
    along?: ITangent;
  }

  /**
   * A strike point's tangent offset within its region.
   *
   * The offset is in metres on the region's tangent plane. Its spread is
   * `sqrt((q r)^2 + (a scatter)^2)`: `q` is `SPREADS.strike`, `r` the
   * region's radius, and `a` is 1 along the weapon's travel on the plane and
   * `ACROSS` across it. The offset is drawn on a disc of `TRUNCATE` spreads
   * and its bound is `r`, so the point stays in its region.
   *
   * @param source The striker's variation; absent, `CENTRE` is returned.
   * @param key The slot key.
   * @param props The radius, the scatter and the travel.
   * @returns The offset from the region's point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the frame, the spread, the bound and the absent result.
   * @evidence contracts/development/implementation.md#principled-implementation A point inside a wide region is free within its name and the weapon also misses what was meant; only the miss grows with speed. The disc is the radial normal's quantile over a uniform angle, so the bound is a distance from the region's point and not a square.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two spreads, one shrink factor, one polar draw and one turn into the region's frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped: both spreads shrink by one factor until the disc's edge lies within the radius.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanVariationDraw.disc`; the scatter is `HumanSkill.scatter`'s, passed in by the striking law that knows the travel.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function strike(
    source: ISource | undefined,
    key: string,
    props: IStrike,
  ): ITangent {
    if (source === undefined || !(props.radius > 0)) return CENTRE;
    const intent: number =
      AutoMovieMotionHumanVariationDraw.quantity(
        source,
        "path",
        SPREADS.strike,
      ) * props.radius;
    const length: number = Math.hypot(
      props.along?.up ?? 0,
      props.along?.out ?? 0,
    );
    const along: ITangent =
      length > 1e-9
        ? { up: props.along!.up / length, out: props.along!.out / length }
        : { up: 1, out: 0 };
    const spreads: [number, number] = [
      source.variation *
        Math.hypot(intent, (length > 1e-9 ? 1 : ACROSS) * props.scatter),
      source.variation * Math.hypot(intent, ACROSS * props.scatter),
    ];
    const shrink: number = Math.min(
      1,
      props.radius /
        (AutoMovieMotionHumanVariationDraw.TRUNCATE * Math.max(...spreads)),
    );
    const [a, b] = AutoMovieMotionHumanVariationDraw.disc(source.series(key));
    const first: number = shrink * spreads[0] * a;
    const second: number = shrink * spreads[1] * b;
    return {
      up: along.up * first - along.out * second,
      out: along.out * first + along.up * second,
    };
  }

  /**
   * A direction with its offset.
   *
   * The offset is a turn in degrees about the stated direction, with spread
   * `SPREADS.direction`, drawn on a disc of `TRUNCATE` spreads. Its bound is
   * the smaller of `BOUNDS.direction` and `MARGIN` of half the angle to the
   * nearest other named direction.
   *
   * @param source The action's variation; absent, the vector itself is returned.
   * @param key The slot key.
   * @param vector The direction, any frame; its length is kept.
   * @param gap The angle to the nearest other named direction, degrees; absent, only `BOUNDS.direction` binds.
   * @returns The turned direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the spread, the bound and each input's meaning when absent.
   * @evidence contracts/development/implementation.md#principled-implementation A direction has two freedoms, so the turn's size and its heading about the direction come from one draw on a disc; the direction leans by the size toward a tangent at the heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bound, one polar draw and one rotation written as a sum of the direction and a tangent.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A zero vector has no direction and is returned as it is; the tangent basis never degenerates because its reference is the world axis the direction is farthest from.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanVariationDraw.basis`, the frame a place's offset is built on, and its `disc`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function direction(
    source: ISource | undefined,
    key: string,
    vector: IAutoMovieVector3,
    gap?: number,
  ): IAutoMovieVector3 {
    if (source === undefined) return vector;
    const length: number = Vector3.length(vector);
    if (!(length > 1e-9)) return vector;
    const spread: number =
      source.variation *
      AutoMovieMotionHumanVariationDraw.quantity(
        source,
        "path",
        SPREADS.direction,
      );
    const bound: number = Math.min(
      BOUNDS.direction,
      gap === undefined
        ? Infinity
        : (AutoMovieMotionHumanVariationDraw.MARGIN * gap) / 2,
    );
    const shrink: number = Math.min(
      1,
      bound / (AutoMovieMotionHumanVariationDraw.TRUNCATE * spread),
    );
    const [a, b] = AutoMovieMotionHumanVariationDraw.disc(source.series(key));
    const turn: number = (shrink * spread * Math.hypot(a, b) * Math.PI) / 180;
    if (turn === 0) return vector;
    const heading: number = Math.atan2(b, a);
    const [along, first, second] = AutoMovieMotionHumanVariationDraw.basis(
      vector,
    ) as [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3];
    return Vector3.scale(
      Vector3.add(
        Vector3.scale(along, Math.cos(turn)),
        Vector3.scale(
          Vector3.add(
            Vector3.scale(first, Math.cos(heading)),
            Vector3.scale(second, Math.sin(heading)),
          ),
          Math.sin(turn),
        ),
      ),
      length,
    );
  }

  /**
   * A phase's duration with its offset.
   *
   * The offset is in seconds with spread `SPREADS.duration`. Its bound is
   * half the duration, so a phase is never shorter than 0.5 or longer than
   * 1.5 of its length and a clock built from varied phases keeps its
   * instants in order. A span physics fixes is not passed through.
   *
   * @param source The action's variation; absent, the duration itself is returned.
   * @param key The slot key.
   * @param seconds The phase's duration, seconds.
   * @returns The varied duration, seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the spread, the bound, what the bound guarantees and what is not passed through.
   * @evidence contracts/development/implementation.md#principled-implementation The motor term of Wing and Kristofferson's (1973) two-level timing model, a spread in seconds independent of the interval; the clock term is the manner's tempo offset, which stays where it is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped; a duration of 0 has no room and stays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared scalar offset; the spread's two ends are `HumanSkill.jitter`'s motor term.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function duration(
    source: ISource | undefined,
    key: string,
    seconds: number,
  ): number {
    if (source === undefined) return seconds;
    return (
      seconds +
      AutoMovieMotionHumanVariationDraw.scalar(
        source,
        key,
        "timing",
        SPREADS.duration,
        1,
        0.5 * seconds,
      )
    );
  }

  /**
   * A pause with its offset.
   *
   * The offset is a factor on the pause with spread `SPREADS.pause`. Its
   * bound is the smaller of the cell rule over
   * `AutoMovieMotionHumanTiming.PAUSES` and half the pause (the scale rung's
   * [0.5, 1.5]). A pause of 0 stays 0.
   *
   * @param source The action's variation; absent, the pause itself is returned.
   * @param key The slot key.
   * @param seconds The pause, seconds.
   * @returns The varied pause, seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the spread, the two bounds and the fixed case.
   * @evidence contracts/development/implementation.md#principled-implementation The clock term of the timing model: an interval a performer times varies in proportion to its length, with the coefficient of variation `HumanSkill.jitter` uses (Wing and Kristofferson 1973; Grondin and Killeen 2009).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bound and one scalar offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped; the name `none` has no length to vary.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `PAUSES` of `AutoMovieMotionHumanTiming` through the shared cell rule and the shared scalar offset.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function pause(
    source: ISource | undefined,
    key: string,
    seconds: number,
  ): number {
    if (source === undefined) return seconds;
    return (
      seconds +
      AutoMovieMotionHumanVariationDraw.scalar(
        source,
        key,
        "timing",
        SPREADS.pause,
        seconds,
        Math.min(
          AutoMovieMotionHumanVariationDraw.cell(
            Object.values(AutoMovieMotionHumanTiming.PAUSES),
            seconds,
          ),
          0.5 * seconds,
        ),
      )
    );
  }
}
