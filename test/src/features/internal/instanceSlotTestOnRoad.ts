import type { IAutoMovieInstanceSetPlacement } from "@automovie/engine";

import { INSTANCE_SLOT_TEST_ROAD as road } from "./INSTANCE_SLOT_TEST_ROAD";
import { instanceSlotTestPlacement as placement } from "./instanceSlotTestPlacement";

/**
 * Preserve the existing four-member route placement and caller overrides.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the same along-route law, shared road and anchor height to actual member placement and its named refusal cases.
 * @evidence contracts/testing.md#independent-expectations Count four and the authored route are inputs; the consumer independently checks arc-length midpoints and lateral jitter rather than using this carrier as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Keeps default, changed-heading, jittered and missing/renamed/degenerate route twins with overrides applied last.
 * @evidence contracts/testing.md#execution-ownership Returns fresh placement/layout/anchor records while borrowing the same road singleton; it opens no file, renderer, browser or GPU and replaces no foreign method.
 */
export function instanceSlotTestOnRoad(
  overrides: Partial<IAutoMovieInstanceSetPlacement> = {},
): IAutoMovieInstanceSetPlacement {
  return placement({
    count: 4,
    layout: { kind: "along-route", route: "road", lateralJitter: 0 },
    route: road,
    anchor: { x: 0, y: 2, z: 0 },
    ...overrides,
  });
}
