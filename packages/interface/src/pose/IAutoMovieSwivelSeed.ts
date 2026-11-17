

/**
 * Which of a hinged chain's poses a fit chose, by the two numbers that name
 * one for any target (`hingedArmSwivel`): its bend branch and its swivel
 * about the chain's root-to-effector line. A fit of a nearby target seeded
 * with it (`IAutoMovieSwivelNear`) continues the same pose instead of
 * searching every swivel again.
 *
 * @evidence contracts/development/design.md#principled-representation The swivel parameterisation of Tolani, Goswami and Badler 2000: a branch and a swivel name one pose of the chain for any target.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, what a fit chose and a seeded fit continues.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pose itself stays the fit's; the seed carries only what continues it.
 * @evidence contracts/development/common.md#meaningful-documentation States what the two numbers name, their units and who reads them.
 */
export interface IAutoMovieSwivelSeed {
  /** The swivel about the chain's root-to-effector line, degrees (`hingedArmSwivel.pose`). */
  swivel: number;

  /** The bend branch: its index in `hingedArmSwivel.branches`. */
  branch: number;
}
