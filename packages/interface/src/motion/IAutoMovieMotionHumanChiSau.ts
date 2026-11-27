/**
 * Wing chun's chi sau (sticky hands), the rolling form (poon sau): two partners
 * facing at arm's length keep both forearms in contact, each forearm crossing
 * the partner's opposite one, while the contacts roll through a small vertical
 * circle.
 *
 * Both partners perform it on the same clock, each naming the other. The
 * contacts lie between the two partners at their lower chest height, a
 * shoulder's width apart; on each side one partner's wrist lies over the
 * other's, and the two contacts roll half a cycle apart, as one arm rolls up
 * into the bong sau while the other turns down into the taan sau. A cycle lasts
 * `CYCLE` seconds unless `seconds` and `cycles` fix it. The circle's radius and
 * the cycle's length are provisional staging values, since no measurement of
 * the drill was read.
 */
export namespace IAutoMovieMotionHumanChiSau {
  /** Parameters. */
  export interface IParams {
    /** The other performer, who performs chi sau naming this one. */
    partner: string;

    /**
     * Roll cycles, a whole number of at least 1; 4 when absent, each
     * `chiSau.CYCLE` (1.2 s, provisional), so 4.8 s of rolling.
     */
    count?: number;

    /**
     * The drill's seconds, positive; the cycles at the provisional cycle length
     * when absent.
     */
    duration?: number;
  }
}
