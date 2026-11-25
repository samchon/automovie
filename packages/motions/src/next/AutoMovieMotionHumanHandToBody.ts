import { coverFace as coverFaceLaw } from "../daily/coverFace";
import { handToFace as handToFaceLaw } from "../daily/handToFace";
import { handToFaceArm as handToFaceArmLaw } from "../daily/handToFaceArm";
import { handToFaceSheet as handToFaceSheetLaw } from "../daily/handToFaceSheet";
import { wipeTears as wipeTearsLaw } from "../daily/wipeTears";
import { headTilt as headTiltLaw } from "../everyday/headTilt";
import { HumanHandToFaceRows as HumanHandToFaceRowsSource } from "../lexicon/HumanHandToFaceRows";
import { HumanSelfActionRows as HumanSelfActionRowsSource } from "../lexicon/HumanSelfActionRows";
import { tuckHair as tuckHairLaw } from "../lexicon/tuckHair";
import { selfAction as selfActionLaw } from "../touch/selfAction";
import { HUMAN_HAND_TO_BODY_COVER_FACE } from "./presets/HUMAN_HAND_TO_BODY_COVER_FACE";
import { HUMAN_HAND_TO_BODY_TUCK_HAIR } from "./presets/HUMAN_HAND_TO_BODY_TUCK_HAIR";
import { HUMAN_HAND_TO_BODY_WIPE_TEARS } from "./presets/HUMAN_HAND_TO_BODY_WIPE_TEARS";

