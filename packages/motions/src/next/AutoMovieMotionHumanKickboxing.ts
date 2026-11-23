import { KickboxingRing as KickboxingRingSource } from "../sport/kickboxing/KickboxingRing";
import { KickboxingRules as KickboxingRulesSource } from "../sport/kickboxing/KickboxingRules";
import { KnockdownCount as KnockdownCountSource } from "../sport/kickboxing/KnockdownCount";

/**
 * A kickboxing bout: the Strike and Defence families' actions, whose timing they own, in the fighting stance (`IAutoMovieMotionHumanStrikingStance`) inside a ring, under the GLORY rules. The ring, the rules and the knockdown count are data on `AutoMovieMotionHumanKickboxing` (`Ring`, `Rules`, `KnockdownCount`); the bout adds no method of its own. No fighting distance in metres, no combination rhythm by skill and no champion speed is defined yet (provisional, to be added from sources).
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 * - `Ring`: A bounded fighting area: a square ring on the floor, centred on a point and turned by a heading, inside its ropes.
 * - `Rules`: The kickboxing ruleset a performance's schedule must keep, in the engine's `checkAutoMovieLegality` form, for the motions vocabulary's `punch`, `kick`, `defend` and `knockdown` actions.
 * - `KnockdownCount`: The knockdown procedure's clock and corner (GLORY Rules 5.05.B.2 to 5 and Appendix 3.D, as inspected in the kickboxing research of #3201): the standing fighter goes to the farthest neutral corner and faces the centre before the count starts; the count is one number per elapsed second from that start, readiness is assessed at eight, and an uninterrupted ten ends the contest by knockout.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by `typeof` and never wrapped, so its parameters, units, frames and refusals are those its own comment states. The family's shared model and each law's parameters are declared by {@link IAutoMovieMotionHumanKickboxing} in `@automovie/interface`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the family covers, how its members relate and where its model is declared.
 * @evidence contracts/development/design.md#principled-representation Each member is the shipped law, preset or row itself, so the units, frames and invariants are those its owner states.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the family groups; each stays owned by its module.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is wrapped, widened or redefined, so no behaviour is added here.
 */
export namespace AutoMovieMotionHumanKickboxing {
  /**
   * A bounded fighting area: a square ring on the floor, centred on a point
   * and turned by a heading, inside its ropes. Footwork and staging read it to
   * keep the fighters' stances inside the ropes and to find its corners.
   *
   * The ring is a square of `size` metres between the ropes (GLORY rings are
   * 6.1 to 7.3 m inside the ropes; the size is the production's). Corners are
   * named in the ring's own frame: the red and blue corners on one diagonal,
   * the two neutral corners on the other. A ring placed in the scene is read
   * from its own contacts (`of`, `createRing`'s): its centre and floor from the
   * `canvas`, its size from the top ropes on opposite sides, its heading from
   * the placement, and its corners named on its posts' tops, `corner1` (`+X
   * +Z`) blue, `corner3` red, `corner4` and `corner2` the neutral corners.
   */
  export import Ring = KickboxingRingSource;

  /**
   * The kickboxing ruleset a performance's schedule must keep, in the engine's
   * `checkAutoMovieLegality` form, for the motions vocabulary's `punch`,
   * `kick`, `defend` and `knockdown` actions.
   *
   * From the GLORY Official Rules V2.2, §5.07 (as inspected in the kickboxing
   * research of #3201): elbows, throws and sweeps are banned, so only punches,
   * round kicks, push kicks and knees strike (A.7, A.10); strikes to the back
   * of the head or the back (A.2) and to the groin (A.3) are fouls, and no
   * other target is, the throat included; a linear kick to the legs is a foul,
   * so a push kick may only strike the body (A.4: "an Athlete may only attack
   * the legs with kicks that arc"); the clinch allows one immediate knee, so a knee
   * may not touch another strike of the same fighter (A.11); and no downed
   * opponent may be attacked. A strike
   * at a performer who is down (between the start of their knockdown and the
   * start of their next action) breaks the last rule.
   *
   * Fighting style choices such as "kicks finish combinations" are not rules
   * and are not checked here.
   */
  export import Rules = KickboxingRulesSource;

  /**
   * The knockdown procedure's clock and corner (GLORY Rules 5.05.B.2 to 5 and
   * Appendix 3.D, as inspected in the kickboxing research of #3201): the
   * standing fighter goes to the farthest neutral corner and faces the centre
   * before the count starts; the count is one number per elapsed second from
   * that start, readiness is assessed at eight, and an uninterrupted ten ends
   * the contest by knockout. One number per second is the research's
   * implementation of the ten-count, not a timing the rulebook quotes.
   */
  export import KnockdownCount = KnockdownCountSource;
}
