import type { IAutoMovieVector3 } from "@automovie/interface";

import { run } from "../actions/run";
import { HumanGaze } from "../everyday/HumanGaze";
import { HumanProxemics } from "../everyday/HumanProxemics";
import { approach } from "../everyday/approach";
import { HumanActionRow } from "../law/HumanActionRow";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanLayer } from "../law/IHumanLayer";

/**
 * Travel relative to another person, each a row of `approach`: the
 * composition gives the person as the target. Register the ones a film
 * uses.
 *
 * `follow`, `escort` and `chase` go where the person goes: the stop is
 * taken where the person comes to rest, read from their placed actions, and
 * the pursuer sets off late enough to arrive just after them. So the person
 * pursued is composed before the pursuer (`leader.with(follower)`), and a
 * pursuit composed the other way round is refused, saying so. First pass:
 * the pursuer does not match the person's speed on the way or keep a gap
 * through their turns. `confront` steps up to a person where they stand.
 *
 * `intercept` heads a moving person off, running to where they will be.
 * `flee` is the opposite travel: a run straight away from a person, read
 * where they are when it begins. It is a law of its own over the run,
 * since its destination comes from the person and not from the scene.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanPursuit {
  /** Come up behind a person at the social distance, as a follower closes the gap. */
  export const follow = HumanActionRow.of("follow", approach, {
    side: "behind",
    at: "social",
    track: "pace",
  });

  /** Come to a person's left side at the personal distance, as an escort takes station. */
  export const escort = HumanActionRow.of("escort", approach, {
    side: "left",
    at: "personal",
    track: "pace",
  });

  /** Close on a person fast, to arm's length, as a chase ends. */
  export const chase = HumanActionRow.of("chase", approach, {
    pace: "fast",
    at: "handing",
    track: true,
  });

  /** Step up face to face, as a confrontation begins. */
  export const confront = HumanActionRow.of("confront", approach, {
    side: "front",
    at: "faceToFace",
  });

  /** Parameters of an interception. */
  export interface IIntercept {
    /** The person headed off, by subject id; composed before the performer. */
    target: string;

    /** The pace; `run` when absent. */
    pace?: run.IParams["pace"];
  }

  /**
   * Head a moving person off: a run to where they will be when the runner
   * gets there, stopping at arm's length of that place (the handing gap of
   * `HumanProxemics`), not to where they are when it begins.
   *
   * The meeting instant is the one at which the run to the person's place
   * at that instant ends at that instant, found by planning the run to
   * where they are at each estimate and taking its end as the next, up to
   * eight times, to within one 24th of a second. Their place is read from
   * their placed actions, so they are composed before the runner. A person
   * the pace does not close on is refused with the last estimate. First
   * pass: one straight run, so the bearing to the person is held only as
   * far as both go straight (Fajen and Warren 2007 describe the curved
   * approach of real interceptions).
   */
  export const intercept: IHumanActionLaw<IIntercept> = {
    name: "intercept",
    family: run.name,
    interrupts: run.interrupts,
    yields: run.yields,
    plan: (context: IHumanActionContext<IIntercept>): IHumanActionPlan => {
      const leader: IHumanActionContext.IPerformer = context.performer(
        context.params.target,
      );
      const gap: number =
        HumanProxemics.gap(
          "handing",
          context.body.measure,
          leader.body.measure,
        ) + approach.chest(context.body);
      const here: IAutoMovieVector3 = context.entry.posture.root;
      const runTo = (seconds: number): IHumanActionPlan => {
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
              (Math.atan2(there.x - here.x, there.z - here.z) * 180) / Math.PI,
            ...(context.params.pace === undefined
              ? {}
              : { pace: context.params.pace }),
          },
        });
      };
      let meets: number = context.start;
      let planned: IHumanActionPlan = runTo(meets);
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

  /** Parameters of a flight from a person. */
  export interface IFlee {
    /** The person fled from, by subject id. */
    from: string;

    /** How far to run, metres; `FLIGHT` hip heights when absent. */
    metres?: number;

    /** The pace; `run` when absent. */
    pace?: run.IParams["pace"];
  }

  /** Seconds one glance back at a pursuer lasts before the eyes return ahead (provisional: no study of fleeing gaze was read). */
  export const GLANCE: number = 0.6;

  /**
   * Glances back at a pursuer, as a layer for the performance: each turns
   * the eyes and the head toward the person's head and returns them ahead
   * after `GLANCE` seconds, leaving the trunk to the run.
   *
   * ```ts
   * layers: { a: [HumanPursuit.glances("b", [1.5, 3.2])] }
   * ```
   *
   * @param at The person looked back at, by subject id.
   * @param seconds The film seconds at which a glance begins.
   * @returns The layer, for the fleeing performer's `layers`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a glance turns, how long it lasts, what it leaves alone and where the layer goes.
   * @evidence contracts/development/implementation.md#principled-implementation A gaze layer over the run: a layer adds to whatever the body does and takes no part of it, so the run's steps are unchanged; the head alone is recruited because the trunk carries the run.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One map over the instants.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The instants are the composition's: how often a fleeing person looks back has no cited rate, so none is invented.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the glances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanGaze.layer`; nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the layer returned.
   */
  export function glances(
    at: string,
    seconds: readonly number[],
  ): IHumanLayer {
    return HumanGaze.layer(
      seconds.map(
        (from: number): HumanGaze.ILayer => ({
          target: { kind: "person", subject: at, region: "forehead" },
          from,
          to: from + GLANCE,
          with: "head",
        }),
      ),
      "glances",
    );
  }

  /** A search's stop: seconds stood at each place, and how far to each side the look goes, degrees from straight ahead (provisional: no study of search pauses was read). */
  export const SEARCH: Readonly<{ pause: number; aside: number }> = {
    pause: 2,
    aside: 60,
  };

  /**
   * Search a set of places: walk to each in turn and stand there a while,
   * as a pursuer who has lost sight of the quarry goes from place to place
   * and stops to look. Each stop is anchored `<name><index>` from 0, so
   * `sweeps` can time the looks to them and another action can sync to one.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is appended, how the stops are named and what reads the names.
   * @evidence contracts/development/implementation.md#principled-implementation A composition of the walk and the stand the vocabulary has: a search owns no motion of its own, so each leg is planned, refused and cut as a walk is.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop over the places.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The chain is taken by the two methods it must have, so an extended chain keeps its own type.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the places.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function search<
    Chain extends {
      walk(params: { to: IAutoMovieVector3 }): Chain;
      stand(params: { seconds: number }, anchor?: string): Chain;
    },
  >(
    chain: Chain,
    places: readonly IAutoMovieVector3[],
    name: string = "search",
    pause: number = SEARCH.pause,
  ): Chain {
    let out: Chain = chain;
    places.forEach((to: IAutoMovieVector3, index: number): void => {
      out = out.walk({ to }).stand({ seconds: pause }, `${name}${index}`);
    });
    return out;
  }

  /**
   * The looks of a search, as layers for the searcher: at each stop the
   * eyes and the head turn `SEARCH.aside` degrees to the left for the
   * first half of the stop and to the right for the second, then return
   * ahead. Each is windowed on its stop's anchor, so it needs no film
   * second.
   *
   * @param count How many stops the search has.
   * @param name The stops' anchor prefix given to `search`; `search` when absent.
   * @param pause Seconds stood at each place, as given to `search`.
   * @returns One scheduled layer per stop, for the searcher's `layers`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each look turns, when, and how it is timed without film seconds.
   * @evidence contracts/development/implementation.md#principled-implementation Gaze layers over the stand, windowed by the stop's own start and end, with targets in the performer's frame two metres off at head height, so the look goes with the body wherever the stop is.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One scheduled layer per stop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angle and the split of the stop are provisional and named in `SEARCH`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the stops.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanGaze.layer`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the layers returned.
   */
  export function sweeps(
    count: number,
    name: string = "search",
    pause: number = SEARCH.pause,
  ): IHumanLayer.IScheduled[] {
    const to = (sign: number): IAutoMovieVector3 => ({
      x: 2 * sign * Math.sin((SEARCH.aside * Math.PI) / 180),
      y: 1.5,
      z: 2 * Math.cos((SEARCH.aside * Math.PI) / 180),
    });
    return Array.from(
      { length: count },
      (_: unknown, index: number): IHumanLayer.IScheduled => ({
        from: { of: `${name}${index}` },
        to: { of: `${name}${index}`, event: "end" },
        layer: (window: IHumanLayer.IWindow): IHumanLayer =>
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

  /** How far a flight runs when no distance is given, hip heights (provisional: about eight metres for an adult, out of a room's reach). */
  export const FLIGHT: number = 9;

  /**
   * Run straight away from a person: a run to the point `metres` from where
   * the performer stands, on the line from the person through the
   * performer. Glances back are a look performed over it.
   */
  export const flee: IHumanActionLaw<IFlee> = {
    name: "flee",
    family: run.name,
    interrupts: run.interrupts,
    yields: run.yields,
    plan: (context: IHumanActionContext<IFlee>): IHumanActionPlan => {
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
