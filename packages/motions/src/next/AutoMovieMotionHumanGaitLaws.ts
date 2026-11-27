import { run as runLaw } from "../gait/internal/run";
import { walk as walkLaw } from "../gait/internal/walk";
import { walkCadence as walkCadenceLaw } from "../gait/internal/walkCadence";
import { walkLegClearance as walkLegClearanceLaw } from "../gait/internal/walkLegClearance";
import { walkStation as walkStationLaw } from "../gait/internal/walkStation";
import { walkSteps as walkStepsLaw } from "../gait/internal/walkSteps";
import { carry as carryLaw } from "../carrying/internal/carry";
import { approach as approachLaw } from "../everyday/internal/approach";
import { HumanAidWalk as HumanAidWalkLaw } from "../lexicon/HumanAidWalk";
import { HumanCaneSweep as HumanCaneSweepLaw } from "../lexicon/HumanCaneSweep";
import { HumanCrutchWalk as HumanCrutchWalkLaw } from "../lexicon/HumanCrutchWalk";

/**
 * The gait family's laws and helpers, each the shipped function under its
 * family name (`AutoMovieMotionHumanGait`), with its own comment.
 */
export namespace AutoMovieMotionHumanGaitLaws {
  /**
   * Walking to a floor point in whole steps, ending with the feet side by side.
   *
   * Speed comes from dynamic similarity (Alexander 1984): people of different
   * leg length walk alike at equal Froude number `v^2 / (g l)`, so each pace is
   * a Froude number on the hip height `l`: slow 0.074, normal 0.25 and fast
   * 0.325, which give 0.82, 1.51 and 1.72 m/s at the reference hip
   * (`walkRoot.REFERENCE_HIP`, 0.93 m). Step length grows with the square root
   * of speed (Grieve and Gear 1966): `1.2 l sqrt(sqrt(Fr))`, 0.8 hip heights at
   * the normal pace (about 0.4 stature, Perry and Burnfield); the step count is
   * rounded up so every step is at most that long, at the pace's own cadence
   * (`WalkPace`).
   *
   * Each foot follows the three rockers of stance with its contact point fixed
   * on the floor, and swings between footprints on a minimum-jerk path lifted
   * clear of the floor ({@link walkSteps}): 60 % stance and 40 % swing of each
   * stride, so each double support lasts a tenth of a stride (Perry and
   * Burnfield). The pelvis advances fastest near double support and slowest
   * near midstance. Its height follows the two contact heights and accounts for
   * the raised leg's share of the 4–5 cm whole-body excursion. It sways 2 cm
   * toward the stance foot and lowers wherever a planted leg cannot reach its
   * foot, so no plant is ever stretched off its point ({@link walkReach}). A
   * swing joins the stance its foot left, as the leg reached it at toe-off, to
   * the stance it lands in, as the leg reaches it at heel strike
   * ({@link walkFoot}), and the pelvis reads a swinging foot only through those
   * two stances. The pelvis turns 4° and tilts 4° with the stride, the chest
   * counter-rotates, and the arms swing opposite the legs about 15° with the
   * elbows bent 15 to 30° (Perry and Burnfield, normal gait kinematics).
   *
   * The explicit footprints and cut entry pose give the engine's IK their
   * stance targets. The audit reads the same windows through contactMask.
   * Proficiency only varies step timing.
   */
  export import walk = walkLaw;

