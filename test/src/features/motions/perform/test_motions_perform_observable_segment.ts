import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";
import {
  observableHumanSegment
} from "../../../../../packages/motions/src/perform/internal/observableHumanSegment";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/**
 * `observableHumanSegment` admits a bone observation of a displayed second only
 * where nothing reads the whole pose: no held prop, no stopped weapon and no
 * entering offset still decaying.
 *
 * Scenarios, on the standing fixture's first stand entered by an inertialized
 * cut at 2 s blending 0.5 s:
 *
 * 1. The plain segment is observable at its two tested seconds.
 * 2. Within the blend (2.4 s) it is not; at its end (2.5 s) and after it is.
 * 3. A redirect blends no offset and is observable inside its blend.
 * 4. A held prop or a stopped weapon makes no second observable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names observation decisions for a plain segment, an inertialized or redirected entry, and reads owned by holds or weapon stops.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the observation gate on standing segment variants with explicit transition duration, holds, and stops. It compares sentinel seconds inside, at the end, and after the inertialized entry.
 * @evidence contracts/development/testing.md#independent-expectations The 0.5 s blend beginning at 2 s owns 2.4 s, and releases the pose reader at 2.5 s. A redirect at the same interval is observable at 2.2 s. The plain case and the added hold and stop distinguish why direct bone observation succeeds or yields.
 */
export async function test_motions_perform_observable_segment(): Promise<void> {
  const { state } = await standingPerformanceState();
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const plain: IAutoMovieMotionHumanSegment = {
    ...person.segments[0]!,
    transition: undefined,
  };
  const free: IAutoMovieMotionHumanSegment.IPerson = {
    ...person,
    holds: [],
    stops: new Map(),
  };

  // 1. Nothing reads the whole pose.
  TestValidator.predicate(
    "an action without a transition",
    observableHumanSegment(free, plain, 0) &&
      observableHumanSegment(free, plain, 2.2),
  );

  // 2. An inertialized entry.
  const entered: IAutoMovieMotionHumanSegment = {
    ...plain,
    transition: { kind: "inertialize", blend: 0.5, source: plain, cut: 2 },
  };
  TestValidator.predicate(
    "the decaying offset reads the whole pose",
    !observableHumanSegment(free, entered, 2.4) &&
      observableHumanSegment(free, entered, 2.5) &&
      observableHumanSegment(free, entered, 2.7),
  );

  // 3. A redirect.
  TestValidator.predicate(
    "a redirect leaves no offset",
    observableHumanSegment(
      free,
      { ...entered, transition: { ...entered.transition!, kind: "redirect" } },
      2.2,
    ),
  );

  // 4. A hold or a stop.
  TestValidator.predicate(
    "a hold or a stop reads the whole pose",
    !observableHumanSegment(
      {
        ...free,
        holds: [
          {
            side: "right",
            prop: "cup",
            fingers: {},
            source: plain,
            from: 0,
            until: 1,
          },
        ],
      },
      plain,
      0.5,
    ) &&
      !observableHumanSegment(
        { ...free, stops: new Map([["blade", 1]]) },
        plain,
        0.5,
      ),
  );
}
