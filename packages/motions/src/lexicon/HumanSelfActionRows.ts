import { selfAction } from "../touch/selfAction";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * The actions on one's own body as rows (#3361): each kind of `selfAction` under a name of its own, the side, the count and the manner open.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and is checked as the law is, and its draws are keyed by its own name. The rows over the arm's phrases themselves are `HumanUpperRows`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row fixes and what it leaves open.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), data over a law that already fits the body and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per value of the law's closed union and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or restates a value of the law.
 */
export namespace HumanSelfActionRows {
  /** `selfAction` of kind `stretch`. */
  export const selfStretch = HumanActionRow.of("selfStretch", selfAction, { kind: "stretch" });

  /** `selfAction` of kind `victory`. */
  export const selfVictory = HumanActionRow.of("selfVictory", selfAction, { kind: "victory" });

  /** `selfAction` of kind `fistPump`. */
  export const selfFistPump = HumanActionRow.of("selfFistPump", selfAction, { kind: "fistPump" });

  /** `selfAction` of kind `neckRoll`. */
  export const selfNeckRoll = HumanActionRow.of("selfNeckRoll", selfAction, { kind: "neckRoll" });

  /** `selfAction` of kind `shoulderRoll`. */
  export const selfShoulderRoll = HumanActionRow.of("selfShoulderRoll", selfAction, { kind: "shoulderRoll" });
}
