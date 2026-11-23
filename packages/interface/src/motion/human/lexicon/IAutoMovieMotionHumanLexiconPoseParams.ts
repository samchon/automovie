import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanCrossAnkleOverKnee } from "../everyday/IAutoMovieMotionHumanCrossAnkleOverKnee";
import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanKneel } from "../everyday/IAutoMovieMotionHumanKneel";
import type { IAutoMovieMotionHumanShiftStandingWeight } from "../everyday/IAutoMovieMotionHumanShiftStandingWeight";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanFlinch } from "../reaction/IAutoMovieMotionHumanFlinch";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";

/**
 * Open parameters of the pose lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconPoseParams {
  /**
   * Take a knee and stay down three seconds (provisional), as a proposal or a
   * rest.
   */
  takeAKnee: Omit<IAutoMovieMotionHumanKneel.IParams, "hold" | "rise">;

  /** Kneel and get up again. */
  kneelBriefly: Omit<IAutoMovieMotionHumanKneel.IParams, "hold" | "rise">;

  /**
   * Sit back on the heels from both knees and stay, the floor seat of a
   * kneel-sit, three seconds (provisional).
   */
  kneelSit: Omit<IAutoMovieMotionHumanKneel.IParams, "kind" | "hold" | "rise">;

  /**
   * Sit down on the floor with the legs ahead and stay three seconds
   * (provisional).
   */
  sitOnFloor: Omit<IAutoMovieMotionHumanLieDown.IParams, "kind" | "hold">;

  /** Sit down on the floor cross-legged and stay three seconds (provisional). */
  sitCrossLegged: Omit<IAutoMovieMotionHumanLieDown.IParams, "kind" | "hold">;

  /**
   * Sit down on the floor with both legs folded to the right, leaning on the
   * left hand, and stay three seconds (provisional).
   */
  sitSideways: Omit<IAutoMovieMotionHumanLieDown.IParams, "kind" | "hold">;

  /**
   * Squat fully, heels up, and hold three seconds (provisional), as people sit
   * low without a seat.
   */
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

  /**
   * A stumble from a shove the body steps out of: a 0.5 m/s push from ahead,
   * about what the largest backward lean young adults recover from by stepping
   * gives a small woman (`HumanPose.stumble`).
   */
  stumble: Omit<IAutoMovieMotionHumanStagger.IParams, "speed">;

  /** Cross a seated ankle onto the opposite knee. */
  crossAnkleOverKnee: IAutoMovieMotionHumanCrossAnkleOverKnee;

  /** Transfer load between planted feet. */
  shiftStandingWeight: IAutoMovieMotionHumanShiftStandingWeight;
}
