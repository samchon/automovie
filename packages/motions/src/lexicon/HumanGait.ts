import type { IAutoMovieVector3 } from "@automovie/interface";

import { run } from "../actions/run";
import { walk } from "../actions/walk";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanActionRow } from "../law/HumanActionRow";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";

/**
 * Named ways of going somewhere on foot; the composition gives the
 * destination. Register the ones a film uses.
 *
 * A style whose speed is one of the walk's or the run's paces is a row of
 * that action with its pace, stride and arm carriage fixed: `stroll`,
 * `hurry`, `trudge`, `swagger`, `jog`, `sprint`. Their scales are
 * provisional until each style's study is read (the manner presets' issue
 * lists them).
 *
 * A style whose speed no pace has runs the walk's stepping plan in a gait
 * of its own, as the run does, and counts as a walk wherever actions are
 * told apart by kind:
 *
 * - `march` keeps the drill's cadence, 120 steps a minute, and its step,
 *   30 inches (0.76 m) for a soldier whose hip stands 0.93 m high, scaled by
 *   the body's hip height (US Army TC 3-21.5, quick time; the scaling and
 *   the reference hip height are provisional). The cadence governs: the way
 *   is covered in the whole number of steps nearest it in drill steps, so
 *   over a way that is not a whole number of them the step gives and the
 *   cadence stays.
 * - `doubleTime` keeps 180 steps a minute on the same step, which is a
 *   jog's speed, so it is run in the jog's gait with the count kept.
 * - `prowl` is the sneak on deeply bent knees; `sad` and `proud` carry a
 *   mood in speed, arm swing and trunk; `limp` spares one leg, standing on
 *   it briefly; `drunk` is slow, unsteady in time and wanders off its line.
 *   All provisional, each constant saying what was read and what was not.
 * - `sneak` goes slower than the slow walk on shorter steps, with the
 *   pelvis lowered and the arms held close (provisional values; no study of
 *   stealthy gait has been read).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each entry is, which are rows and which run a gait of their own, with the march's source and what is provisional.
 * @evidence contracts/development/design.md#principled-representation A row is data over a law that already fits the body; a styled gait is a law record over the walk's own stepping planner, with the gait as a Froude number and steps in hip heights, so each fits any body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's entries and the two styled gaits' constants; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No entry writes steps of its own: every one is planned by `walk.locomote`.
 */
export namespace HumanGait {
  /** A stroll: slow, the stride a little short, the arms easy. */
  export const stroll = HumanActionRow.of("stroll", walk, {
    pace: "slow",
    stride: 0.9,
    armSwing: 0.8,
  });

  /** A hurry: fast, the stride long, the arms driving. */
  export const hurry = HumanActionRow.of("hurry", walk, {
    pace: "fast",
    stride: 1.1,
    armSwing: 1.3,
  });

  /** A weary trudge: slow, short, the arms barely swinging. */
  export const trudge = HumanActionRow.of("trudge", walk, {
    pace: "slow",
    stride: 0.8,
    armSwing: 0.4,
  });

  /** A swagger: the elbows out and the arms swung wide. */
  export const swagger = HumanActionRow.of("swagger", walk, {
    pace: "normal",
    armSwing: 1.5,
    elbows: 20,
  });

  /** A jog. */
  export const jog = HumanActionRow.of("jog", run, { pace: "jog" });

  /** A sprint. */
  export const sprint = HumanActionRow.of("sprint", run, { pace: "sprint" });

  /** What a styled gait leaves to the composition: the walk's destination, waypoints, arrival heading and elbows. */
  export type IParams = Omit<walk.IParams, "pace" | "stride" | "armSwing">;

  /**
   * The march: steps a minute, the step in hip heights (0.76 m at a 0.93 m
   * hip, the hip height the walk's paces are referred to), and the arm's
   * swing. TC 3-21.5 gives the arm 9 inches to the front and 6 to the rear
   * of the trouser seam, about 17 degrees each way on a 0.65 m arm
   * (unverified in the current edition); the elbow nearly straight is
   * provisional, and so is the half of a walk's step-to-step unevenness a
   * drill keeps.
   */
  export const MARCH: Readonly<{
    cadence: number;
    step: number;
    arms: walk.IGait["arms"];
    unevenness: number;
  }> = {
    cadence: 120,
    step: 0.76 / 0.93,
    arms: { shoulder: 17, elbow: 10, swing: 0 },
    unevenness: 0.5,
  };

  /**
   * The sneak (provisional): its Froude number, a third of the slow walk's;
   * its step as a share of the walking step at that number; how far the
   * pelvis rides below a walk's, hip heights; and the arm's small swing
   * with the elbow bent.
   */
  export const SNEAK: Readonly<{
    froude: number;
    step: number;
    drop: number;
    arms: walk.IGait["arms"];
  }> = {
    froude: 0.04,
    step: 0.8,
    drop: 0.05,
    arms: { shoulder: 2, elbow: 30, swing: 0 },
  };

