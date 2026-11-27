import { stand as standLaw } from "../actions/internal/stand";
import { standUpright as standUprightLaw } from "../actions/internal/standUpright";
import { bend as bendLaw } from "../everyday/internal/bend";
import { brace as braceLaw } from "../everyday/internal/brace";
import { braceOnThigh as braceOnThighLaw } from "../everyday/internal/braceOnThigh";
import { crouch as crouchLaw } from "../everyday/internal/crouch";
import { curtsy as curtsyLaw } from "../everyday/internal/curtsy";
import { rest as restLaw } from "../everyday/internal/rest";
import { shift as shiftLaw } from "../everyday/internal/shift";
import { shiftStandingWeight as shiftStandingWeightLaw } from "../everyday/internal/shiftStandingWeight";

/**
 * The stance family's laws, each the shipped function under its family name
 * (`AutoMovieMotionHumanStance`), with its own comment.
 */
export namespace AutoMovieMotionHumanStanceLaws {
  /**
   * Quiet standing: both feet planted where they are (or under the hips when
   * entered from the air), the pelvis settling over them, the column upright on
   * the plumb line and inclined slightly forward at the ankles
   * ({@link standUpright}), arms hanging relaxed, and the body swaying
   * slightly.
   *
   * The feet keep their entry plants so a stop never slides them; a foot that
   * was not planted lands at its rest place beside the other. The root moves
   * from its entry position to the midpoint of the feet over the first 0.5 s on
   * a minimum-jerk profile and sits 5 mm below full extension so the knees are
   * not locked. A planted foot keeps the heading it stands at, a flat sole
   * turned on the floor sliding across it; a foot set down turns out 7° from
   * the heading, the mean adult foot progression angle (Perry and Burnfield,
   * Gait Analysis, 2nd ed.). Arms hang relaxed (`relaxed`): 12° of elbow
   * flexion, the hand in its position of rest (`HumanHand.shape`, relaxed), and
   * the least shoulder abduction that hangs the hand beside the thigh, its
   * digits clear of the body, read on the stance the feet settle in
   * (`standClearArms`), so a staggered or wide stance kept from the entry hangs
   * its arms clear of its own thighs. Postural sway moves the root on two
   * seeded smooth signals below 1 Hz, side to side and front to back in the
   * body's frame, with an RMS of 3 mm for an elite and 4.8 mm for a novice:
   * quiet-stance centre-of-pressure sway of healthy adults is a few millimetres
   * RMS (Prieto et al. 1996), and experts sway less (Perrin et al. 2002,
   * provisional factor 1.6); a given `sway` replaces that RMS, and 0 stands
   * still. The window of the noise keeps the start and the end of the stand
   * exact. A law acting with one side that stands on this law's body passes
   * that side (`plan`'s `side`): the side-to-side draw is signed in that side's
   * frame, so a left action's sway is the mirror of a right one's for every
   * seed, its statistics unchanged.
   */
  export import stand = standLaw;

  /**
   * Shifting along a bench while seated: the seat socket slides sideways along
   * the seat by the requested distance, while the feet stay planted and the
   * hands stay on the thighs.
   *
   * The goal is the socket's path; the root follows with the seated pitch kept,
   * and the legs and hands are solved by inverse kinematics. A seated person
   * edges along by unweighting the buttocks, not by lifting them off: the seat
   * bears throughout, sliding, so the body never stands on its feet alone with
   * its centre of mass behind them, and the socket keeps to the seat on the
   * slide's minimum-jerk share `s`; the slide lasts `0.6 + |d|` seconds for `d`
   * metres (provisional). The feet do not step, so a shift is limited to what
   * the planted legs allow sideways: 0.35 thigh lengths, which turns each thigh
   * about 19 degrees in abduction or adduction, inside their 30 degree range
   * (provisional); a longer shift is refused and takes several shifts, as
   * people edge along a bench a few tens of centimetres at a time.
   *
   * On a seat above 1.2 of the popliteal height, where a foot is off the floor,
   * the shift is refused: getting off and sitting down again moves the body
   * there.
   *
   * Events `seatOff` (the buttocks unweighted as the slide starts) and
   * `seatContact` (bearing fully again as it ends).
   */
  export import shift = shiftLaw;

