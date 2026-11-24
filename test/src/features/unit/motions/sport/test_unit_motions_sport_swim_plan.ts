import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSwim,
} from "@automovie/interface";
import { swim } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `swim.plan` swims whole cycles: the front crawl at `swim.CYCLE` (1.4 s) a
 * cycle, the right arm entering at each cycle's start and the breath at the
 * middle of the recovery after the `PULL` (60%) share, `(i + 0.8) · 1.4` s;
 * treading water at 1 s a cycle.
 *
 * The average man stands at the origin.
 *
 * Scenarios:
 *
 * 1. Two crawl cycles last 2.8 s; the second right entry comes at 1.4 s and the
 *    first breath at 1.12 s.
 * 2. Four cycles of treading water last 4 s, one event a cycle.
 * 3. No cycle is refused.
 */
export async function test_unit_motions_sport_swim_plan(): Promise<void> {
  // Whole body: the strokes place both arms and legs on goals the full rig
  // resolves.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (
    params: IAutoMovieMotionHumanSwim.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    swim.plan(motionActionContext(body, params));
  const crawl: IAutoMovieMotionHumanActionPlan = plan({
    kind: "frontCrawl",
    count: 2,
  });
  const at = (name: string): number =>
    crawl.duration *
    crawl.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;
  TestValidator.predicate(
    "the crawl's cycles",
    nclose(crawl.duration, 2.8, 1e-9) &&
      nclose(at("entryRight2"), 1.4, 1e-9) &&
      nclose(at("breath1"), 1.12, 1e-9),
  );
  const tread: IAutoMovieMotionHumanActionPlan = plan({
    kind: "treadWater",
    count: 4,
  });
  TestValidator.predicate(
    "treading water",
    nclose(tread.duration, 4, 1e-9) &&
      tread.events.filter((e: IAutoMovieMotionEvent): boolean =>
        e.name.startsWith("cycle"),
      ).length === 4,
  );
  TestValidator.predicate(
    "no cycle",
    throwsError(() => plan({ kind: "frontCrawl", count: 0 })),
  );
}
