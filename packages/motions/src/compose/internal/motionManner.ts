import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanEffort,
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionManner,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanEffort } from "../../everyday/internal/HumanEffort";
import { HumanBound } from "../../law/internal/HumanBound";
import { motionClock } from "./motionClock";

/*
 * The modifiers of an action's manner, drawn from the action's own seeded
 * channel. The performer's timing and path skills govern the temporal and
 * spatial spreads when the manner leaves consistency unspecified. Moving spans
 * also take the action's own time scale (`IHumanActionContext.tempo`) with or
 * without a manner; its holds keep their seconds.
 * Parameter context: The action's skill, draw streams and time scale.
 * Parameter manner: The manner; neutral when absent.
 * Returns: The modifiers.
 */
export function motionManner(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  manner: IAutoMovieMotionManner | undefined,
): IAutoMovieMotionManner.IModifiers {
  const own: IAutoMovieMotionManner.IModifiers =
    manner === undefined
      ? motionManner.NEUTRAL
      : motionManner.resolve(
          manner,
          context.random("manner"),
          context.skill.axes,
        );

  // The action's own time scale, where it is replanned to take the time
  // its motion needs, slows its moving spans only: a hold is a duration,
  // not a speed-limited phase, so its seconds (an authored hold's
  // included) stay as the manner gives them.
  const scale: number = context.tempo ?? 1;
  return scale === 1 ? own : { ...own, tempo: own.tempo * scale };
}

/*
 * How an action is performed, as distinct from which action it is: how fast,
 * how large, how forceful, how skilled and how varied.
 *
 * A manner is resolved once into modifiers. The tempo and the hold factor
 * change durations through the clock (time); the extent, the curvature
 * and the bend change sizes through the phrases. A manner never changes a goal
 * on a solid place: a phrase that states a contact keeps its place, and only a
 * place in the air, an excursion about the base or a free-space amplitude is
 * scaled. The absent manner is neutral and leaves every action as it is.
 */
export namespace motionManner {
  /*
   * The modifiers of the absent manner.
   */
  export const NEUTRAL: IAutoMovieMotionManner.IModifiers = {
    tempo: 1,
    hold: 1,
    extent: 1,
    curvature: 0,
    bend: 0,
    step: 1,
    swing: 1,
  };

  /*
   * How much longer a bound movement holds, a share of the hold per unit of
   * Flow; provisional, with EMOTE's direction (bound movement is held, free
   * movement passes through).
   */
  export const HOLD: number = 0.3;

  /*
   * The greatest seeded offset of the tempo and of the extent at full
   * variation, as shares, for a novice and for an expert. The tempo's are two
   * standard deviations of the timing variability `HumanSkill.jitter` uses
   * (coefficients of variation 0.07 and 0.025); the extent's are provisional.
   */
  export const BOUNDS: Readonly<
    Record<BOUNDSEntryItem, readonly [novice: number, elite: number]>
  > = {
    tempo: [0.14, 0.05],
    extent: [0.2, 0.08],
  };

  /*
   * The modifiers of a manner.
   * Parameter manner: The manner; neutral when absent.
   * Parameter random: The stream the variation is drawn from; indices 0 and 1 are
   * read.
   * Parameter axes: The performer's temporal and spatial skills when consistency is
   * absent. Omit for elite spread in both dimensions.
   * Returns: The modifiers.
   * When a member lies outside its range.
   */
  export function resolve(
    manner: IAutoMovieMotionManner | undefined,
    random: IAutoMovieRandom,
    axes?: VariationAxes,
  ): IAutoMovieMotionManner.IModifiers {
    if (manner === undefined) return NEUTRAL;
    const intensity: number = manner.intensity ?? 1;
    const pace: number = manner.pace ?? 1;
    const consistency: number | undefined = manner.consistency;
    const variation: number = manner.variation ?? 0;
    HumanBound.within("manner.intensity", intensity, 0, 1, "", "minimum");
    HumanBound.above("manner.pace", pace, 0);
    if (consistency !== undefined)
      HumanBound.within("manner.consistency", consistency, 0, 1);
    HumanBound.within("manner.variation", variation, 0, 1);
    const effort: IAutoMovieMotionHumanEffort.IModifiers =
      HumanEffort.modifiers(manner.effort);
    const offset = (
      bounds: readonly [number, number],
      index: number,
      skill: number,
    ): number =>
      variation === 0
        ? 1
        : 1 +
          variation *
            (bounds[0] + (bounds[1] - bounds[0]) * skill) *
            (2 * random.float(index) - 1);
    const tempo: number =
      (effort.tempo / pace) *
      offset(BOUNDS.tempo, 0, consistency ?? axes?.timing ?? 1);
    return {
      tempo,
      hold: tempo * (1 + HOLD * (manner.effort?.flow ?? 0)),
      extent:
        effort.extent *
        intensity *
        offset(BOUNDS.extent, 1, consistency ?? axes?.path ?? 1),
      curvature: effort.curvature,
      bend: effort.elbow,
      step: effort.step,
      swing: effort.swing,
    };
  }

