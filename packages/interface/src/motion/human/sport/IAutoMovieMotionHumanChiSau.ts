/**
 * Wing chun's chi sau (sticky hands), the rolling form (poon sau): two
 * partners facing at arm's length keep both forearms in contact, each
 * forearm crossing the partner's opposite one, while the contacts roll
 * through a small vertical circle.
 *
 * Both partners perform it on the same clock, each naming the other. The
 * contacts lie between the two partners at their lower chest height, a
 * shoulder's width apart; on each side one partner's wrist lies over the
 * other's, and the two contacts roll half a cycle apart, as one arm rolls
 * up into the bong sau while the other turns down into the taan sau. A
 * cycle lasts `CYCLE` seconds unless `seconds` and `cycles` fix it. The
 * circle's radius and the cycle's length are provisional staging values,
 * since no measurement of the drill was read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation partner: The other performer. cycles: Roll cycles, 4 when absent. seconds: The drill's length, 4 cycles of the provisional cycle when absent.
 * @evidence contracts/development/design.md#principled-representation The partner's subject and two optional extents of the drill.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the chi sau law only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact geometry is the law's, read from both partners' placed marks.
 */
export namespace IAutoMovieMotionHumanChiSau {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The partner and two optional extents.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the chi sau plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns the partner refusal.
   */
  export interface IParams {
    /** The other performer, who performs chi sau naming this one. */
    partner: string;

    /** Roll cycles; 4 when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    cycles?: number;

    /** The drill's seconds; the cycles at the provisional cycle length when absent.
     * Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds?: number;
  }
}