  /**
   * Bending down to bring a hand to a low point (the floor, a low shelf, a note
   * on the ground) with the feet planted, by a stoop, a squat or a semi-squat,
   * then straightening up.
   *
   * The goal is the palm on the target, facing it from above. The body is found
   * from that goal: the strategy sets how far the hips drop, to the height the
   * body's own leg keeps at the strategy's knee flexion (a stoop's knees as
   * straight as a planted leg holds them, a semi-squat's 90 degrees, a squat's
   * 135, Washmuth, McAfee and Bickel 2022; `bendLower.hipShare`), and the trunk
   * then inclines forward just enough to bring the shoulder within the arm's
   * reach of the target (`bendLower.REACH`, where freely reaching people lean
   * in, of the arm's length plus the palm's offset), found by bisection. A
   * stoop carries its measured hip retreat from Kim and Yoo (2018). An
   * explicitly balanced bend may add a shift. The inclination is shared by the
   * lumbopelvic rhythm of forward bending: about 40 degrees of lumbar flexion
   * against 70 of hip flexion at full bending (Esola et al. 1996, Spine 21:71),
   * so the pelvis pitches 0.64 of it, the lumbar spine flexes 0.28 and the
   * thorax 0.08 (`HumanTrunk.incline`). The legs are solved onto the planted
   * feet, lowering the pelvis where a leg could not reach
   * (`lowerHumanPosture`); a squat, which outruns the ankles' 20 degree
   * dorsiflexion range, lets the heels rise up to 30 degrees, the feet rolling
   * on their balls (provisional). The arm goes onto the palm's goal and the
   * gaze onto the target, and the free hand braces on its own thigh just above
   * the knee (Kingma, Faber and van Dieen 2016, J Biomech 49:881, on supporting
   * the trunk with a hand on the thigh while lifting). No lifting technique is
   * shown to be better than another (van Dieen, Hoozemans and Toussaint 1999,
   * Clin Biomech 14:685), so `auto` takes the semi-squat for targets below
   * mid-shank and the stoop above, the rule the campaign sets, and squats where
   * the semi-squat cannot reach (a short-armed body cannot reach the floor from
   * a semi-squat).
   *
   * The descent takes the time of a movement that stops on a target for the
   * hand's travel, the package's timing owner for aimed movements
   * (`AutoMovieMotionHumanTiming.aimed`, McIntosh et al. 2018's two-factor fit,
   * the palm's target a point), scaled from 1.4 to 1.0 by the `speed` axis; the
   * hand holds for `hold` seconds and the rise takes the same time. Events:
   * `contact` and `deepest` at the bottom, `upright` at the end. A target the
   * strategy cannot reach is refused with the lowest height it reaches.
   */
  export import bend = bendLaw;

  /**
   * A crouch or a squat held in place: the hips sink over the planted feet to a
   * knee flexion the depth names, the trunk inclines over the feet, the hands
   * come to rest on the thighs above the knees, the body holds, then stands
   * again.
   *
   * The depth is a knee flexion, not a height, so one depth fits every body:
   * `partial` is the parallel squat of about 100 degrees (Escamilla 2001, Med
   * Sci Sports Exerc 33:127) and `full` the deep squat at the knee's range end
   * of 150 degrees, inside the 141.6 degrees measured in kneeling (Acker et al.
   * 2011, J Arthroplasty 26:319) and below the 157 +- 6 degrees of a heels-up
   * squat (Hemmerich et al. 2006, J Orthop Res 24:770), which the range table
   * does not reach. The shank tilts forward by the crouching ankle's
   * dorsiflexion (`ANKLE`, within the range table's), plus the heel lift when
   * the heels are up (the foot pivots about its toes' joint, which stays on the
   * floor), and the thigh takes the rest of the knee flexion, so the hip
   * joint's place over the ankle follows from the leg's two lengths. On the way
   * down the shank and the thigh tilt together, each by the descent's share of
   * its own tilt, so the hips follow the leg's arc and the ankle never passes
   * its range: the heel stays down until the ankle reaches the range and then
   * rises by the rest, the heel-off of a range-limited ankle. A depth whose
   * thigh angle and the hip's flexion range leave no room for the trunk is
   * refused with the deepest knee flexion the heels allow: a full squat with
   * flat heels leaves the thigh past the hip's range at the crouching ankle, so
   * it asks for `heels: "up"`.
   *
   * The trunk inclines to the squat's measured key (`INCLINE`) by the same
   * share as the legs. When the caller opts into balance, the lumbar joint
   * turns the trunk by the nearest angle that brings the centre of mass over
   * the measured soles. One rigid rotation describes the changed mass points.
   * See Hof, Gazendam and Sinke (2005) for the static support criterion. The
   * inclination is shared by the lumbopelvic rhythm: the pelvis tilts about the
   * hips as far as the folded thighs leave the hip room and the spine flexes
   * for the rest, the rounded back of a deep squat (`HumanTrunk.incline`); the
   * hands rest on the thighs just above the knees, as people support the trunk
   * on the thighs (Kingma, Faber and van Dieen 2016, J Biomech 49:881). The
   * descent takes 1.0 s for a partial squat (half a self-paced repetition,
   * Hannan and King 2022) and that times the square root of the full squat's
   * greater knee travel, about 1.22 s, for a full one (`DESCENT`) at the
   * reference hip (`REFERENCE_HIP`) height, scaled by the square root of the
   * hip height (dynamic similarity, Alexander 1984) and by the manner's tempo,
   * the hold `hold` seconds and the rise as long as the descent. Events:
   * `descend` at the start, `lowest`, `ascend`.
   */
  export import crouch = crouchLaw;

