import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanEffort,
  IAutoMovieMotionManner,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanEffort } from "../everyday/HumanEffort";
import { HumanBound } from "../law/HumanBound";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";

/**
 * How an action is performed, as distinct from which action it is: how fast,
 * how large, how forceful, how skilled and how varied.
 *
 * A manner is resolved once into modifiers. The tempo and the hold factor
 * change durations through the clock ({@link time}); the extent, the
 * curvature and the bend change sizes through the phrases. A manner never
 * changes a goal on a solid place: a phrase that states a contact keeps its
 * place, and only a place in the air, an excursion about the base or a
 * free-space amplitude is scaled. The absent manner is neutral and leaves
 * every action as it is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a manner is, which modifiers act through the clock and which through the phrases, and what a manner never changes.
 * @evidence contracts/development/design.md#principled-representation The manner of the Parameterized Action Representation (Badler et al. 2000) and the Effort of the EMOTE model (Chi et al. 2000): a record apart from the action's kind and participants, resolved once into factors, so a law states its natural timing and size and reads the factors where it differs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two records, a spans record, the neutral value, two named constants (`HOLD`, `BOUNDS`), two resolvers, the clock's retiming and the named preset table with its names (`PRESETS`, `Preset`, `PRESET_NAMES`). `flinch` and `stagger` read it; the other laws read it with #3286. The Effort record and its mapping stay `HumanEffort`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The modifiers are plain factors and shares with neutral values, not flags; a goal on a solid place is outside what a manner reaches, by the phrases' contact rule rather than by a switch here.
 */
export namespace AutoMovieMotionManner {
  /** The modifiers of the absent manner. */
  export const NEUTRAL: IAutoMovieMotionManner.IModifiers = {
    tempo: 1,
    hold: 1,
    extent: 1,
    curvature: 0,
    bend: 0,
    step: 1,
    swing: 1,
  };

  /**
   * How much longer a bound movement holds, a share of the hold per unit of
   * Flow; provisional, with EMOTE's direction (bound movement is held, free
   * movement passes through).
   */
  export const HOLD: number = 0.3;

  /**
   * The greatest seeded offset of the tempo and of the extent at full
   * variation, as shares, for a novice and for an expert. The tempo's are two
   * standard deviations of the timing variability `HumanSkill.jitter` uses
   * (coefficients of variation 0.07 and 0.025); the extent's are provisional.
   */
  export const BOUNDS: Readonly<
    Record<"tempo" | "extent", readonly [novice: number, elite: number]>
  > = {
    tempo: [0.14, 0.05],
    extent: [0.2, 0.08],
  };

