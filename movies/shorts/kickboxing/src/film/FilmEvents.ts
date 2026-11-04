import type { FilmPlan } from "./FilmPlan";

/**
 * The film's fixed audible intentions, separate from measured interaction results.
 * @evidence contracts/common.md#implementation-and-ownership Builds one immutable manifest from the consumed exchange and route identities plus the shared official clock. Actual case onsets and admitted touchdowns replace nominal intentions in FilmRuntime; impact sounds require separate actual contact receipts.
 * @evidence contracts/common.md#authoring-interface All times are absolute film seconds. This namespace schedules speech, count and conditional sound intentions without creating hits or measuring physical motion. Both Viewer and export consume the runtime-resolved collection.
 */
export namespace FilmEvents {
  /**
   * Build fixed cues without executing geometry, native audio or another clock.
   * @evidence contracts/common.md#implementation-and-ownership Maps the given placements to stable action/cue IDs and retains explicitly conditional contact intentions. Ten ordered count events use the supplied open-count time, and complete decision speech precedes the closing bell. No missing actual contact is replaced by these entries.
   * @evidence contracts/common.md#authoring-interface Returns frozen owned events in chronological order. Contact cue times remain intentions until actual receipts resolve them. Delivery onsets and footsteps are emitted only by the actual module and admitted route consumers in FilmRuntime.
   */
  export function build(
    exchanges: readonly Readonly<FilmPlan.Exchange>[],
    clock: { countStart: number; decisionSeconds: number },
  ): readonly Readonly<FilmPlan.Event>[] {
    const events: FilmPlan.Event[] = [
      { id: "opening-bell", seconds: 0, kind: "bell", actorId: "referee" },
      {
        id: "ringside-ambience",
        seconds: 0,
        kind: "ambience",
        actorId: "referee",
      },
      ...Array.from(
        { length: 30 },
        (_: unknown, index: number): FilmPlan.Event[] =>
          (["a", "b"] as const).map(
            (actorId: "a" | "b"): FilmPlan.Event => ({
              id: `${actorId}-breath-${index}`,
              seconds: index * 6,
              durationSeconds: 6,
              kind: "breath",
              actorId,
            }),
          ),
      ).flat(),
      {
        id: "referee-fight",
        seconds: 0.22,
        kind: "speech",
        actorId: "referee",
        speech: "fight",
        durationSeconds: 0.8,
      },
      {
        id: "opening-touch",
        seconds: 1,
        kind: "touch",
        actorId: "a",
        targetId: "b",
        actionId: "opening-touch",
        relation: "guard",
        requiresContact: "opening-touch",
      },
      ...exchanges.flatMap(
        (exchange: Readonly<FilmPlan.Exchange>): FilmPlan.Event[] => {
          const actionIds: string[] =
            exchange.technique === "one-two"
              ? [`${exchange.id}:jab`, `${exchange.id}:cross`]
              : [exchange.id];
          return actionIds.flatMap(
            (actionId: string, index: number): FilmPlan.Event[] => [
              {
                id: `${actionId}:contact`,
                seconds:
                  exchange.impactSeconds ??
                  exchange.start + 0.25 + index * 0.25,
                kind: "contact",
                actorId: exchange.actorId,
                targetId: exchange.actorId === "a" ? "b" : "a",
                actionId,
                requiresContact: actionId,
                ...(exchange.impactSeconds !== undefined
                  ? { relation: "head" as const }
                  : {}),
              },
            ],
          );
        },
      ),
      ...Array.from(
        { length: 10 },
        (_: unknown, index: number): FilmPlan.Event => ({
          id: `count-${index + 1}`,
          seconds: clock.countStart + index + 1,
          kind: "count",
          actorId: "referee",
          count: index + 1,
          durationSeconds: 0.85,
        }),
      ),
      {
        id: "referee-down",
        seconds: 150.3,
        kind: "speech",
        actorId: "referee",
        speech: "down",
        durationSeconds: 0.65,
      },
      {
        id: "referee-neutral",
        seconds: 151.4,
        kind: "speech",
        actorId: "referee",
        speech: "neutral",
        durationSeconds: 1.7,
      },
      { id: "down-hip", seconds: 150.9, kind: "fall", actorId: "b" },
      { id: "down-shoulder", seconds: 151.2, kind: "fall", actorId: "b" },
      {
        id: "knockout-decision",
        seconds: clock.decisionSeconds,
        durationSeconds: 2.3,
        kind: "decision",
        actorId: "referee",
      },
      {
        id: "closing-bell",
        seconds: 170.1,
        kind: "bell",
        actorId: "referee",
      },
      {
        id: "winner-celebration",
        seconds: 168.1,
        kind: "celebration",
        actorId: "a",
      },
    ];
    return Object.freeze(
      events
        .sort(
          (a: FilmPlan.Event, b: FilmPlan.Event): number =>
            a.seconds - b.seconds,
        )
        .map(
          (event: FilmPlan.Event): Readonly<FilmPlan.Event> =>
            Object.freeze(event),
        ),
    );
  }
}
