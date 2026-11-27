import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPursuit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { run } from "../../gait/internal/run";
import { HumanGaze } from "../../everyday/internal/HumanGaze";
import { HumanProxemics } from "../../everyday/internal/HumanProxemics";
import { approach } from "../../everyday/internal/approach";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HUMAN_GAIT_CONFRONT } from "../../next/presets/HUMAN_GAIT_CONFRONT";
import { HUMAN_GAIT_ESCORT } from "../../next/presets/HUMAN_GAIT_ESCORT";
import { HUMAN_GAIT_FOLLOW } from "../../next/presets/HUMAN_GAIT_FOLLOW";

/** The record of `ISEARCHItem`'s site. */
type ISEARCHItem = { pause: number; aside: number };

/**
 * Travel relative to another person, each a row of `approach`: the composition
 * gives the person as the target. Register the ones a film uses.
 *
 * `follow` and `escort` go where the person goes: the stop is taken where the
 * person comes to rest, read from their placed actions, and the pursuer sets
 * off late enough to arrive just after them. So the person pursued is composed
 * before the pursuer (`leader.with(follower)`), and a pursuit composed the
 * other way round is refused, saying so. First pass: the pursuer does not match
 * the person's speed on the way or keep a gap through their turns. `confront`
 * steps up to a person where they stand.
 *
 * `intercept` heads a moving person off, running to where they will be, and
 * `chase` is a row of it: a chase runs. `flee` is the opposite travel: a run
 * straight away from a person, read where they are when it begins. It is a law
 * of its own over the run, since its destination comes from the person and not
 * from the scene.
 */
export namespace HumanPursuit {
  /**
   * Come up behind a person at the social distance, as a follower closes the
   * gap.
   */
  export const follow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pursuit"]["follow"]
  > = AutoMovieMotionHumanActionRow.of("follow", approach, HUMAN_GAIT_FOLLOW);

  /**
   * Come to a person's left side at the personal distance, as an escort takes
   * station.
   */
  export const escort: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pursuit"]["escort"]
  > = AutoMovieMotionHumanActionRow.of("escort", approach, HUMAN_GAIT_ESCORT);

  /** Step up face to face, as a confrontation begins. */
  export const confront: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pursuit"]["confront"]
  > = AutoMovieMotionHumanActionRow.of(
    "confront",
    approach,
    HUMAN_GAIT_CONFRONT,
  );

