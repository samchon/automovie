import type { IAutoMovieRandom } from "@automovie/engine";

import { HumanEffort } from "../everyday/HumanEffort";
import type { IHumanActionContext } from "../law/IHumanActionContext";
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
 */
export namespace AutoMovieMotionManner {
  /** A manner; every member is optional and neutral when absent. */
  export interface IManner {
    /** Laban Effort, each factor in [-1, 1]; neutral when absent. */
    effort?: HumanEffort.IEffort;

    /** How much of the action's full size is performed, in (0, 1]; 1 when absent. */
    intensity?: number;

    /** The rate as a multiple of the action's natural rate; positive, 1 when absent. */
    pace?: number;

    /** Skill in [0, 1], which narrows the variation; the performer's own when absent. */
    proficiency?: number;

    /** How much one performance differs from the next, in [0, 1]; 0 when absent. */
    variation?: number;
  }

  /** What a clock and a phrase read. */
  export interface IModifiers {
    /** Factor on every duration that physics does not fix. */
    tempo: number;

    /** Factor on the duration of a hold. */
    hold: number;

    /** Factor on excursions about the base and on free-space amplitudes. */
    extent: number;

    /** Lateral deviation of a hand's path, a share of the path's length. */
    curvature: number;

    /** A share added to the bend preset's outward share; negative draws the elbows in. */
    bend: number;

    /** Factor on a gait's step length. */
    step: number;

    /** Factor on a gait's arm swing. */
    swing: number;
  }

  /** The modifiers of the absent manner. */
  export const NEUTRAL: IModifiers = {
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
   */
  export function resolve(
    manner: IManner | undefined,
    random: IAutoMovieRandom,
  ): IModifiers {
    if (manner === undefined) return NEUTRAL;
    const intensity: number = manner.intensity ?? 1;
    const pace: number = manner.pace ?? 1;
    const proficiency: number = manner.proficiency ?? 1;
    const variation: number = manner.variation ?? 0;
    if (!(intensity > 0 && intensity <= 1))
      throw new Error("A manner's intensity lies in (0, 1]");
    if (!(pace > 0)) throw new Error("A manner's pace is positive");
    if (!(proficiency >= 0 && proficiency <= 1))
      throw new Error("A manner's proficiency lies in [0, 1]");
    if (!(variation >= 0 && variation <= 1))
      throw new Error("A manner's variation lies in [0, 1]");
    const effort: HumanEffort.IModifiers = HumanEffort.modifiers(manner.effort);
    const offset = (bounds: readonly [number, number], index: number): number =>
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
   * proficiency.
   *
   * @param context The action's skill and draw streams.
   * @param manner The manner; neutral when absent.
   * @returns The modifiers.
   */
  export function of(
    context: Pick<IHumanActionContext, "skill" | "random">,
    manner: IManner | undefined,
  ): IModifiers {
    return manner === undefined
      ? NEUTRAL
      : resolve(
          { proficiency: context.skill.axes.timing, ...manner },
          context.random("manner"),
        );
  }

  /** Which spans of a clock a manner treats apart from the rest. */
  export interface ISpans {
    /** The instants that open the holds; a phrase's `ready` and `strokeEnd` when absent. */
    holds?: readonly string[];

    /** The instants that open the spans physics fixes; none when absent. */
    fixed?: readonly string[];
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
   */
  export function time(
    clock: AutoMovieMotionClock.IClock,
    modifiers: Pick<IModifiers, "tempo" | "hold">,
    spans: ISpans = {},
  ): AutoMovieMotionClock.IClock {
    const named = new Set<string>(
      clock.instants.map((i: AutoMovieMotionClock.IInstant): string => i.name),
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
}
