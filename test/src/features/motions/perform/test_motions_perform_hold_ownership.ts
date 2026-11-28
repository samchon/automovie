import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  HumanPerformanceContacts
} from "../../../../../packages/motions/src/perform/internal/HumanPerformanceContacts";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/**
 * A hand remains assigned to its held prop until a same-hand grip takes over.
 * When a cut removes that takeover, it restores the prior hold and removes
 * any new hold begun after the cut.
 *
 * Scenarios:
 *
 * 1. An action's local grip opens before its placed entry. The old hold ends
 *    at entry, and its new hold begins at film second 3.
 * 2. A cut at the new hold's start keeps it. A cut just before drops it. One
 *    before entry also restores the old hold and clears its takeover fields.
 * 3. Trying to use a hand holding a prop for another object reports its side.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenario follows a same-hand takeover from placed entry through exact hold and rollback boundaries, and checks a conflicting object's refusal.
 * @evidence contracts/development/testing.md#behavioral-verification The hold and cut owners mutate typed placed hold records inside a staged performance. The test reads their identity, end time, ownership fields and restoration, then checks the refusal's hand and offered alternative.
 * @evidence contracts/development/testing.md#independent-expectations The contact opens locally at 2 + 0.25·2 = 2.5 s but entry clips takeover to 2.75 s. The new hold starts at 2 + 0.5·2 = 3 s, so the cuts at 3, 2.875, and 2.5 s keep it, remove it, and restore the prior hold respectively.
 */
export async function test_motions_perform_hold_ownership(): Promise<void> {
  const { state } = await standingPerformanceState();
  const person: IAutoMovieMotionHumanSegment.IPerson = state.people.get("actor")!;
  const source: IAutoMovieMotionHumanSegment = person.segments[0]!;
  const held: IAutoMovieMotionHumanSegment.IHeld = {
    side: "left",
    prop: "cup",
    source,
    from: 0,
    until: Infinity,
    fingers: {},
  };
  const grip: IAutoMovieMotionHumanContactWindow = {
    part: "leftHand",
    kind: "grip",
    from: 0.25,
    to: 0.75,
    support: { kind: "prop", subject: "cup" },
  };
  const take: IAutoMovieMotionHumanSegment = {
    ...source,
    entry: 7,
    name: "adjust",
    start: 2,
    entryTime: 2.75,
    end: 3.5,
    plan: {
      ...source.plan,
      duration: 2,
      contacts: [grip],
      holds: [
        { side: "left", prop: "cup", from: 0.5 },
        { side: "right", prop: "spoon", from: 0.875 },
      ],
    },
  };
  person.holds.push(held);
  HumanPerformanceContacts.hold(person, take, true);
  const next: IAutoMovieMotionHumanSegment.IHeld = person.holds[1]!;
  TestValidator.predicate(
    "the overlay takes the existing grip at its actual entry",
    held.until === 2.75 && held.takenBy === 7 && held.riding === true &&
      person.holds.length === 2 && next.source === take &&
      next.from === 3 && next.until === Infinity,
  );

  HumanPerformanceContacts.cutHolds(person, 7, 3);
  TestValidator.predicate("the exact endpoint keeps the new hold", person.holds.includes(next));
  HumanPerformanceContacts.cutHolds(person, 7, 2.875);
  TestValidator.predicate(
    "cutting before the new hold keeps the earlier takeover",
    !person.holds.includes(next) && person.holds.includes(held) && held.until === 2.75,
  );
  HumanPerformanceContacts.cutHolds(person, 7, 2.5);
  TestValidator.predicate(
    "cutting before entry restores the original grip",
    held.until === Infinity && held.takenBy === undefined && held.riding === undefined,
  );

  let refused: boolean = false;
  try {
    HumanPerformanceContacts.hold(person, {
      ...take,
      plan: { ...take.plan, contacts: [{ ...grip, support: { kind: "prop", subject: "book" } }] },
    }, false);
  } catch (error: unknown) {
    refused = error instanceof AutoMovieMotionHumanRefusal && error.axis === "hand" && error.value === "left" &&
      error.feasible?.kind === "alternatives" && error.feasible.values.join() === "right";
  }
  TestValidator.predicate("the held hand refuses another object", refused);
}
