import type { AudioMix } from "../audio/AudioMix";
import { BoutScript } from "../bout/BoutScript";
import type { Footsteps } from "../bout/Footsteps";
import { RefereeCues } from "../bout/RefereeCues";
import { Strike } from "../bout/Strike";
import { FilmPlan } from "./FilmPlan";

/**
 * The complete cue list of the film: bells, referee voice, contacts, misses, footsteps, breath and falls.
 *
 * @evidence contracts/common.md#implementation-and-ownership Built from the same tables that drive the picture (BoutScript, RefereeCues, the footstep schedules) plus the measured contact and mat receipts, so every impact sound has a displayed contact and every footstep sound a displayed landing. A planned contact without a receipt still emits its event; AudioMix then omits the sound.
 * @evidence contracts/common.md#authoring-interface Film seconds. Contact event ids are `contact:<action id>` and must equal the receipt ids; mat events are `fall:hip` and `fall:shoulder`.
 */
export namespace FilmEvents {
  /**
   * Relation of an action's planned contact, or null for an evasion.
   *
   * @evidence contracts/common.md#implementation-and-ownership Maps the defence to the contact class the mixer expects; evasions have none.
   * @evidence contracts/common.md#authoring-interface Returns null for slips and weaves.
   */
  export function relation(
    action: BoutScript.Action,
  ): AudioMix.Contact["relation"] | null {
    switch (action.defense) {
      case "slip":
      case "weave":
        return null;
      case "check":
        return "shin-check";
      case "hit":
        return BoutScript.specs[action.technique].target === "head"
          ? "head"
          : "body";
      case "parry":
      case "cover":
      case "catch":
      case "block":
        return "guard";
    }
  }

  /**
   * Build every event of the film.
   *
   * @evidence contracts/common.md#implementation-and-ownership Collects bells, referee speech and counts, per-action attempts with contact or miss events, every scheduled footstep landing and breathing beds, sorted by time.
   * @evidence contracts/common.md#authoring-interface Film seconds; contact ids are `contact:<action id>`.
   */
  export function build(input: {
    steps: Readonly<Record<FilmPlan.ActorId, Footsteps>>;
  }): FilmPlan.Event[] {
    const events: FilmPlan.Event[] = [
      { id: "ambience", seconds: 0, kind: "ambience", actorId: "referee" },
      { id: "bell:start", seconds: 0, kind: "bell", actorId: "referee" },
      {
        id: "bell:end",
        seconds: FilmPlan.endBellSeconds,
        kind: "bell",
        actorId: "referee",
      },
      {
        id: "celebration",
        seconds: FilmPlan.celebrationSeconds,
        kind: "celebration",
        actorId: "a",
      },
      {
        id: "touch",
        seconds: 1.0,
        kind: "touch",
        actorId: "a",
        targetId: "b",
        actionId: "touch",
        relation: "guard",
        requiresContact: "touch",
      },
      { id: "fall:hip", seconds: 151.0, kind: "fall", actorId: "b" },
      { id: "fall:shoulder", seconds: 151.25, kind: "fall", actorId: "b" },
    ];
    for (const [onset, duration, phrase] of RefereeCues.speech)
      events.push(
        phrase === "decision"
          ? {
              id: `speech:${phrase}`,
              seconds: onset,
              kind: "decision",
              actorId: "referee",
              durationSeconds: duration,
            }
          : {
              id: `speech:${phrase}`,
              seconds: onset,
              kind: "speech",
              actorId: "referee",
              speech: phrase,
              durationSeconds: duration,
            },
      );
    RefereeCues.counts.forEach((onset: number, index: number): void => {
      events.push({
        id: `count:${index + 1}`,
        seconds: onset,
        kind: "count",
        actorId: "referee",
        count: index + 1,
      });
    });
    for (const action of BoutScript.actions) {
      const target: FilmPlan.ActorId = action.actor === "a" ? "b" : "a";
      const [start] = Strike.window(action);
      events.push({
        id: `attempt:${action.id}`,
        seconds: Math.max(0, start + (action.at - start) * 0.5),
        kind: "attempt",
        actorId: action.actor,
        targetId: target,
        actionId: action.id,
      });
      const kind: AudioMix.Contact["relation"] | null = relation(action);
      if (kind === null)
        events.push({
          id: `miss:${action.id}`,
          seconds: action.at,
          kind: "miss",
          actorId: action.actor,
          targetId: target,
          actionId: action.id,
        });
      else
        events.push({
          id: `contact:${action.id}`,
          seconds: action.at,
          kind: "contact",
          actorId: action.actor,
          targetId: target,
          actionId: action.id,
          relation: kind,
          requiresContact: action.id,
        });
    }
    for (const [actor, schedule] of Object.entries(input.steps) as [
      FilmPlan.ActorId,
      Footsteps,
    ][])
      for (const step of schedule.steps)
        if (step.end > 0 && step.end < FilmPlan.duration)
          events.push({
            id: `step:${actor}:${step.side}:${step.end.toFixed(4)}`,
            seconds: step.end,
            kind: "step",
            actorId: actor,
          });

    // Breathing beds: steady during the bout, heavier after the knockout for A.
    for (const actor of ["a", "b"] as const)
      for (
        let seconds: number = actor === "a" ? 0.5 : 3.5;
        seconds < FilmPlan.duration - 1;
        seconds += 6
      )
        events.push({
          id: `breath:${actor}:${seconds}`,
          seconds,
          kind: "breath",
          actorId: actor,
          durationSeconds: Math.min(6, FilmPlan.duration - seconds),
        });
    return events.sort(
      (x: FilmPlan.Event, y: FilmPlan.Event): number =>
        x.seconds - y.seconds || (x.id < y.id ? -1 : 1),
    );
  }
}
