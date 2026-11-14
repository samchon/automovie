import { rest } from "../everyday/rest";
import { HumanActionRow } from "../law/HumanActionRow";
import { selfAction } from "../touch/selfAction";

/**
 * Named ways of standing and what a body does by itself, each a row of
 * `rest` or `selfAction`. Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (HumanActionRow), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanStance {
  /** Arms crossed on the chest. */
  export const armsCrossed = HumanActionRow.of("armsCrossed", rest, {
    left: "crossed",
    right: "crossed",
  });

  /** Hands on the hips. */
  export const handsOnHips = HumanActionRow.of("handsOnHips", rest, {
    left: "hip",
    right: "hip",
  });

  /** Hands in the pockets. */
  export const handsInPockets = HumanActionRow.of("handsInPockets", rest, {
    left: "pocket",
    right: "pocket",
  });

  /** Parade rest: the hands clasped behind the back. */
  export const paradeRest = HumanActionRow.of("paradeRest", rest, {
    left: "claspedBehind",
    right: "claspedBehind",
  });

  /** The hands clasped in front. */
  export const handsClasped = HumanActionRow.of("handsClasped", rest, {
    left: "claspedFront",
    right: "claspedFront",
  });

  /** The hands behind the head. */
  export const handsBehindHead = HumanActionRow.of("handsBehindHead", rest, {
    left: "behindHead",
    right: "behindHead",
  });

  /** The thinker: the chin on one hand, the other arm supporting its elbow. */
  export const thinking = HumanActionRow.of("thinking", rest, {
    left: "elbowSupport",
    right: "chinRest",
  });

  /** A victory raise of the arms. */
  export const victory = HumanActionRow.of("victory", selfAction, {
    kind: "victory",
  });

  /** A fist pump. */
  export const fistPump = HumanActionRow.of("fistPump", selfAction, {
    kind: "fistPump",
  });

  /** A stretch on waking or after sitting long. */
  export const bigStretch = HumanActionRow.of("bigStretch", selfAction, {
    kind: "stretch",
  });

  /** A roll of a stiff neck. */
  export const neckRoll = HumanActionRow.of("neckRoll", selfAction, {
    kind: "neckRoll",
  });
}