/**
 * The hand's own-body actions: touching the face, and self-directed touch such
 * as scratching or smoothing.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `handToFace`: A hand-to-face task of daily living while standing: drinking,
 *   sipping, eating with a spoon, biting held food, a phone at the ear, reading
 *   a held sheet, brushing the teeth, combing the hair, washing the face and
 *   wiping the mouth.
 * - `selfAction`: A whole-body self action while standing: the yawn-and-stretch
 *   with both arms overhead, both arms raised in victory, a fist pump, a neck
 *   roll and a shoulder roll.
 * - `headTilt`: Tilt toward one shoulder, hold, then return over the entry
 *   posture or a carrier that yields its head.
 * - `coverFace`: Cover the face with both bare hands.
 * - `wipeTears`: Brush tears from one cheek.
 * - `tuckHair`: The relaxed index fingertip sweeps from in front of the same-side
 *   ear to behind it and retracts.
 * - `handToFaceArm`: The arm a hand-to-face task lays on its place
 *   (`handToFace`): how the effector lies, the elbow's hint and the reference
 *   every second's fit is held to, and, for a held vessel, its lean toward the
 *   lips and the way it faces.
 * - `handToFaceSheet`: Where a hand-to-face task holds a sheet to be read: the
 *   one task whose place is not a region of the face but a point before the
 *   eyes, split from `handToFace` so each file holds one responsibility.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `COVER_FACE`: The cover-face preset: the right hand, one cover, no prop, no
 *   grasp and no other hand, and the hold on the right and the left cheek as
 *   one row (bare flat palms with the fingers upward, the head bowed 15
 *   degrees, the pose arriving at `atFace`, held 1.2 s after `taskEnd`).
 * - `WIPE_TEARS`: The wipe-tears preset: no other prop handle, and one rub of the
 *   right cheek (mirrored for the left hand) by a flat palm, going up and down
 *   once with no hold, the head unmoved, the arrival event `atCheek`.
 * - `TUCK_HAIR`: The tuck-hair preset: one stroke of the relaxed index fingertip
 *   to the right ear (mirrored for the left hand), from 0.065 up and 0.135
 *   forward of the ear to 0.018 up, 0.055 behind and 0.035 out of it, in shares
 *   of the arm's length.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanHandToFaceRows`: The tasks that bring a hand, or what it holds, to the
 *   face as rows: each task of `handToFace` under a name of its own, the side,
 *   the count, the time and the held prop open.
 * - `HumanSelfActionRows`: The actions on one's own body as rows: each kind of
 *   `selfAction` under a name of its own, the side, the count and the manner
 *   open.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanHandToBody} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanHandToBody {
  /**
   * A hand-to-face task of daily living while standing: drinking, sipping,
   * eating with a spoon, biting held food, a phone at the ear, reading a held
   * sheet, brushing the teeth, combing the hair, washing the face and wiping
   * the mouth.
   *
   * Every task takes the drinking task's phases (Alt Murphy et al. 2006, 2011):
   * reach and forward transport to the face, the task at the face, back
   * transport and return. Each is a row of the touch generator
   * (`AutoMovieMotionHumanTouch`) on a region of the performer's own head: the
   * effector is the tip of the implied tool (a cup's rim, a spoon's bowl, a
   * brush's head, a phone's face) stated in the hand's axes as shares of the
   * hand's length, or a bare palm, so the task is performed with no prop and
   * the hand stands where the tool would put it. A grooming task repeats its
   * stroke at the face (rub kinds); eating brings the head forward to meet the
   * spoon (van der Kamp and Steenbergen 1999), drinking tips the head back only
   * once the vessel is at the lips, in the drinking phase that follows the
   * transport (Alt Murphy et al. 2011), and reading holds the sheet 36.2 cm
   * from the eyes (Bababekova et al. 2011, the mean for text) where the hanging
   * arm's hand meets that distance. While walking, the sheet follows the
   * preferred head-relative gaze and viewing distance measured for walking
   * readers (doi:10.1007/s00221-021-06267-6, Table 1). The head flexes by Lee
   * et al. 2015's measured 35 degrees and the eyes taking the rest of the line
   * of sight up to their range (`handToFaceSheet`). Tool lengths, the other
   * head shares and the sip's extension have no located measurement.
   *
   * Events: the phrase instants, with `atMouth` (or `atEar`, `atFace`,
   * `atSheet`) at `ready` and `taskEnd` at `strokeEnd`. The back transport may
   * be cut into a put-down or standing from `relax`.
   *
   * With `prop`, the task is performed with the prop the hand already holds (a
   * glass a `pickUp` took): the prop's own point, a vessel's `lip` or a phone's
   * `screen`, replaces the implied tool (`HumanHeld`), the fingers keep their
   * grip, and the hand holds the prop through the task and after it. A prop
   * that is not in the hand is refused. With the `grasp` the prop was taken up
   * by for its use, the hand holds it at the face as that grasp presents it
   * there (`HumanHeldUse`), so the task asks the wrist only what the grip was
   * chosen for; with `other` as well, the other hand takes the prop's other
   * handle where the first carries it, as a camera is held in both hands.
   */
  export import handToFace = handToFaceLaw;

  /**
   * A whole-body self action while standing: the yawn-and-stretch with both
   * arms overhead, both arms raised in victory, a fist pump, a neck roll and a
   * shoulder roll. The body-directed touches of the same family (pats, rubs,
   * scratches, covers, pain holds) are rows of the `touch` law.
   *
   * Each action is a phrase: the parts rise to their place over the free-space
   * transport of the hand's travel (`AutoMovieMotionHumanTiming.transport`),
   * and at least as long as each raised arm's path needs to keep within the
   * audit's travel bound (`AutoMovieMotionHumanArmPlanned.reaching`), or 0.4 s
   * for the head and the shoulders, perform the stroke, hold and return in the
   * rise's time. Each arm's raise, hold and lowering are planned as one
   * trajectory over the clock's instants (`AutoMovieMotionHumanArm.carried`),
   * from the entry's angles to a named place of the air
   * (`AutoMovieMotionHumanTargetGrid.place`): overhead above the shoulders for
   * the stretch, palms up; overhead and outside them for victory, the hands
   * fists, as winners raise their arms above the shoulders and away from the
   * body with fists clenched (Hwang and Matsumoto 2014, Motivation and Emotion:
   * medal winners at the 2004 and 2008 Olympic and 2004 Paralympic judo events,
   * blind athletes among them); at eye height a forearm ahead of the shoulder
   * for the fist pump, the forearm rising to it from an elbow near the body;
   * its fist drops a fifth of the arm and rises again `count` times. A neck
   * roll circles the head through a light share of the neck's flexion and
   * lateral range, a shoulder roll circles both shoulder girdles through a
   * light share of theirs. The stretch lasts 6 s in all, the yawn's duration of
   * Provine 1986 (unverified); every other time and size is provisional.
   *
   * Events: the phrase instants.
   */
  export import selfAction = selfActionLaw;

  /**
   * Tilt toward one shoulder, hold, then return over the entry posture or a
   * carrier that yields its head. Hadar, Steiner and Clifford Rose observed
   * single-direction movements during conversational listening. The 20 degree
   * cap and the default 0.9 second phrase divided into thirds are provisional.
   * The 0.6 second minimum leaves 0.2 seconds for the carrier's fade at each
   * end.
   *
   * @see https://doi.org/10.1007/BF00986881
   */
  export const headTilt: typeof headTiltLaw = headTiltLaw;

  /**
   * Cover the face with both bare hands. The open palms settle on the cheeks
   * with the fingers upward toward the eyes. The head bows into the cover as
   * both hands arrive at `atFace`. The `seconds` parameter sets the additional
   * hold after `taskEnd` before applying the action's manner and time scale.
   *
   * [Wróbel, Zickfeld and Ciesielski
   * (2025)](https://doi.org/10.3758/s13428-025-02766-4) describes face hiding
   * as part of crying behavior. The bilateral pose, 15 degrees of head flexion
   * and the default 1.2 s additional hold are authored choices.
   */
  export const coverFace: typeof coverFaceLaw = coverFaceLaw;

  /**
   * Brush tears from one cheek. The chosen hand rises to its own cheek, wipes
   * up and down along the cheek and returns to its entry pose. `atCheek` marks
   * arrival and `taskEnd` marks the end of the wipe. The side, repetition
   * count, timing and manner are open. A held tissue can supply the contact
   * point.
   *
   * [Wróbel, Zickfeld and Ciesielski
   * (2025)](https://doi.org/10.3758/s13428-025-02766-4) treats face touching as
   * a visible component of crying. The wipe's path, palm shape and default
   * timing are authored choices.
   */
  export const wipeTears: typeof wipeTearsLaw = wipeTearsLaw;

  /**
   * The relaxed index fingertip sweeps from in front of the same-side ear to
   * behind it and retracts. Register the row with `HumanPerformance` and author
   * it by name, optionally selecting `side` or `manner`.
   *
   * The grooming action is described in
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC6137092/. The start and end
   * offsets are provisional shares of arm length. A slightly outward offset
   * clears the head as the fingertip passes the ear landmark.
   */
  export const tuckHair: typeof tuckHairLaw = tuckHairLaw;

  /**
   * The arm a hand-to-face task lays on its place (`handToFace`): how the
   * effector lies, the elbow's hint and the reference every second's fit is
   * held to, and, for a held vessel, its lean toward the lips and the way it
   * faces.
   */
  export const handToFaceArm: typeof handToFaceArmLaw = handToFaceArmLaw;

  /**
   * Where a hand-to-face task holds a sheet to be read: the one task whose
   * place is not a region of the face but a point before the eyes, split from
   * `handToFace` so each file holds one responsibility.
   */
  export import handToFaceSheet = handToFaceSheetLaw;

  /**
   * The tasks that bring a hand, or what it holds, to the face as rows: each
   * task of `handToFace` under a name of its own, the side, the count, the time
   * and the held prop open.
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses
   * and is checked as the law is, and its draws are keyed by its own name. The
   * rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanHandToFaceRows = HumanHandToFaceRowsSource;

  /**
   * The actions on one's own body as rows: each kind of `selfAction` under a
   * name of its own, the side, the count and the manner open.
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses
   * and is checked as the law is, and its draws are keyed by its own name. The
   * rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanSelfActionRows = HumanSelfActionRowsSource;

  /**
   * The cover-face preset: the right hand, one cover, no prop, no grasp and no
   * other hand, and the hold on the right and the left cheek as one row (bare
   * flat palms with the fingers upward, the head bowed 15 degrees, the pose
   * arriving at `atFace`, held 1.2 s after `taskEnd`). Spread into
   * `handToFace`'s parameters; the `coverFace` row fixes these values. Face
   * hiding as part of crying (Wróbel, Zickfeld and Ciesielski 2025,
   * https://doi.org/10.3758/s13428-025-02766-4); the bilateral pose, the bow
   * and the hold are authored choices.
   */
  export const COVER_FACE: typeof HUMAN_HAND_TO_BODY_COVER_FACE =
    HUMAN_HAND_TO_BODY_COVER_FACE;

  /**
   * The wipe-tears preset: no other prop handle, and one rub of the right cheek
   * (mirrored for the left hand) by a flat palm, going up and down once with no
   * hold, the head unmoved, the arrival event `atCheek`. Spread into
   * `handToFace`'s parameters; the `wipeTears` row fixes these values. Face
   * touching as a visible component of crying (Wróbel, Zickfeld and Ciesielski
   * 2025, https://doi.org/10.3758/s13428-025-02766-4); the path, the palm shape
   * and the timing are authored choices.
   */
  export const WIPE_TEARS: typeof HUMAN_HAND_TO_BODY_WIPE_TEARS =
    HUMAN_HAND_TO_BODY_WIPE_TEARS;

  /**
   * The tuck-hair preset: one stroke of the relaxed index fingertip to the
   * right ear (mirrored for the left hand), from 0.065 up and 0.135 forward of
   * the ear to 0.018 up, 0.055 behind and 0.035 out of it, in shares of the
   * arm's length. Spread into the arm phrase's parameters; the `tuckHair` row
   * fixes these values. The grooming action is described in
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC6137092/; the offsets are
   * provisional, and the slightly outward end offset clears the head as the
   * fingertip passes the ear landmark.
   */
  export const TUCK_HAIR: typeof HUMAN_HAND_TO_BODY_TUCK_HAIR =
    HUMAN_HAND_TO_BODY_TUCK_HAIR;
}
