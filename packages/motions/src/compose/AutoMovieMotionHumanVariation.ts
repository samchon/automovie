import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanHand } from "../posture/HumanHand";
import type { IAutoMovieProficiency } from "../skill/IAutoMovieProficiency";
import { HumanSkill } from "../skill/HumanSkill";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "./AutoMovieMotionHumanTiming";
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
 * A slot's draws come from its own stream, keyed by the chain seed, the
 * performer, the action's id and the slot key, so adding or removing a slot
 * moves no other slot. The repeat of the action is the index into the slot's
 * low-discrepancy sequence, so consecutive repeats land apart. Without
 * variation every function returns its input and reads no draw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a slot is, where the owner sits, how a spread is read and bounded, how a name is kept and how draws are keyed.
 * @evidence contracts/development/design.md#principled-representation Movement variability as the motor control literature models it: a spread that narrows with skill (Schmidt et al. 1979; Wing and Kristofferson 1973), an end point ellipse along the arrival (Gordon et al. 1994; van Beers et al. 2004), and task-relevant slots narrowing more than the rest (Scholz and Schoner 1999; Todorov and Jordan 2002).
 * @evidence contracts/development/design.md#minimal-and-owned-surface One source record, one function per slot type, the spread table, the bound constants and the two sampling functions the tests read. `HumanSkill` keeps the skill quantities and the engine the streams.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A law never writes an offset and no attribute is added: `IManner.variation` is the only switch, and a bound is a rule over the names and the body, never a clamp.
 */
export namespace AutoMovieMotionHumanVariation {
  /**
   * How many spreads from its mean a component may lie (provisional; the two
   * spreads `AutoMovieMotionManner.BOUNDS` uses, checked by
   * `test_motion_compose_variation_bounded`).
   */
  export const TRUNCATE: number = 2;

  /**
   * The share of the way from a value to the nearer edge of its name's cell
   * an offset may reach (provisional, checked by
   * `test_motion_compose_variation_named`).
   */
  export const MARGIN: number = 0.8;

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
    place: [0.04, 0.015],
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
   * The steps of the additive recurrence by the number of components
   * (Roberts 2018, "The unreasonable effectiveness of quasirandom
   * sequences"): the inverse golden ratio for one component, the powers of
   * the inverse plastic constant for two and the powers of the inverse root
   * of `x^4 = x + 1` for three.
   */
  export const ALPHA: readonly (readonly number[])[] = [
    [],
    [0.6180339887498949],
    [1 / 1.324717957244746, 1 / 1.324717957244746 ** 2],
    [
      1 / 1.2207440846057596,
      1 / 1.2207440846057596 ** 2,
      1 / 1.2207440846057596 ** 3,
    ],
  ];

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
    if (!(variation >= 0 && variation <= 1))
      throw new Error("A manner's variation lies in [0, 1]");
    if (variation === 0) return undefined;
    const proficiency: number | undefined = manner?.proficiency;
    if (proficiency !== undefined && !(proficiency >= 0 && proficiency <= 1))
      throw new Error("A manner's proficiency lies in [0, 1]");
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
   * The uniform values of one repeat of a slot.
   *
   * @param draws The slot's stream and the repeat's index.
   * @param count The slot's number of components, 1 to 3.
   * @returns One value in [0, 1) per component.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the count's range and the result's range.
   * @evidence contracts/development/implementation.md#principled-implementation The additive recurrence of Roberts 2018 with a seeded rotation (Cranley and Patterson 1976): component `c` of repeat `n` is the fraction of `stream.float(c) + n ALPHA[count][c]`, so repeats fill the range evenly and two slots never move together.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression per component.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The stream is read at the fixed indices 0 to `count - 1` whatever the repeat, so a slot's draws never depend on another slot or on the order of calls.
   * @evidence contracts/development/implementation.md#efficient-algorithms One stream read per component.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; the laws resolve each slot once at plan time.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function uniforms(
    draws: IHumanActionContext.ISeries,
    count: 1 | 2 | 3,
  ): number[] {
    return ALPHA[count]!.map((alpha: number, c: number): number => {
      const value: number = draws.random.float(c) + draws.index * alpha;
      return value - Math.floor(value);
    });
  }

