import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { brace } from "../everyday/brace";
import { crouch } from "../everyday/crouch";
import { kneel } from "../everyday/kneel";
import { lieDown } from "../floor/lieDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { flinch } from "../reaction/flinch";
import { stagger } from "../reaction/stagger";

/**
 * Whole-body postures and reactions under film names, each a row of a
 * shipped action. Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (HumanActionRow), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanPose {
  /** Take a knee and stay down three seconds (provisional), as a proposal or a rest. */
  export const takeAKnee: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["takeAKnee"]
  > = HumanActionRow.of("takeAKnee", kneel, {
    hold: 3,
    rise: false,
  });

  /** Kneel and get up again. */
  export const kneelBriefly: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["kneelBriefly"]
  > = HumanActionRow.of("kneelBriefly", kneel, {
    hold: 1,
    rise: true,
  });

  /** Sit back on the heels from both knees and stay, the floor seat of a kneel-sit, three seconds (provisional). */
  export const kneelSit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["kneelSit"]
  > = HumanActionRow.of("kneelSit", kneel, {
    kind: "sitBack",
    hold: 3,
    rise: false,
  });

  /** Sit down on the floor with the legs ahead and stay three seconds (provisional). */
  export const sitOnFloor: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["sitOnFloor"]
  > = HumanActionRow.of("sitOnFloor", lieDown, {
    position: "sitLong",
    hold: 3,
  });

  /** Sit down on the floor cross-legged and stay three seconds (provisional). */
  export const sitCrossLegged: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["sitCrossLegged"]
  > = HumanActionRow.of("sitCrossLegged", lieDown, {
    position: "sitCrossed",
    hold: 3,
  });

  /** Sit down on the floor with both legs folded to the right, leaning on the left hand, and stay three seconds (provisional). */
  export const sitSideways: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["sitSideways"]
  > = HumanActionRow.of("sitSideways", lieDown, {
    position: "sitSide",
    hold: 3,
  });

  /** Squat fully, heels up, and hold three seconds (provisional), as people sit low without a seat. */
  export const squatSit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["squatSit"]
  > = HumanActionRow.of("squatSit", crouch, {
    depth: "full",
    heels: "up",
    hold: 3,
  });

  /** Duck down and hold, as behind cover. */
  export const takeCover: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["takeCover"]
  > = HumanActionRow.of("takeCover", crouch, { hold: 2 });

  /** Lie down and stay, as to sleep or to play dead. */
  export const lieStill: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["lieStill"]
  > = HumanActionRow.of("lieStill", lieDown, { hold: 3 });

  /** Brace for an impact. */
  export const braceForImpact: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["braceForImpact"]
  > = HumanActionRow.of("braceForImpact", brace, {
    kind: "impact",
  });

  /** A startle: the full flinch. */
  export const startle: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["startle"]
  > = HumanActionRow.of("startle", flinch, { intensity: 1 });

  /** A wince: the slight flinch. */
  export const wince: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["wince"]
  > = HumanActionRow.of("wince", flinch, { intensity: 0.4 });

  /**
   * A stumble from a shove that the body steps out of: a push of 0.5 m/s from
   * ahead, the speed whose extrapolated centre of mass a 9 degree backward
   * lean gives a small woman's pendulum (`omega l sin 9`, 0.50 m/s; 0.54 m/s
   * on the average man's), the largest backward lean young adults recover from by
   * stepping (Pitts et al. 2024, Appl Ergon 117:104236, unloaded: 9
   * degrees backward, 20 forward). A shove at walking speed, 1.2 m/s, is a
   * fall for every body: four recovery steps catch at most 0.95 m/s
   * pushed backward on the small woman and 1.17 m/s on the average man.
   * Those limits are people's: released from a backward lean, young adults
   * recover by stepping from at most 16.4 +- 3.1 degrees (Telonio, Cyr,
   * Moglo and Smeesters 2005, ISB XX abstract 430), and more steps do not
   * raise the lean recovered from (Cyr, Moglo and Smeesters 2005, ISB XX
   * abstract 401: 30.4, 33.2 and 32.2 degrees forward with one step, two
   * and no limit); the same pendulum reads 16.4 degrees as 0.90 m/s on the
   * small woman and 0.97 m/s on the average man, and 1.2 m/s as a lean of
   * 22.0 and 20.3 degrees, past the measured threshold.
   */
  export const stumble: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["pose"]["stumble"]
  > = HumanActionRow.of("stumble", stagger, { speed: 0.5 });
}
