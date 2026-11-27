import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanVariation,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanTiming } from "./AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanVariationDraw } from "./AutoMovieMotionHumanVariationDraw";

/**
 * The source of an action's variation.
 *
 * @param context The action's skill and series.
 * @param manner The manner; its `variation` and `consistency` are read.
 * @returns The source, or `undefined` when the variation is absent or 0.
 * @throws {Error} When an active variation or its consistency lies outside [0,
 *   1].
 */
export function AutoMovieMotionHumanVariation(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  manner: Pick<IAutoMovieMotionManner, OfManner> | undefined,
): IAutoMovieMotionHumanVariation.ISource | undefined {
  const variation: number = manner?.variation ?? 0;
  HumanBound.within("manner.variation", variation, 0, 1);
  if (variation === 0) return undefined;
  const consistency: number | undefined = manner?.consistency;
  if (consistency !== undefined)
    HumanBound.within("manner.consistency", consistency, 0, 1);
  return {
    skill:
      consistency === undefined
        ? context.skill
        : {
            ...context.skill,
            axes: {
              ...context.skill.axes,
              path: consistency,
              timing: consistency,
            },
          },
    variation,
    series: (key: string): IAutoMovieMotionHumanActionContext.ISeries =>
      context.series(`variation/${key}`),
  };
}

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
export namespace AutoMovieMotionHumanVariation {
  /**
   * The spread across a movement's arrival direction as a share of the spread
   * along it (provisional ratio; the ellipse's direction is from Gordon et al.
   * 1994, Exp Brain Res 99:97, and van Beers et al. 2004, J Neurophysiol
   * 91:1050).
   */
  export const ACROSS: number = 0.5;

  /**
   * The spread of each slot type at `variation` 1, for a novice and for an
   * elite:
   *
   * - `place`: where a performer means to put a hand within what the name allows,
   *   arm lengths (provisional, checked by the visibility check of
   *   `test_motion_compose_variation_place`);
   * - `strike`: where a performer means to land within a region, a share of the
   *   region's radius (provisional, checked by
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
    Record<SPREADSEntryItem, readonly [novice: number, elite: number]>
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
   * The largest offset of a slot type whose bound is a fixed size: a direction
   * in degrees, a preset bend as a share of the upper arm and a curvature as a
   * share of the path's length (provisional; twice the novice's spread, so a
   * full variation is not shrunk).
   */
  export const BOUNDS: Readonly<Record<BOUNDSEntryItem, number>> = {
    direction: 10,
    bend: 0.1,
    curvature: 0.04,
  };

  /** The tangent offset of no variation: the region's own point. */
  export const CENTRE: IAutoMovieMotionHumanVariation.ITangent = {
    up: 0,
    out: 0,
  };

  /**
   * A strike point's tangent offset within its region.
   *
   * The offset is in metres on the region's tangent plane. Its spread is
   * `sqrt((q r)^2 + (a scatter)^2)`: `q` is `SPREADS.strike`, `r` the region's
   * radius, and `a` is 1 along the weapon's travel on the plane and `ACROSS`
   * across it. The offset is drawn on a disc of `TRUNCATE` spreads and its
   * bound is `r`, so the point stays in its region.
   *
   * @param source The striker's variation; absent, `CENTRE` is returned.
   * @param key The slot key.
   * @param props The radius, the scatter and the travel.
   * @returns The offset from the region's point.
   */
  export function strike(
    source: IAutoMovieMotionHumanVariation.ISource | undefined,
    key: string,
    props: IAutoMovieMotionHumanVariation.IStrike,
  ): IAutoMovieMotionHumanVariation.ITangent {
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
    const along: IAutoMovieMotionHumanVariation.ITangent =
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
   * @param source The action's variation; absent, the vector itself is
   *   returned.
   * @param key The slot key.
   * @param vector The direction, any frame; its length is kept.
   * @param gap The angle to the nearest other named direction, degrees; absent,
   *   only `BOUNDS.direction` binds.
   * @returns The turned direction.
   */
  export function direction(
    source: IAutoMovieMotionHumanVariation.ISource | undefined,
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
   * The offset is in seconds with spread `SPREADS.duration`. Its bound is half
   * the duration, so a phase is never shorter than 0.5 or longer than 1.5 of
   * its length and a clock built from varied phases keeps its instants in
   * order. A span physics fixes is not passed through.
   *
   * @param source The action's variation; absent, the duration itself is
   *   returned.
   * @param key The slot key.
   * @param seconds The phase's duration, seconds.
   * @returns The varied duration, seconds.
   */
  export function duration(
    source: IAutoMovieMotionHumanVariation.ISource | undefined,
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
   * The offset is a factor on the pause with spread `SPREADS.pause`. Its bound
   * is the smaller of the cell rule over `AutoMovieMotionHumanTiming.PAUSES`
   * and half the pause (the scale rung's [0.5, 1.5]). A pause of 0 stays 0.
   *
   * @param source The action's variation; absent, the pause itself is returned.
   * @param key The slot key.
   * @param seconds The pause, seconds.
   * @returns The varied pause, seconds.
   */
  export function pause(
    source: IAutoMovieMotionHumanVariation.ISource | undefined,
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

/** The alternatives of `OfManner`'s site. */
type OfManner = "variation" | "consistency";

/** The alternatives of `OfContext`'s site. */
type OfContext = "skill" | "series";

/** The alternatives of `BOUNDSEntryItem`'s site. */
type BOUNDSEntryItem = "direction" | "bend" | "curvature";

/** The alternatives of `SPREADSEntryItem`'s site. */
type SPREADSEntryItem =
  | "place"
  | "strike"
  | "direction"
  | "amount"
  | "duration"
  | "pause"
  | "swivel"
  | "bend"
  | "curvature";
