import {
  planDeliveredCut
} from "../../../../../packages/render/src/delivery/internal/planDeliveredCut";
import { TestValidator } from "@nestia/e2e";

/**
 * `planDeliveredCut` maps timeline entries onto the frames drawn.
 *
 * Scenarios:
 *
 * 1. Entries starting at 0 and 1 over frames at 0, 0.5, 1 and 1.5 are live in
 *    frames [0, 2) and [2, 4), and a start on a frame instant belongs to that
 *    frame.
 * 2. An entry passed over before any frame reaches it gets the empty range.
 * 3. A timeline with no entry is refused.
 */
export function test_render_delivery_plan_auto_movie_delivered_cut(): void {
  const entry = (
    index: number,
    start: number,
  ): {
    entry: number;
    shot: string;
    start: number;
    played: number;
    offset: number;
  } => ({
    entry: index,
    shot: `shot:${index}`,
    start,
    played: 1,
    offset: 0,
  });
  const times: number[] = [0, 0.5, 1, 1.5];
  TestValidator.equals(
    "two entries",
    planDeliveredCut({
      timeline: { entries: [entry(0, 0), entry(1, 1)], runtime: 2 },
      times,
    }).map((row: { liveFrames: [number, number] }): [number, number] => row.liveFrames),
    [
      [0, 2],
      [2, 4],
    ],
  );
  TestValidator.equals(
    "passed over",
    planDeliveredCut({
      timeline: {
        entries: [entry(0, 0), entry(1, 0.7), entry(2, 0.8)],
        runtime: 2,
      },
      times,
    }).map((row: { liveFrames: [number, number] }): [number, number] => row.liveFrames),
    [
      [0, 2],
      [2, 2],
      [2, 4],
    ],
  );
  TestValidator.error("no entries", (): void => {
    planDeliveredCut({ timeline: { entries: [], runtime: 0 }, times });
  });
}