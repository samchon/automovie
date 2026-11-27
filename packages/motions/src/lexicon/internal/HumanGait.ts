import { AutoMovieEngineGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanGait,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieVector3,
} from "@automovie/interface";

import { run } from "../../gait/internal/run";
import { walk } from "../../gait/internal/walk";
import { walkCadence } from "../../gait/internal/walkCadence";
import { walkStation } from "../../gait/internal/walkStation";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_GAIT_HURRY } from "../../next/presets/HUMAN_GAIT_HURRY";
import { HUMAN_GAIT_STROLL } from "../../next/presets/HUMAN_GAIT_STROLL";
import { HUMAN_GAIT_SWAGGER } from "../../next/presets/HUMAN_GAIT_SWAGGER";
import { HUMAN_GAIT_TRUDGE } from "../../next/presets/HUMAN_GAIT_TRUDGE";
import { HumanGaitCounted } from "./HumanGaitCounted";
import { HumanGaitDistance } from "./HumanGaitDistance";
import { HumanGaitLimping } from "./HumanGaitLimping";
import { HumanGaitMiddle } from "./HumanGaitMiddle";
import { HumanGaitMood } from "./HumanGaitMood";
import { HumanGaitRegulated } from "./HumanGaitRegulated";
import { HumanGaitSneaking } from "./HumanGaitSneaking";
import { HumanGaitStyled } from "./HumanGaitStyled";

/*
 * Named ways of going somewhere on foot; the composition gives the destination.
 * Register the ones a film uses.
 *
 * A style whose speed is one of the walk's or the run's paces is a row of that
 * action: `stroll`, `hurry`, `trudge` and `swagger` fix the walk presets of the
 * same names (`AutoMovieMotionHumanGait.STROLL` and the others, provisional
 * until each style's study is read), and `jog` and `sprint` fix the run's pace
 * alone.
 *
 * A style whose speed no pace has runs the walk's stepping plan in a gait of
 * its own, as the run does, and counts as a walk wherever actions are told
 * apart by kind:
 *
 * - `march` keeps the drill's cadence, 120 steps a minute, and its step, 30
 *   inches (0.762 m) for every marcher, as the regulation prescribes one step
 *   to all so the ranks keep their dress (US Army TC 3-21.5, quick time). The
 *   cadence governs: the way is covered in the whole number of steps nearest it
 *   in drill steps, so over a way that is not a whole number of them the step
 *   gives and the cadence stays.
 * - `doubleTime` keeps 180 steps a minute on the same step, which is a jog's
 *   speed, so it is run in the jog's gait with the count kept.
 * - `prowl` is the sneak on deeply bent knees; `sad` and `proud` carry a mood in
 *   speed, arm swing and trunk; `limp` spares one leg, standing on it briefly;
 *   `drunk` is slow, unsteady in time and wanders off its line. All
 *   provisional, each constant saying what was read and what was not.
 * - `sneak` goes slower than the slow walk on shorter steps, with the pelvis
 *   lowered and the arms held close (provisional values; no study of stealthy
 *   gait has been read).
 */
export namespace HumanGait {
  /*
   * The stroll: the walk with the stroll preset's pace, step and arm swing
   * fixed (`HUMAN_GAIT_STROLL`, `AutoMovieMotionHumanGait.STROLL`).
   */
  export const stroll: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gait"]["stroll"]
  > = AutoMovieMotionHumanActionRow.of("stroll", walk, HUMAN_GAIT_STROLL);

  /*
   * The hurry: the walk with the hurry preset's pace, step and arm swing fixed
   * (`HUMAN_GAIT_HURRY`, `AutoMovieMotionHumanGait.HURRY`).
   */
  export const hurry: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gait"]["hurry"]
  > = AutoMovieMotionHumanActionRow.of("hurry", walk, HUMAN_GAIT_HURRY);

  /*
   * The weary trudge: the walk with the trudge preset's pace, step and arm
   * swing fixed (`HUMAN_GAIT_TRUDGE`, `AutoMovieMotionHumanGait.TRUDGE`).
   */
  export const trudge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gait"]["trudge"]
  > = AutoMovieMotionHumanActionRow.of("trudge", walk, HUMAN_GAIT_TRUDGE);