  /**
   * Bracing for an expected impact, push or a falling body: the stance widens
   * and staggers along the line of the coming force, the body lowers and leans
   * into it, and the hands come up in front, all set before the force arrives.
   *
   * People preparing for a predictable perturbation adjust their posture in
   * advance, anticipatory postural adjustments (Massion 1992, Prog Neurobiol
   * 38:35): they enlarge the base of support along the expected force, lower
   * the centre of mass and lean against the force, keeping the feet in place
   * once set (Horak and Nashner 1986, J Neurophysiol 55:1369; Maki and McIlroy
   * 1997, Phys Ther 77:488, on changing the base of support). The goals: the
   * foot on the side away from the force steps back along the force's line by
   * `STAGGER` leg lengths and out until the feet stand a shoulder width apart
   * (a staggered, wider base); the pelvis drops until the knees flex `KNEE`
   * degrees over the middle of the new base. A requested hip or lumbar
   * correction uses the actual bearing sole or soles. The trunk inclines 10
   * degrees toward the force; and both palms come up ahead of the chest's front
   * surface (its sternum region) along the force, facing it for an `impact` or
   * a `push`, turned up and lower to receive a `catchBody`. The arms rise from
   * the entry's and hold the palms there as one trajectory planned clear of the
   * body (`AutoMovieMotionHumanArmPlanned`, through `gestureHands.planned`), so
   * no forearm passes through the trunk on the way. Step size, drop and lean
   * have no measured source (Massion describes the adjustments, not these
   * magnitudes). The stepping foot swings over 0.4 s, a walking swing (Perry
   * and Burnfield; Pachi and Ji 2005), with a 3 cm lift, and the set is reached
   * at `set`, 0.5 s after the start, the end of the 400 to 500 ms in which
   * early postural adjustments precede a predictable impact (Krishnan, Latash
   * and Aruin 2012), and held for the rest of the action.
   *
   * The force comes from `toward` (a person, prop or point the force comes
   * from) or from straight ahead when absent.
   */
  export import brace = braceLaw;

  /**
   * Standing with the hands at rest places: in the front pockets, on the hips,
   * arms crossed, clasped in front or behind, behind the head, or the chin on a
   * fist, each hand moved there and held.
   *
   * Every rest place is an effector goal on the body's own surface: a hand
   * surface is laid on a region with the palm facing into it; the palm and fist
   * sockets lie on the hand's own collider surface, so a laid hand touches the
   * region rather than sinking into it ({@link HumanHand}). The places, with the
   * surface and region each uses:
   *
   * - `side`: no goal; the arm hangs relaxed as the stand law holds it.
   * - `pocket`: the palm on the front pocket region of the same side's thigh,
   *   fingers down, as a hand slipped into a front pocket shows from outside.
   * - `hip`: the palm on the side of the pelvis midway between the hip region and
   *   the waist, fingers forward and down, elbow out (akimbo).
   * - `crossed`: each palm lies on the front of the other upper arm three
   *   quarters of the way to its elbow, fingers round its outside, so the
   *   forearms cross in front of the lower chest. Each arm's pose depends on
   *   the other's goal, so both upper arms are set first: hanging forward at
   *   least 20 degrees (provisional) and enough for the forearms to clear the
   *   chest, the elbows drawn in until each palm lies one forearm from its own
   *   elbow; each elbow's hint is then that elbow, so the solved arms are the
   *   arms the palms were laid on.
   * - `claspedFront`: the left palm lies on the front of the pelvis, at the
   *   height a slightly flexed arm reaches, and the right palm on the back of
   *   the left hand; each hand continues its forearm (`restClasped`).
   * - `claspedBehind`: the back of the left hand rests on the sacrum, palm facing
   *   back, and the back of the right hand lies in the left palm
   *   (`restClasped`).
   * - `behindHead`: each palm on the back of the head beside the midline, elbows
   *   wide.
   * - `chinRest`: the top of the fist under the chin, fingers up and palm facing
   *   in, the elbow low and forward; with both hands, the chin on both fists,
   *   which meet at the midline.
   * - `elbowSupport`: the palm under the other arm's elbow while that hand is at
   *   `chinRest`, the thinking pose.
   *
   * The arms are carried together in joint angles from where the entry left
   * them to their places on one minimum-jerk course
   * (`AutoMovieMotionHumanArm.carry`), the fingers taking the places' shapes on
   * the same course, over the free-space time of the farther hand's distance
   * (`AutoMovieMotionHumanTiming.transport`), and hold there: two hands sent at
   * once to targets of unequal distance arrive together (Kelso, Southard and
   * Goodman 1979, Science 203:1029). The places are solved once, on the body as
   * it stands when the last hand arrives, and the arms hold those angles, so
   * the place follows the body the arms hang from: breathing and sway carry the
   * hands with it. A hand at `side` is not moved.
   */
  export import rest = restLaw;

