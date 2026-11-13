import { walk } from "../actions/walk";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Loaded carries of strength training, each a row of a shipped law that
 * carries what the hands took before it: the held props ride the hands
 * through the row (`HumanSegment`'s carry). Register the rows a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the law it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanSportCarry {
  /** A farmer's walk: a slow walk with the arms still, carrying what both hands took before it (a kettlebell or a dumbbell in each), so the arms hang and do not swing (provisional: no arm swing, as a loaded carry is taught). The composition gives where to. */
  export const farmersWalk = HumanActionRow.of("farmersWalk", walk, {
    pace: "slow",
    armSwing: 0,
  });
}