  /** A march: the drill step at the drill cadence, the arms swung straight. */
  export const march: IHumanActionLaw<IParams> = styled(
    "march",
    (context: IHumanActionContext<IParams>): walk.IGait => {
      const l: number = context.body.measure.hipHeight;

      // The whole number of steps nearest the way in drill steps, taken at the cadence: the step and the speed follow from them.
      const way: number = distance(context);
      const step: number =
        way / Math.max(2, Math.round(way / (MARCH.step * l)));
      const speed: number = (step * MARCH.cadence) / 60;
      return {
        ...walk.walking((speed * speed) / (9.81 * l)),

        // The stepping plan measures the way along its own path; 2 % of slack keeps it on this count of steps.
        step: (): number => (1.02 * step) / l,
        arms: MARCH.arms,
        unevenness: MARCH.unevenness,
        called: true,
      };
    },
  );

  /**
   * Double time: steps a minute and the step in hip heights. TC 3-21.5
   * gives 180 steps a minute; the 30-inch step of quick time is kept
   * (unverified in the current edition), which at that cadence is a jog's
   * speed, so the body runs it in the jog's gait.
   */
  export const DOUBLE: Readonly<{ cadence: number; step: number }> = {
    cadence: 180,
    step: 0.76 / 0.93,
  };

  /** Double time: the drill step at 180 a minute, run as a jog that keeps the count. */
  export const doubleTime: IHumanActionLaw<IParams> = styled(
    "doubleTime",
    (context: IHumanActionContext<IParams>): walk.IGait => {
      const l: number = context.body.measure.hipHeight;

      // As the march: the nearest whole number of drill steps, taken at the cadence.
      const way: number = distance(context);
      const step: number =
        way / Math.max(2, Math.round(way / (DOUBLE.step * l)));
      const speed: number = (step * DOUBLE.cadence) / 60;
      return {
        ...run.GAITS.jog,
        froude: (speed * speed) / (9.81 * l),
        step: (): number => (1.02 * step) / l,
        unevenness: MARCH.unevenness,
        called: true,
      };
    },
  );

  /** A sneak: slow short steps on bent knees, the arms held still and close. */
  export const sneak: IHumanActionLaw<IParams> = styled(
    "sneak",
    (): walk.IGait => {
      const walking: walk.IGait = walk.walking(SNEAK.froude);
      return {
        ...walking,
        step: (froude: number): number => SNEAK.step * walking.step(froude),
        bob: { mean: -SNEAK.drop, amplitude: 0 },
        arms: SNEAK.arms,
      };
    },
  );

  /** How far the pelvis rides below a walk's in a prowl, the sneak's crouched variant, hip heights (provisional). */
  export const PROWL: number = 0.12;

  /** A prowl: the sneak on deeply bent knees. */
  export const prowl: IHumanActionLaw<IParams> = styled(
    "prowl",
    (): walk.IGait => {
      const walking: walk.IGait = walk.walking(SNEAK.froude);
      return {
        ...walking,
        step: (froude: number): number => SNEAK.step * walking.step(froude),
        bob: { mean: -PROWL, amplitude: 0 },
        arms: SNEAK.arms,
      };
    },
  );

  /**
   * The trunk's forward lean of each mood's walk, degrees (provisional): a
   * sad walker is more slumped than a neutral one (Michalak et al. 2009,
   * Psychosom Med 71:580, give the direction) and a proud one upright. The
   * rest of a mood is the manner preset of its name
   * (`AutoMovieMotionManner.PRESETS`): its tempo sets the speed, its step
   * and swing factors the step and the arms, so one table owns the moods
   * for every act.
   */
  export const MOODS: Readonly<Record<"sad" | "proud", number>> = {
    sad: 8,
    proud: 0,
  };

  /** A sad walk: slow, the arms barely swinging, the trunk slumped. */
  export const sad: IHumanActionLaw<IParams> = styled(
    "sad",
    (context: IHumanActionContext<IParams>): walk.IGait =>
      mood("sad", context),
  );

  /** A proud walk: upright, the arms swung freely. */
  export const proud: IHumanActionLaw<IParams> = styled(
    "proud",
    (context: IHumanActionContext<IParams>): walk.IGait =>
      mood("proud", context),
  );

  /**
   * The limp (provisional): the slow walk's Froude number, the step as a
   * share of the walking step, and the share by which a step standing on
   * the spared leg is cut short and the next drawn out. A normal stance
   * takes about 60 % of the stride and a painful one less (Perry and
   * Burnfield 2010); the size of the asymmetry awaits a measured cohort.
   */
  export const LIMP: Readonly<{ froude: number; step: number; share: number }> =
    { froude: 0.12, step: 0.85, share: 0.15 };

  /** What a limp leaves to the composition: the walk's, and the leg spared. */
  export interface ILimp extends IParams {
    /** The leg spared; the right when absent. */
    side?: "left" | "right";
  }

