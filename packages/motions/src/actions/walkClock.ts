import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieMotionHumanWalkSteps,
} from "@automovie/interface";

import { HUMAN_ATTRIBUTE_EFFECTS } from "../ensemble/HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "../ensemble/HumanAttribute";
import { HumanSkill } from "../skill/HumanSkill";
import { walkCadence } from "../gait/internal/walkCadence";
import { walkStation } from "../gait/internal/walkStation";
import { walkSteps } from "../gait/internal/walkSteps";
import { walkTempo } from "./walkTempo";
import { walkWindows } from "./walkWindows";

/**
 * A stepping plan's timing, the last step of `walk.locomote`: the steps taken a
 * little unevenly in time, or entrained to a beat track when the walker locks
 * to one, and kept on a moving station by speed matching when the gait draws
 * its own tempo.
 *
 * A stride time varies by 3 % in a novice down to 1 % in an expert (the 1 to 3
 * % of healthy adults, Hausdorff; the mapping onto skill is provisional), which
 * each step's own draw carries as the square root of two times that, two
 * independent steps making a stride (`walkTempo`). On a beat track a locked
 * walker lands each strike by its phase correction toward its beat
 * (`walkCadence`, `walkTempo.entrainment`). A cadenced gait keeps its count,
 * its station kept by the length of its steps when it was planned
 * (`walkStation.cadenced`); any other keeps its station by matching the slot's
 * speed (`walkStation`).
 *
 * @param context The walk's context, its station resolved.
 * @param planned The stepping plan on its own clock.
 * @param gait The gait.
 * @param clock The entrained clock already used to plan a timed station, when
 *   present.
 * @returns The plan on its film clock.
 */
export function walkClock(
  context: IAutoMovieMotionHumanActionContext<
    Omit<IAutoMovieMotionHumanWalkParams, "pace">
  >,
  planned: walkStation.IPlan,
  gait: IAutoMovieMotionHumanWalkGait,
  clock: walkTempo.IClock | null = walkClock.entrainment(context, planned),
): walkStation.IPlan {
  const tempo: walkStation.IPlan =
    clock !== null
      ? walkTempo.playback(planned, clock)
      : walkTempo(
          planned,
          (index: number): number =>
            Math.SQRT2 *
            HumanSkill.quantity(context.skill, "timing", 0.03, 0.01) *
            (gait.unevenness ?? 1) *
            HumanSkill.normal(context.random("stride"), 2 * index),
          gait.limp,
        );

  // A gait that draws its own tempo keeps its station by matching the slot's speed; a cadenced one keeps its count.
  const station: IAutoMovieMotionHumanFormation.IStation | undefined =
    context.params.station;
  return station === undefined || gait.called === true
    ? tempo
    : walkStation(
        tempo,
        walkStation.point(context, station),
        context.start,
        walkStation.rests(context, station),
      );
}
/** The record of `IWalkClockStepsResult`'s site. */
type IWalkClockStepsResult = {
  plan: IAutoMovieMotionHumanWalkSteps.IPlan;
  clock?: walkTempo.IClock | null;
};

/** Companions of {@link walkClock}. */
export namespace walkClock {
  /**
   * Fit a designated station's film-time travel to the same clock used by the
   * step events and playback. At a fixed step frequency, walkers change step
   * length with speed (https://doi.org/10.1038/s41597-022-01817-1).
   *
   * @param context The resolved walk's cue, discipline and time origin.
   * @param input The step planner's inputs, including any film-time travel.
   * @returns The step plan and any cue clock already prepared for it.
   */
  export function steps(
    context: IAutoMovieMotionHumanActionContext<
      Omit<IAutoMovieMotionHumanWalkParams, "pace">
    >,
    input: IAutoMovieMotionHumanWalkSteps.IInput,
  ): IWalkClockStepsResult {
    let plan: ReturnType<typeof walkSteps.plan> = walkSteps.plan(input);
    const travel: IAutoMovieMotionHumanWalkSteps.IInput["travel"] =
      input.travel;
    if (travel === undefined || context.params.cadence === undefined)
      return { plan };

    const opening: walkSteps.IOpening = plan.opening;
    for (;;) {
      const clock: walkTempo.IClock | null = entrainment(context, {
        duration: plan.duration,
        events: walkWindows(plan).events,
      });
      if (clock === null) return { plan, clock };

      // Footprints and pelvis both read the station in film seconds. Fit
      // again if a different strike closes the new plan. The fixed opening
      // and step period keep the shared prefix of each clock identical.
      const start: number = clock.toFilm(opening.seconds);
      const fitted: ReturnType<typeof walkSteps.plan> = walkSteps.plan(
        {
          ...input,
          travel: (seconds: number): number =>
            travel(clock.toFilm(seconds + opening.seconds) - start),
        },
        opening,
      );
      if (fitted.duration === plan.duration) return { plan: fitted, clock };
      plan = fitted;
    }
  }
  /** The alternatives of `WalkClockEntrainmentPlanned`'s site. */
  type WalkClockEntrainmentPlanned = "duration" | "events";

  /**
   * Read the cue and phase correction for this sequence of heel strikes.
   *
   * @param context The current walk's cue, discipline and time origin.
   * @param planned The nominal action's events and duration.
   * @returns The two-way film clock, or null when the gait is unlocked.
   */
  export function entrainment(
    context: IAutoMovieMotionHumanActionContext<
      Omit<IAutoMovieMotionHumanWalkParams, "pace">
    >,
    planned: Pick<IAutoMovieMotionHumanActionPlan, WalkClockEntrainmentPlanned>,
  ): walkTempo.IClock | null {
    if (context.params.cadence === undefined) return null;
    const strikes: walkTempo.IStrike[] = walkTempo.strikes(planned);
    const seconds: number[] | null = walkCadence.strikes(
      context,
      context.params.cadence,
      strikes,
    );
    return seconds === null
      ? null
      : (walkTempo.entrainment(
          strikes,
          seconds.map((s: number): number => s - context.start),
        ) ?? null);
  }
  /**
   * The factor a member's fatigue puts on a walk's speed
   * (`HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace`, fresh when absent): 1 for a
   * cadenced gait, which keeps its count, so only a gait that draws its own
   * tempo slows.
   *
   * @param context The walk's context.
   * @param gait The gait.
   * @returns The factor.
   */
  export function weary(
    context: IAutoMovieMotionHumanActionContext,
    gait: IAutoMovieMotionHumanWalkGait,
  ): number {
    return gait.called === true
      ? 1
      : HumanAttribute.effect(
          HUMAN_ATTRIBUTE_EFFECTS.fatigue.pace,
          context.attributes?.fatigue,
          0,
        );
  }
}
