import type { IAutoMovieInstanceSetPlacement } from "@automovie/engine";

import { instanceSlotTestPlacement as placement } from "./instanceSlotTestPlacement";

/**
 * Preserve the original 64-slot radius-five scatter input at the supplied heading.
 *
 * @evidence contracts/testing.md#behavioral-verification The layout unit regenerates the same slots at headings zero/ninety through the actual member owner to compare radius containment and a quarter turn.
 * @evidence contracts/testing.md#independent-expectations Literal count/radius/anchor are inputs; the consumer states the transformed point relation independently of this carrier.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the two original heading twins and fixed seed/layout without adding sample populations or an alternate scatter implementation.
 * @evidence contracts/testing.md#execution-ownership Each call returns the same fresh placement law the former local closure returned, opens no file/renderer/browser/GPU and retains no generated members.
 */
export function instanceSlotTestScatter(
  facingDeg: number,
): IAutoMovieInstanceSetPlacement {
  return placement({
    count: 64,
    facingDeg,
    anchor: { x: 3, y: 0, z: 4 },
    layout: { kind: "scatter", radius: 5 },
  });
}
