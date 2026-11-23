import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `gesturePalmsUp` row of `HumanGestureRows` fixes on `gesture`,
 * spread into its parameters. `gesture` of kind `palmsUp`: one opening of 0.6
 * s, both hands, plus the preparation and retraction; fits "I do not know", an
 * appeal, offering an explanation ({@link gestureStrokeTables.RHYTHM}, `count`
 * repeats the stroke).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IGestureKindPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PALMS_UP`; the `gesturePalmsUp` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PALMS_UP: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "palmsUp",
  };
