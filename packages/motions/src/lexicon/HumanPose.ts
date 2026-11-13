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