  /**
   * The truncated standard normal values of one repeat of a slot.
   *
   * @param draws The slot's stream and the repeat's index.
   * @param count The slot's number of components, 1 to 3.
   * @returns One value in [-`TRUNCATE`, `TRUNCATE`] per component.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result's range.
   * @evidence contracts/development/implementation.md#principled-implementation Each uniform is mapped into the central mass of the normal between the two truncation points and read through the normal's quantile function, so one uniform gives one component and the sequence's spacing survives, which a Box-Muller pair does not keep.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map over `uniforms`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped: a truncated quantile has no pile-up at its ends.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `uniforms` and one quantile function.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per component.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function normals(
    draws: IHumanActionContext.ISeries,
    count: 1 | 2 | 3,
  ): number[] {
    return uniforms(draws, count).map((u: number): number =>
      quantile(TAIL + u * (1 - 2 * TAIL)),
    );
  }

  /**
   * How a hand arrives on a place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member states its unit, its frame and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The distance and the time of the arriving phase, the two inputs of the impulse variability law, and the direction the end point's ellipse is longest along.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `place`; the phrase that arrives already has all three.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The direction is stated in the nudge frame the offset is read in, so no second frame enters.
   */
  export interface ITravel {
    /** The distance the hand travels in the arriving phase, metres. */
    distance: number;

    /** The length of the arriving phase, seconds; positive. */
    seconds: number;

    /** The direction of arrival in the nudge frame (`out`, `up`, `forward`); forward when absent. */
    direction?: AutoMovieMotionHumanTarget.INudge;
  }