  /**
   * Running to a floor point, at a jog, a run or a sprint: the walk's footprint
   * plan in a running gait, with a flight phase between stances.
   *
   * A run differs from a walk by its duty factor, the share of the stride a
   * foot is on the ground, below one half so both feet leave the floor once a
   * step (Alexander 1984, "The gaits of bipedal and quadrupedal animals";
   * Novacheck 1998, "The biomechanics of running", Gait & Posture 7): 0.4 at a
   * jog, 0.35 at a run and 0.25 at a sprint, so the swing lasts `2 (1 - duty)`
   * step periods. The speed comes from the Froude number, `v = sqrt(Fr g l)`,
   * at 0.6, 1.3 and 5 (about 2.3, 3.4 and 6.8 m/s at the reference hip,
   * `walkRoot.REFERENCE_HIP`). The step frequency is the measured quantity:
   * nearly constant over endurance speeds and rising toward a sprint (Cavagna,
   * Franzetti, Heglund and Willems 1988, J Physiol 399:81), about 172 steps a
   * minute at a recreational runner's preferred 2.9 m/s (Heiderscheit et al.
   * 2011, Med Sci Sports Exerc 43:296). Scaled by the pendulum time `sqrt(l /
   * g)` (Alexander 1984), it is `0.8 + 0.08 Fr` (a provisional fit: 170 steps a
   * minute at 2.9 m/s on a reference hip, `walkRoot.REFERENCE_HIP`), so the
   * longest step is `l sqrt(Fr) / (0.8 + 0.08 Fr)`, about 0.9, 1.3 and 1.9 hip
   * heights, inside the step lengths measured across running speeds (Novacheck
   * 1998). The foot lands on its ball with the heel held `FOREFOOT` degrees up,
   * the forefoot strike of sprinters (Novacheck 1998) and of runners who strike
   * without an impact transient (Lieberman et al. 2010, Nature 463:531); the
   * angle is provisional. The pelvis rides the spring-mass stance
   * (`runStance`): highest at contact and toe-off, lowest at mid-stance where
   * the stance knee is most flexed (Blickhan 1989), and a foot in the air asks
   * nothing of it. The swing foot rises 0.15 to 0.35 hip heights as the knee
   * folds in recovery, the elbows hold near 92° (Yegian et al. 2019) and swing
   * 19° either way with the shoulders (half the range Tartaruga et al. 2012
   * measured), and the trunk inclines forward of a walk's and more as the pace
   * rises (Thorstensson et al. 1984): 5, 8 and 12 degrees for a jog, a run and
   * a sprint (provisional).
   */
  export import run = runLaw;

  /**
   * Walking up to a person, a prop or a point and stopping at an interpersonal
   * distance, facing it.
   *
   * The goal is the stop, not the steps: the front of the performer's chest
   * (the sternum region) must end `gap` short of the target, horizontally,
   * along the line from where the performer stands to the target
   * ({@link HumanProxemics}). The law turns that goal into the floor point the
   * feet's midpoint must reach, `gap` plus the chest's lead over the feet back
   * from the target, and lets the walk law place whole steps to it, so the stop
   * is exact without sliding (the walk's footprints are inverse-kinematics
   * goals) and the body faces the target because it walked straight at it.
   *
   * The target is read once, at the start: a person's region (the `sternum` for
   * Hall's chest-to-chest gaps, `upperBack` to stop behind someone), a prop's
   * point or a free point. For `handing` the gap comes from both people's own
   * measures, so a short and a tall partner meet at a gap both can reach; a
   * prop or point target uses the performer's measure alone. A target already
   * nearer than the requested gap is refused with both distances, since an
   * approach never backs away.
   *
   * A `side` stops on a named side of a person target instead, in that person's
   * own frame (their sternum's outward normal is their front), at the same gap,
   * and the walk's final heading turns the body to face them on the last steps.
   * The person approached on a side is walked round like one named in `avoid`,
   * so a stop behind them is not reached through them. People named in `avoid`
   * are walked round: where the straight leg would pass one nearer than the
   * walker's lateral clearance (0.5 m, `CLEARANCE`; walkers keep an elliptical
   * personal space wider ahead than to the side while circumventing a person,
   * Gerin-Lajoie, Richards and McFadyen 2005, Motor Control 9:242) plus half
   * the walker's chest breadth, a waypoint abeam that person takes the walk
   * round on the side that deviates least. Walkers moving past each other are
   * not avoided here; reciprocal avoidance belongs to the engine. An Effort
   * sets the walk's step length, arm swing and elbow width
   * ({@link HumanEffort}); bound flow's elbows held in cannot be shown, since
   * the walk only widens them.
   *
   * With `track`, a person who moves is followed: their placed root is read
   * ahead over `HORIZON` seconds for where and when they come to rest, the stop
   * is taken against the target carried and turned with their root to that
   * place, and the walk waits in its first posture so that it arrives `LAG`
   * after they stop, which keeps the follower behind a leader on the leader's
   * own line. Where their way bends by more than `BEND` the walk goes by the
   * places they passed, and with `track: "pace"` it matches their speed instead
   * of waiting (`walkStation`; Rio, Rhea and Warren 2014).
   *
   * Events are the walk's (each foot's toe-offs and heel strikes,
   * `lastFootfall`, `arrive`), and `depart` where the walk waited.
   */
  export import approach = approachLaw;