  /*
   * The swagger: the walk with the swagger preset's pace, arm swing and elbows
   * fixed (`HUMAN_GAIT_SWAGGER`, `AutoMovieMotionHumanGait.SWAGGER`).
   */
  export const swagger: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gait"]["swagger"]
  > = AutoMovieMotionHumanActionRow.of("swagger", walk, HUMAN_GAIT_SWAGGER);

  /*
   * A jog: the `jog` run (about 2.3 m/s, about 165 steps a minute); exercise,
   * an easy pace held for a long way
   * (IAutoMovieMotionHumanRun.IParams.pace).
   */
  export const jog: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gait"]["jog"]
  > = AutoMovieMotionHumanActionRow.of("jog", run, { pace: "jog" });

  /*
   * A sprint: the `sprint` run (about 6.8 m/s, about 234 steps a minute); a
   * charge, chase or escape at full effort
   * (IAutoMovieMotionHumanRun.IParams.pace).
   */
  export const sprint: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gait"]["sprint"]
  > = AutoMovieMotionHumanActionRow.of("sprint", run, { pace: "sprint" });

  /*
   * The march: steps a minute, the step in metres (the regulation's 30 inches,
   * the same for every marcher), and the arm's swing. TC 3-21.5 gives the arm 9
   * inches to the front and 6 to the rear of the trouser seam, about 17 degrees
   * each way on a 0.65 m arm (unverified in the current edition); the elbow
   * nearly straight is provisional, and so is the half of a walk's step-to-step
   * unevenness a drill keeps.
   */
  export const MARCH: Readonly<IMARCHItem> = {
    cadence: 120,
    step: 0.762,
    arms: { shoulder: 17, elbow: 10, swing: 0 },
    unevenness: 0.5,
  };

  /*
   * The sneak (provisional): its Froude number, a third of the slow walk's; its
   * step as a share of the walking step at that number; how far the pelvis
   * rides below a walk's, hip heights; and the arm's small swing with the elbow
   * bent.
   */
  export const SNEAK: Readonly<ISNEAKItem> = {
    froude: 0.04,
    step: 0.8,
    drop: 0.05,
    arms: { shoulder: 2, elbow: 30, swing: 0 },
  };

  /*
   * A march: the drill step at the drill cadence, the arms swung straight.
   */
  export const march: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IMarch> =
    HumanGaitStyled(
      "march",
      (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IMarch>,
      ): IAutoMovieMotionHumanWalkGait => {
        const l: number = context.body.measure.hipHeight;

        // The cadence and the drill step: the regulation's time, or the beat track's period when the march keeps step to one.
        const drill: IMarchDrill = HumanGaitRegulated(context.params);
        const beats: number[] =
          context.params.cadence === undefined
            ? []
            : walkCadence.beats(context, context.params.cadence);
        const cadence: number =
          beats.length < 2 ? drill.cadence : 60 / walkCadence.period(beats);

        // The whole number of steps nearest the way in drill steps, taken at the cadence: the step and the speed follow from them. A march keeping station takes as many steps as the cadence fits in the station's span, and the step gives.
        const resolved: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IMarch> =
          walkStation.resolve(context);
        const way: number = HumanGaitDistance(resolved);
        const station: IAutoMovieMotionHumanFormation.IStation | undefined =
          context.params.station;
        const count: number =
          station === undefined
            ? Math.max(2, Math.round(way / drill.step))
            : Math.max(
                2,
                Math.round(
                  ((walkStation.rests(context, station) - context.start) *
                    cadence) /
                    60,
                ),
              );
        const step: number = HumanGaitCounted(way, count);
        const speed: number = (step * cadence) / 60;
        return {
          ...walk.walking((speed * speed) / (AutoMovieEngineGravity.STANDARD * l)),
          step: (): number => step / l,
          arms: MARCH.arms,
          unevenness: MARCH.unevenness,
          called: true,
        };
      },
    );

