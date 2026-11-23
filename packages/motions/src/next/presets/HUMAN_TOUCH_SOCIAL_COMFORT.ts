import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `comfort` row of `HumanSocial` fixes on `touch`, spread into its parameters. A comforting hand held on the partner. Held 2 s after the reach (provisional); condolence, reassurance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchEffectorKindHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.SOCIAL_COMFORT`; the `comfort` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_SOCIAL_COMFORT: IAutoMovieMotionHumanTouch.ITouchEffectorKindHoldPreset =
  {
    effector: "palm",
    kind: "hold",
    hold: 2,
  };
