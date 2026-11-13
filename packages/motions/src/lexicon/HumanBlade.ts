import { HumanActionRow } from "../law/HumanActionRow";
import { guard } from "../striking/guard";
import { punch } from "../striking/punch";
import { useTool } from "../tasks/useTool";
import { wipe } from "../tasks/wipe";

/**
 * Blade work as rows of shipped actions, a first pass: the arm's stroke of
 * each technique without the blade's own reach, edge alignment or bind.
 * The composition gives the target. Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (HumanActionRow), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; every value here is provisional until the blade is the effector.
 */
export namespace HumanBlade {
  /** The guard a fencer waits in. */
  export const enGarde = HumanActionRow.of("enGarde", guard, {
    stance: "orthodox",
  });

  /** A descending cut: one chopping stroke onto the target. */
  export const cut = HumanActionRow.of("cut", useTool, {
    tool: "hammer",
    cycles: 1,
  });

  /** A horizontal slash: one sweep across the target. */
  export const slash = HumanActionRow.of("slash", wipe, { cycles: 1 });

  /** A thrust: the lead hand driven straight at the target. */
  export const thrust = HumanActionRow.of("thrust", punch, {
    technique: "straight",
    hand: "lead",
  });

  /** A drawing cut: the edge sawn along the target. */
  export const draw = HumanActionRow.of("draw", useTool, {
    tool: "saw",
    cycles: 1,
  });
}
