import { TestValidator } from "@nestia/e2e";

import { HUMAN_LEXICON } from "../../../../../packages/motions/src/lexicon/internal/HUMAN_LEXICON";
import { canTraceHumanPreparation } from "../../../../../packages/motions/src/perform/internal/canTraceHumanPreparation";
import { humanPreparationReads } from "../../../../../packages/motions/src/perform/internal/humanPreparationReads";
import { prepareHumanPerformancePlans } from "../../../../../packages/motions/src/perform/internal/prepareHumanPerformancePlans";

interface ITestPlan {
  entryTime: number;
  context: object;
  plan: { prepare(): void };
}

interface ITestPerson {
  performer: { subject: string };
  segments: ITestPlan[];
  overlays: ITestPlan[];
}

/**
 * Reprepare native readers of a changed performer and refresh their reads.
 *
 * Scenarios:
 *
 * 1. Initial preparation visits every plan in cast order.
 * 2. A stop on the target reprepares the direct and transitive readers only.
 * 3. The reader switches targets, then follows the new target's flight change.
 * 4. An action can retain its anchor across preparation calls.
 * 5. Opaque callbacks use a complete pass even with an empty change set.
 * 6. A shipped registered row is traceable, and a new law of the same name stays
 *    on full preparation.
 * 7. Closing the operation releases anchor reads and ignores playback reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies initial, selective, changed-source, retained-anchor and opaque preparation.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the selective preparation owner on typed in-memory actors and records the prepare callbacks it invokes.
 * @evidence contracts/development/testing.md#independent-expectations Derives each sequence from the fixture's declared reads, transitive reach and original cast order.
 */
export function test_motions_perform_preparation_dependencies(): void {
  const state: { people: Map<string, ITestPerson> } = { people: new Map() };
  const observed: string[] = [];
  let target: string = "lead";
  function person(subject: string, read?: () => string): ITestPlan {
    const action: ITestPlan = {
      context: {},
      entryTime: 0,
      plan: {
        prepare(): void {
          observed.push(subject);
          if (read !== undefined)
            humanPreparationReads.performer(state, read());
        },
      },
    };
    state.people.set(subject, {
      performer: { subject },
      segments: [action],
      overlays: [],
    });
    return action;
  }
  person("lead");
  person("follow", (): string => target);
  person("third", (): string => "follow");
  person("other");
  const anchored: ITestPlan = person("anchor-reader");
  humanPreparationReads.begin(state);
  humanPreparationReads.retain(state, anchored.context, "other");

  const prepare: ReturnType<typeof prepareHumanPerformancePlans> =
    prepareHumanPerformancePlans(state, true);
  const whole: string[] = ["lead", "follow", "third", "other", "anchor-reader"];
  prepare();
  TestValidator.equals("initial cast", observed.splice(0), whole);

  target = "other";
  prepare(new Set(["lead"]));
  TestValidator.equals("following a stop", observed.splice(0), [
    "lead",
    "follow",
    "third",
  ]);
  prepare(new Set(["lead"]));
  TestValidator.equals("withdrawal after a changed read", observed.splice(0), [
    "lead",
  ]);
  prepare(new Set(["other"]));
  TestValidator.equals(
    "following a flight and a retained anchor",
    observed.splice(0),
    ["follow", "third", "other", "anchor-reader"],
  );

  prepareHumanPerformancePlans(state, false)(new Set());
  TestValidator.equals(
    "opaque callbacks use the original pass",
    observed,
    whole,
  );

  const jab = Object.values(HUMAN_LEXICON)
    .flat()
    .find((law) => law.name === "jab")!;
  TestValidator.predicate(
    "registered shipped row",
    canTraceHumanPreparation({ laws: [jab] }),
  );
  TestValidator.predicate(
    "a same-name registration can use a different callback",
    !canTraceHumanPreparation({ laws: [{ ...jab }] }),
  );

  humanPreparationReads.end(state);
  humanPreparationReads.retain(state, anchored.context, "other");
  TestValidator.predicate(
    "playback cannot retain preparation anchors",
    humanPreparationReads.anchors(state, anchored.context) === undefined,
  );
}
