import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A stagger: a blow pushes the centre of mass past the base of support and
 * recovery steps catch it.
 *
 * The centre of mass moves over the floor as an inverted pendulum of Hof's
 * leg length, 1.34 hip heights (Hof, Gazendam and Sinke 2005, J Biomech
 * 38:1), from the blow's speed along the push, its centre of pressure always
 * as near the extrapolated centre of mass `x + v / omega0`, `omega0 = sqrt(g
 * / l)`, as the bearing feet reach: on it, which holds it, or at the nearest
 * point of their outline, from which it runs on (Hof 2008, Hum Mov Sci
 * 27:112). Each recovery step chooses its time and its place within measured
 * bounds, as capture-point stepping does (Koolen et al. 2012, Int J Robot Res
 * 31:1094; Griffin et al. 2017): the weight shifts onto the stance foot over
 * both feet, the foot swings in its direction's step time and lands the sole
 * point it lands on as near the extrapolated centre of mass as its reachable
 * footstep region allows, and the body is caught once the extrapolated
 * centre of mass lies inside the base the two feet make. The region is the
 * stance foot's: within its direction's longest recovery step of where the
 * foot stood beside the stance foot, and inside the legs' own reachable set
 * from the pelvis the centre of mass carries at the landing, the trunk free
 * to tilt, the landing foot to turn out and the two legs clear of each other
 * as the tangle audit reads them (`walkStanceCourse`, `walkLegClearance`); a
 * step past it shortens toward the stance foot. The legs may cross: a
 * footstep planner's region on the stepping foot's own side of the stance
 * foot (Deits and Tedrake 2014) keeps a walking robot's legs apart, but it
 * forbids the crossover step people take in most lateral recoveries, so it
 * is not this region. Every order of the feet over up to four steps is tried,
 * the fewest steps first, so capture is monotone in the push's speed; the
 * order preferred alternates its feet forward and backward (Maki and McIlroy
 * 1997), beginning with the foot further along the push, the rear foot for a
 * push backward, and pushed sideways begins with the leg the push unloads,
 * which crosses in front of or behind the loaded one (Maki, McIlroy and
 * Perry 1996: 96% of lateral stepping responses), the loaded leg's
 * side-step being the other order. The bounds are those of younger
 * adults at the threshold of balance recovery: an 82 ms reaction and a 138
 * ms weight shift before the first step (Cyr, Moglo and Smeesters 2005),
 * steps of 238, 176 and 193 ms and up to 0.59, 0.38 and 0.42 statures
 * forward, sideways and backward (Telonio, Cyr, Moglo and Smeesters 2005),
 * read between those directions on an ellipse; the leg a sideways push
 * unloads leaves the floor 20% sooner and swings 70% longer than a forward
 * or backward step (Maki, McIlroy and Perry 1996, `LATERAL`). A foot
 * stepping forward strikes with its heel and
 * one stepping backward lands on its forefoot (Grasso, Bianchi and
 * Lacquaniti 1998). A push four steps do not catch is a fall, as people take
 * up to four recovery steps (Debelle, Maganaris and O'Brien 2021): it is
 * refused, naming the fastest push the body catches that way.
 *
 * Once caught, the other foot closes at the entry's stance width, as far
 * ahead or behind as stands the middle of the two ankles under the caught
 * point as the entry stood over its own. The extrapolated centre of mass
 * then tracks a minimum-jerk course to where the body stood over its feet,
 * its centre of pressure placed by the divergent component's tracking law
 * inside the base (Englsberger, Ott and Albu-Schaffer 2015), and the centre
 * of mass follows it, `x' = omega0 (xi - x)`, until both rest within a
 * millimetre.
 *
 * The body over its feet is one stance course (`walkStanceCourse`): the
 * pelvis's drop, each planted foot's pitch about its ball and its turn on
 * the floor, and the trunk's tilt about the hips, as one trajectory
 * optimisation, the pelvis carrying the centre of mass on its course less
 * the shift the trunk's tilt makes of it. The legs' reach, the hip's
 * extension and rotation and the ankle's range are its constraints, with the
 * feet bearing the centre of pressure and the caught extrapolated centre of
 * mass, so a backward landing carries the pelvis back over the rear foot by
 * bending the trunk against the fall, the hip strategy (Horak and Nashner
 * 1986, J Neurophysiol 55:1369), because the ranges ask for it rather than
 * by a rule. A stance whose leg leans further to its side than the ankle's
 * 25 degrees rolls onto its edge; a stepping foot first rises clear of the
 * floor by the minimum toe clearance of walking (`walkFoot.CLEARANCE`,
 * Killeen et al. 2017), over the share of its swing a walking foot takes to set down
 * from that height, then swings as a walking foot swings (`walkFoot.swing`)
 * to the stance it lands in, held inside its leg's ranges and as high over
 * the floor as its swing carries it (`walkReach.swing`), so it leaves and
 * joins its stances where they stand.
 *
 * Both
 * arms abduct as balance reactions, 9.4 degrees from 154 ms after the push
 * (the mean of the two arms' abduction within 200 ms of a backward release,
 * 10.7 and 8.0 degrees, at its measured onset; Weerdesteyn, Laing and
 * Robinovitch 2008, Exp Brain Res 186:571), held through the steps and let
 * down as the body settles, each let out further where it would pass into
 * the body (`HumanArmSwing.of`). The steps, the catch and the settling are
 * the body's dynamics, which no manner changes; the manner's tempo scales
 * the righting.
 *
 * The push is read where its source is as the plan begins, the causal read
 * a reaction makes (`ReactionSource`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: Where the blow comes from: the body is pushed away from it; a place ahead of the performer when absent.
 * @evidence contracts/development/design.md#principled-representation from: Where the blow comes from: the body is pushed away from it; a place ahead of the performer when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.stagger, params); reaction/stagger.ts (stagger.plan, context); reaction/stagger.ts (stagger.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStagger {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blow's target and its default, the push's direction, the speed's unit and what the manner changes.
   * @evidence contracts/development/design.md#principled-representation The blow is the interface's motion-target union, the speed metres per second, checked positive and capturable when planning, and the manner the shared manner record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union and the shared manner.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** Where the blow comes from: the body is pushed away from it; a place ahead of the performer when absent. */
    from?: IAutoMovieMotionTarget;

    /** The centre of mass's speed after the blow, m/s. */
    speed: number;

    /** How it is performed: the tempo scales the trunk's righting after the last step. */
    manner?: IAutoMovieMotionManner.IManner;
  }
}