  /**
   * Head a moving person off: a run to where they will be when the runner gets
   * there, stopping at arm's length of that place (the handing gap of
   * `HumanProxemics`), not to where they are when it begins.
   *
   * The meeting instant is the one at which the run to the person's place at
   * that instant ends at that instant, found by planning the run to where they
   * are at each estimate and taking its end as the next, up to eight times, to
   * within one 24th of a second. Their place is read from their placed actions,
   * so they are composed before the runner. A person the pace does not close on
   * is refused with the last estimate. First pass: one straight run, so the
   * bearing to the person is held only as far as both go straight (Fajen and
   * Warren 2007 describe the curved approach of real interceptions).
   */
  export const intercept: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPursuit.IIntercept> =
    {
      name: "intercept",
      family: run.name,
      interrupts: run.interrupts,
      yields: run.yields,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPursuit.IIntercept>,
      ): IAutoMovieMotionHumanActionPlan => {
        const leader: IAutoMovieMotionHumanPerformerReader = context.performer(
          context.params.target,
        );
        const gap: number =
          HumanProxemics.gap(
            "handing",
            context.body.measure,
            leader.body.measure,
          ) + approach.chest(context.body);
        const here: IAutoMovieVector3 = context.entry.posture.root;
        const runTo = (seconds: number): IAutoMovieMotionHumanActionPlan => {
          const there: IAutoMovieVector3 = leader.root(seconds).position;
          const far: number = Math.hypot(there.x - here.x, there.z - here.z);
          const short: number = Math.max(0, far - gap) / Math.max(far, 1e-9);
          return run.plan({
            ...context,
            params: {
              to: {
                x: here.x + (there.x - here.x) * short,
                y: 0,
                z: here.z + (there.z - here.z) * short,
              },
              face:
                (Math.atan2(there.x - here.x, there.z - here.z) * 180) /
                Math.PI,
              ...(context.params.pace === undefined
                ? {}
                : { pace: context.params.pace }),
            },
          });
        };
        let meets: number = context.start;
        let planned: IAutoMovieMotionHumanActionPlan = runTo(meets);
        for (let tries: number = 0; tries < 8; ++tries) {
          const next: number = context.start + planned.duration;
          if (Math.abs(next - meets) < 1 / 24) return planned;
          meets = next;
          planned = runTo(meets);
        }
        throw new HumanRefusal({
          kind: "reach",
          axis: "pace",
          value: context.params.pace ?? "run",
          reason: `this pace does not close on ${context.params.target}: after eight estimates the meeting is still moving, last at ${(meets - context.start).toFixed(2)} s`,
          fix: "choose a faster pace, start nearer, or head off a slower person",
        });
      },
    };

  /**
   * Run after a person to arm's length of where they will be, as a chase ends:
   * a chase runs, so it is a row of `intercept` (the run's `run` pace when none
   * is given), never a walk.
   */
  export const chase: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pursuit"]["chase"]
  > = AutoMovieMotionHumanActionRow.of("chase", intercept, {});

  /**
   * Seconds one glance back at a pursuer lasts before the eyes return ahead
   * (provisional: no study of fleeing gaze was read).
   */
  export const GLANCE: number = 0.6;

  /**
   * Glances back at a pursuer, as a layer for the performance: each turns the
   * eyes and the head toward the person's head and returns them ahead after
   * `GLANCE` seconds, leaving the trunk to the run.
   *
   * ```ts
   * layers: {
   *   a: [HumanPursuit.glances("b", [1.5, 3.2])];
   * }
   * ```
   *
   * @param at The person looked back at, by subject id.
   * @param seconds The film seconds at which a glance begins.
   * @returns The layer, for the fleeing performer's `layers`.
   */
  export function glances(
    at: string,
    seconds: readonly number[],
  ): IAutoMovieMotionHumanLayer {
    return HumanGaze.layer(
      seconds.map(
        (from: number): IAutoMovieMotionHumanGaze.ILayer => ({
          target: { kind: "person", subject: at, region: "forehead" },
          from,
          to: from + GLANCE,
          with: "head",
        }),
      ),
      "glances",
    );
  }

  /**
   * A search's stop: seconds stood at each place, and how far to each side the
   * look goes, degrees from straight ahead (provisional: no study of search
   * pauses was read).
   */
  export const SEARCH: Readonly<ISEARCHItem> = {
    pause: 2,
    aside: 60,
  };

  /**
   * Search a set of places: walk to each in turn and stand there a while, as a
   * pursuer who has lost sight of the quarry goes from place to place and stops
   * to look. Each stop is anchored `<name><index>` from 0, so `sweeps` can time
   * the looks to them and another action can sync to one.
   *
   * ```ts
   * const chain = HumanPursuit.search(HumanChain.subject("a"), [p, q], "seek");
   * new HumanPerformance({ ..., composition: chain.node, layers: { a: HumanPursuit.sweeps(2, "seek") } });
   * ```
   *
   * @param chain The searcher's chain so far.
   * @param places The floor points visited, in order, world metres.
   * @param name The stops' anchor prefix; `search` when absent.
   * @param pause Seconds stood at each place; `SEARCH.pause` when absent.
   * @returns The chain with a walk and a stand per place.
   */
  export function search<
    Chain extends {
      walk(params: { to: IAutoMovieVector3 }): Chain;
      stand(params: { hold: number }, anchor?: string): Chain;
    },
  >(
    chain: Chain,
    places: readonly IAutoMovieVector3[],
    name: string = "search",
    pause: number = SEARCH.pause,
  ): Chain {
    let out: Chain = chain;
    places.forEach((to: IAutoMovieVector3, index: number): void => {
      out = out.walk({ to }).stand({ hold: pause }, `${name}${index}`);
    });
    return out;
  }

  /**
   * The looks of a search, as layers for the searcher: at each stop the eyes
   * and the head turn `SEARCH.aside` degrees to the left for the first half of
   * the stop and to the right for the second, then return ahead. Each is
   * windowed on its stop's anchor, so it needs no film second.
   *
   * @param count How many stops the search has.
   * @param name The stops' anchor prefix given to `search`; `search` when
   *   absent.
   * @param pause Seconds stood at each place, as given to `search`.
   * @returns One scheduled layer per stop, for the searcher's `layers`.
   */
  export function sweeps(
    count: number,
    name: string = "search",
    pause: number = SEARCH.pause,
  ): IAutoMovieMotionHumanLayer.IScheduled[] {
    const to = (sign: number): IAutoMovieVector3 => ({
      x: 2 * sign * Math.sin((SEARCH.aside * Math.PI) / 180),
      y: 1.5,
      z: 2 * Math.cos((SEARCH.aside * Math.PI) / 180),
    });
    return Array.from(
      { length: count },
      (_: unknown, index: number): IAutoMovieMotionHumanLayer.IScheduled => ({
        from: { of: `${name}${index}` },
        to: { of: `${name}${index}`, event: "end" },
        layer: (
          window: IAutoMovieMotionHumanLayer.IWindow,
        ): IAutoMovieMotionHumanLayer =>
          HumanGaze.layer(
            [
              {
                target: { kind: "point", at: to(1), frame: "performer" },
                from: window.from,
                to: window.from + pause / 2,
                with: "head",
              },
              {
                target: { kind: "point", at: to(-1), frame: "performer" },
                from: window.from + pause / 2,
                to: window.to,
                with: "head",
              },
            ],
            `${name}Look${index}`,
          ),
      }),
    );
  }

  /**
   * How far a flight runs when no distance is given, hip heights (provisional:
   * about eight metres for an adult, out of a room's reach).
   */
  export const FLIGHT: number = 9;

  /**
   * Run straight away from a person: a run to the point `metres` from where the
   * performer stands, on the line from the person through the performer.
   * Glances back are a look performed over it.
   */
  export const flee: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPursuit.IFlee> =
    {
      name: "flee",
      family: run.name,
      interrupts: run.interrupts,
      yields: run.yields,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPursuit.IFlee>,
      ): IAutoMovieMotionHumanActionPlan => {
        const metres: number =
          context.params.metres ?? FLIGHT * context.body.measure.hipHeight;
        HumanBound.above("metres", metres, 0, "m");
        const threat: IAutoMovieVector3 = context.aim(
          { kind: "person", subject: context.params.from, region: "sternum" },
          context.start,
        ).point;
        const here: IAutoMovieVector3 = context.entry.posture.root;
        const away: number = Math.hypot(here.x - threat.x, here.z - threat.z);
        if (away < 1e-6)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "from",
            value: context.params.from,
            reason: `the performer stands where ${context.params.from} does, so no direction leads away`,
            fix: "flee from a person who stands somewhere else",
          });
        return run.plan({
          ...context,
          params: {
            to: {
              x: here.x + ((here.x - threat.x) / away) * metres,
              y: 0,
              z: here.z + ((here.z - threat.z) / away) * metres,
            },
            ...(context.params.pace === undefined
              ? {}
              : { pace: context.params.pace }),
          },
        });
      },
    };
}
