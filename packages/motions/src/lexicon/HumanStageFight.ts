import { clinch } from "../grappling/clinch";
import { HumanActionRow } from "../law/HumanActionRow";
import { touch } from "../touch/touch";

/**
 * Stage fighting short of a strike: slaps, grabs and holds, each a row of a
 * shipped action on a partner the composition names (the row leaves the
 * target or the partner open). The receiver's response is its own action,
 * synced to the row's contact. Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanStageFight {
  /** A forehand slap: one tap of the open palm. The composition gives the cheek as the target. */
  export const slap = HumanActionRow.of("slap", touch, {
    with: "palm",
    kind: "tap",
    count: 1,
    tangent: "across",
  });

  /** A backhand slap: one tap of the hand's back. */
  export const backhand = HumanActionRow.of("backhand", touch, {
    with: "handBack",
    kind: "tap",
    count: 1,
    tangent: "across",
  });

  /** A shove: the palm pressed on the partner's chest. */
  export const shove = HumanActionRow.of("shove", touch, {
    with: "palm",
    kind: "press",
    count: 1,
  });

  /** A grab: the hand closed on the partner's region and held (a collar, an arm, the hair at the crown). */
  export const grab = HumanActionRow.of("grab", touch, {
    with: "palm",
    kind: "squeeze",
    count: 1,
  });

  /** A poke of the forefinger into the partner's chest, repeated. */
  export const poke = HumanActionRow.of("poke", touch, {
    with: "fingertips",
    kind: "tap",
  });

  /** A hold on the partner by the clinch, kept three seconds (provisional). */
  export const restrain = HumanActionRow.of("restrain", clinch, { hold: 3 });
}