  /**
   * Walking to a floor point while carrying a load or pushing a wheeled one: a
   * bag in one hand, a box in both hands before the body, a child on the hip,
   * or a cart or stroller pushed by its handle.
   *
   * The walk is the walk law's own (`walk.plan`), the base every unclaimed
   * channel keeps, so footfalls, pelvis and the free arm's swing are the
   * walk's; the load claims the arms that hold it, which stop swinging (arm
   * swing is suppressed on the loaded side), slows a held load's walk by its
   * mass (`loadedWalkPace`), and leans the trunk by its mass, a share of the
   * body's mass in [0, 0.25] (the issue's band):
   *
   * - `oneHand`: the loaded arm hangs straight beside the body with the hand
   *   closed on the handle, and the trunk leans laterally away from the load
   *   (Zhang, Ye and Wang 2010, Comput Methods Biomech Biomed Engin 13:339).
   * - `twoHands`: both palms press the sides of a box as wide as 0.8 of the
   *   shoulders, held at waist height a third of the arm before the root or
   *   beyond the abdomen by the forearm's radius, and the trunk leans back over
   *   it (Chaffin et al. 2006's front load).
   * - `hip`: the hand of the hip side lies palm up under the child's seat before
   *   that hip, and the trunk leans away to the other side.
   * - `push`: both hands grip a handle at the elbow's height a forearm before the
   *   shoulders, the upper arms hanging, a shoulder width apart, and the trunk
   *   leans forward (Hoozemans et al. 1998 on handle height in pushing).
   *
   * A held load's lean is the trunk's balance over the hips (`tilt`): the trunk
   * leans until its own weight's moment about the hips matches the load's, the
   * head, arms and trunk weighing 0.678 of the body with their centre 0.626 of
   * the way from the hips to the shoulders (Winter 2009, Biomechanics and Motor
   * Control of Human Movement, Table 4.1). It is an upper bound: the legs also
   * tilt toward the free side (Zhang, Ye and Wang 2010). A pushed handle's
   * forward lean is `PUSH` degrees per unit of the cart's mass share, with no
   * located study of the slope (a push's force is the cart's rolling
   * resistance, which the law does not know). The lean is shared between the
   * chest and the spine and grows in over the first `RAMP` seconds. The load
   * itself is not a prop yet, so no grip window is declared. Events: the
   * walk's. An overlay may take the head and, under a one-hand or hip load, the
   * free arm and hand (the plan's `yields`), so a wave or a phone rides a carry
   * as it rides a walk.
   *
   * Not yet: shoulder straps, backpacks, overhead and head loads, a level tray,
   * the child in the arms, on the shoulders or in a carrier, pulling a trolley
   * or a suitcase, the cart as a moving support (A2), changing hands
   * (`shiftLoad`) and the frozen hand offset of a held prop.
   */
  export import carryLoad = carryLaw;

  /**
   * A floor-aid gait with an explicit prop curve and body fitting on the same
   * clock.
   *
   * A walker advances while both feet support the actor. A cane or crutch
   * advances during the opposite foot's swing. The parked aid stays fixed. The
   * screen orders are based on measured aid and foot contacts in [Thies et
   * al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7057469/) and [Kang et
   * al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7506684/).
   *
   * Each station's `seconds` is the author's, so the speed is its distance over
   * them; no natural value is defined (provisional, missing a study of aided
   * walking speed): choose 0.6 m/s or slower for a frail walker (Studenski et
   * al. 2011, the speed below which an older adult is frail). The opening
   * stance takes a quarter of the first station's time.
   */
  export const aidWalk: typeof HumanAidWalkLaw = HumanAidWalkLaw;