  /**
   * A place of the air with its offset.
   *
   * The offset is in arm lengths, along and across the arrival and read in
   * the nudge frame. Its spread on each axis is `sqrt(intent^2 + (a k D / (T
   * arm))^2)`: `intent` is `SPREADS.place`, the second term is
   * `HumanSkill.scatter` of the travel, and `a` is 1 along the arrival and
   * `ACROSS` across it. On each axis the bound is the smaller of
   * `AutoMovieMotionHumanTarget.NUDGE` and the cell rule over that axis's
   * names, and the three axes share one shrink factor, so the ellipse keeps
   * its shape. An axis with no room, such as the height of a place on the
   * floor, drops out of the offset and the ellipse lies flat across it.
   *
   * @param source The action's variation; absent, the record itself is returned.
   * @param key The slot key.
   * @param body The body whose measure the shares are of.
   * @param side The acting hand, which the lateral names mirror by.
   * @param record The place's share record.
   * @param travel How the hand arrives; absent, only the intent varies.
   * @returns The varied share record, facing as the input faces.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the frame, the spread, the bound and every input's meaning when absent.
   * @evidence contracts/development/implementation.md#principled-implementation Two terms because two things vary: where the performer means to arrive within the name, and how far the arm misses that, which alone grows with speed (Schmidt et al. 1979; Harris and Wolpert 1998). The ellipse lies along the arrival (Gordon et al. 1994; van Beers et al. 2004).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The spreads, the basis, the bounds, one shrink factor and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No component is clamped: the factor is the largest for which the offset at `TRUNCATE` on every component stays inside every axis's bound.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the height, the share tables and `NUDGE` of `AutoMovieMotionHumanTarget`, and `HumanSkill.scatter`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work over three axes and eighteen names.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function place(
    source: ISource | undefined,
    key: string,
    body: Pick<IHumanBody, "measure">,
    side: HumanHand.Side,
    record: AutoMovieMotionHumanTarget.IDefault,
    travel?: ITravel,
  ): AutoMovieMotionHumanTarget.IDefault {
    if (source === undefined) return record;
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const sign: number = side === "left" ? 1 : -1;
    const intent: number = quantity(source, "path", SPREADS.place);
    const miss: number =
      travel === undefined
        ? 0
        : HumanSkill.scatter(source.skill, travel.distance, travel.seconds) /
          arm;
    const spreads: number[] = [1, ACROSS, ACROSS].map(
      (a: number): number => source.variation * Math.hypot(intent, a * miss),
    );
    const axes: IAutoMovieVector3[] = basis({
      x: travel?.direction?.out ?? 0,
      y: travel?.direction?.up ?? 0,
      z: travel?.direction?.forward ?? (travel?.direction === undefined ? 1 : 0),
    });
    // Each axis's bound in arm lengths: out, up, forward. A place on the
    // floor has no room upward or downward.
    const bounds: IAutoMovieVector3 = {
      x:
        (cell(
          Object.values(AutoMovieMotionHumanTarget.LATERALS),
          sign * (record.lateral ?? 0),
        ) *
          m.shoulderHalfWidth) /
        arm,
      y:
        (Math.min(
          record.height,
          cell(
            AutoMovieMotionHumanTarget.HEIGHTS.map(
              (name: AutoMovieMotionHumanTarget.Height): number =>
                AutoMovieMotionHumanTarget.height(body, name),
            ),
            record.height,
          ),
        ) *
          m.stature) /
        arm,
      z: cell(Object.values(AutoMovieMotionHumanTarget.DISTANCES), record.range),
    };
    let shrink: number = 1;
    const open: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };
    for (const axis of ["x", "y", "z"] as const) {
      const reach: number =
        TRUNCATE *
        axes.reduce(
          (sum: number, e: IAutoMovieVector3, i: number): number =>
            sum + Math.abs(e[axis]) * spreads[i]!,
          0,
        );
      const bound: number = Math.min(
        AutoMovieMotionHumanTarget.NUDGE,
        bounds[axis],
      );
      if (!(bound > 0)) open[axis] = 0;
      else if (reach > bound) shrink = Math.min(shrink, bound / reach);
    }
    const z: number[] = normals(source.series(key), 3);
    const drawn: IAutoMovieVector3 = axes.reduce(
      (sum: IAutoMovieVector3, e: IAutoMovieVector3, i: number) =>
        Vector3.add(sum, Vector3.scale(e, shrink * spreads[i]! * z[i]!)),
      { x: 0, y: 0, z: 0 },
    );
    const offset: IAutoMovieVector3 = {
      x: drawn.x * open.x,
      y: drawn.y * open.y,
      z: drawn.z * open.z,
    };
    return {
      ...record,
      height: record.height + (offset.y * arm) / m.stature,
      range: record.range + offset.z,
      lateral:
        (record.lateral ?? 0) + (sign * offset.x * arm) / m.shoulderHalfWidth,
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `uniforms`; the scatter is `HumanSkill.scatter`'s, passed in by the striking law that knows the travel.
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
      quantity(source, "path", SPREADS.strike) * props.radius;
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
      props.radius / (TRUNCATE * Math.max(...spreads)),
    );
    const [a, b] = disc(source.series(key));
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `basis`, the frame `place` builds on an arrival.
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
      source.variation * quantity(source, "path", SPREADS.direction);
    const bound: number = Math.min(
      BOUNDS.direction,
      gap === undefined ? Infinity : (MARGIN * gap) / 2,
    );
    const shrink: number = Math.min(1, bound / (TRUNCATE * spread));
    const [a, b] = disc(source.series(key));
    const turn: number = (shrink * spread * Math.hypot(a, b) * Math.PI) / 180;
    if (turn === 0) return vector;
    const heading: number = Math.atan2(b, a);
    const [along, first, second] = basis(vector) as [
      IAutoMovieVector3,
      IAutoMovieVector3,
      IAutoMovieVector3,
    ];
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
   * An amount with its offset.
   *
   * The amount is a share of a joint's range, as a level resolves to. The
   * offset is a factor on the share with spread `SPREADS.amount`. Its bound
   * is the smallest of the cell rule over `AutoMovieMotionHumanRange.LEVELS`,
   * half the share (the scale rung's [0.5, 1.5]) and what is left of the
   * whole range.
   *
   * @param source The action's variation; absent, the share itself is returned.
   * @param key The slot key.
   * @param share The share of the range, in [0, 1].
   * @returns The varied share, in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the spread, the three bounds and the result's range.
   * @evidence contracts/development/implementation.md#principled-implementation Signal-dependent noise: a larger movement varies more, so the offset is a factor on the share (Harris and Wolpert 1998). Skill and variation never raise a range of motion, so the whole range bounds the result.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bound and one scalar offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped; a share of 0 or of the whole range has no room and stays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `LEVELS` of `AutoMovieMotionHumanRange` through the shared cell rule and the shared scalar offset.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function amount(
    source: ISource | undefined,
    key: string,
    share: number,
  ): number {
    if (source === undefined) return share;
    return (
      share +
      scalar(
        source,
        key,
        "path",
        SPREADS.amount,
        Math.abs(share),
        Math.min(
          cell(Object.values(AutoMovieMotionHumanRange.LEVELS), share),
          0.5 * Math.abs(share),
          1 - Math.abs(share),
        ),
      )
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
      scalar(source, key, "timing", SPREADS.duration, 1, 0.5 * seconds)
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
      scalar(
        source,
        key,
        "timing",
        SPREADS.pause,
        seconds,
        Math.min(
          cell(Object.values(AutoMovieMotionHumanTiming.PAUSES), seconds),
          0.5 * seconds,
        ),
      )
    );
  }

  /**
   * A solved elbow place with its offset.
   *
   * The offset is a turn in degrees about the line from the shoulder to the
   * wrist, from the place of least strain, with spread `SPREADS.swivel`. Its
   * bound is the smaller of `TRUNCATE` spreads and the arc of allowed places
   * on either side of the solved one, found in steps of `STEP` degrees. The
   * wrist's place does not change.
   *
   * @param source The action's variation; absent, the elbow place itself is returned.
   * @param key The slot key.
   * @param props The request `AutoMovieMotionHumanBend.solve` answered.
   * @param elbow The solved elbow place, world metres.
   * @returns The turned elbow place, world metres, usable as a bend hint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the axis, the spread, the bound and what stays.
   * @evidence contracts/development/implementation.md#principled-implementation The elbow's swivel does not change where the hand is, so it is a freedom the goal does not depend on and varies with little regard to skill (Scholz and Schoner 1999); the allowed arc is read on the same strain `solve` ranks by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The allowed arc on both sides, one scalar offset and one turn about the line.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arc ends at the first place the strain refuses, so an offset never passes through a refused place to an allowed one beyond it; an elbow on the line has no swivel and stays.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most `2 TRUNCATE spread / STEP` strain reads, each one bounded sweep, once per slot at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanBend.strain` for legality and `AutoMovieMotionHumanBend.turn` for the rotation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function swivel(
    source: ISource | undefined,
    key: string,
    props: AutoMovieMotionHumanBend.ISolve,
    elbow: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (source === undefined) return elbow;
    const turned = (degrees: number): IAutoMovieVector3 =>
      AutoMovieMotionHumanBend.turn(props, elbow, degrees);
    const spread: number =
      source.variation * quantity(source, "path", SPREADS.swivel);
    const reach: number = TRUNCATE * spread;
    let arc: number = 0;
    while (
      arc + STEP <= reach &&
      Number.isFinite(AutoMovieMotionHumanBend.strain(props, turned(arc + STEP))) &&
      Number.isFinite(AutoMovieMotionHumanBend.strain(props, turned(-arc - STEP)))
    )
      arc += STEP;
    const degrees: number = scalar(
      source,
      key,
      "path",
      SPREADS.swivel,
      1,
      Math.min(reach, arc),
    );
    return degrees === 0 ? elbow : turned(degrees);
  }

  /**
   * A preset bend's outward share with its offset.
   *
   * The offset is a share of the upper arm added to the preset's `out`, with
   * spread `SPREADS.bend` and bound `BOUNDS.bend`.
   *
   * @param source The action's variation; absent, the share itself is returned.
   * @param key The slot key.
   * @param out The outward share.
   * @returns The varied outward share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the spread and the bound.
   * @evidence contracts/development/implementation.md#principled-implementation The elbow's width is a freedom the hand's goal does not depend on, so its spread narrows little with skill (Scholz and Schoner 1999).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared scalar offset.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function bend(
    source: ISource | undefined,
    key: string,
    out: number,
  ): number {
    if (source === undefined) return out;
    return out + scalar(source, key, "path", SPREADS.bend, 1, BOUNDS.bend);
  }

  /**
   * A path's curvature with its offset.
   *
   * The offset is a share of the path's length added to the manner's
   * `curvature`, with spread `SPREADS.curvature` and bound
   * `BOUNDS.curvature`.
   *
   * @param source The action's variation; absent, the share itself is returned.
   * @param key The slot key.
   * @param share The curvature, a share of the path's length.
   * @returns The varied curvature.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the spread and the bound.
   * @evidence contracts/development/implementation.md#principled-implementation How a hand's path bows between two places is a freedom the end place does not depend on, so its spread narrows little with skill (Todorov and Jordan 2002).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared scalar offset.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function curvature(
    source: ISource | undefined,
    key: string,
    share: number,
  ): number {
    if (source === undefined) return share;
    return (
      share +
      scalar(source, key, "path", SPREADS.curvature, 1, BOUNDS.curvature)
    );
  }
}

/** The mass of the standard normal below `-TRUNCATE`: `Phi(-2)`. */
const TAIL: number = 0.022750131948179195;

/** The step the allowed arc of an elbow is walked in, degrees. */
const STEP: number = 2;

/** A row of the spread table at the source's skill on one axis. */
function quantity(
  source: AutoMovieMotionHumanVariation.ISource,
  axis: IAutoMovieProficiency.Axis,
  spread: readonly [number, number],
): number {
  return HumanSkill.quantity(source.skill, axis, spread[0], spread[1]);
}

/**
 * A one-component offset: a truncated normal draw times the spread, the
 * spread shrunk until `TRUNCATE` spreads fit the bound. No room reads no
 * draw and gives 0.
 *
 * @param source The action's variation.
 * @param key The slot key.
 * @param axis The skill axis the spread is read on.
 * @param spread The spread's novice and elite values.
 * @param scale A factor on the spread: 1 for an absolute offset, the value for a relative one.
 * @param bound The largest size of the offset.
 * @returns The offset, in the spread's unit.
 */
function scalar(
  source: AutoMovieMotionHumanVariation.ISource,
  key: string,
  axis: IAutoMovieProficiency.Axis,
  spread: readonly [number, number],
  scale: number,
  bound: number,
): number {
  const sigma: number =
    source.variation * scale * quantity(source, axis, spread);
  if (!(sigma > 0 && bound > 0)) return 0;
  return (
    Math.min(1, bound / (AutoMovieMotionHumanVariation.TRUNCATE * sigma)) *
    sigma *
    AutoMovieMotionHumanVariation.normals(source.series(key), 1)[0]!
  );
}

/**
 * The cell rule: `MARGIN` of the distance from a value to the nearer edge of
 * the cell of the name nearest it. A cell's edge is the midpoint with the
 * neighbouring name; the first and the last name, which have one neighbour,
 * take the same distance on their open side.
 *
 * @param names The values of an axis's names, in the axis's unit.
 * @param value The value.
 * @returns The bound, in the axis's unit; 0 when the value lies on or past an edge.
 */
function cell(names: readonly number[], value: number): number {
  const sorted: number[] = [...names].sort((a: number, b: number) => a - b);
  let nearest: number = 0;
  for (let i: number = 1; i < sorted.length; ++i)
    if (Math.abs(sorted[i]! - value) < Math.abs(sorted[nearest]! - value))
      nearest = i;
  const name: number = sorted[nearest]!;
  const below: number | undefined =
    nearest > 0 ? (name - sorted[nearest - 1]!) / 2 : undefined;
  const above: number | undefined =
    nearest < sorted.length - 1
      ? (sorted[nearest + 1]! - name) / 2
      : undefined;
  const low: number = name - (below ?? above ?? 0);
  const high: number = name + (above ?? below ?? 0);
  return Math.max(
    0,
    AutoMovieMotionHumanVariation.MARGIN * Math.min(value - low, high - value),
  );
}

/**
 * A point of the disc of `TRUNCATE` spreads under a standard normal on each
 * axis: the radius through the quantile of the radial distribution cut at
 * `TRUNCATE`, the angle uniform.
 *
 * @param draws The slot's stream and the repeat's index.
 * @returns Two coordinates in spreads, at most `TRUNCATE` from the origin.
 */
function disc(draws: IHumanActionContext.ISeries): [number, number] {
  const [u, v] = AutoMovieMotionHumanVariation.uniforms(draws, 2) as [
    number,
    number,
  ];
  const cut: number = 1 - Math.exp(-(AutoMovieMotionHumanVariation.TRUNCATE ** 2) / 2);
  const radius: number = Math.sqrt(-2 * Math.log(1 - u * cut));
  return [
    radius * Math.cos(2 * Math.PI * v),
    radius * Math.sin(2 * Math.PI * v),
  ];
}

/**
 * A right-handed orthonormal basis whose first vector lies along a
 * direction; the second is across the world axis the direction is farthest
 * from. A zero direction takes +Z.
 *
 * @param direction The direction; any length.
 * @returns Three unit vectors.
 */
function basis(direction: IAutoMovieVector3): IAutoMovieVector3[] {
  const along: IAutoMovieVector3 =
    Vector3.length(direction) > 1e-9
      ? Vector3.normalize(direction)
      : { x: 0, y: 0, z: 1 };
  const reference: IAutoMovieVector3 =
    Math.abs(along.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const first: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(reference, along),
  );
  return [along, first, Vector3.cross(along, first)];
}

/**
 * The standard normal's quantile function, by Acklam's rational
 * approximation (relative error below 1.15e-9).
 *
 * @param p A probability in (0, 1).
 * @returns The value the standard normal lies below with probability `p`.
 */
function quantile(p: number): number {
  const tail = (q: number): number =>
    (((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) /
    ((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1);
  if (p < LOW) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - LOW) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q: number = p - 0.5;
  const r: number = q * q;
  return (
    ((((((A[0] * r + A[1]) * r + A[2]) * r + A[3]) * r + A[4]) * r + A[5]) *
      q) /
    (((((B[0] * r + B[1]) * r + B[2]) * r + B[3]) * r + B[4]) * r + 1)
  );
}

/** Below this probability, and above its complement, the quantile uses its tail form. */
const LOW: number = 0.02425;

/** The numerator of the quantile's central form. */
const A: readonly [number, number, number, number, number, number] = [
  -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
  1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
];

/** The denominator of the quantile's central form. */
const B: readonly [number, number, number, number, number] = [
  -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
  6.680131188771972e1, -1.328068155288572e1,
];

/** The numerator of the quantile's tail form. */
const C: readonly [number, number, number, number, number, number] = [
  -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
  -2.549732539343734, 4.374664141464968, 2.938163982698783,
];

/** The denominator of the quantile's tail form. */
const D: readonly [number, number, number, number] = [
  7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
  3.754408661907416,
];