  /** A stiff-knee limp: the spared leg also swings straight, barely clearing the floor. */
  export const stiffLimp: IHumanActionLaw<ILimp> = styled(
    "stiffLimp",
    (context: IHumanActionContext<ILimp>): walk.IGait => {
      const walking: walk.IGait = walk.walking(LIMP.froude);
      const side: "left" | "right" = context.params.side ?? "right";
      return {
        ...walking,
        step: (froude: number): number => LIMP.step * walking.step(froude),
        limp: { side, share: LIMP.share },
        stiff: side,
      };
    },
  );

  /** How far a tiptoe holds the heels off the floor, degrees about the toes' joint (provisional). */
  export const TIPTOE: number = 25;

  /** A tiptoe: the sneak's slow short steps on the balls of the feet, the heels never set down. */
  export const tiptoe: IHumanActionLaw<IParams> = styled(
    "tiptoe",
    (): walk.IGait => {
      const walking: walk.IGait = walk.walking(SNEAK.froude);
      return {
        ...walking,
        step: (froude: number): number => SNEAK.step * walking.step(froude),
        arms: SNEAK.arms,
        heels: TIPTOE,
      };
    },
  );

  /** A limp: an antalgic gait, the spared leg stood on briefly. */
  export const limp: IHumanActionLaw<ILimp> = styled(
    "limp",
    (context: IHumanActionContext<ILimp>): walk.IGait => {
      const walking: walk.IGait = walk.walking(LIMP.froude);
      return {
        ...walking,
        step: (froude: number): number => LIMP.step * walking.step(froude),
        limp: { side: context.params.side ?? "right", share: LIMP.share },
      };
    },
  );

  /**
   * The intoxicated walk (provisional): the slow walk's Froude number, the
   * multiple of a sober walk's step-to-step unevenness, and the wander, a
   * waypoint every `every` hip heights of the way set aside by up to
   * `aside` hip heights to a seeded side. At 0.11 % breath alcohol people
   * widen their steps, turn their feet out and sway more (Gimunova et al.
   * 2022, Sci Rep 12); the step width and the foot rotation are not
   * modelled here.
   */
  export const DRUNK: Readonly<{
    froude: number;
    unevenness: number;
    every: number;
    aside: number;
  }> = { froude: 0.12, unevenness: 3, every: 2, aside: 0.15 };

  /** An intoxicated walk: slow, unsteady in time, wandering off its line and back. */
  export const drunk: IHumanActionLaw<IParams> = {
    name: "drunk",
    family: walk.name,
    interrupts: walk.interrupts,
    yields: walk.yields,
    plan: (context: IHumanActionContext<IParams>): IHumanActionPlan => {
      const l: number = context.body.measure.hipHeight;
      const feet: IHumanActionContext["entry"]["feet"] = context.entry.feet;
      const from: IAutoMovieVector3 = {
        x: (feet.left.ankle.x + feet.right.ankle.x) / 2,
        y: 0,
        z: (feet.left.ankle.z + feet.right.ankle.z) / 2,
      };
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
          x: from.x + (to.x - from.x) * along - ((to.z - from.z) / way) * aside,
          y: 0,
          z: from.z + (to.z - from.z) * along + ((to.x - from.x) / way) * aside,
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

/** A mood's gait: the normal walk in the manner preset of the mood's name, a tempo factor slowing the speed by itself (the Froude number by its square), with the mood's lean. */
function mood(
  name: "sad" | "proud",
  context: IHumanActionContext<HumanGait.IParams>,
): walk.IGait {
  const manner: AutoMovieMotionManner.IModifiers = AutoMovieMotionManner.of(
    context,
    AutoMovieMotionManner.PRESETS[name],
  );
  const walking: walk.IGait = walk.walking(
    walk.FROUDE.normal / (manner.tempo * manner.tempo),
  );
  return {
    ...walking,
    step: (froude: number): number => manner.step * walking.step(froude),
    arms: {
      shoulder: manner.swing * walking.arms.shoulder,
      elbow: walking.arms.elbow,
      swing: manner.swing * walking.arms.swing,
    },
    lean: HumanGait.MOODS[name],
  };
}

/** A walk in a gait of its own, under a name: the walk's cuts and yields, planned by its stepping plan. */
function styled<P extends HumanGait.IParams>(
  name: string,
  gait: (context: IHumanActionContext<P>) => walk.IGait,
): IHumanActionLaw<P> {
  return {
    name,
    family: walk.name,
    interrupts: walk.interrupts,
    yields: walk.yields,
    plan: (context: IHumanActionContext<P>): IHumanActionPlan =>
      walk.locomote(context, gait(context)),
  };
}

/** The length of the way from where the feet stand through the waypoints to the destination, metres. */
function distance(context: IHumanActionContext<HumanGait.IParams>): number {
  const feet: IHumanActionContext["entry"]["feet"] = context.entry.feet;
  let from: IAutoMovieVector3 = {
    x: (feet.left.ankle.x + feet.right.ankle.x) / 2,
    y: 0,
    z: (feet.left.ankle.z + feet.right.ankle.z) / 2,
  };
  let length: number = 0;
  for (const to of [...(context.params.via ?? []), context.params.to]) {
    length += Math.hypot(to.x - from.x, to.z - from.z);
    from = to;
  }
  return length;
}