  /**
   * Walking on two crutches: a crutch gait on the support law, the crutches
   * advancing on their own track and the body swinging on the hands.
   *
   * Each station first advances both crutch tips (`ADVANCE` of its time), the
   * feet standing; then the hands bear on the planted handgrips while the feet
   * swing. In a three-point gait only the sound foot bears and steps, the
   * injured leg held off the floor (`HELD`), its foot first lifted clear over
   * its place before the leg folds; in a swing-to gait both feet land level
   * with the tips, and in a swing-through gait `THROUGH` past them
   * (Physiopedia, Crutches, https://www.physio-pedia.com/Crutches). The crutch
   * props share the walk's clock (`track`), so a scene's crutches and the body
   * read one course. Each station carries both crutches and the feet rigidly
   * with the walker: displaced by the station and turned about the walk's
   * `origin` (each crutch about its own tip and the feet about the tips'
   * midpoint when none is given). The hands hold their grips where the crutch
   * stands at each support key and ride the crutch's lift between them
   * (`carryCrutchHands`).
   *
   * Each station's `seconds` is the author's, so the speed is its distance over
   * them; no natural value is defined (provisional, missing a study of crutch
   * gait). A crutch advances through the first third of each station and the
   * body swings through the rest; the opening stance takes a quarter of the
   * first station's time.
   */
  export const crutchWalk: typeof HumanCrutchWalkLaw = HumanCrutchWalkLaw;

  /**
   * Sweep a long cane while walking, performed over the walk. The cane hand is
   * held at the midline, `AHEAD` of the forearm before the hips at the waist's
   * height (the hand's place in the walker's moving frame). The walk's own
   * steps are read from its posture at `RATE`: each instant a leg's goal
   * becomes planted while the hand holds the cane pose (after the `REACH` to it
   * and before the `RETURN` from it) is a landing, and at each landing the tip
   * touches the floor on the opposite side, `BEYOND` outside the body's widest
   * part (the shoulder and the upper arm), as the two-point touch places it.
   * Between two touches the tip crosses on a minimum-jerk share, lifted at most
   * `LIFT` (two-point) or sliding on the floor (constant contact); before the
   * first touch and after the last it rests on that touch's place. At every
   * second the tip's reach ahead is solved so the cane's grip-to-tip length
   * spans from the hand to the tip, and the cane's shaft points from the tip to
   * the hand; the hand that holds it is placed for that frame
   * (`HumanWornItem.holding`) and laid as one course (`courseArmGoal`), under a
   * grip window on the cane that keeps it in the hand and a hold that leaves it
   * there. Events: `touch<n>`. A cane too short to reach the floor ahead, or a
   * walk with no landing in the span, is refused.
   */
  export const caneSweep: typeof HumanCaneSweepLaw = HumanCaneSweepLaw;

  /**
   * Heel strikes entrained to a beat track: which beat each strike answers and
   * when it lands, by the linear phase-correction model of sensorimotor
   * synchronisation (Vorberg and Wing 1996, reviewed by Repp 2005, Psychon Bull
   * Rev 12:969).
   *
   * A locked walker's k-th heel strike answers beat `b0 + k`, `b0` set so the
   * cadence's foot strikes first on its `index` beat, or on the beat nearest
   * that strike when no index is given. Its asynchrony, strike minus beat,
   * follows `A(k+1) = (1 - alpha) A(k) + T(k) - C`, with `C` the beat's period,
   * `T(k)` the walker's timer interval (the period drawn with Wing and
   * Kristofferson's timing variability, `HumanSkill.jitter`, which carries the
   * motor part too) and `alpha` the correction gain, discipline's
   * (`HUMAN_ATTRIBUTE_EFFECTS.discipline .correction`). The first strike keeps
   * the plan's own second, so its asynchrony is where the walker set off, and
   * the correction draws the strikes onto the beats from there. Whether a
   * walker locks at all is drawn against discipline's share (`discipline.lock`:
   * 62 % of side-by-side civilian pairs lock step frequency, Nessler and
   * Gilliland 2009; drilled troops all do); one who does not keeps its own
   * tempo. After the track's last beat the steps keep the plan's own times.
   */
  export import walkCadence = walkCadenceLaw;

  /**
   * How far two legs of one body pass into each other, read as the tangle audit
   * reads them: each leg posed as the posture shows it (its hip, knee and ankle
   * and its thigh's and shank's rotations, `HumanLegChain`, and its foot's
   * rotation), and the deepest probe of either leg's thigh, shank, foot or toes
   * in a segment of the other beyond the probe's own reference depth there
   * (`AutoMovieMotionHumanAuditTangleModel.excess`). A planner that keeps it
   * within the audit's give (`AutoMovieMotionHumanAuditTangleModel.BUILT`)
   * keeps two legs that cross, as a sideways recovery's do, clear of each other
   * where the audit would find them run through each other.
   */
  export import walkLegClearance = walkLegClearanceLaw;

