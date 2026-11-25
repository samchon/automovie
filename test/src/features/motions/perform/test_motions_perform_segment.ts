import type { IAutoMovieMotionHumanActionPlan } from "@automovie/interface";
import { HumanSegment, prepareHumanSegment } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";
import { throwsError } from "../../internal/throwsError";

/**
 * `HumanSegment`'s small readers: a weapon's key among its person's stops,
 * whether a plan drives a hand, and a share of a plan from a share or an event
 * name.
 *
 * Scenarios:
 *
 * 1. A weapon's key is the action's order and the weapon's id.
 * 2. A plan drives a hand it holds a contact window on or names, and no other.
 * 3. A share is itself; an event name gives its share; an unknown name is refused.
 */
function scenario_test_motions_perform_segment(): void {
  // 1. The stop key.
  TestValidator.equals(
    "the weapon key",
    HumanSegment.weapon({ index: 2 }, "fist"),
    "2:fist",
  );

  // 2. Driven hands.
  const gripping: IAutoMovieMotionHumanActionPlan = syntheticHumanPlan({
    duration: 1,
    contacts: [
      {
        part: "leftHand",
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ],
    hands: ["right"],
  });
  const idle: IAutoMovieMotionHumanActionPlan = syntheticHumanPlan({
    duration: 1,
  });
  TestValidator.predicate(
    "a plan drives the hands it grips with or names",
    HumanSegment.drives(gripping, "left") &&
      HumanSegment.drives(gripping, "right") &&
      !HumanSegment.drives(idle, "left"),
  );

  // 3. Shares.
  const timed: Pick<IAutoMovieMotionHumanActionPlan, "events"> = {
    events: [{ name: "impact", share: 0.4 }],
  };
  TestValidator.predicate(
    "a share from a share or an event",
    HumanSegment.share(0.25, timed) === 0.25 &&
      HumanSegment.share("impact", timed) === 0.4 &&
      throwsError((): number => HumanSegment.share("release", timed)),
  );
}

/** The action spanning film seconds 2 to 3. */
const ACTION: prepareHumanSegment.ISpan = { entryTime: 2, end: 3 };

/** The action before it, 0 to 2. */
const BEFORE: prepareHumanSegment.ISpan = { entryTime: 0, end: 2 };

/**
 * `prepareHumanSegment.ridden` tells whether a hold or an overlay rides an
 * action, its fade (`HumanSegment.FADE`) included, so the action's record
 * carries an anchor course.
 *
 * The action spans 2 to 3 s; holds and overlays sit around it.
 *
 * Scenarios:
 *
 * 1. Nothing rides an action without holds or overlays.
 * 2. A hold the action took itself does not ride it; one taken before and held
 *    into it does.
 * 3. A hold released just inside the fade before the action rides it; one released
 *    just past it does not.
 * 4. An overlay opening inside the action rides it; one opening after its end does
 *    not.
 */
function scenario_test_motions_perform_segment_ridden(): void {
  // 1. Nothing.
  TestValidator.equals(
    "no rider",
    prepareHumanSegment.ridden({ holds: [], overlays: [] }, ACTION),
    false,
  );

  // 2. Own and earlier holds.
  TestValidator.equals(
    "its own hold does not ride it",
    prepareHumanSegment.ridden(
      { holds: [{ source: ACTION, from: 2.2, until: 2.8 }], overlays: [] },
      ACTION,
    ),
    false,
  );
  TestValidator.equals(
    "an earlier hold held into it rides it",
    prepareHumanSegment.ridden(
      { holds: [{ source: BEFORE, from: 1, until: 2.5 }], overlays: [] },
      ACTION,
    ),
    true,
  );

  // 3. The fade.
  const hold = (until: number): prepareHumanSegment.IRiders => ({
    holds: [{ source: BEFORE, from: 0.5, until }],
    overlays: [],
  });
  TestValidator.predicate(
    "a hold rides through its fade only",
    prepareHumanSegment.ridden(hold(2 - HumanSegment.FADE / 2), ACTION) &&
      !prepareHumanSegment.ridden(hold(2 - 2 * HumanSegment.FADE), ACTION),
  );

  // 4. Overlays.
  TestValidator.predicate(
    "an overlay rides inside the span only",
    prepareHumanSegment.ridden(
      { holds: [], overlays: [{ entryTime: 2.5, end: 4 }] },
      ACTION,
    ) &&
      !prepareHumanSegment.ridden(
        { holds: [], overlays: [{ entryTime: 3.5, end: 4 }] },
        ACTION,
      ),
  );
}

/** HumanSegment, a performance segment and a ridden one, each scenario below. */
export function test_motions_perform_segment(): void {
  scenario_test_motions_perform_segment();
  scenario_test_motions_perform_segment_ridden();
}
