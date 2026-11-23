/**
 * Which of a hinged chain's poses a fit chose, by the two numbers that name
 * one for any target (`hingedArmSwivel`): its bend branch and its swivel
 * about the chain's root-to-effector line. A fit of a nearby target seeded
 * with it (`IAutoMovieSwivelNear`) continues the same pose instead of
 * searching every swivel again.
 */
export interface IAutoMovieSwivelSeed {
  /** The swivel about the chain's root-to-effector line, degrees (`hingedArmSwivel.pose`). */
  swivel: number;

  /** The bend branch: its index in `hingedArmSwivel.branches`. */
  branch: number;

  /**
   * The mid bone's distal twist the fit chose (a forearm's pronation),
   * clinical degrees; absent for a chain without one. A fit continued from
   * the seed keeps the twist nearest it (Tolani, Goswami and Badler 2000:
   * the feasible value nearest the previous solution), since the elbow's
   * hinge leaves the twist to be derived from the asked rotation afresh,
   * and where that rotation is beyond the twist's range the least miss
   * jumps from one end of the range to the other between two frames.
   */
  twist?: number;
}
