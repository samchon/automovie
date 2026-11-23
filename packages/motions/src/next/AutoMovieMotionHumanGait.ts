import { run as runLaw } from "../actions/run";
import { walk as walkLaw } from "../actions/walk";
import { walkCadence as walkCadenceLaw } from "../actions/walkCadence";
import { walkLegClearance as walkLegClearanceLaw } from "../actions/walkLegClearance";
import { walkStation as walkStationLaw } from "../actions/walkStation";
import { walkSteps as walkStepsLaw } from "../actions/walkSteps";
import { carry as carryLaw } from "../carrying/carry";
import { HumanProxemics as HumanProxemicsSource } from "../everyday/HumanProxemics";
import { approach as approachLaw } from "../everyday/approach";
import { HUMANOID_GAITS as HUMANOID_GAITSSource } from "../gait/HUMANOID_GAITS";
import { HUMANOID_PROFILE as HUMANOID_PROFILESource } from "../gait/HUMANOID_PROFILE";
import { HumanAidWalk as HumanAidWalkLaw } from "../lexicon/HumanAidWalk";
import { HumanCaneSweep as HumanCaneSweepLaw } from "../lexicon/HumanCaneSweep";
import { HumanCrutchSit as HumanCrutchSitSource } from "../lexicon/HumanCrutchSit";
import { HumanCrutchStairs as HumanCrutchStairsSource } from "../lexicon/HumanCrutchStairs";
import { HumanCrutchWalk as HumanCrutchWalkLaw } from "../lexicon/HumanCrutchWalk";
import { HumanFrailWalk as HumanFrailWalkSource } from "../lexicon/HumanFrailWalk";
import { HumanGait as HumanGaitSource } from "../lexicon/HumanGait";
import { HumanPursuit as HumanPursuitSource } from "../lexicon/HumanPursuit";
import { HumanRaceGait as HumanRaceGaitSource } from "../lexicon/HumanRaceGait";
import { HumanTravelDoor as HumanTravelDoorSource } from "../lexicon/HumanTravelDoor";
import { HUMAN_GAIT_CONFRONT } from "./presets/HUMAN_GAIT_CONFRONT";
import { HUMAN_GAIT_ESCORT } from "./presets/HUMAN_GAIT_ESCORT";
import { HUMAN_GAIT_FOLLOW } from "./presets/HUMAN_GAIT_FOLLOW";
import { HUMAN_GAIT_HURRY } from "./presets/HUMAN_GAIT_HURRY";
import { HUMAN_GAIT_STROLL } from "./presets/HUMAN_GAIT_STROLL";
import { HUMAN_GAIT_SWAGGER } from "./presets/HUMAN_GAIT_SWAGGER";
import { HUMAN_GAIT_TRUDGE } from "./presets/HUMAN_GAIT_TRUDGE";

