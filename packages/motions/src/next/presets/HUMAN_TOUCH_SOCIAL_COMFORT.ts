import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `comfort` row of `HumanSocial` fixes on `touch`, spread into
 * its parameters. A comforting hand held on the partner. Held 2 s after the
 * reach (provisional); condolence, reassurance.
 */
export const HUMAN_TOUCH_SOCIAL_COMFORT: IAutoMovieMotionHumanTouch.ITouchEffectorKindHoldPreset =
  {
    effector: "palm",
    kind: "hold",
    hold: 2,
  };
