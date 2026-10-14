import type { IAutoMovieInstanceSetPlacement } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import { instanceSlotTestPlacement as placement } from "./instanceSlotTestPlacement";

/**
 * Preserve the original oak/elm explicit inputs and missing third slot.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies the original overrides and omitted sibling fields to actual member placement; count remains three with only two transforms so the same missing-slot refusal is observable.
 * @evidence contracts/testing.md#independent-expectations Literal authored position/scale/palette/trait/visibility facts are inputs, while the consumer separately checks their output and defaults. The supplied quarter-turn object is borrowed unchanged for the original identity relation.
 * @evidence contracts/testing.md#distinguishing-cases Keeps oak's explicit overrides, elm's inherited variation and absent slot two without adding a prototype or repairing the missing transform.
 * @evidence contracts/testing.md#execution-ownership Returns fresh placement/transform arrays but borrows the exact caller rotation object, preserving shallow override identity; it opens no file, render host, browser or GPU.
 */
export function instanceSlotTestExplicit(quarterAboutX: IAutoMovieQuaternion): IAutoMovieInstanceSetPlacement {
  return placement({
    count: 3,
    facingDeg: 0,
    anchor: { x: 10, y: 0, z: 0 },
    variation: { scale: { min: 1, max: 1 }, palette: ["#336633"], traits: [{ name: "height", min: 1, max: 2 }] },
    layout: {
      kind: "explicit",
      transforms: [
        { id: "oak", translation: { x: 1, y: 2, z: 3 }, rotation: quarterAboutX, scale: { x: 2, y: 3, z: 4 }, palette: "#aa0000", traits: { height: 9 }, visible: false },
        { id: "elm", translation: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } },
      ],
    },
  });
}