/**
 * The gaits: walking and running to a floor point, travel relative to a person,
 * passing an opening and walking with a load, with the styled gaits
 * (`IAutoMovieMotionHumanGaitStyled`) and the aided walks
 * (`IAutoMovieMotionHumanGaitAided`), which run the walk's stepping plan.
 *
 * Every gait shares one speed model: a pace is a Froude number `Fr` and the
 * speed is `v = sqrt(Fr g l)` for the hip height `l` (`walk.FROUDE`,
 * `run.GAITS`): a body with a longer leg is faster by the square root of `l`,
 * its step is longer by `l` and its steps a minute fall by the square root of
 * `l`. Every speed and steps a minute stated on these types is at the reference
 * hip, 0.93 m (`walkRoot.REFERENCE_HIP`). `stride` changes the step and the
 * steps a minute inversely and leaves the speed; `manner.pace` multiplies the
 * speed (`IAutoMovieMotionManner.pace`).
 *
 * `WalkPace` and `RunPace` name the closed paces. A style that fixes more than
 * the pace is a preset, data spread into `walk`'s parameters beside the
 * destination: `AutoMovieMotionHumanGait.STROLL`, `HURRY` and `TRUDGE`
 * (`IStridePreset`) and `SWAGGER` (`ICarriagePreset`); a preset adds no method.
 * The approach has presets too: `FOLLOW` and `ESCORT`
 * (`ITrackingApproachPreset`) and `CONFRONT` (`IFacingApproachPreset`). A jog
 * and a sprint fix only the run's pace, so they are `pace: "jog"` and `pace:
 * "sprint"`, with no preset.
 *
 * Every method appends its action to the chain and returns the chain. Its
 * `anchor` is the action's id, unique in the composition, which another action
 * syncs to (`sync({ of })`) or is cut on (`until({ of, event })`).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `walk`: Walking to a floor point in whole steps, ending with the feet side by
 *   side.
 * - `run`: Running to a floor point, at a jog, a run or a sprint: the walk's
 *   footprint plan in a running gait, with a flight phase between stances.
 * - `approach`: Walking up to a person, a prop or a point and stopping at an
 *   interpersonal distance, facing it.
 * - `carryLoad`: Walking to a floor point while carrying a load or pushing a
 *   wheeled one: a bag in one hand, a box in both hands before the body, a
 *   child on the hip, or a cart or stroller pushed by its handle.
 * - `aidWalk`: A floor-aid gait with an explicit prop curve and body fitting on
 *   the same clock.
 * - `crutchWalk`: Walking on two crutches: a crutch gait on the support law, the
 *   crutches advancing on their own track and the body swinging on the hands.
 * - `caneSweep`: Sweep a long cane while walking, performed over the walk.
 * - `walkCadence`: Heel strikes entrained to a beat track: which beat each strike
 *   answers and when it lands, by the linear phase-correction model of
 *   sensorimotor synchronisation (Vorberg and Wing 1996, reviewed by Repp 2005,
 *   Psychon Bull Rev 12:969).
 * - `walkLegClearance`: How far two legs of one body pass into each other, read
 *   as the tangle audit reads them: each leg posed as the posture shows it (its
 *   hip, knee and ankle and its thigh's and shank's rotations, `HumanLegChain`,
 *   and its foot's rotation), and the deepest probe of either leg's thigh,
 *   shank, foot or toes in a segment of the other beyond the probe's own
 *   reference depth there (`AutoMovieMotionHumanAuditTangleModel.excess`).
 * - `walkStation`: A stepping plan walked to keep station on a moving point: a
 *   formation's slot, a steered course, or a person followed.
 * - `walkSteps`: The footstep plan of a walk: footprints, their heel-strike and
 *   toe-off times, each foot's scheduled stance, and the pelvis path, all as
 *   closed functions of seconds.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `STROLL`: The stroll preset: the `slow` walk (about 0.82 m/s at the reference
 *   hip) on steps 0.9 times the pace's, about 94 steps a minute, the arms swung
 *   0.8; leisure, waiting about, a quiet street.
 * - `HURRY`: The hurry preset: the `fast` walk (about 1.72 m/s at the reference
 *   hip) on steps 1.1 times the pace's, about 125 steps a minute, the arms
 *   swung 1.3; late for something, a purposeful errand that is not a run.
 * - `TRUDGE`: The trudge preset: the `slow` walk (about 0.82 m/s at the reference
 *   hip) on steps 0.8 times the pace's, about 106 steps a minute, the arms
 *   swung 0.4; exhaustion, defeat, a long march home.
 * - `SWAGGER`: The swagger preset: the `normal` walk (about 1.5 m/s at the
 *   reference hip), the arms swung 1.5 and the elbows held 20 degrees out;
 *   confidence, a challenge, showing off.
 * - `FOLLOW`: The follow preset: come up behind the person (`from: "behind"`) to
 *   the social distance (`at: "social"`, `HumanProxemics.GAPS`), matching their
 *   speed on the way (`track: "pace"`), as a follower closes the gap.
 * - `ESCORT`: The escort preset: come to the person's left side (`from: "left"`)
 *   at the personal distance (`at: "personal"`, `HumanProxemics.GAPS`),
 *   matching their speed on the way (`track: "pace"`), as an escort takes
 *   station.
 * - `CONFRONT`: The confront preset: step up in front of the person (`from:
 *   "front"`) face to face (`at: "faceToFace"`, `HumanProxemics.GAPS`), as a
 *   confrontation begins.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanGait`: Named ways of going somewhere on foot; the composition gives the
 *   destination.
 * - `HumanPursuit`: Travel relative to another person, each a row of `approach`:
 *   the composition gives the person as the target.
 * - `HumanTravelDoor`: Going through a doorway: travel that squares up before a
 *   named opening of one of the performance's obstacles, passes through its
 *   middle and comes out beyond it.
 * - `HumanFrailWalk`: The walk of a frail older person, graded by `severity` from
 *   the ordinary walk (0) to a shuffle (1): each feature is the ordinary walk's
 *   own value carried linearly toward its frail end.
 * - `HumanRaceGait`: The race walk: a walk driven to a run's speed without a
 *   flight.
 * - `HumanCrutchSit`: Sit down onto a chair with two crutches, or rise from it,
 *   in the prescribed order (Cornell Health and HealthLinkBC, Using crutches).
 * - `HumanCrutchStairs`: Climbing stairs on two crutches: "up with the good, down
 *   with the bad" (HealthLinkBC, Using crutches).
 * - `HumanProxemics`: Interpersonal distance: the gaps people keep, by
 *   relationship and purpose, as the chest-to-target gap an approach stops at.
 * - `HUMANOID_GAITS`: The five canonical humanoid gaits, the locomotion the
 *   `locomote` verb's `gait` enum names
 *   (`walk`/`run`/`sprint`/`sneak`/`march`), as ready {@link IAutoMovieGait}
 *   data a host drops into an actor context.
 * - `HUMANOID_PROFILE`: The canonical humanoid profile fixture: the same
 *   locomotion vocabulary as {@link HUMANOID_GAITS}, packaged as reusable
 *   profile data so a host can bind it onto any humanoid skeleton without
 *   hand-authored TypeScript clips.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanGait} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanGait {
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
   * Named ways of going somewhere on foot; the composition gives the
   * destination. Register the ones a film uses.
   *
   * A style whose speed is one of the walk's or the run's paces is a row of
   * that action: `stroll`, `hurry`, `trudge` and `swagger` fix the walk presets
   * of the same names (`AutoMovieMotionHumanGait.STROLL` and the others,
   * provisional until each style's study is read), and `jog` and `sprint` fix
   * the run's pace alone.
   *
   * A style whose speed no pace has runs the walk's stepping plan in a gait of
   * its own, as the run does, and counts as a walk wherever actions are told
   * apart by kind:
   *
   * - `march` keeps the drill's cadence, 120 steps a minute, and its step, 30
   *   inches (0.762 m) for every marcher, as the regulation prescribes one step
   *   to all so the ranks keep their dress (US Army TC 3-21.5, quick time). The
   *   cadence governs: the way is covered in the whole number of steps nearest
   *   it in drill steps, so over a way that is not a whole number of them the
   *   step gives and the cadence stays.
   * - `doubleTime` keeps 180 steps a minute on the same step, which is a jog's
   *   speed, so it is run in the jog's gait with the count kept.
   * - `prowl` is the sneak on deeply bent knees; `sad` and `proud` carry a mood
   *   in speed, arm swing and trunk; `limp` spares one leg, standing on it
   *   briefly; `drunk` is slow, unsteady in time and wanders off its line. All
   *   provisional, each constant saying what was read and what was not.
   * - `sneak` goes slower than the slow walk on shorter steps, with the pelvis
   *   lowered and the arms held close (provisional values; no study of stealthy
   *   gait has been read).
   */
  export import HumanGait = HumanGaitSource;

  /**
   * Travel relative to another person, each a row of `approach`: the
   * composition gives the person as the target. Register the ones a film uses.
   *
   * `follow` and `escort` go where the person goes: the stop is taken where the
   * person comes to rest, read from their placed actions, and the pursuer sets
   * off late enough to arrive just after them. So the person pursued is
   * composed before the pursuer (`leader.with(follower)`), and a pursuit
   * composed the other way round is refused, saying so. First pass: the pursuer
   * does not match the person's speed on the way or keep a gap through their
   * turns. `confront` steps up to a person where they stand.
   *
   * `intercept` heads a moving person off, running to where they will be, and
   * `chase` is a row of it: a chase runs. `flee` is the opposite travel: a run
   * straight away from a person, read where they are when it begins. It is a
   * law of its own over the run, since its destination comes from the person
   * and not from the scene.
   */
  export import HumanPursuit = HumanPursuitSource;

  /**
   * Going through a doorway: travel that squares up before a named opening of
   * one of the performance's obstacles, passes through its middle and comes out
   * beyond it. Register `HumanTravelDoor.passThrough` to use it.
   *
   * The walker passes two places on the opening's own line, one of its own
   * steps at its pace before the sill and one beyond it (`walk.walking`, the
   * step `1.2 l Fr^0.25` of Alexander's walking model), so the last footfall
   * before the opening and the first after it lie on that line and the body
   * crosses the opening at right angles to its width wherever the walk began.
   * The walk itself asks the obstacles about each stretch (`walkClear`), so an
   * opening narrower than the walker's chest or lower than the walker stands is
   * refused there with the measure it would need. First pass: the leaf of a
   * door is not opened or held; an opening is a hole.
   *
   * A `duck`, `squeeze` or `crawl` mode hands the same opening to
   * `planReducedOpening`, which fits that posture through the solid's whole
   * depth and refuses with the width or headroom the posed body needs.
   */
  export import HumanTravelDoor = HumanTravelDoorSource;

  /**
   * The walk of a frail older person, graded by `severity` from the ordinary
   * walk (0) to a shuffle (1): each feature is the ordinary walk's own value
   * carried linearly toward its frail end.
   *
   * - Speed: the Froude number at the shuffle's end is that of 0.6 m/s at the
   *   reference hip, the gait speed below which an older adult is frail
   *   (Studenski et al. 2011, JAMA 305:50).
   * - Step length: `STEP` of the ordinary step at the shuffle's end, the shortest
   *   step the walk admits; older adults shorten the step before they slow the
   *   cadence (Winter et al. 1990, Phys Ther 70:340).
   * - Toe clearance: the swing's lift falls to `LIFT` of the ordinary one, the
   *   low foot of a shuffle (Winter et al. 1990).
   * - Trunk flexion: the forward lean grows to `LEAN` degrees, the stooped trunk
   *   of advanced age (provisional, of the order kyphotic walkers show).
   * - Arm swing: falls to `ARMS` of the ordinary swing (provisional).
   * - Step width: widens to `WIDTH` hip heights, a wider base (provisional).
   * - Double support: the swing shortens to `SWING` step periods, so both feet
   *   stand `1 - SWING` of each step instead of a fifth; older adults lengthen
   *   their double support (Winter et al. 1990).
   * - Toe clearance: the least clearance of the swinging foot falls to
   *   `CLEARANCE` metres, the low end of older adults' (Begg et al. 2007).
   * - Turning in place: each step turns by the same share of a hip's usable twist
   *   as the step keeps of its length, so a frail half turn takes more, shorter
   *   steps (provisional: the shortened step carried to the turn).
   *
   * The values are provisional where marked.
   */
  export import HumanFrailWalk = HumanFrailWalkSource;

  /**
   * The race walk: a walk driven to a run's speed without a flight. World
   * Athletics rule TR54.2 defines it: one foot is always on the ground, and the
   * advancing leg is straight from its first contact until it passes under the
   * body. So the swing takes almost the whole step and the double support
   * shrinks to a sliver (`SWING`), the pelvis barely rises (the flattened bob,
   * `BOB`), and the arms pump with the elbows near a right angle (`ARMS`). Its
   * speed is a Froude number of `FROUDE`, about 2.9 m/s on a 0.93 m hip, a club
   * walker's pace (elite 20 km walkers keep near 4 m/s on longer steps than the
   * walk's hip range admits here).
   *
   * Not yet: the pelvis's transverse rotation that lengthens the elite step,
   * and a stance knee locked straight by its own rule rather than by the walk's
   * contact flexion.
   */
  export import HumanRaceGait = HumanRaceGaitSource;

  /**
   * Sit down onto a chair with two crutches, or rise from it, in the prescribed
   * order (Cornell Health and HealthLinkBC, Using crutches).
   *
   * Sitting (`crutchSitDown`): the hands take the standing crutches' grips
   * (`taken`) as the injured leg lifts off the floor; both crutches are
   * gathered into the injured side's hand (`gathered`); the sound hand reaches
   * back to the chair's armrest or seat (`reached`); and the sit law lowers the
   * body while the crutches tilt on their planted tips. Rising (`crutchSitUp`):
   * the rise law stands the body on the sound leg while the sound hand pushes
   * on the chair and the crutches come back upright; the sound hand takes its
   * crutch back (`taken`), and both are planted in the tripod (`planted`). The
   * injured leg is held off the floor throughout.
   *
   * Both arms are laid as one course (`courseArmGoal`) from the second the
   * hands hold the crutches. The crutches are held, never leaned on: the hands
   * carry them by grip windows, a wear and holds.
   */
  export const HumanCrutchSit: typeof HumanCrutchSitSource =
    HumanCrutchSitSource;

  /**
   * Climbing stairs on two crutches: "up with the good, down with the bad"
   * (HealthLinkBC, Using crutches). The hands take the handgrips on both feet,
   * then the injured leg is held off the steps (`HELD`), its foot first lifted
   * clear over its place (`crutchHeldLeg`). Going up, each step first sets the
   * sound foot down on the next tread while the crutches stay planted
   * (`footUp<n>`), then lifts both crutches up and over the nosing onto that
   * tread (`crutchUp<n>`); going down, each step first moves both crutches over
   * and down onto the next tread (`crutchDown<n>`), then sets the sound foot
   * down beside them (`footDown<n>`). A foot's ball and a crutch's tip come
   * down `ON` of the tread back from its front edge. The flight starts at the
   * floor the body and the crutches enter on, so a descent is staged on its top
   * landing and never below the floor plane. The flight's riser and tread are
   * bounded as the climb bounds them (`climbStairsFlight`: a riser above 0.35
   * of the hip height, a tread shorter than 0.6 of the foot, refused), since
   * the climb is the sound leg's single step-up or step-down. The crutch props
   * share the climb's clock (`track`), so the scene's crutches and the body
   * read one course: the hands hold their grips where each crutch stands at
   * every support key and ride its move between them (`carryCrutchHands`), and
   * the injured leg is raised by the instant the first step's foot lifts.
   *
   * Each step takes `seconds`, 2 s when absent (provisional, missing a study),
   * after an opening of a quarter of a step in which the hands take the grips.
   */
  export const HumanCrutchStairs: typeof HumanCrutchStairsSource =
    HumanCrutchStairsSource;

  /**
   * Interpersonal distance: the gaps people keep, by relationship and purpose,
   * as the chest-to-target gap an approach stops at.
   *
   * Hall (1966, The Hidden Dimension) divides the space around a person into
   * zones by the interaction they afford, each with a close and a far phase:
   * intimate under 0.45 m, personal 0.45 to 1.2 m (close 0.45 to 0.75, far 0.75
   * to 1.2), social 1.2 to 3.6 m (close 1.2 to 2.1) and public beyond. The
   * named gaps here sit inside those zones:
   *
   * - `intimate` 0.3 m, the middle of the intimate far phase (0.15 to 0.45);
   * - `faceToFace` 0.6 m, the middle of the personal close phase, where two
   *   people stand squared up within arm's reach;
   * - `personal` 1.0 m, the far phase where conversation between acquaintances
   *   happens (Hall; Hayduk 1978, Psychol Bull 85:117, reviews measured
   *   comfortable distances of the same order, larger in front than behind);
   * - `fighting` 1.5 m, the middle of the 1.01 to 2.00 m two taekwondo fighters
   *   keep for 60 % of a fight (Maloney, Renshaw and Farrow 2021, Int J Perf
   *   Anal Sport 21:993, the kicking sport measured), where a kickboxing or
   *   karate bout squares off out of punching reach;
   * - `social` 1.6 m, the middle of the social close phase, impersonal business;
   * - `handing`: the gap at which both people's hands meet midway between their
   *   chests with the elbows flexed 35 degrees, the middle of the 20 to 50
   *   degrees the campaign assumes for a comfortable handover (provisional:
   *   Kopnarski et al. 2023 report where a handover happens, not at what
   *   distance), at the handover height midway between the two waists and
   *   chests (provisional).
   *
   * A gap is horizontal, measured from the front of the performer's chest (the
   * sternum region) to the target point: another person's sternum, a prop's
   * point or a free point.
   */
  export import HumanProxemics = HumanProxemicsSource;

  /**
   * The five canonical humanoid gaits, the locomotion the `locomote` verb's
   * `gait` enum names (`walk`/`run`/`sprint`/`sneak`/`march`), as ready
   * {@link IAutoMovieGait} data a host drops into an actor context. Same role as
   * the engine's other canonical humanoid tables (ROM, joint axes): the shapes
   * are fixed, a body is what varies.
   *
   * Every gait is tuned to sit inside the humanoid ROM, which is the whole
   * reason `neutral` exists. Knees (flexion `[0, 150]°`, no hyperextension)
   * swing about a bent center; and the faster gaits carry the hips forward too:
   * a sprint's `±amplitude` swing would cross the hip's `−30°` floor without a
   * forward `neutral`. Slower is calmer: `sneak` crouches (a high knee center)
   * and holds the ground longer (high `duty`); `march` throws the knees high;
   * `sprint` is all reach and little contact (low `duty`).
   *
   * Left/right limb pairs are a half-cycle out of phase, and each upper arm
   * shares the opposite upper leg's phase for contralateral counter-swing.
   * These rows drive hips, knees and upper arms; performShot's later stance
   * stage owns ground-contact IK.
   *
   * `locomote` carries the authored gait as `fullBody`. Layer safety is decided
   * from the root/bones/expression the synthesized clips actually carry after
   * masking, not from the broad region names: this counter-swing can layer with
   * a head-only look, but correctly conflicts with a simultaneous arm gesture.
   *
   * Periods are seconds, phases are turns and angular channels are degrees.
   * These are conventional schematic performance targets rather than measured
   * anatomical motion capacities. Module-owned rows are shared by every profile
   * context; the engine validates and samples them. Fixed table construction
   * happens once and retains no per-frame task or host resource.
   */
  export const HUMANOID_GAITS: typeof HUMANOID_GAITSSource =
    HUMANOID_GAITSSource;

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

  /**
   * The stroll preset: the `slow` walk (about 0.82 m/s at the reference hip) on
   * steps 0.9 times the pace's, about 94 steps a minute, the arms swung 0.8;
   * leisure, waiting about, a quiet street. Spread into `walk`'s parameters
   * with the destination; the `stroll` row of `HumanGait` fixes these values.
   * The scales are provisional until a study of strolling is read.
   */
  export const STROLL: typeof HUMAN_GAIT_STROLL = HUMAN_GAIT_STROLL;

  /**
   * The hurry preset: the `fast` walk (about 1.72 m/s at the reference hip) on
   * steps 1.1 times the pace's, about 125 steps a minute, the arms swung 1.3;
   * late for something, a purposeful errand that is not a run. Spread into
   * `walk`'s parameters with the destination; the `hurry` row of `HumanGait`
   * fixes these values. The scales are provisional until a study of hurried
   * walking is read.
   */
  export const HURRY: typeof HUMAN_GAIT_HURRY = HUMAN_GAIT_HURRY;

  /**
   * The trudge preset: the `slow` walk (about 0.82 m/s at the reference hip) on
   * steps 0.8 times the pace's, about 106 steps a minute, the arms swung 0.4;
   * exhaustion, defeat, a long march home. Spread into `walk`'s parameters with
   * the destination; the `trudge` row of `HumanGait` fixes these values. The
   * scales are provisional until a study of weary walking is read.
   */
  export const TRUDGE: typeof HUMAN_GAIT_TRUDGE = HUMAN_GAIT_TRUDGE;

  /**
   * The swagger preset: the `normal` walk (about 1.5 m/s at the reference hip),
   * the arms swung 1.5 and the elbows held 20 degrees out; confidence, a
   * challenge, showing off. Spread into `walk`'s parameters with the
   * destination; the `swagger` row of `HumanGait` fixes these values. The
   * scales are provisional until a study of the swagger is read.
   */
  export const SWAGGER: typeof HUMAN_GAIT_SWAGGER = HUMAN_GAIT_SWAGGER;

  /**
   * The follow preset: come up behind the person (`from: "behind"`) to the
   * social distance (`at: "social"`, `HumanProxemics.GAPS`), matching their
   * speed on the way (`track: "pace"`), as a follower closes the gap. Spread
   * into `approach`'s parameters with the person; the `follow` row of
   * `HumanPursuit` fixes these values.
   */
  export const FOLLOW: typeof HUMAN_GAIT_FOLLOW = HUMAN_GAIT_FOLLOW;

  /**
   * The escort preset: come to the person's left side (`from: "left"`) at the
   * personal distance (`at: "personal"`, `HumanProxemics.GAPS`), matching their
   * speed on the way (`track: "pace"`), as an escort takes station. Spread into
   * `approach`'s parameters with the person; the `escort` row of `HumanPursuit`
   * fixes these values.
   */
  export const ESCORT: typeof HUMAN_GAIT_ESCORT = HUMAN_GAIT_ESCORT;

  /**
   * The confront preset: step up in front of the person (`from: "front"`) face
   * to face (`at: "faceToFace"`, `HumanProxemics.GAPS`), as a confrontation
   * begins. Spread into `approach`'s parameters with the person; the `confront`
   * row of `HumanPursuit` fixes these values.
   */
  export const CONFRONT: typeof HUMAN_GAIT_CONFRONT = HUMAN_GAIT_CONFRONT;

  /**
   * The canonical humanoid profile fixture: the same locomotion vocabulary as
   * {@link HUMANOID_GAITS}, packaged as reusable profile data so a host can bind
   * it onto any humanoid skeleton without hand-authored TypeScript clips.
   *
   * Object.values allocates the gait array once at module load in declared key
   * order; its elements alias the owning gait table. Drivers and limits are
   * empty, so this profile adds no control or ROM enforcement. Hosts must not
   * mutate the shared rows, and the profile retains no process or renderer
   * state.
   */
  export const HUMANOID_PROFILE: typeof HUMANOID_PROFILESource =
    HUMANOID_PROFILESource;
}
