import type { KickboxingAction } from "./KickboxingAction";
import { KickboxingTechnique } from "./KickboxingTechnique";

/**
 * The defenses of the study: which attacks each one meets, which limb it
 * occupies and which of the receiver's regions the attack then touches.
 *
 * ```ts
 * KickboxingDefense.meets("parry", KickboxingTechnique.table.jab); // true
 * KickboxingDefense.contact("cover", KickboxingTechnique.table.hook); // "glove-right"
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#defenses Limbs and the attacks each defense meets follow the defense table.
 * @evidence docs/research/kickboxing/exchanges.md#outcomes The touched region follows the outcome table's contact column.
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace answers and gives examples.
 * @evidence contracts/development/design.md#principled-representation Answers are the closed union of the action vocabulary; regions are the receiver's own sided region ids.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three questions, asked by the outcome table, the legality rules and the pose and contact laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fighter or scene is named.
 */
export namespace KickboxingDefense {
  /** The limb an answer occupies: the rear (right) hand, the attacked side's arm, the whole body, the lead (left) leg, or nothing. */
  export type Limb = "rear-hand" | "attacked-arm" | "body" | "lead-leg" | "none";

  /**
   * The limb an answer occupies.
   *
   * @param answer The answer.
   * @returns Its limb.
   * @evidence docs/research/kickboxing/techniques.md#defenses The limb column of the defense table.
   * @evidence contracts/development/common.md#meaningful-documentation States the mapping.
   * @evidence contracts/development/implementation.md#principled-implementation A table lookup.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied table.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function limb(answer: KickboxingAction.Answer): Limb {
    switch (answer) {
      case "parry":
        return "rear-hand";
      case "cover":
      case "elbow-block":
      case "high-block":
        return "attacked-arm";
      case "slip":
      case "roll":
      case "sway":
        return "body";
      case "check":
        return "lead-leg";
      case "take":
        return "none";
    }
  }

  /**
   * Whether an answer can meet an attack, judged on the technique it performs
   * or shows.
   *
   * @param answer The answer.
   * @param attack The attack, possibly a feint or a disguised kick.
   * @returns True when the defense table pairs them; `take` meets everything.
   * @evidence docs/research/kickboxing/techniques.md#defenses The "meets" column.
   * @evidence docs/research/kickboxing/exchanges.md#brazilian-kick A disguised kick is answered as the kick it shows at its chamber.
   * @evidence contracts/development/common.md#meaningful-documentation States the pairing rule and the disguise rule.
   * @evidence contracts/development/implementation.md#principled-implementation A feint is judged as the technique it shows and a disguised kick as its disguise, because the receiver reads the shown chamber.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch over answers reading the technique's line and level.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No technique name is tested.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied table.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function meets(
    answer: KickboxingAction.Answer,
    attack: KickboxingTechnique.ISpec,
  ): boolean {
    const shown: KickboxingTechnique.ISpec = read(attack);
    const punch: boolean = shown.family === "punch";
    switch (answer) {
      case "parry":
        return (
          (punch && shown.line === "straight" && shown.level === "head") ||
          shown.family === "push-kick"
        );
      case "cover":
        return punch && shown.level === "head";
      case "slip":
      case "sway":
        return punch && shown.line === "straight" && shown.level === "head";
      case "roll":
        return punch && shown.line === "arc" && shown.level === "head";
      case "elbow-block":
        return shown.level === "body" && shown.family !== "push-kick";
      case "high-block":
        return shown.family === "round-kick" && shown.level === "head";
      case "check":
        return shown.family === "round-kick" && shown.level === "leg";
      case "take":
        return true;
    }
  }

  /**
   * The receiver's region an attack touches under an answer, or null when
   * nothing is touched.
   *
   * @param answer The answer.
   * @param attack The attack.
   * @returns A receiver region id, or null for an evasion, a feint or a disguise that passes the defense.
   * @evidence docs/research/kickboxing/exchanges.md#outcomes The contact column: glove on glove or forearm, shin on forearm, shin on shin, or the attacked region itself.
   * @evidence contracts/development/common.md#meaningful-documentation States the result and when it is null.
   * @evidence contracts/development/implementation.md#principled-implementation A defending limb on the attacked side meets the attack; a disguised kick passes the defense of its disguise and reaches its own region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One switch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No technique is named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The studied contact column.
   * @evidence contracts/development/behaviors.md#relational-goals The result is a region of the receiver's body.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function contact(
    answer: KickboxingAction.Answer,
    attack: KickboxingTechnique.ISpec,
  ): string | null {
    if (attack.shows) return null;
    if (attack.disguise !== undefined && answer !== "take")
      return KickboxingTechnique.region(attack);
    const side: KickboxingTechnique.Side = KickboxingTechnique.opposite(
      attack.side,
    );
    switch (answer) {
      case "parry":
        return attack.family === "push-kick" ? "forearm-right" : "glove-right";
      case "cover":
        return `glove-${side}`;
      case "elbow-block":
      case "high-block":
        return `forearm-${side}`;
      case "check":
        return "shin-left";
      case "slip":
      case "roll":
      case "sway":
        return null;
      case "take":
        return KickboxingTechnique.region(attack);
    }
  }

  /** The technique a receiver reads: what a feint shows, what a disguise imitates, or the attack itself. */
  function read(attack: KickboxingTechnique.ISpec): KickboxingTechnique.ISpec {
    const shown: KickboxingTechnique.ISpec = KickboxingTechnique.performed(attack);
    return shown.disguise !== undefined
      ? KickboxingTechnique.table[shown.disguise]
      : shown;
  }
}
