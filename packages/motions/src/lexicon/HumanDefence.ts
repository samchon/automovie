import { brace } from "../everyday/brace";
import { HumanActionRow } from "../law/HumanActionRow";
import { defend } from "../striking/defend";

/**
 * The defences as rows on the grammar (#3362): each named defence is a row
 * of `defend`, the law that owns the defender's role and the outcome shared
 * with the strike it answers, and the brace a row of `brace`, a base
 * adaptation. The composition gives the strike answered (`against`) and,
 * where the scene decides it, the outcome.
 *
 * | Row | Law | Fixed |
 * | --- | --- | --- |
 * | `cover`, `parry`, `elbowBlock`, `highBlock`, `checkKick` | `defend` | the block |
 * | `slip`, `roll`, `sway` | `defend` | the evasion |
 * | `braceImpact`, `bracePush` | `brace` | what is braced for |
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of and what the composition gives.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named defences of #3362's table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; the outcome stays the defence law's.
 */
export namespace HumanDefence {
  /** Both forearms brought up to cover the head. */
  export const cover = HumanActionRow.of("cover", defend, { kind: "cover" });

  /** The incoming fist deflected by the hand. */
  export const parry = HumanActionRow.of("parry", defend, { kind: "parry" });

  /** A body strike taken on the elbow. */
  export const elbowBlock = HumanActionRow.of("elbowBlock", defend, {
    kind: "elbowBlock",
  });

  /** A high strike taken on the raised forearm. */
  export const highBlock = HumanActionRow.of("highBlock", defend, {
    kind: "highBlock",
  });

  /** A kick checked with the raised shin. */
  export const checkKick = HumanActionRow.of("checkKick", defend, {
    kind: "check",
  });

  /** The head moved off the line of a straight punch. */
  export const slip = HumanActionRow.of("slip", defend, { kind: "slip" });

  /** The body rolled under a hook. */
  export const roll = HumanActionRow.of("roll", defend, { kind: "roll" });

  /** The trunk swayed back from a strike. */
  export const sway = HumanActionRow.of("sway", defend, { kind: "sway" });

  /** The stance widened and lowered for an impact. */
  export const braceImpact = HumanActionRow.of("braceImpact", brace, {
    kind: "impact",
  });

  /** The stance set against a push. */
  export const bracePush = HumanActionRow.of("bracePush", brace, {
    kind: "push",
  });
}