  /**
   * A small ceremonial curtsy. The Royal Household describes a small curtsy as
   * a traditional optional greeting
   * (https://www.royal.uk/encyclopedia/greeting-the-king-and-queen). Canadian
   * Heritage describes placing the right foot behind the left heel and bending
   * the knees slightly
   * (https://www.canada.ca/en/canadian-heritage/services/meeting-royal-family.html).
   * Melinda Coy's 2019 Practical Etiquette guide for Dickens Fair performers
   * teaches a rear step and a flat-footed dip
   * (https://static1.squarespace.com/static/5bae69697fdcb819deb44456/t/68e2f5d69da9b523c4d22f95/1759704534424/Practical%2BEtiquette.pdf).
   * The performer transfers onto one leg, sets the other foot across and behind
   * it, dips with both feet grounded, rises, then uncrosses and restores the
   * entry stance. The depth, phase durations and step margins are provisional
   * staging choices.
   *
   * This floor variant uses flat feet in the dip. The heel and toes stay on the
   * floor in each plant. The law refuses a body or stance whose solved feet
   * fail the plant, clearance or reach checks at the key poses and the
   * intervening witnesses. The arms, hands and head are available for layers.
   *
   * Register with HumanChain.extend({ curtsy }) and HumanPerformance's laws.
   * Enter from standing and cut into another action only after recovery.
   */
  export const curtsy: typeof curtsyLaw = curtsyLaw;

  /**
   * The upright alignment of a body's quiet stance, solved from the body's own
   * joints by forward kinematics, once per body.
   *
   * Clinical standing alignment puts the ear, the shoulder joint and the hip
   * joint on one vertical line, the plumb line of Kendall (Kendall, McCreary
   * and Provance, Muscles: Testing and Function), with the head level so the
   * gaze is horizontal, and the whole body inclines slightly forward at the
   * ankles so the centre of mass lies a few centimetres in front of the ankle
   * joints (Winter 1995, "Human balance and posture control during standing and
   * walking", Gait & Posture 3). A rig's rest column need not stand so: the
   * polygon man's shoulders rest behind its hips. The alignment therefore fits
   * the plumb line: equal spine and chest flexion (Brent's minimisation within
   * ±15°) and neck flexion (a bracketed root within a comfortable ±20°) that
   * minimise the squared horizontal distances of the shoulder joints' midpoint
   * and the head joint, the ear's proxy, from the hip joints' vertical, since a
   * simplified neck need not let all three stack exactly; head flexion that
   * levels the head's forward axis. The planted entry places the hip joints
   * ahead of the ankles by the early quiet-standing separation, scaled by hip
   * height to preserve the posture's proportions across rigs.
   */
  export import standUpright = standUprightLaw;

  /**
   * An intentional lateral pelvis shift with both feet planted on the ground.
   * Time to shift, time to hold, and optional time to return are authored
   * independently. The respective transition events are shifted, release and
   * returned, with the last two present only on a return.
   *
   * A force-plate study of prolonged standing observed spontaneous lateral
   * shifts with both feet on the ground
   * (https://stacks.cdc.gov/view/cdc/224979). Center-of-pressure shifts
   * (https://pubmed.ncbi.nlm.nih.gov/9924098/) reflect force distribution. The
   * law takes an authored pelvis distance and checks the fitted body's static
   * center-of-mass margin at entry, midway and at the held displacement. The
   * default transfer time of 0.8 s is provisional. This law models kinematic
   * staging and leaves individual foot loads and dynamics unspecified.
   */
  export const shiftStandingWeight: typeof shiftStandingWeightLaw =
    shiftStandingWeightLaw;

  /**
   * A palm carried from the angles the arm held onto its own thigh just above
   * the knee (`braceOnThighPoint`), the hand support of a low posture, read on
   * the legs the action has placed.
   *
   * @param body The body.
   * @param side The hand and thigh.
   * @param rest The arm's angles at weight 0.
   * @param duration The action's duration, seconds; the arm is written over all
   *   of it.
   * @param weight How far the palm is on the thigh at a second, in [0, 1].
   * @param span The reach, hold and return instants, when the caller has them.
   * @param group The other arm on the same body.
   * @param apart Whether the grouped arms remain on their own sides.
   * @returns The primitive, on the arm's channel.
   */
  export const braceOnThigh: typeof braceOnThighLaw = braceOnThighLaw;
}
