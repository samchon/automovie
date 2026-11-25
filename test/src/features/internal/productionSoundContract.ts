import type {
  IAutoMovieShotContract,
  IAutoMovieShotEventContract,
} from "@automovie/interface";

import { shotContractFixture } from "./shotContractFixture";

/**
 * Seven declared events over an actor, a formation and an instance set.
 *
 * `trimmed` samples past the film's own cut, which is what lets a scenario see that planning omits it rather than rounding it into range.
 *
 * Behavior: Constructs the seven original sound event declarations whose actual planner observations are asserted by the sound and viseme entries.
 * Expectation basis: These declarations are authored inputs, not independently measured outputs; trim membership and event identities are expected from the supported clock/subject joins.
 * Cases: Keeps actor, formation and instance subjects, mixed transition subjects and an event beyond the authored trim; missing/current-contract faults are introduced by the viseme entry.
 * Execution: The existing owning entries call productionSoundContract during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function productionSoundContract(): IAutoMovieShotContract {
  return shotContractFixture(
    "sound-shot",
    EVENTS.map(
      (
        [id, kind, subject]: [
          string,
          IAutoMovieShotEventContract["kind"],
          string,
        ],
        index: number,
      ): IAutoMovieShotEventContract => ({
        id,
        kind,
        window: { from: index * 0.25, to: index * 0.25 + 0.2 },
        subjects: id === "transition" ? ["actor", "formation"] : [subject],
        predicates: [],
      }),
    ),
  );
}

/** Each event's id, kind and subject, in declaration order. */
const EVENTS: ReadonlyArray<
  [string, IAutoMovieShotEventContract["kind"], string]
> = [
  ["contact", "contact", "actor"],
  ["arrival", "arrival", "formation"],
  ["impact", "contact", "instances"],
  ["break", "break", "actor"],
  ["reveal", "reveal", "formation"],
  ["transition", "transition", "actor"],
  ["trimmed", "transition", "actor"],
];
