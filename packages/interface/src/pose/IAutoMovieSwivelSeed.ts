import type { IAutoMovieSwivelArcs } from "./IAutoMovieSwivelArcs";

/**
 * Which of a hinged chain's poses a fit chose, by the two numbers that name one
 * for any target (`hingedArmSwivel`): its bend branch and its swivel about the
 * chain's root-to-effector line. A fit of a nearby target seeded with it
 * (`IAutoMovieSwivelNear`) continues the same pose instead of searching every
 * swivel again.
 */
export interface IAutoMovieSwivelSeed {
  /**
   * The swivel about the chain's root-to-effector line, degrees
   * (`hingedArmSwivel.pose`).
   */
  swivel: number;

  /** The bend branch: its index in `hingedArmSwivel.branches`. */
  branch: number;

  /**
   * The mid bone's distal twist the fit chose (a forearm's pronation), clinical
   * degrees; absent for a chain without one. A fit continued from the seed
   * keeps the twist nearest it (Tolani, Goswami and Badler 2000: the feasible
   * value nearest the previous solution), since the elbow's hinge leaves the
   * twist to be derived from the asked rotation afresh, and where that rotation
   * is beyond the twist's range the least miss jumps from one end of the range
   * to the other between two frames.
   */
  twist?: number;

  /**
   * The arc of swivels around `swivel`, degrees in its own turn, over which the
   * fit's requested end rotation is admitted: outside every arc the end joint's
   * box refuses and inside the mid segment's twist range (Tolani, Goswami and
   * Badler 2000, section 3.2.4: each limit maps to an interval of the swivel).
   * Absent where that analysis does not apply or the swivel lies outside every
   * admitted arc. A fit continued from the seed follows the admitted arc that
   * overlaps this one, the same connected arc moved by the target, and never
   * another.
   */
  admitted?: IAutoMovieSwivelArcs.IArc;

  /**
   * The feasible interval of swivels around `swivel`, degrees in its own turn:
   * the interval the chain root's limits leave that holds it (Tolani, Goswami
   * and Badler 2000, section 3.2.3; `hingedSwivelFeasible`). Absent where the
   * root has no limits or the swivel lies in no feasible interval. A fit
   * continued from the seed whose swivel leaves the feasible set moves to the
   * feasible interval overlapping this one, the same connected interval moved
   * by the target, and never to another.
   */
  feasible?: IAutoMovieSwivelArcs.IArc;

  /**
   * Whether an interval the fit continued from vanished at this fit's target:
   * the seed's `feasible` interval, where no feasible interval overlaps it
   * while the seed lies outside every one, or its `admitted` arc, where no
   * admitted arc overlaps it. No swivel connected to the seed is then within
   * the root's limits or takes the requested end rotation, and the fit only
   * refined the seed. The course continuing such fits refuses there or plans
   * the span, never jumps; absent, the intervals held.
   */
  vanished?: boolean;
}
