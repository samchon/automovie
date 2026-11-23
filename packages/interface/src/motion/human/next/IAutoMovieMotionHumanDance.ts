import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBallet } from "../exercise/IAutoMovieMotionHumanBallet";
import type { IAutoMovieMotionHumanGroupDance } from "../exercise/IAutoMovieMotionHumanGroupDance";
import type { IAutoMovieMotionHumanStreetDance } from "../exercise/IAutoMovieMotionHumanStreetDance";
import type { IAutoMovieMotionHumanTapDance } from "../exercise/IAutoMovieMotionHumanTapDance";

/**
 * Footwork and body movement on a beat: social, ballet, tap, street and group dance, and the slow-dance sway. A beat count at a tempo gives the duration; the dance styles share one clock of 120 beats a minute, 0.5 s a beat, unless `bpm` or a cue track (`lock`) sets it. No tempo by style (a waltz, a hip-hop groove) is defined: choose `bpm` (provisional, missing).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Dance family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Dance laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanDance<Chain> {
  /**
   * A solo dance step locked to a declared beat (#3253, M23): the bounce, the side-to-side sway, the step-touch and the box step.
   *
   * @param params The `kind`, `bpm`, `beats`, `lock`, `side`, `waltz` and `manner` of `IAutoMovieMotionHumanDance.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  dance(params: IAutoMovieMotionHumanDance.IParams, anchor?: string): Chain;

  /**
   * Classical ballet on the beat clock (#3991): the five positions of the feet with a plié or a relevé, the pirouette from fourth on demi-pointe en dehors or en dedans, and the grand jeté with its split at the flight's apex.
   *
   * @param params The `kind`, `position`, `movement`, `turnout`, `turns`, `direction`, `split`, `side`, `bpm`, `beats` and `lock` of `IAutoMovieMotionHumanBallet.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  ballet(params: IAutoMovieMotionHumanBallet.IParams, anchor?: string): Chain;

  /**
   * Tap dance on the beat clock (#3991): the shuffle, the flap, the ball change, the heel drop, the cramp roll and a single time step.
   *
   * @param params The `step`, `bpm`, `repeats`, `side` and `lock` of `IAutoMovieMotionHumanTapDance.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  tapDance(
    params: IAutoMovieMotionHumanTapDance.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Street grooves on the beat clock (#4010): the rock, a bounce of the knees with the chest and the head isolating side to side and popping hits that stop sharp on their beat subdivisions; and the moonwa.
   *
   * @param params The `groove`, `bpm`, `beats`, `hits`, `vary`, `side` and `lock` of `IAutoMovieMotionHumanStreetDance.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  streetDance(
    params: IAutoMovieMotionHumanStreetDance.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Social group dances on one shared beat (#4010), each member dancing the same steps relative to the group: - line: a grapevine to the right and back to the left, the last count turning a quarter to the left, so every repeat faces the next wall and the rows keep their spacing; - circle: members spaced evenly round a centre, hands joined with their neighbours, side-stepping round the centre so the circle rotates; - conga: members in file, each with both hands on the shoulders of the one ahead, stepping three counts forward and kicking on the fourth.
   *
   * @param params The `kind`, `bpm`, `repeats`, `centre`, `members`, `left`, `right`, `ahead`, `vary` and `lock` of `IAutoMovieMotionHumanGroupDance.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  groupDance(
    params: IAutoMovieMotionHumanGroupDance.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A slow dance's sway on planted feet (#4012): the weight goes over one foot and back, then over the other and back, `count` times, each half of a sway a beat long, as a couple in a slow dance hold sways to the music. Each shift is a standing-weight shift toward the performer's left, then right, by `by` metres with its return, so the law's own plant and balance checks stand. A partner resting a cheek on this performer's (`headRest`) follows the sway by its felt correction. It ends when the last shift has returned.
   *
   * @param params The `by`, `beat` and `count` of `IAutoMovieMotionHumanDance.ISlowDanceSway`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   * @throws {HumanRefusal} When `count` is not a whole number of one or more.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  slowDanceSway(
    params: IAutoMovieMotionHumanDance.ISlowDanceSway,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Dance methods.
 */
export namespace IAutoMovieMotionHumanDance {
  /**
   * The parameters of `slowDanceSway`: a sway's size, beat and repetitions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and its meaning.
   * @evidence contracts/development/design.md#principled-representation The size in metres, the beat in seconds and a whole count of sways.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the sway reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The beat and the distance are the author's; no default is assumed.
   */
  export interface ISlowDanceSway {
    /** How far the pelvis goes over each foot, metres; positive. */
    by: number;

    /** The beat, seconds: each half of a sway, over one foot and back, takes one. */
    beat: number;

    /** How many sways, each over the left foot and then the right; a whole number of at least 1. */
    count: number;
  }
}

