import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";

/**
 * Bracing for an expected impact, push or a falling body: the stance widens and
 * staggers along the line of the coming force, the body lowers and leans into
 * it, and the hands come up in front, all set before the force arrives.
 *
 * People preparing for a predictable perturbation adjust their posture in
 * advance, anticipatory postural adjustments (Massion 1992, Prog Neurobiol
 * 38:35): they enlarge the base of support along the expected force, lower the
 * centre of mass and lean against the force, keeping the feet in place once set
 * (Horak and Nashner 1986, J Neurophysiol 55:1369; Maki and McIlroy 1997, Phys
 * Ther 77:488, on changing the base of support). The goals: the foot on the
 * side away from the force steps back along the force's line by `STAGGER` leg
 * lengths and out until the feet stand a shoulder width apart (a staggered,
 * wider base); the pelvis drops until the knees flex `KNEE` degrees and is then
 * moved so the engine's whole-body centre of mass stands over the middle of the
 * new base's hull, found on the solved posture; the trunk inclines 10 degrees
 * toward the force; and both palms come up ahead of the chest's front surface
 * (its sternum region) along the force, facing it for an `impact` or a `push`,
 * turned up and lower to receive a `catchBody`. The arms rise from the entry's
 * and hold the palms there as one trajectory planned clear of the body
 * (`AutoMovieMotionHumanArmPlanned`, through `gestureHands.planned`), so no
 * forearm passes through the trunk on the way. Step size, drop, lean and timing
 * are provisional (Massion describes the adjustments, not these magnitudes).
 * The stepping foot swings over 0.4 s with a 3 cm lift, the set is reached at
 * `set`, 0.6 s after the start (provisional lead time), and held for the rest
 * of the action.
 *
 * The force comes from `toward` (a person, prop or point the force comes from)
 * or from straight ahead when absent.
 */
export namespace IAutoMovieMotionHumanBrace {
  /**
   * Parameters of a brace: where the force comes from, what is braced for and
   * how long the brace lasts.
   */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** Where the force comes from; straight ahead when absent. */
    target?: IAutoMovieMotionTarget;

    /** What is braced for; `impact` when absent. */
    kind?: "impact" | "push" | "catchBody";

    /** How long the brace lasts, seconds; 1.5 when absent. */
    hold?: number;
  }
}
