import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * A stagger: a blow pushes the centre of mass past the base of support and
 * recovery steps catch it.
 *
 * The centre of mass moves over the floor as an inverted pendulum of Hof's leg
 * length, 1.34 hip heights (Hof, Gazendam and Sinke 2005, J Biomech 38:1), from
 * the blow's speed along the push, its centre of pressure always as near the
 * extrapolated centre of mass `x + v / omega0`, `omega0 = sqrt(g / l)`, as the
 * bearing feet reach: on it, which holds it, or at the nearest point of their
 * outline, from which it runs on (Hof 2008, Hum Mov Sci 27:112). Each recovery
 * step chooses its time and its place within measured bounds, as capture-point
 * stepping does (Koolen et al. 2012, Int J Robot Res 31:1094; Griffin et al.
 * 2017): the weight shifts onto the stance foot over both feet, the foot swings
 * in its direction's step time and lands the sole point it lands on as near the
 * extrapolated centre of mass as its reachable footstep region allows, and the
 * body is caught once the extrapolated centre of mass lies inside the base the
 * two feet make. The region is the stance foot's: within its direction's
 * longest recovery step of where the foot stood beside the stance foot; a step
 * past it shortens toward the stance foot. The legs then admit each step at its
 * mid-swing and its landing, under the pelvis the centre of mass carries there:
 * each planted leg's reach, knee flexion and thigh extension as a two-bone
 * chain, and crossed legs clear of each other as the tangle audit reads them
 * (`staggerAdmission`, `walkLegClearance`). The legs may cross: a footstep
 * planner's region on the stepping foot's own side of the stance foot (Deits
 * and Tedrake 2014) keeps a walking robot's legs apart, but it forbids the
 * crossover step people take in most lateral recoveries, so it is not this
 * region. Every order of the feet over up to four steps is tried, the fewest
 * steps first, so capture is monotone in the push's speed; the order preferred
 * alternates its feet forward and backward (Maki and McIlroy 1997), beginning
 * with the foot further along the push, the rear foot for a push backward, and
 * pushed sideways begins with the leg the push unloads, which crosses in front
 * of or behind the loaded one (Maki, McIlroy and Perry 1996: 96% of lateral
 * stepping responses), the loaded leg's side-step being the other order. The
 * bounds are those of younger adults at the threshold of balance recovery: an
 * 82 ms reaction and a 138 ms weight shift before the first step (Cyr, Moglo
 * and Smeesters 2005), steps of 238, 176 and 193 ms and up to 0.59, 0.38 and
 * 0.42 statures forward, sideways and backward (Telonio, Cyr, Moglo and
 * Smeesters 2005), read between those directions on an ellipse; the leg a
 * sideways push unloads leaves the floor 20% sooner and swings 70% longer than
 * a forward or backward step (Maki, McIlroy and Perry 1996, `LATERAL`). A foot
 * stepping forward strikes with its heel and one stepping backward lands on its
 * forefoot (Grasso, Bianchi and Lacquaniti 1998). A push four steps do not
 * catch is a fall, as people take up to four recovery steps (Debelle, Maganaris
 * and O'Brien 2021): it is refused, naming the fastest push the body catches
 * that way.
 *
 * Once caught, the other foot closes at the entry's stance width, as far ahead
 * or behind as stands the middle of the two ankles under the caught point as
 * the entry stood over its own. The extrapolated centre of mass then tracks a
 * minimum-jerk course to where the body stood over its feet, its centre of
 * pressure placed by the divergent component's tracking law inside the base
 * (Englsberger, Ott and Albu-Schaffer 2015), and the centre of mass follows it,
 * `x' = omega0 (xi - x)`, until both rest within a millimetre.
 *
 * The body over its feet is read at each second from prepared courses
 * (`StaggerFeet`): the trunk bends about the hips against the fall, the hip
 * strategy (Horak and Nashner 1986, J Neurophysiol 55:1369), by the inclination
 * of the extrapolated centre of mass's lead over the pendulum's length, bounded
 * by the hip's extension (`staggerLean`); the pelvis carries the centre of
 * mass's course less the shift that tilt makes of it, and is lowered to the
 * height its planted legs allow, as the walk settles its pelvis
 * (`walkReach.ground`), each heel rising about its ball where the ankle runs
 * out of room. A stance whose leg leans further to its side than the ankle's
 * inversion or eversion rolls onto its edge (`walkReachStance.SIDE`); a
 * stepping foot first rises clear of the floor by the minimum toe clearance of
 * walking (`walkFoot.CLEARANCE`, Killeen et al. 2017), over the share of its
 * swing a walking foot takes to set down from that height, then swings as a
 * walking foot swings (`walkFoot.prepareSwing`) to the stance it lands in, held
 * inside its leg's ranges and as high over the floor as its swing carries it
 * (`walkReach.swing`), so it leaves and joins its stances where they stand.
 *
 * Both arms abduct as balance reactions, 9.4 degrees from 154 ms after the push
 * (the mean of the two arms' abduction within 200 ms of a backward release,
 * 10.7 and 8.0 degrees, at its measured onset; Weerdesteyn, Laing and
 * Robinovitch 2008, Exp Brain Res 186:571), held through the steps and let down
 * as the body settles, each let out further where it would pass into the body
 * (`HumanArmSwing.of`). The steps, the catch and the settling are the body's
 * dynamics, which no manner changes; the manner's tempo scales the righting.
 *
 * The push is read where its source is as the plan begins, the causal read a
 * reaction makes (`ReactionSource`).
 *
 * A performer standing on one foot, a kicker mid-kick, catches no push: the
 * stagger is refused, naming the speed it can catch.
 */
export namespace IAutoMovieMotionHumanStagger {
  /** Parameters. */
  export interface IParams {
    /**
     * Where the blow comes from: the body is pushed away from it; a place ahead
     * of the performer when absent.
     */
    target?: IAutoMovieMotionTarget;

    /**
     * The centre of mass's speed after the blow, m/s. Up to four recovery steps
     * catch it (each about 0.18 to 0.24 s, 0.38 to 0.59 stature long); a faster
     * push is refused as a fall, naming the fastest push the body catches, and
     * a fall is a `knockdown`. The step count and times are the body's dynamics
     * and follow this speed alone.
     */
    speed: number;

    /**
     * How it is performed: the tempo scales the trunk's righting after the last
     * step.
     */
    manner?: IAutoMovieMotionManner;
  }
}
