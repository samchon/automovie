import { bedsidePerch as bedsidePerchLaw } from "../everyday/bedsidePerch";
import { crossAnkleOverKnee as crossAnkleOverKneeLaw } from "../everyday/crossAnkleOverKnee";
import { kneel as kneelLaw } from "../everyday/kneel";
import { rise as riseLaw } from "../everyday/rise";
import { seated as seatedLaw } from "../everyday/seated";
import { seatedHeelBounce as seatedHeelBounceLaw } from "../everyday/seatedHeelBounce";
import { sit as sitLaw } from "../everyday/sit";
import { HUMAN_SEAT_KNEEL_BRIEFLY } from "./presets/HUMAN_SEAT_KNEEL_BRIEFLY";
import { HUMAN_SEAT_KNEEL_SIT } from "./presets/HUMAN_SEAT_KNEEL_SIT";
import { HUMAN_SEAT_TAKE_A_KNEE } from "./presets/HUMAN_SEAT_TAKE_A_KNEE";

/**
 * The seated postures and their transitions: sitting down, rising and kneeling.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `sit`: Sitting down on a chair, bench or stool from standing in front of it:
 *   the body's seat socket is lowered onto the seat while the trunk leans
 *   forward and the feet stay where they stand.
 * - `rise`: Standing up from a seat, in the four phases of sit-to-stand
 *   (Schenkman, Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion
 *   momentum, where the trunk flexes forward while the seat still bears the
 *   weight; momentum transfer at seat-off, where the hips leave the seat and
 *   the body moves forward over the feet; extension of the hips and knees; and
 *   stabilisation.
 * - `kneel`: Kneeling from standing: on one knee (half kneel), on both knees
 *   upright, or sitting back on the heels, held, then rising the way it went
 *   down.
 * - `crossAnkleOverKnee`: Cross one ankle over the other knee while seated, hold,
 *   and put the foot back.
 * - `seatedHeelBounce`: Repeated seated heel raises, with the moving foot rocking
 *   about its ball.
 * - `bedsidePerch`: Sit on a fixed bed's long edge, pause, then stand.
 * - `seated`: The geometry every seat law shares: where on a seat the body's seat
 *   socket rests, the root that puts it there under a trunk pitch, whether a
 *   seat suits the body, and the hands resting on the thighs.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `TAKE_A_KNEE`: The takeAKnee preset of `kneel`: Kneeling on one knee and
 *   staying three seconds without rising (provisional).
 * - `KNEEL_BRIEFLY`: The kneelBriefly preset of `kneel`: Kneeling, staying one
 *   second and rising again (provisional).
 * - `KNEEL_SIT`: The kneelSit preset of `kneel`: Sitting back on the heels from
 *   both knees and staying three seconds (provisional).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanSeat} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanSeat {
  /**
   * Sitting down on a chair, bench or stool from standing in front of it: the
   * body's seat socket is lowered onto the seat while the trunk leans forward
   * and the feet stay where they stand.
   *
   * Stand-to-sit is the rise reversed under eccentric control (Kralj, Jaeger
   * and Munih 1990, J Biomech 23:1123): the hips travel back and down, the
   * trunk flexes forward to keep the weight over the feet until the seat takes
   * it, then the trunk settles into the seated posture. The goal is the seat
   * socket on its point on the seat ({@link seated}); the root follows from that
   * goal and the trunk's pitch, the planted legs and the hands are solved by
   * inverse kinematics. The socket moves back over the first 70 % of the
   * descent, no further than keeps the centre of mass where it stands over the
   * feet until a pendulum's time constant before contact (Hof, Gazendam and
   * Sinke 2005), over which the body comes down onto the seat, and down from 10
   * % to its end, so it reaches the seat from above; the trunk pitches forward
   * to its peak by 45 % of the descent and settles after contact; each hand is
   * brought to its rest along the arm trajectory planner's path, onto its
   * armrest as the seat takes the body, the two supports loaded together where
   * the armrest lies nearest the shoulder, or, with none, onto its thigh from
   * contact to seated, once the thighs no longer rise under it, the fingers
   * straightening to lie flat.
   *
   * Peak trunk flexion `35 + 50 (1 - r)` degrees and descent time `2 (1 + 0.6
   * (1 - r))` seconds for a seat at `r` of the popliteal height (provisional
   * coefficients; a lower seat needs more trunk flexion and more time, Janssen,
   * Bussmann and Stam 2002, and sit-to-stand takes about 1.5 to 2.5 s in
   * healthy adults). Contact comes at 75 % of the descent. The seated back is
   * `upright` (pitch 0), `lean` (12 degrees back onto a backrest, which the
   * seat must have) or `slump` (pelvis 10 degrees back, chest 12 and spine 8
   * flexed), all provisional.
   *
   * The performer must stand facing within 20 degrees of the seat's heading
   * with feet the legs can reach from the seat; otherwise the sit is refused
   * with the range of foot distances that work. Events `commit` (the last
   * instant the sitting can be abandoned for standing), `seatContact` and
   * `seated`; the seat window starts at contact.
   *
   * A seat above 1.2 of the popliteal height, or one sat astride, is got onto
   * instead ({@link HumanMountOn}): the feet leave the floor for the seat's
   * rests or hang, under the same parameters, events and cancel table.
   */
  export import sit = sitLaw;

  /**
   * Standing up from a seat, in the four phases of sit-to-stand (Schenkman,
   * Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion momentum,
   * where the trunk flexes forward while the seat still bears the weight;
   * momentum transfer at seat-off, where the hips leave the seat and the body
   * moves forward over the feet; extension of the hips and knees; and
   * stabilisation.
   *
   * The goal is the seat socket's path from where it rests to where it stands
   * over the planted feet; the root follows from it and the trunk's pitch, and
   * the legs are solved onto the unmoved feet. The trunk flexes on a
   * minimum-jerk profile over the first half of the rise to a peak of at least
   * `35 + 50 (1 - r)` degrees, so it is still flexing fast when the seat is
   * left (peak trunk flexion closely follows seat-off, Schenkman et al.).
   * Seat-off occurs at 36 percent of the rise (McDonald, Villarejo Mayor and
   * Lennon 2025, Front Bioeng Biotechnol 13:1605524). The seat still constrains
   * the pelvis before release. A requested hip correction starts when the feet
   * take the load. A lumbar correction uses the actual seat, hand and sole
   * contacts of its phase. From seat-off the socket travels forward and up to
   * standing at 85 %, the trunk returns upright by the end, and the hands leave
   * the thighs, or the armrests they pushed on, over the next 30 %. The time is
   * `2 (1 + 0.6 (1 - r))` seconds for a seat at `r` of the popliteal height,
   * the seat height being where the socket rests (provisional, as the sit's).
   *
   * Before it, a body sitting deep edges forward on the seat until its hip
   * joints stand at most one thigh length behind the ankles, so the knees come
   * near over the feet, as people do before rising from a deep seat (a
   * provisional rule, kept 0.6 thigh lengths inside the front edge when the
   * entered sit names its seat); the edging takes `0.4 + 1.5 d` seconds for `d`
   * metres (provisional).
   *
   * Then each foot standing ahead of its knee is drawn back, one at a time over
   * `DRAW` seconds with a `LIFT` clearance, until the ankle stands behind the
   * knee with the shank 12 degrees forward of vertical, inside the 10 to 15
   * degrees of a prepared sit-to-stand (moving the feet behind the knees
   * reduces the trunk lean the rise needs; Shepherd and Koh 1996, Scand J
   * Rehabil Med 28:79, values provisional). A pelvis that stands more than 1 cm
   * aside of the feet's middle, as after a shift along the seat, has both feet
   * set across by that distance in the same draws, the foot on that side first:
   * the body rises between its feet, not over the edge of their base.
   *
   * The rise reads only the seated posture it is entered from, so it follows a
   * sit, a shift or any posture with the socket on a seat. Events `seatOff` and
   * `standing`; the seat window ends at seat-off.
   *
   * A seat above 1.2 of the popliteal height with a foot off the floor, as a
   * bar stool or a saddle is sat on, is got off instead ({@link HumanMountOff}),
   * ahead of the seat or to the side `to` names, with the same events.
   */
  export import rise = riseLaw;

  /**
   * Kneeling from standing: on one knee (half kneel), on both knees upright, or
   * sitting back on the heels, held, then rising the way it went down.
   *
   * The goals are floor points, solved by {@link kneelKeys}. The kneeling leg
   * steps back onto its tucked toes while the hips travel along the heading
   * from where they stand to where the step key puts them as the foot travels,
   * so they trail the foot and arrive after it lands; with the balance option
   * (`IAutoMovieMotionHumanBalance`) they run instead a course that keeps the
   * extrapolated centre of mass between the feet (the extrapolated-centre
   * course; Hof, Gazendam and Sinke 2005), going to the middle between the two
   * feet. Through the step the hips ride as high as the less extended leg
   * reaches its foot, the reach going from the standing leg's to `REACH` of its
   * length, a reverse lunge, and the pelvis tips forward by what keeps the leg
   * behind inside the hip's extension range (`kneelKeys.lean`). Then the hips
   * lower until the knee touches the floor straight under its hip joint with
   * the thigh upright, the shin lying back along the floor to the foot. For
   * both knees the front leg then swings back and its knee lands beside the
   * first, and for sitting back the hips turn about the knees toward the heels
   * until the knees flex `kneelKeys.SIT` degrees. Pollard, Porter and Redfern
   * (2011, J Appl Biomech 27:233) give the four kneeling postures. The hands
   * rest on the thighs as the body settles.
   *
   * Each phase moves on minimum-jerk progress; its length is provisional,
   * scaled by the square root of the hip height (Alexander 1984) and by the
   * manner's tempo. The root is lowered wherever a planted leg could not reach
   * its foot. Each foot plants while it keeps its floor point, and each knee on
   * the floor bears there (a `bear` window on its lower leg, at the knee) from
   * the key it comes down in until it leaves, both on the floor the feet stand
   * on. Events: `stepBack` at the start, `kneeContact`, `secondKnee` for both
   * knees, `seatOnHeels` for sitting back, `settled`, and when it rises
   * `kneeOff` and `stood`.
   */
  export import kneel = kneelLaw;

  /**
   * Cross one ankle over the other knee while seated, hold, and put the foot
   * back. Register under `crossAnkleOverKnee` and perform after a completed
   * chair `sit`. The same seat, carrying leg and other active supports continue
   * through the action.
   *
   * Jeong et al. (2008), Leg Crossing-Induced Asymmetrical Trunk Muscle
   * Activity During Seated Computer Work, distinguish ankle-on-knee from
   * upper-leg crossing
   * (https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001291962).
   * Yu and An (2015), https://pmc.ncbi.nlm.nih.gov/articles/PMC4483391/,
   * studied the latter. Turley et al. (2013),
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC3589629/, identify coupled hip
   * range limits during activities such as chair leg crossing. Ganokroj et al.
   * (2021), https://doi.org/10.1186/s12891-021-04487-z, distinguish the chair
   * figure-four by its hip flexion, abduction and external rotation. The moving
   * hip needs a calibrated thigh-axis rotation order. The planner fits the
   * seated leg's actual bearing surface and checks the sweep outside and above
   * the carrying leg before settling the ankle. The return retraces that fit.
   */
  export const crossAnkleOverKnee: typeof crossAnkleOverKneeLaw =
    crossAnkleOverKneeLaw;

  /**
   * Repeated seated heel raises, with the moving foot rocking about its ball.
   * Qi et al. (2019, doi:10.1038/s41598-019-43824-0) used unilateral seated
   * heel tapping as one of their lower-limb rhythm tasks. Narayanan et al.
   * (2026, doi:10.1038/s41598-025-33921-8) instructed seated rhythmic foot
   * tapping or bouncing on one leg. Pettit-Mee et al. (2021,
   * doi:10.1002/oby.23173) used heel tapping and knee bouncing at self-selected
   * cadence. The author sets cadence and amplitude. Soucie et al. (2011,
   * doi:10.1111/j.1365-2516.2010.02399.x) measured passive ankle range, which
   * informs the rig range used by the shared fit, rather than a fidget
   * amplitude.
   *
   * Each beat rises and falls on two minimum-jerk halves. Heel travel follows
   * from the body's own ball-to-heel geometry and the authored rotation. The
   * ball stays fixed, the toes counter-rotate to maintain their entry height,
   * and the knee follows the ankle through the existing leg fit. The seat and
   * opposite foot retain their entry contacts. When they share a prop with the
   * moving foot, the whole posture rides that prop.
   */
  export import seatedHeelBounce = seatedHeelBounceLaw;

  /**
   * Sit on a fixed bed's long edge, pause, then stand. Enter facing away from
   * the chosen edge with the feet on the floor within reach of the seat. The
   * bed supplies the edge's position, outward heading and depth. The ordinary
   * sit and rise supply the support transfer and reach checks.
   *
   * @param chain The standing performer's chain.
   * @param bed A model with a level `leftSide` or `rightSide` seat affordance.
   * @param placement The bed's fixed world placement, in metres and yaw
   *   degrees.
   * @param side The long edge on the bed's local positive X (`left`) or
   *   negative X (`right`).
   * @param seconds Time seated after settling, in seconds. Defaults to one
   *   second.
   * @returns A chain with the sit and rise appended.
   * @throws {HumanRefusal} If the chosen edge has no seat affordance. The sit
   *   and rise can also refuse unreachable supports at planning time.
   */
  export const bedsidePerch: typeof bedsidePerchLaw = bedsidePerchLaw;

  /**
   * The geometry every seat law shares: where on a seat the body's seat socket
   * rests, the root that puts it there under a trunk pitch, whether a seat
   * suits the body, and the hands resting on the thighs.
   *
   * A seat is given as the sitting surface's frame the way an
   * `IAutoMovieAffordance` of kind `seat` states it: a world point at the
   * middle of the front edge, the heading the sitter faces, an optional depth
   * back from the edge and an optional backrest height. Sitting brings the
   * body's `seat` socket (under the ischial tuberosities) onto the seat;
   * everything else follows by inverse kinematics and the trunk's pitch.
   *
   * The socket rests `thigh - 0.05 m` behind the edge, corrected by the
   * socket's own offset from the hip joints, so with a level thigh the knee
   * stands 5 cm ahead of the front edge and the thigh is supported almost to
   * the knee (provisional clearance; seating standards keep the seat shorter
   * than the buttock-to-popliteal length); a shallower seat moves the socket
   * forward to 2 cm inside its depth.
   *
   * A seat is sat on with both feet on the floor when its height above the
   * floor under the feet (the ground, or the floor of a prop they stand on, as
   * a boat's) lies within 0.8 to 1.2 of the popliteal height, the ratio the
   * campaign sets: a lower seat needs more trunk flexion and a longer rise
   * (Janssen, Bussmann and Stam 2002, Phys Ther 82:866) and is refused. A
   * higher one is a high seat: a bar stool, a saddle, a wall. The feet leave
   * the floor for its rests or hang, and the body gets onto it by a step up or
   * a swing of a leg. The popliteal height is the knee joint's height less the
   * thigh's radius, where the thigh's underside meets a level seat.
   */
  export import seated = seatedLaw;

  /**
   * The takeAKnee preset of `kneel`: Kneeling on one knee and staying three
   * seconds without rising (provisional). Spread into `kneel`'s parameters; the
   * `takeAKnee` row reads it.
   */
  export const TAKE_A_KNEE: typeof HUMAN_SEAT_TAKE_A_KNEE =
    HUMAN_SEAT_TAKE_A_KNEE;

  /**
   * The kneelBriefly preset of `kneel`: Kneeling, staying one second and rising
   * again (provisional). Spread into `kneel`'s parameters; the `kneelBriefly`
   * row reads it.
   */
  export const KNEEL_BRIEFLY: typeof HUMAN_SEAT_KNEEL_BRIEFLY =
    HUMAN_SEAT_KNEEL_BRIEFLY;

  /**
   * The kneelSit preset of `kneel`: Sitting back on the heels from both knees
   * and staying three seconds (provisional). Spread into `kneel`'s parameters;
   * the `kneelSit` row reads it.
   */
  export const KNEEL_SIT: typeof HUMAN_SEAT_KNEEL_SIT = HUMAN_SEAT_KNEEL_SIT;
}