  /**
   * The modifiers of a manner.
   *
   * @param manner The manner; neutral when absent.
   * @param random The stream the variation is drawn from; indices 0 and 1 are read.
   * @returns The modifiers.
   * @throws {Error} When a member lies outside its range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, which draws are read and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The tempo is Effort's tempo over the pace, the extent Effort's extent times the intensity, and each takes a seeded offset whose bound narrows from the novice's to the expert's with proficiency. A hold lasts longer in bound Flow and shorter in free Flow, EMOTE's direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The defaults, four range checks, one offset helper and the record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each member outside its range throws, a non-number included. The Flow share `HOLD` and the extent's bounds are provisional, named constants with their status stated; the tempo's bounds come from the variability `HumanSkill.jitter` uses.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `HumanEffort.modifiers` for the Effort mapping. No variation reads no draw, so a manner without it is deterministic whatever the stream.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function resolve(
    manner: IAutoMovieMotionManner | undefined,
    random: IAutoMovieRandom,
  ): IAutoMovieMotionManner.IModifiers {
    if (manner === undefined) return NEUTRAL;
    const intensity: number = manner.intensity ?? 1;
    const pace: number = manner.pace ?? 1;
    const proficiency: number = manner.consistency ?? 1;
    const variation: number = manner.variation ?? 0;
    HumanBound.within("manner.intensity", intensity, 0, 1, "", "minimum");
    HumanBound.above("manner.pace", pace, 0);
    HumanBound.within("manner.proficiency", proficiency, 0, 1);
    HumanBound.within("manner.variation", variation, 0, 1);
    const effort: IAutoMovieMotionHumanEffort.IModifiers =
      HumanEffort.modifiers(manner.effort);
    const offset = (
      bounds: readonly [number, number],
      index: number,
    ): number =>
      variation === 0
        ? 1
        : 1 +
          variation *
            (bounds[0] + (bounds[1] - bounds[0]) * proficiency) *
            (2 * random.float(index) - 1);
    const tempo: number = (effort.tempo / pace) * offset(BOUNDS.tempo, 0);
    return {
      tempo,
      hold: tempo * (1 + HOLD * (manner.effort?.flow ?? 0)),
      extent: effort.extent * intensity * offset(BOUNDS.extent, 1),
      curvature: effort.curvature,
      bend: effort.elbow,
      step: effort.step,
      swing: effort.swing,
    };
  }

  /**
   * The modifiers of an action's manner, drawn from the action's own seeded
   * channel and with the performer's timing skill where the manner states no
   * proficiency, and with its moving spans slowed by the action's own time
   * scale (`IHumanActionContext.tempo`) with or without a manner; its holds
   * keep their seconds.
   *
   * @param context The action's skill, draw streams and time scale.
   * @param manner The manner; neutral when absent.
   * @returns The modifiers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where the draws and the default proficiency come from.
   * @evidence contracts/development/implementation.md#principled-implementation A performer's own timing skill is the proficiency a manner means when it states none, and the action's `manner` channel keeps the variation apart from the law's other draws, so adding a manner does not move them. A replan's time scale lengthens what its speed bound limits, the motion, and not a hold, which is a duration.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional and one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: a stated proficiency overrides the performer's, and the ranges are checked by `resolve`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `resolve`; every law resolves its manner here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "skill" | "random" | "tempo"
    >,
    manner: IAutoMovieMotionManner | undefined,
  ): IAutoMovieMotionManner.IModifiers {
    const own: IAutoMovieMotionManner.IModifiers =
      manner === undefined
        ? NEUTRAL
        : resolve(
            { consistency: context.skill.axes.timing, ...manner },
            context.random("manner"),
          );

    // The action's own time scale, where it is replanned to take the time
    // its motion needs, slows its moving spans only: a hold is a duration,
    // not a speed-limited phase, so its seconds (an authored hold's
    // included) stay as the manner gives them.
    const scale: number = context.tempo ?? 1;
    return scale === 1 ? own : { ...own, tempo: own.tempo * scale };
  }

  /**
   * A clock performed in a manner: the holds stretched by the hold factor,
   * the fixed spans left as they are and every other span stretched by the
   * tempo.
   *
   * @param clock The action's clock at its natural timing.
   * @param modifiers The manner's modifiers.
   * @param spans The holds and the fixed spans, by the instants that open them.
   * @returns The clock, with the same instant names.
   * @throws {Error} On a named instant the clock lacks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which spans take which factor, that the names are kept and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A manner changes how long a performer takes, not how long a body falls: the spans physics fixes keep their length, a hold takes the hold factor and the rest the tempo.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The two lists are resolved and checked, then one `stretch` picks a factor per span.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A stated instant the clock lacks throws through `clock.at` even when the manner is neutral; the default holds are only the standard ones the clock has, so a clock that is not a phrase is retimed by the tempo alone.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionClock.stretch`; a neutral manner returns the clock itself.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A handful of instants; the list lookups are over at most that many names.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function time(
    clock: IAutoMovieMotionClock,
    modifiers: Pick<IAutoMovieMotionManner.IModifiers, "tempo" | "hold">,
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
    return AutoMovieMotionClock.stretch(clock, (opening: string): number =>
      fixed.includes(opening)
        ? 1
        : holds.includes(opening)
          ? modifiers.hold
          : modifiers.tempo,
    );
  }

  /**
   * Named manners: the eight basic Effort actions of Laban, four moods and
   * the two Shape qualities of the trunk and limbs, as manner records a
   * composition names instead of spelling out factors.
   *
   * The Effort actions are `HumanEffort.ACTIONS`. A mood adds Flow, pace and
   * intensity to an Effort: `weary` is slow, small and heavy, `brisk` quick
   * and direct, `sad` slow, small and bound, `proud` large, free and
   * unhurried. `enclosing` and `spreading` are Shape's two poles as far as a
   * manner reaches them: bound Flow draws the elbows in and shortens the
   * excursions, free Flow releases them outward.
   *
   * Each preset is a plain `IManner`, so a law that reads a manner reads a
   * preset with no further case; the table has no resolver of its own, since
   * `resolve` and `of` take its records. The moods' factors, paces and
   * intensities and the two Shape poles' Flow are provisional: no measured
   * population values were located (sad walks are slower with shorter strides
   * and proud ones larger in direction, Montepare, Goldstein and Clausen 1987,
   * J Nonverbal Behav 11:33; the magnitudes here are not from it).
   *
   * What a preset does to durations and to a normal walk at the reference
   * hip (`IAutoMovieMotionHumanGait` gives the speed model): the Effort
   * actions `punch`, `dab`, `slash` and `flick` take 0.7 times the time (a
   * walk of about 2.2 m/s) and `press`, `glide`, `wring` and `float` 1.3
   * times (about 1.2 m/s). `weary` takes 1.51 times the time, a walk of
   * about 1.0 m/s, at an intensity of 0.7; `brisk` 0.88 times, about
   * 1.72 m/s, the fast walk where Murtagh et al. 2021 place walking briskly; `sad` 1.39 times, about 1.1 m/s, at an intensity of 0.7; `proud`
   * 1.05 times, about 1.4 m/s; `enclosing` and `spreading` do
   * not change the time. Each is `1 - 0.3 time` over the preset's `pace`.
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

  /** The names of {@link PRESETS}, as data; a name `Preset` lacks fails the type check, and a test checks none is missing. */
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
