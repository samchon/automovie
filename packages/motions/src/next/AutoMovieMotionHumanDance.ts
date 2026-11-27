import { balletPositions as balletPositionsLaw } from "../exercise/internal/balletPositions";
import { balletStep as balletStepLaw } from "../exercise/internal/balletStep";
import { dance as danceLaw } from "../exercise/internal/dance";
import { groupDance as groupDanceLaw } from "../exercise/internal/groupDance";
import { streetDance as streetDanceLaw } from "../exercise/internal/streetDance";
import { tapDance as tapDanceLaw } from "../exercise/internal/tapDance";
import { HumanDanceStyles as HumanDanceStylesSource } from "../lexicon/internal/HumanDanceStyles";
import { composeHumanSlowDanceSway as composeHumanSlowDanceSwayLaw } from "../touch/internal/composeHumanSlowDanceSway";

/**
 * Footwork and body movement on a beat: social, ballet, tap, street and group
 * dance, and the slow-dance sway. A beat count at a tempo gives the duration;
 * the dance styles share one clock of 120 beats a minute, 0.5 s a beat, unless
 * `bpm` or a cue track (`lock`) sets it. No tempo by style (a waltz, a hip-hop
 * groove) is defined: choose `bpm` (provisional, missing).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `dance`: A solo dance step locked to a declared beat: the bounce, the
 *   side-to-side sway, the step-touch and the box step.
 * - `ballet`: Classical ballet on the dance law's beat clock: a position of the
 *   feet with a plié or a relevé (`balletPositions`), a pirouette from fourth
 *   (`balletPirouette`) and a grand jeté (`balletJete`).
 * - `tapDance`: Tap dance on the dance law's beat clock.
 * - `streetDance`: Street grooves on the dance law's beat clock.
 * - `groupDance`: Social group dances on one shared beat: the line dance
 *   (`groupDanceLine`), the circle dance (`groupDanceCircle`) and the conga
 *   (`groupDanceConga`).
 * - `slowDanceSway`: Stage a slow dance's sway on planted feet: the weight goes
 *   over one foot and back, then over the other and back, `count` times, each
 *   half of a sway a beat long, as a couple in a slow dance hold sways to the
 *   music.
 * - `balletPositions`: Ballet's five positions of the feet and what the legs do
 *   in them.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanDanceStyles`: Dance styles beyond the social steps: tap, classical
 *   ballet, street grooves and social group dances, each a row of its law on
 *   the dance law's beat clock, the step left open.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanDance} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanDance {
  /**
   * A solo dance step locked to a declared beat: the bounce, the side-to-side
   * sway, the step-touch and the box step.
   *
   * The beat comes from the author's tempo, never from audio: beat `k` falls at
   * `k 60 / bpm` seconds, 120 bpm when absent (people resonate near 120 bpm,
   * van Noorden and Moelants 1999; the spontaneous locomotor tempo is near 2
   * Hz, MacDougall and Moore 2005). Each beat is an event `beat{k}`. Locked to
   * a cue track (`lock`), the beats are the track's instants instead: the first
   * on the track's first beat at or after the start, the rest at the mean
   * interval of the track's beats, so footfalls land on a score's beats
   * whatever its tempo (a tempo that drifts within the step is followed at its
   * mean, a first pass).
   *
   * - Bounce: the knees give on every beat, the hips lowest on the beat by 1 % of
   *   the stature (provisional; vertical bounce follows the rhythm, Burger et
   *   al. 2013), the feet planted.
   * - Sway: the hips travel side to side over two beats, at each side on a beat,
   *   by half the feet's spacing, the feet planted. They leave the middle for
   *   the first side through the first beat and return to it after the last,
   *   and ride the arc that keeps both legs at their standing length.
   * - Step-touch: on odd beats one foot steps a shoulder width to its side, on
   *   even beats the other closes beside it; the direction turns every two
   *   beats. Each foot travels over the half beat before its footfall, so the
   *   footfall lands on the beat; the hips follow the feet's mean and sink
   *   until each leg reaches its foot, the travelling one too.
   * - Box step: six footfalls that trace a square and return, one a beat: the
   *   first foot forward, the other to its own side level with it, the first
   *   closed beside it; then the other foot back, the first to its own side
   *   level with it, the other closed. The square's side is a shoulder width
   *   (provisional); the feet and the hips move as in the step-touch.
   *
   * With `waltz`, the box adds a three-beat lowering and rise and can rotate
   * around an authored floor pivot. A second dancer can share the pivot and cue
   * track and start back on beat one. Held partner contacts are separate.
   */
  export import dance = danceLaw;

  /**
   * Classical ballet on the dance law's beat clock: a position of the feet with
   * a plié or a relevé (`balletPositions`), a pirouette from fourth
   * (`balletPirouette`) and a grand jeté (`balletJete`).
   *
   * Each step reads the dancer's hips: a turnout beyond the hip's external
   * rotation (`AutoMovieMotionHumanRange.limit`) is refused with that limit,
   * and a jeté's split beyond the leading hip's flexion and the other's
   * extension is refused with their sum. The turnout is `TURNOUT` degrees when
   * absent, a trained dancer's hip share of a working turnout (provisional).
   *
   * Not yet: the battement tendu, the développé and the attitude, and a jeté
   * prepared by its own run.
   */
  export import ballet = balletStepLaw;

  /**
   * Tap dance on the dance law's beat clock. Each step is a table of strikes in
   * quarter beats from its first beat (`tapDanceSteps.STEPS`): which foot (the
   * leading one or the other), how it is set down (on the ball with the heel up
   * `PITCH` degrees, on the heel with the toes up, or flat), where (in place,
   * or `REACH` foot lengths ahead or behind where it stood), whether it then
   * bears, and the part that sounds, if any. A brush passes through its strike
   * without bearing.
   *
   * - Shuffle: the ball brushes forward on the "and" and back on the beat.
   * - Flap: a forward brush, then the ball steps down ahead and takes the weight.
   * - Ball change: weight to the ball behind, then back onto the other foot.
   * - Heel drop: up onto the ball, the heel dropped on the beat.
   * - Cramp roll: ball, ball, heel, heel, one a quarter beat.
   * - Time step (single): a shuffle, a hop on the other foot, a step, a flap and
   *   a step.
   *
   * A foot travels to a strike over at most `TRAVEL` of a beat, lifted `LIFT`
   * of the stature. The hips ride over the feet's midpoint, `CROUCH` of the
   * stature low on soft knees, no lower than a flat step's shank allows its
   * unloaded ankle as it lands; while no foot bears (the hop) they fly the
   * ballistic arc whose flight time that span is. Repeats alternate the leading
   * foot, each starting where the last left the feet.
   *
   * Events: `beat{k}`, each sounding strike's `strike{n}{Side}{Part}`, `relax`.
   */
  export import tapDance = tapDanceLaw;

  /**
   * Street grooves on the dance law's beat clock.
   *
   * - Rock: the knees give `BOUNCE` of the stature on every beat; the chest
   *   isolates `CHEST` degrees side to side and the head `HEAD` degrees the
   *   other way, one side a beat; each popping hit drives the forearms to a
   *   struck pose that peaks exactly on its subdivision, rising over `RISE` of
   *   a beat on a sharp ease-in and released over the half beat after.
   * - Moonwalk: one foot stands on its ball, the heel up `HEEL` degrees, while
   *   the other slides back flat along the floor, never lifting, from `STEP`
   *   foot lengths ahead of the standing foot to as far behind; on the beat the
   *   slid foot rises onto its ball and the standing heel drops, so the roles
   *   change every beat and the dancer travels backward while seeming to step
   *   forward. The hips ride over the feet's midpoint.
   *
   * Every instant of a member strays from the beat by an offset drawn once from
   * its seed within `vary`, so a crowd keeps the beat without moving cloned
   * (Burger et al. 2013 measured such individual timing in groove).
   *
   * Events: `beat{k}`, the rock's `hit{n}`, the moonwalk's `slide{k}`, `relax`.
   */
  export import streetDance = streetDanceLaw;

  /**
   * Social group dances on one shared beat: the line dance (`groupDanceLine`),
   * the circle dance (`groupDanceCircle`) and the conga (`groupDanceConga`).
   * Every member runs this law with the same tempo or cue track, so their beats
   * coincide; each member's beats are then moved by one offset drawn from its
   * own seed within `vary`, so steps fall within that band of the shared beat
   * and no two members move alike. Joined hands read the shared beat, not the
   * member's, so both hands of a pair name the same point. The hips ride over
   * the feet, `CROUCH` of the stature low.
   *
   * Events: `beat{k}` on the member's own beats, `relax`.
   */
  export import groupDance = groupDanceLaw;

  /**
   * Stage a slow dance's sway on planted feet: the weight goes over one foot
   * and back, then over the other and back, `count` times, each half of a sway
   * a beat long, as a couple in a slow dance hold sways to the music. Each
   * shift is `shiftStandingWeight` toward the performer's left, then right, by
   * `by` metres with its return, so the law's own plant and balance checks
   * stand. A partner resting a cheek on this performer's (`headRest`) follows
   * the sway by its felt correction.
   *
   * @param chain The swaying performer's chain.
   * @param params How far the pelvis goes, the beat and how many sways.
   * @returns The same kind of chain with the shifts appended.
   * @throws {AutoMovieMotionHumanRefusal} When the count is not a whole number of one or more.
   */
  export const slowDanceSway: typeof composeHumanSlowDanceSwayLaw =
    composeHumanSlowDanceSwayLaw;

  /**
   * Ballet's five positions of the feet and what the legs do in them. Each foot
   * turns out by the turnout from the dancer's heading; the heels stand, in
   * foot lengths (provisional readings of Vaganova's Basic Principles of
   * Classical Ballet):
   *
   * - First: together, `HEEL` apart;
   * - Second: `SECOND` apart side by side;
   * - Third: the working foot's heel against the middle of the other's inner
   *   edge, a foot's width (`WIDTH`) ahead;
   * - Fourth: the working heel in line with the other's toes, `FOURTH` ahead;
   * - Fifth: the working heel at the other's toes, a foot's width ahead.
   *
   * A plié bends the knees `PLIE` degrees over the toes, the heels down; a
   * relevé rises onto the balls of the feet, the heels up `RELEVE` degrees, the
   * metatarsal heads staying where they stand. The feet move into the position
   * before the first beat, the working foot first; the legs then go down or up
   * on even beats and back on odd ones.
   */
  export import balletPositions = balletPositionsLaw;

  /**
   * Dance styles beyond the social steps: tap, classical ballet, street grooves
   * and social group dances, each a row of its law on the dance law's beat
   * clock, the step left open. The clock keeps 120 beats a minute, 0.5 s a beat
   * (`dance.BPM`), unless `bpm` or a cue track sets it; `beats` counts the
   * beats of a street groove and of ballet's position. No tempo by style (a
   * waltz, a hip-hop groove) is defined: choose `bpm` (provisional, missing).
   */
  export import HumanDanceStyles = HumanDanceStylesSource;
}