  /**
   * A stepping plan walked to keep station on a moving point: a formation's
   * slot, a steered course, or a person followed. While the point moves, the
   * walker's speed along its own way follows the point's, and once the point
   * has stopped it walks the rest of its way at its own pace.
   *
   * Followers match a leader's speed: the follower's acceleration is
   * proportional to the difference of the two speeds, `a = c (v_point -
   * v_walker)` with `c` = `GAIN` (Rio, Rhea and Warren 2014, J Vis 14(2):4,
   * Table 1; fitted between 1 and 4 m of gap). Formations are kept the same
   * way, each member steering to its own place relative to a reference (Balch
   * and Arkin 1998; Reynolds 1999's offset pursuit), so a slot is followed as a
   * leader is. A walker sets off as the point does, slows where it slows and
   * stands while it stands, and after a change of the point's speed by `dv` the
   * gap has changed by `dv / c`. The law holds the gap, it does not close it:
   * what is left of the way when the point has stopped, or from the place where
   * the plan's own stop begins, is walked on the plan's own clock, whose rate
   * comes to 1 by the same first-order law, so the walker stops as its own gait
   * stops.
   *
   * The point's speed is the length it travels between readings `STEP` apart,
   * and no more than `FASTEST` times the gait's own cruising speed is matched:
   * a walker that cannot keep up falls behind and arrives after it. The plan's
   * way is the length its root travels, read at `SAMPLES` instants; its
   * cruising speed is the median of the speeds between them. A point that does
   * not move leaves the plan as it is. The plan's clock slows with the speed,
   * so a slower walker steps as long and less often, and one whose point pauses
   * holds its stride where it is.
   *
   * @param plan The walker's stepping plan at its own pace, laid along the
   *   point's way.
   * @param where Where the point is at a film second.
   * @param from The film second the walker's plan begins.
   * @param rests The film second the point comes to rest.
   * @returns The plan at the point's speed.
   * @throws {HumanRefusal} When the clock would need more than `TICKS` entries,
   *   a station kept past the longest walk timed.
   */
  export const walkStation: typeof walkStationLaw = walkStationLaw;

  /**
   * The footstep plan of a walk: footprints, their heel-strike and toe-off
   * times, each foot's scheduled stance, and the pelvis path, all as closed
   * functions of seconds.
   *
   * Footprints lie along the path from the feet's midpoint through the `via`
   * points to the destination, at least two steps whenever there is a way to
   * go. Each lies where the pelvis is `front` step periods after its heel
   * strike, so the footprints are one even step, at most `longest`, apart in
   * full stride and closer while the pelvis gathers and sheds its speed, and no
   * landing is further ahead of the pelvis than in full stride. Each is turned
   * to the path's heading averaged over one step so a corner is taken over a
   * step, alternately half a step width to either side (the gait's `width`,
   * else `WIDTH`; a run passes its swing share, mid-swing lift and vertical
   * oscillation), the foot behind stepping first and the last two ending at the
   * body's rest separation, facing `face` when given: the two footfalls before
   * the closing pair turn a third and two thirds of the way, a stepping turn,
   * and the closing pair faces the arrival. A walk setting off away from the
   * way it faces turns about over its first footfalls, each foot turning no
   * more per swing than in a standing turn, and a footprint leans its leg no
   * further than the ankle holds (`walkHeading`). The pelvis's heading follows
   * the footprints (`WalkTurn`): at each heel strike it faces midway between
   * the two feet it stands on, so no foot needs more hip rotation than the
   * hip's range. `WalkPace` owns the timing: each step's heel strike comes one
   * step period after the previous; its toe-off one swing (0.8 step periods, 40
   * % of a stride) before its heel strike; the first toe-off comes after the
   * gait's initiation. `walkFoot` owns the rockers of each stance, toes-down by
   * up to 55° at toe-off.
   *
   * With `facing` (`walkFacing.IFacing`), the footprints and the pelvis face it
   * while the footprints still lie along the path: a walk backward, aside or
   * round a target, the side offset taken across the facing.
   *
   * The plan's root is the unconstrained pelvis path; `walkReach` then makes
   * every foot goal reachable on the actual pelvis.
   */
  export import walkSteps = walkStepsLaw;
}