  /*
   * Double time: steps a minute and the step in metres. TC 3-21.5 gives 180
   * steps a minute; the 30-inch step of quick time is kept (unverified in the
   * current edition), which at that cadence is a jog's speed, so the body runs
   * it in the jog's gait.
   */
  export const DOUBLE: Readonly<IDOUBLEItem> = {
    cadence: 180,
    step: 0.762,
  };

  /*
   * Double time: the drill step at 180 a minute, run as a jog that keeps the
   * count.
   */
  export const doubleTime: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IParams> =
    HumanGaitStyled(
      "doubleTime",
      (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IParams>,
      ): IAutoMovieMotionHumanWalkGait => {
        const l: number = context.body.measure.hipHeight;

        // As the march: the nearest whole number of drill steps, taken at the
        // cadence.
        const way: number = HumanGaitDistance(context);
        const step: number = HumanGaitCounted(
          way,
          Math.max(2, Math.round(way / DOUBLE.step)),
        );
        const speed: number = (step * DOUBLE.cadence) / 60;
        return {
          ...run.GAITS.jog,
          froude: (speed * speed) / (AutoMovieEngineGravity.STANDARD * l),
          step: (): number => step / l,
          unevenness: MARCH.unevenness,
          called: true,
        };
      },
    );

  /*
   * A sneak: slow short steps on bent knees, the arms held still and close.
   */
  export const sneak: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IParams> =
    HumanGaitStyled(
      "sneak",
      (): IAutoMovieMotionHumanWalkGait =>
        HumanGaitSneaking({ bob: { mean: -SNEAK.drop, amplitude: 0 } }),
    );

  /*
   * How far the pelvis rides below a walk's in a prowl, the sneak's crouched
   * variant, hip heights (provisional).
   */
  export const PROWL: number = 0.12;

  /*
   * A prowl: the sneak on deeply bent knees.
   */
  export const prowl: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IParams> =
    HumanGaitStyled(
      "prowl",
      (): IAutoMovieMotionHumanWalkGait =>
        HumanGaitSneaking({ bob: { mean: -PROWL, amplitude: 0 } }),
    );

  /*
   * The trunk's forward lean of each mood's walk, degrees (provisional): a sad
   * walker is more slumped than a neutral one (Michalak et al. 2009, Psychosom
   * Med 71:580, give the direction) and a proud one upright. The rest of a mood
   * is the manner preset of its name (`AutoMovieMotionManner.PRESETS`): its
   * tempo sets the speed, its step and swing factors the step and the arms, so
   * one table owns the moods for every act.
   */
  export const MOODS: Readonly<Record<MOODSEntryItem, number>> = {
    sad: 8,
    proud: 0,
  };

  /*
   * A sad walk: slow, the arms barely swinging, the trunk slumped.
   */
  export const sad: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IParams> =
    HumanGaitStyled(
      "sad",
      (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IParams>,
      ): IAutoMovieMotionHumanWalkGait => HumanGaitMood("sad", context),
    );

  /*
   * A proud walk: upright, the arms swung freely.
   */
  export const proud: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IParams> =
    HumanGaitStyled(
      "proud",
      (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IParams>,
      ): IAutoMovieMotionHumanWalkGait => HumanGaitMood("proud", context),
    );

  /*
   * The limp (provisional): the slow walk's Froude number, the step as a share
   * of the walking step, and the share by which a step standing on the spared
   * leg is cut short and the next drawn out. A normal stance takes about 60 %
   * of the stride and a painful one less (Perry and Burnfield 2010); the size
   * of the asymmetry awaits a measured cohort.
   */
  export const LIMP: Readonly<ILIMPItem> = {
    froude: 0.12,
    step: 0.85,
    share: 0.15,
  };

  /*
   * A stiff-knee limp: the spared leg also swings straight, barely clearing the
   * floor.
   */
  export const stiffLimp: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.ILimp> =
    HumanGaitStyled(
      "stiffLimp",
      (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.ILimp>,
      ): IAutoMovieMotionHumanWalkGait => ({
        ...HumanGaitLimping(context.params),
        stiff: context.params.side ?? "right",
      }),
    );

