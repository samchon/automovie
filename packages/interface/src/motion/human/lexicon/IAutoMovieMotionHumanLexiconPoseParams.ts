import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanKneel } from "../everyday/IAutoMovieMotionHumanKneel";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanFlinch } from "../reaction/IAutoMovieMotionHumanFlinch";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";

/**
 * Open parameters of the pose lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The pose family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the pose row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconPoseParams {
  /** Take a knee and stay down three seconds (provisional), as a proposal or a rest. */
  takeAKnee: Omit<IAutoMovieMotionHumanKneel.IParams, "hold" | "rise">;

  /** Kneel and get up again. */
  kneelBriefly: Omit<IAutoMovieMotionHumanKneel.IParams, "hold" | "rise">;

  /** Sit back on the heels from both knees and stay, the floor seat of a kneel-sit, three seconds (provisional). */
  kneelSit: Omit<IAutoMovieMotionHumanKneel.IParams, "kind" | "hold" | "rise">;

  /** Sit down on the floor with the legs ahead and stay three seconds (provisional). */
  sitOnFloor: Omit<IAutoMovieMotionHumanLieDown.IParams, "position" | "hold">;

  /** Sit down on the floor cross-legged and stay three seconds (provisional). */
  sitCrossLegged: Omit<
    IAutoMovieMotionHumanLieDown.IParams,
    "position" | "hold"
  >;

  /** Sit down on the floor with both legs folded to the right, leaning on the left hand, and stay three seconds (provisional). */
  sitSideways: Omit<IAutoMovieMotionHumanLieDown.IParams, "position" | "hold">;

  /** Squat fully, heels up, and hold three seconds (provisional), as people sit low without a seat. */
  squatSit: Omit<
    IAutoMovieMotionHumanCrouch.IParams,
    "depth" | "heels" | "hold"
  >;

  /** Duck down and hold, as behind cover. */
  takeCover: Omit<IAutoMovieMotionHumanCrouch.IParams, "hold">;

  /** Lie down and stay, as to sleep or to play dead. */
  lieStill: Omit<IAutoMovieMotionHumanLieDown.IParams, "hold">;

  /** Brace for an impact. */
  braceForImpact: Omit<IAutoMovieMotionHumanBrace.IParams, "kind">;

  /** A startle: the full flinch. */
  startle: Omit<IAutoMovieMotionHumanFlinch.IParams, "intensity">;

  /** A wince: the slight flinch. */
  wince: Omit<IAutoMovieMotionHumanFlinch.IParams, "intensity">;

  /** A stumble from a shove at walking speed (1.2 m/s, provisional). */
  stumble: Omit<IAutoMovieMotionHumanStagger.IParams, "speed">;
}
