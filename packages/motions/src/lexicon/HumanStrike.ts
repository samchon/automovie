import { HumanActionRow } from "../law/HumanActionRow";
import { kick } from "../striking/kick";
import { knee } from "../striking/knee";
import { punch } from "../striking/punch";

/**
 * The strikes as rows on the grammar (#3362): each named technique is a row
 * of the shipped law that owns its geometry and its outcome, the effector
 * and the side fixed, the target and the accuracy the composition's.
 *
 * | Row | Law | Fixed |
 * | --- | --- | --- |
 * | `jab`, `cross` | `punch` | straight, lead or rear hand |
 * | `leadHook`, `rearHook` | `punch` | hook, lead or rear hand |
 * | `leadUppercut`, `rearUppercut` | `punch` | uppercut, lead or rear hand |
 * | `roundKick`, `switchKick` | `kick` | round, rear or lead leg |
 * | `pushKick`, `teep` | `kick` | push, lead or rear leg |
 * | `leadKnee`, `rearKnee` | `knee` | lead or rear leg |
 *
 * A strike with a held weapon is the weapons' rows on the blade laws
 * (`HumanWeaponMelee`) and a slap the stage fight's (`HumanStageFight`), so
 * every strike shares the stroke and the outcome law of its family. The
 * receiver's reaction is synced to the strike's hit (`sync({ hit })`,
 * #3480) and planned by the perturbation law (#3430).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what it fixes, what the composition gives and where the weapons, slaps and reactions are.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named techniques of #3362's table; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanStrike {
  /** A straight punch with the lead hand. */
  export const jab = HumanActionRow.of("jab", punch, {
    technique: "straight",
    hand: "lead",
  });

  /** A straight punch with the rear hand. */
  export const cross = HumanActionRow.of("cross", punch, {
    technique: "straight",
    hand: "rear",
  });

  /** A hook with the lead hand. */
  export const leadHook = HumanActionRow.of("leadHook", punch, {
    technique: "hook",
    hand: "lead",
  });

  /** A hook with the rear hand. */
  export const rearHook = HumanActionRow.of("rearHook", punch, {
    technique: "hook",
    hand: "rear",
  });

  /** An uppercut with the lead hand. */
  export const leadUppercut = HumanActionRow.of("leadUppercut", punch, {
    technique: "uppercut",
    hand: "lead",
  });

  /** An uppercut with the rear hand. */
  export const rearUppercut = HumanActionRow.of("rearUppercut", punch, {
    technique: "uppercut",
    hand: "rear",
  });

  /** A round kick with the rear leg's shin. */
  export const roundKick = HumanActionRow.of("roundKick", kick, {
    technique: "round",
    leg: "rear",
  });

  /** A round kick with the lead leg. */
  export const switchKick = HumanActionRow.of("switchKick", kick, {
    technique: "round",
    leg: "lead",
  });

  /** A push kick with the lead foot. */
  export const pushKick = HumanActionRow.of("pushKick", kick, {
    technique: "push",
    leg: "lead",
  });

  /** A push kick with the rear foot. */
  export const teep = HumanActionRow.of("teep", kick, {
    technique: "push",
    leg: "rear",
  });

  /** A knee with the lead leg. */
  export const leadKnee = HumanActionRow.of("leadKnee", knee, { leg: "lead" });

  /** A knee with the rear leg. */
  export const rearKnee = HumanActionRow.of("rearKnee", knee, { leg: "rear" });
}
