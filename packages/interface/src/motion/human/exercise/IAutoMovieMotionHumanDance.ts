import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation bpm: Beats per minute; `BPM` when absent. Exclusive minimum: 0. Unit: "beats/min". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. beats: How many beats; 8 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. lock: A cue track to lock the beats to (#3340, #3378): beat `k` falls on the track's `k`-th instant named `event` (`beat` when absent) at or after the action's start, and the tempo is the mean interval of those instants, so `bpm` is not read. The track is the performance's input, never audio. Unlocked, the beats follow `bpm` from one period after the start.
 * @evidence contracts/development/design.md#principled-representation bpm: Beats per minute; `BPM` when absent. Exclusive minimum: 0. Unit: "beats/min". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. beats: How many beats; 8 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. lock: A cue track to lock the beats to (#3340, #3378): beat `k` falls on the track's `k`-th instant named `event` (`beat` when absent) at or after the action's start, and the tempo is the mean interval of those instants, so `bpm` is not read. The track is the performance's input, never audio. Unlocked, the beats follow `bpm` from one period after the start.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.dance, params); exercise/dance.ts (dance.plan, context); exercise/dance.ts (dance.plan); executable/cases/danceCases.ts (danceCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanDance {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The step, the tempo and the number of beats.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tempo is a number, not audio.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The step. */
    kind: IAutoMovieMotionHumanDance.Kind;

    /** Beats per minute; `BPM` when absent.
     * Exclusive minimum: 0. Unit: "beats/min". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    bpm?: number;

    /** How many beats; 8 when absent. At the default 120 beats a minute a beat is 0.5 s ({@link dance.BPM}), so 8 beats take 4 s plus one beat.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    beats?: number;

    /**
     * A cue track to lock the beats to (#3340, #3378): beat `k` falls on the
     * track's `k`-th instant named `event` (`beat` when absent) at or after the
     * action's start, and the tempo is the mean interval of those instants,
     * so `bpm` is not read. The track is the performance's input, never
     * audio. Unlocked, the beats follow `bpm` from one period after the start.
     */
    lock?: {
      /** Performance cue-track id whose instants entrain the dance beats. */
      of: string;
      /** Cue event name whose instants are used; defaults to beat. */
      event?: string;
    };

    /** The foot that steps first; `right` when absent. */
    side?: "left" | "right";

    /** Waltz timing and travel for the box step. Omitted keeps the basic square. */
    waltz?: {
      /** Signed rotation through the last beat, in degrees. Defaults to zero. */
      turn?: number;
      /** Shared pivot in world metres. Omitted uses this performer's starting origin. */
      pivot?: IAutoMovieVector3;
      /** World displacement of the pivot over the figure, metres: the line of dance a led couple travels down the floor. Omitted keeps the pivot in place. */
      travel?: IAutoMovieVector3;
      /** Step back on beat one, for the dancer facing the forward-stepping role. */
      reverse?: boolean;
    };

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

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