  /*
   * How far a tiptoe holds the heels off the floor, degrees about the toes'
   * joint (provisional).
   */
  export const TIPTOE: number = 25;

  /*
   * A tiptoe: the sneak's slow short steps on the balls of the feet, the heels
   * never set down.
   */
  export const tiptoe: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IParams> =
    HumanGaitStyled(
      "tiptoe",
      (): IAutoMovieMotionHumanWalkGait => HumanGaitSneaking({ heels: TIPTOE }),
    );

  /*
   * A limp: an antalgic gait, the spared leg stood on briefly.
   */
  export const limp: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.ILimp> =
    HumanGaitStyled(
      "limp",
      (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.ILimp>,
      ): IAutoMovieMotionHumanWalkGait => HumanGaitLimping(context.params),
    );

  /*
   * The intoxicated walk (provisional): the slow walk's Froude number, the
   * multiple of a sober walk's step-to-step unevenness, and the wander, a
   * waypoint every `every` hip heights of the way set aside by up to `aside`
   * hip heights to a seeded side. At 0.11 % breath alcohol people widen their
   * steps, turn their feet out and sway more (Gimunova et al. 2022, Sci Rep
   * 12); the step width and the foot rotation are not modelled here.
   */
  export const DRUNK: Readonly<IDRUNKItem> = {
    froude: 0.12,
    unevenness: 3,
    every: 2,
    aside: 0.15,
  };

  /*
   * An intoxicated walk: slow, unsteady in time, wandering off its line and
   * back.
   */
  export const drunk: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IParams> =
    {
      name: "drunk",
      family: walk.name,
      interrupts: walk.interrupts,
      yields: walk.yields,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IParams>,
      ): IAutoMovieMotionHumanActionPlan => {
        const l: number = context.body.measure.hipHeight;
        const from: IAutoMovieVector3 = HumanGaitMiddle(context);
        const to: IAutoMovieVector3 = context.params.to;
        const way: number = Math.hypot(to.x - from.x, to.z - from.z);

        // The wander is laid on a straight way only: waypoints the composition gives are its own path.
        const count: number =
          context.params.via !== undefined || way < 1e-6
            ? 0
            : Math.max(0, Math.round(way / (DRUNK.every * l)) - 1);
        const via: IAutoMovieVector3[] = [];
        for (let k: number = 1; k <= count; ++k) {
          const along: number = k / (count + 1);
          const aside: number =
            DRUNK.aside * l * (2 * context.random("wander").float(k) - 1);
          via.push({
            x:
              from.x +
              (to.x - from.x) * along -
              ((to.z - from.z) / way) * aside,
            y: 0,
            z:
              from.z +
              (to.z - from.z) * along +
              ((to.x - from.x) / way) * aside,
          });
        }
        return walk.locomote(
          {
            ...context,
            params: { ...context.params, ...(count === 0 ? {} : { via }) },
          },
          { ...walk.walking(DRUNK.froude), unevenness: DRUNK.unevenness },
        );
      },
    };
}

/*
 * The record of `IDRUNKItem`'s site.
 */
type IDRUNKItem = {
  froude: number;
  unevenness: number;
  every: number;
  aside: number;
};

/*
 * The record of `ILIMPItem`'s site.
 */
type ILIMPItem = { froude: number; step: number; share: number };

/*
 * The alternatives of `MOODSEntryItem`'s site.
 */
type MOODSEntryItem = "sad" | "proud";

/*
 * The record of `IDOUBLEItem`'s site.
 */
type IDOUBLEItem = { cadence: number; step: number };

/*
 * The record of `IMarchDrill`'s site.
 */
type IMarchDrill = { cadence: number; step: number };

/*
 * The record of `ISNEAKItem`'s site.
 */
type ISNEAKItem = {
  froude: number;
  step: number;
  drop: number;
  arms: IAutoMovieMotionHumanWalkGait["arms"];
};

/*
 * The record of `IMARCHItem`'s site.
 */
type IMARCHItem = {
  cadence: number;
  step: number;
  arms: IAutoMovieMotionHumanWalkGait["arms"];
  unevenness: number;
};