/**
 * A solo dance step locked to a declared beat (#3253, M23): the bounce, the
 * side-to-side sway, the step-touch and the box step.
 *
 * The beat comes from the author's tempo, never from audio: beat `k` falls
 * at `k 60 / bpm` seconds, 120 bpm when absent (people resonate near 120
 * bpm, van Noorden and Moelants 1999; the spontaneous locomotor tempo is
 * near 2 Hz, MacDougall and Moore 2005). Each beat is an event `beat{k}`.
 * Locked to a cue track (`lock`, #3378), the beats are the track's instants
 * instead: the first on the track's first beat at or after the start, the
 * rest at the mean interval of the track's beats, so footfalls land on a
 * score's beats whatever its tempo (a tempo that drifts within the step is
 * followed at its mean, a first pass).
 *
 * - Bounce: the knees give on every beat, the hips lowest on the beat by 1
 *   % of the stature (provisional; vertical bounce follows the rhythm,
 *   Burger et al. 2013), the feet planted.
 * - Sway: the hips travel side to side over two beats, at each side on a
 *   beat, by half the feet's spacing, the feet planted. They leave the
 *   middle for the first side through the first beat and return to it
 *   after the last, and ride the arc that keeps both legs at their standing
 *   length.
 * - Step-touch: on odd beats one foot steps a shoulder width to its side,
 *   on even beats the other closes beside it; the direction turns every two
 *   beats. Each foot travels over the half beat before its footfall, so
 *   the footfall lands on the beat; the hips follow the feet's mean and
 *   sink until each leg reaches its foot, the travelling one too.
 *
 * - Box step: six footfalls that trace a square and return, one a beat:
 *   the first foot forward, the other to its own side level with it, the
 *   first closed beside it; then the other foot back, the first to its own
 *   side level with it, the other closed. The square's side is a shoulder
 *   width (provisional); the feet and the hips move as in the step-touch.
 *
 * The optional waltz box adds a three-beat change in height and a turn
 * around a world-space pivot. A pair can share that pivot and a cue track,
 * with one dancer beginning backward. This action owns foot contacts.
 */
export namespace IAutoMovieMotionHumanDance {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The step, the tempo and the number of beats.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tempo is a number, not audio.
   */
  export interface IParams {
    /** The step. */
    kind: IAutoMovieMotionHumanDance.Kind;

    /** Beats per minute, positive; `dance.BPM` (120) when absent. */
    bpm?: number;

    /** How many beats, a whole number of at least 1; 8 when absent. At the default 120 beats a minute a beat is 0.5 s (`dance.BPM`), so 8 beats take 4 s plus one beat. */
    count?: number;

    /**
     * A cue track to lock the beats to (#3340, #3378): beat `k` falls on the
     * track's `k`-th instant named `event` (`beat` when absent) at or after the
     * action's start, and the tempo is the mean interval of those instants,
     * so `bpm` is not read. The track is the performance's input, never
     * audio. Unlocked, the beats follow `bpm` from one period after the start.
     */
    lock?: IAutoMovieMotionHumanDance.ILock;

    /** The foot that steps first; `right` when absent. */
    side?: IAutoMovieMotionHumanDance.Side;

    /** Waltz timing and travel for the box step. Omitted keeps the basic square. */
    waltz?: IAutoMovieMotionHumanDance.IWaltz;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * The cue track a dance's beats lock to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation A track id and the event name read from it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the beat lock reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The track is the performance's input, never audio.
   */
  export interface ILock {
    /** Performance cue-track id whose instants entrain the dance beats. */
    of: string;

    /** Cue event name whose instants are used; defaults to beat. */
    event?: string;
  }

  /**
   * The waltz timing and travel of the box step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit, frame and default.
   * @evidence contracts/development/design.md#principled-representation A turn in degrees, a pivot and a travel in world metres, and the role.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The four values the waltz box reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted members keep the basic square; nothing is assumed.
   */
  export interface IWaltz {
    /** Signed rotation through the last beat, in degrees. Defaults to zero. */
    turn?: number;

    /** Shared pivot in world metres. Omitted uses this performer's starting origin. */
    pivot?: IAutoMovieVector3;

    /** World displacement of the pivot over the figure, metres: the line of dance a led couple travels down the floor. Omitted keeps the pivot in place. */
    travel?: IAutoMovieVector3;

    /** Step back on beat one, for the dancer facing the forward-stepping role. */
    reverse?: boolean;
  }

  /**
   * The foot that steps first.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two admitted feet.
   * @evidence contracts/development/design.md#principled-representation Closed choices "left", "right" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The foot choice of the solo dance steps.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Side = "left" | "right";

  /**
   * Capture cases of the solo dance steps (#3253), eight beats at 120 bpm from quiet standing. The steps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of the solo dance steps (#3253), eight beats at 120 bpm from quiet standing. The steps.
   * @evidence contracts/development/design.md#principled-representation Closed choices "bounce", "sway", "stepTouch", "boxStep" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/danceCases.ts (danceCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in danceCases.
   */
  export type Kind = "bounce" | "sway" | "stepTouch" | "boxStep";
}
