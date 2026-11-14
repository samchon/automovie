import { gesture } from "../everyday/gesture";
import { dance } from "../exercise/dance";
import { exercise } from "../exercise/exercise";
import { HumanActionRow } from "../law/HumanActionRow";
import { guard } from "../striking/guard";
import { kick } from "../striking/kick";
import { punch } from "../striking/punch";

/**
 * Fighting and training rows, each a row of a shipped action; a strike's
 * row leaves its target to the composition. Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (HumanActionRow), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanDrill {
  /** A jab: the lead straight. */
  export const jab = HumanActionRow.of("jab", punch, {
    technique: "straight",
    hand: "lead",
  });

  /** A cross: the rear straight. */
  export const cross = HumanActionRow.of("cross", punch, {
    technique: "straight",
    hand: "rear",
  });

  /** A lead hook. */
  export const hook = HumanActionRow.of("hook", punch, {
    technique: "hook",
    hand: "lead",
  });

  /** A rear uppercut. */
  export const uppercut = HumanActionRow.of("uppercut", punch, {
    technique: "uppercut",
    hand: "rear",
  });

  /** A front push kick with the lead leg, as a teep or a door kick. */
  export const frontKick = HumanActionRow.of("frontKick", kick, {
    technique: "push",
    leg: "lead",
  });

  /** A rear round kick. */
  export const roundKick = HumanActionRow.of("roundKick", kick, {
    technique: "round",
    leg: "rear",
  });

  /** A southpaw guard. */
  export const southpaw = HumanActionRow.of("southpaw", guard, {
    stance: "southpaw",
  });

  /** Level a held thing at a target, as a weapon or a torch is aimed: the pointing arm. */
  export const aim = HumanActionRow.of("aim", gesture, {
    kind: "point",
    hold: 1.5,
  });

  /** Squats. */
  export const squats = HumanActionRow.of("squats", exercise, {
    kind: "squat",
  });

  /** Jumping jacks. */
  export const jumpingJacks = HumanActionRow.of("jumpingJacks", exercise, {
    kind: "jumpingJack",
  });

  /** A sway to music. */
  export const sway = HumanActionRow.of("sway", dance, { kind: "sway" });
}
