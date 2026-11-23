import { HumanCover as HumanCoverLaw } from "../lexicon/HumanCover";

/**
 * Moving against a cover: peeking, sidling, a window and a breach, with the back or the chest against the wall.
 *
 * Laws and helpers, each the shipped function under the family name:
 * - `cover`: Moving in cover along staged walls and doors: a corner peek, a wall sidle, a crouched pass under a window and a door breach, each planned against the named prop (`planCover`).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by `typeof` and never wrapped, so its parameters, units, frames and refusals are those its own comment states. The family's shared model and each law's parameters are declared by {@link IAutoMovieMotionHumanCover} in `@automovie/interface`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the family covers, how its members relate and where its model is declared.
 * @evidence contracts/development/design.md#principled-representation Each member is the shipped law, preset or row itself, so the units, frames and invariants are those its owner states.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the family groups; each stays owned by its module.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is wrapped, widened or redefined, so no behaviour is added here.
 */
export namespace AutoMovieMotionHumanCover {
  /**
   * Moving in cover along staged walls and doors: a corner peek, a wall
   * sidle, a crouched pass under a window and a door breach, each planned
   * against the named prop (`planCover`). A door stack composes sidles to the
   * door's side and `passThrough` entries in order. Register
   * `HumanCover.moveInCover` to use it.
   */
  export import cover = HumanCoverLaw;
}
