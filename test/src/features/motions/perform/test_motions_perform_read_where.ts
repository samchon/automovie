import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanPerformanceReadWhere } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/**
 * `HumanPerformanceReadWhere` locates an intent for a refusal: its performer,
 * its capability as the act, and its instance, one more than the person's
 * placed actions and overlays of the intent's id, its anchor when it has one.
 *
 * Scenarios, for a person whose two actions are a `wave` and a `stand` and
 * whose one overlay is a `wave`:
 *
 * 1. A `wave` is the third: one action and one overlay share its id.
 * 2. An intent anchored `stand` counts the anchor, not its capability: the
 *    second.
 * 3. An id nobody placed is the first.
 * 4. An unknown performer is the first, under their own name.
 */
export async function test_motions_perform_read_where(): Promise<void> {
  const { state } = await standingPerformanceState();
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const first: IAutoMovieMotionHumanSegment = person.segments[0]!;
  const second: IAutoMovieMotionHumanSegment = person.segments[1]!;
  const self: IAutoMovieMotionHumanPerformanceState = {
    ...state,
    people: new Map([
      [
        "actor",
        {
          ...person,
          segments: [
            { ...first, id: "wave" },
            { ...second, id: "stand" },
          ],
          overlays: [{ ...first, id: "wave", channels: [] }],
        },
      ],
    ]),
  };
  TestValidator.equals(
    "a third wave",
    HumanPerformanceReadWhere(self, { subject: "actor", capability: "wave" }),
    { performer: "actor", act: "wave", instance: 3 },
  );
  TestValidator.equals(
    "the anchor names the id",
    HumanPerformanceReadWhere(self, {
      subject: "actor",
      capability: "wave",
      anchor: "stand",
    }),
    { performer: "actor", act: "wave", instance: 2 },
  );
  TestValidator.equals(
    "an id nobody placed",
    HumanPerformanceReadWhere(self, { subject: "actor", capability: "bow" }),
    { performer: "actor", act: "bow", instance: 1 },
  );
  TestValidator.equals(
    "an unknown performer",
    HumanPerformanceReadWhere(self, { subject: "ghost", capability: "wave" }),
    { performer: "ghost", act: "wave", instance: 1 },
  );
}
