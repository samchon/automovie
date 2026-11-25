import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { brace } from "../everyday/brace";
import { crouch } from "../everyday/crouch";
import { kneel } from "../everyday/kneel";
import { lieDown } from "../floor/lieDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { HUMAN_FLOOR_LIE_STILL } from "../next/presets/HUMAN_FLOOR_LIE_STILL";
import { HUMAN_FLOOR_SIT_CROSS_LEGGED } from "../next/presets/HUMAN_FLOOR_SIT_CROSS_LEGGED";
import { HUMAN_FLOOR_SIT_ON_FLOOR } from "../next/presets/HUMAN_FLOOR_SIT_ON_FLOOR";
import { HUMAN_FLOOR_SIT_SIDEWAYS } from "../next/presets/HUMAN_FLOOR_SIT_SIDEWAYS";
import { HUMAN_SEAT_KNEEL_BRIEFLY } from "../next/presets/HUMAN_SEAT_KNEEL_BRIEFLY";
import { HUMAN_SEAT_KNEEL_SIT } from "../next/presets/HUMAN_SEAT_KNEEL_SIT";
import { HUMAN_SEAT_TAKE_A_KNEE } from "../next/presets/HUMAN_SEAT_TAKE_A_KNEE";
import { HUMAN_STANCE_SQUAT_SIT } from "../next/presets/HUMAN_STANCE_SQUAT_SIT";
import { HUMAN_STANCE_TAKE_COVER } from "../next/presets/HUMAN_STANCE_TAKE_COVER";
import { flinch } from "../reaction/flinch";
import { stagger } from "../reaction/stagger";

/**
 * Whole-body postures and reactions under film names, each a row of a shipped
 * action. Register the ones a film uses.
 */
export namespace HumanPose {
  /**
   * Take a knee and stay down three seconds (provisional), as a proposal or a
   * rest.
   */
  export const takeAKnee: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["takeAKnee"]
  > = HumanActionRow("takeAKnee", kneel, HUMAN_SEAT_TAKE_A_KNEE);

  /**
   * Kneel, stay 1 s and get up again; checking something low, tying a shoe, a
   * quick bow of the knee (the descent and rise times are
   * `IAutoMovieMotionHumanKneel`'s, provisional).
   */
  export const kneelBriefly: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["kneelBriefly"]
  > = HumanActionRow("kneelBriefly", kneel, HUMAN_SEAT_KNEEL_BRIEFLY);

  /**
   * Sit back on the heels from both knees and stay, the floor seat of a
   * kneel-sit, three seconds (provisional).
   */
  export const kneelSit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["kneelSit"]
  > = HumanActionRow("kneelSit", kneel, HUMAN_SEAT_KNEEL_SIT);

  /**
   * Sit down on the floor with the legs ahead and stay three seconds
   * (provisional).
   */
  export const sitOnFloor: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["sitOnFloor"]
  > = HumanActionRow("sitOnFloor", lieDown, HUMAN_FLOOR_SIT_ON_FLOOR);

  /** Sit down on the floor cross-legged and stay three seconds (provisional). */
  export const sitCrossLegged: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["sitCrossLegged"]
  > = HumanActionRow("sitCrossLegged", lieDown, HUMAN_FLOOR_SIT_CROSS_LEGGED);

  /**
   * Sit down on the floor with both legs folded to the right, leaning on the
   * left hand, and stay three seconds (provisional).
   */
  export const sitSideways: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["sitSideways"]
  > = HumanActionRow("sitSideways", lieDown, HUMAN_FLOOR_SIT_SIDEWAYS);

  /**
   * Squat fully, heels up, and hold three seconds (provisional), as people sit
   * low without a seat: the full squat takes 1.3 s down and as long up at the
   * reference hip (`IAutoMovieMotionHumanCrouch`), 5.6 s in all.
   */
  export const squatSit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["squatSit"]
  > = HumanActionRow("squatSit", crouch, HUMAN_STANCE_SQUAT_SIT);

  /**
   * Duck down and hold 2 s, as behind cover: the partial crouch takes 1.0 s
   * down and as long up at the reference hip (`IAutoMovieMotionHumanCrouch`), 4
   * s in all; hiding, ducking under fire.
   */
  export const takeCover: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["takeCover"]
  > = HumanActionRow("takeCover", crouch, HUMAN_STANCE_TAKE_COVER);

  /**
   * Lie down and stay 3 s (provisional), as to sleep or to play dead; the
   * lying-down time is `IAutoMovieMotionHumanLieDown`'s.
   */
  export const lieStill: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["lieStill"]
  > = HumanActionRow("lieStill", lieDown, HUMAN_FLOOR_LIE_STILL);

  /**
   * Brace for an impact: the brace of kind `impact`, set 0.6 s after the start
   * and lasting 1.5 s when `seconds` is absent (`IAutoMovieMotionHumanBrace`,
   * provisional); a crash, an explosion, a fall.
   */
  export const braceForImpact: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["braceForImpact"]
  > = HumanActionRow("braceForImpact", brace, {
    kind: "impact",
  });

  /**
   * A startle: the full flinch (`intensity` 1): the peak at 0.2 s and back by
   * 0.6 s (`IAutoMovieMotionHumanFlinch`); a sudden noise, a near miss.
   */
  export const startle: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["startle"]
  > = HumanActionRow("startle", flinch, { intensity: 1 });

  /**
   * A wince: the slight flinch, 0.4 of the startle's size in the same 0.6 s
   * (`IAutoMovieMotionHumanFlinch`, provisional); pain, distaste.
   */
  export const wince: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["wince"]
  > = HumanActionRow("wince", flinch, { intensity: 0.4 });

  /**
   * A stumble from a shove that the body steps out of: a push of 0.5 m/s from
   * ahead, the speed whose extrapolated centre of mass a 9 degree backward lean
   * gives a small woman's pendulum (`omega l sin 9`, 0.50 m/s; 0.54 m/s on the
   * average man's), the largest backward lean young adults recover from by
   * stepping (Pitts et al. 2024, Appl Ergon 117:104236, unloaded: 9 degrees
   * backward, 20 forward). A shove at walking speed, 1.2 m/s, is a fall for
   * every body: four recovery steps catch at most 0.95 m/s pushed backward on
   * the small woman and 1.17 m/s on the average man. Those limits are people's:
   * released from a backward lean, young adults recover by stepping from at
   * most 16.4 +- 3.1 degrees (Telonio, Cyr, Moglo and Smeesters 2005, ISB XX
   * abstract 430), and more steps do not raise the lean recovered from (Cyr,
   * Moglo and Smeesters 2005, ISB XX abstract 401: 30.4, 33.2 and 32.2 degrees
   * forward with one step, two and no limit); the same pendulum reads 16.4
   * degrees as 0.90 m/s on the small woman and 0.97 m/s on the average man, and
   * 1.2 m/s as a lean of 22.0 and 20.3 degrees, past the measured threshold.
   */
  export const stumble: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["stumble"]
  > = HumanActionRow("stumble", stagger, { speed: 0.5 });
}
