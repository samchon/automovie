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
  export const takeAKnee = HumanActionRow.of("takeAKnee", kneel, {
    hold: 3,
    rise: false,
  });

  /** Kneel and get up again. */
  export const kneelBriefly = HumanActionRow.of("kneelBriefly", kneel, {
    hold: 1,
    rise: true,
  });

  /** Sit back on the heels from both knees and stay, the floor seat of a kneel-sit, three seconds (provisional). */
  export const kneelSit = HumanActionRow.of("kneelSit", kneel, {
    kind: "sitBack",
    hold: 3,
    rise: false,
  });

  /** Sit down on the floor with the legs ahead and stay three seconds (provisional). */
  export const sitOnFloor = HumanActionRow.of("sitOnFloor", lieDown, {
    position: "sitLong",
    hold: 3,
  });

  /** Sit down on the floor cross-legged and stay three seconds (provisional). */
  export const sitCrossLegged = HumanActionRow.of("sitCrossLegged", lieDown, {
    position: "sitCrossed",
    hold: 3,
  });

  /** Sit down on the floor with both legs folded to the right, leaning on the left hand, and stay three seconds (provisional). */
  export const sitSideways = HumanActionRow.of("sitSideways", lieDown, {
    position: "sitSide",
    hold: 3,
  });

  /** Squat fully, heels up, and hold three seconds (provisional), as people sit low without a seat. */
  export const squatSit = HumanActionRow.of("squatSit", crouch, {
    depth: "full",
    heels: "up",
    hold: 3,
  });

  /** Duck down and hold, as behind cover. */
  export const takeCover = HumanActionRow.of("takeCover", crouch, { hold: 2 });

  /** Lie down and stay, as to sleep or to play dead. */
  export const lieStill = HumanActionRow.of("lieStill", lieDown, { hold: 3 });

  /** Brace for an impact. */
  export const braceForImpact = HumanActionRow.of("braceForImpact", brace, {
    kind: "impact",
  });

  /** A startle: the full flinch. */
  export const startle = HumanActionRow.of("startle", flinch, { intensity: 1 });

  /** A wince: the slight flinch. */
  export const wince = HumanActionRow.of("wince", flinch, { intensity: 0.4 });

  /** A stumble from a shove at walking speed (1.2 m/s, provisional). */
  export const stumble = HumanActionRow.of("stumble", stagger, { speed: 1.2 });
}