  /*
   * A clock performed in a manner: the holds stretched by the hold factor, the
   * fixed spans left as they are and every other span stretched by the tempo.
   * Parameter clock: The action's clock at its natural timing.
   * Parameter modifiers: The manner's modifiers.
   * Parameter spans: The holds and the fixed spans, by the instants that open them.
   * Returns: The clock, with the same instant names.
   * On a named instant the clock lacks.
   */
  export function time(
    clock: IAutoMovieMotionClock,
    modifiers: Pick<IAutoMovieMotionManner.IModifiers, TimeModifiers>,
    spans: IAutoMovieMotionManner.ISpans = {},
  ): IAutoMovieMotionClock {
    const named = new Set<string>(
      clock.instants.map((i: IAutoMovieMotionClockInstant): string => i.name),
    );
    const holds: readonly string[] =
      spans.holds ??
      ["ready", "strokeEnd"].filter((name: string): boolean => named.has(name));
    const fixed: readonly string[] = spans.fixed ?? [];
    for (const name of [...holds, ...fixed]) clock.at(name);
    if (modifiers.tempo === 1 && modifiers.hold === 1) return clock;
    return motionClock.stretch(clock, (opening: string): number =>
      fixed.includes(opening)
        ? 1
        : holds.includes(opening)
          ? modifiers.hold
          : modifiers.tempo,
    );
  }

  /*
   * Named manners: the eight basic Effort actions of Laban, four moods and the
   * two Shape qualities of the trunk and limbs, as manner records a composition
   * names instead of spelling out factors.
   *
   * The Effort actions are `HumanEffort.ACTIONS`. A mood adds Flow, pace and
   * intensity to an Effort: `weary` is slow, small and heavy, `brisk` quick and
   * direct, `sad` slow, small and bound, `proud` large, free and unhurried.
   * `enclosing` and `spreading` are Shape's two poles as far as a manner
   * reaches them: bound Flow draws the elbows in and shortens the excursions,
   * free Flow releases them outward.
   *
   * Each preset is a plain `IManner`, so a law that reads a manner reads a
   * preset with no further case; the table has no resolver of its own, since
   * `resolve` and `of` take its records. The moods' factors, paces and
   * intensities and the two Shape poles' Flow are provisional: no measured
   * population values were located (sad walks are slower with shorter strides
   * and proud ones larger in direction, Montepare, Goldstein and Clausen 1987,
   * J Nonverbal Behav 11:33; the magnitudes here are not from it).
   *
   * What a preset does to durations and to a normal walk at the reference hip
   * (`IAutoMovieMotionHumanGait` gives the speed model): the Effort actions
   * `punch`, `dab`, `slash` and `flick` take 0.7 times the time (a walk of
   * about 2.2 m/s) and `press`, `glide`, `wring` and `float` 1.3 times (about
   * 1.2 m/s). `weary` takes 1.51 times the time, a walk of about 1.0 m/s, at an
   * intensity of 0.7; `brisk` 0.88 times, about 1.72 m/s, the fast walk where
   * Murtagh et al. 2021 place walking briskly; `sad` 1.39 times, about 1.1 m/s,
   * at an intensity of 0.7; `proud` 1.05 times, about 1.4 m/s; `enclosing` and
   * `spreading` do not change the time. Each is `1 - 0.3 time` over the
   * preset's `pace`.
   */
  export const PRESETS: Readonly<
    Record<IAutoMovieMotionManner.Preset, IAutoMovieMotionManner>
  > = {
    punch: { effort: HumanEffort.ACTIONS.punch },
    dab: { effort: HumanEffort.ACTIONS.dab },
    press: { effort: HumanEffort.ACTIONS.press },
    glide: { effort: HumanEffort.ACTIONS.glide },
    slash: { effort: HumanEffort.ACTIONS.slash },
    flick: { effort: HumanEffort.ACTIONS.flick },
    wring: { effort: HumanEffort.ACTIONS.wring },
    float: { effort: HumanEffort.ACTIONS.float },
    weary: {
      effort: { weight: 0.5, time: -0.7, flow: 0.3 },
      pace: 0.8,
      intensity: 0.7,
    },
    // The fast outdoor pace, where "walk briskly" belongs (Murtagh et al.
    // 2021, Sports Med 51:125): 1.72 m/s against the normal walk's 1.51 m/s
    // at the reference hip, over the quick Effort's 1 - 0.3 * 0.6.
    brisk: { effort: { time: 0.6, space: 0.6 }, pace: (0.82 * 1.72) / 1.51 },
    sad: {
      effort: { weight: -0.3, time: -0.6, flow: 0.7 },
      pace: 0.85,
      intensity: 0.7,
    },
    proud: { effort: { weight: 0.5, space: 0.5, flow: -0.6 }, pace: 0.95 },
    enclosing: { effort: { flow: 1 }, intensity: 0.8 },
    spreading: { effort: { flow: -1 } },
  };

  /*
   * The names of PRESETS, as data; a name `Preset` lacks fails the type
   * check, and a test checks none is missing.
   */
  export const PRESET_NAMES = [
    "punch",
    "dab",
    "press",
    "glide",
    "slash",
    "flick",
    "wring",
    "float",
    "weary",
    "brisk",
    "sad",
    "proud",
    "enclosing",
    "spreading",
  ] as const satisfies readonly IAutoMovieMotionManner.Preset[];
}

/*
 * The alternatives of `TimeModifiers`'s site.
 */
type TimeModifiers = "tempo" | "hold";

/*
 * The alternatives of `OfContext`'s site.
 */
type OfContext = "skill" | "random" | "tempo";

/*
 * The alternatives of `BOUNDSEntryItem`'s site.
 */
type BOUNDSEntryItem = "tempo" | "extent";

/*
 * The timing and path skills used when a manner leaves consistency to the
 * performer.
 */
type VariationAxes = Pick<
  IAutoMovieMotionHumanSkill["axes"],
  "timing" | "path"
>;
