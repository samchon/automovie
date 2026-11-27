import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Authoring inputs and presets for dance and paired dance operations.
 */
/**
 * A solo dance step locked to a declared beat: the bounce, the side-to-side
 * sway, the step-touch and the box step.
 *
 * The beat comes from the author's tempo, never from audio: beat `k` falls at
 * `k 60 / bpm` seconds, 120 bpm when absent (people resonate near 120 bpm, van
 * Noorden and Moelants 1999; the spontaneous locomotor tempo is near 2 Hz,
 * MacDougall and Moore 2005). Each beat is an event `beat{k}`. Locked to a cue
 * track (`lock`), the beats are the track's instants instead: the first on the
 * track's first beat at or after the start, the rest at the mean interval of
 * the track's beats, so footfalls land on a score's beats whatever its tempo (a
 * tempo that drifts within the step is followed at its mean, a first pass).
 *
 * - Bounce: the knees give on every beat, the hips lowest on the beat by 1 % of
 *   the stature (provisional; vertical bounce follows the rhythm, Burger et al.
 *   2013), the feet planted.
 * - Sway: the hips travel side to side over two beats, at each side on a beat, by
 *   half the feet's spacing, the feet planted. They leave the middle for the
 *   first side through the first beat and return to it after the last, and ride
 *   the arc that keeps both legs at their standing length.
 * - Step-touch: on odd beats one foot steps a shoulder width to its side, on even
 *   beats the other closes beside it; the direction turns every two beats. Each
 *   foot travels over the half beat before its footfall, so the footfall lands
 *   on the beat; the hips follow the feet's mean and sink until each leg
 *   reaches its foot, the travelling one too.
 * - Box step: six footfalls that trace a square and return, one a beat: the first
 *   foot forward, the other to its own side level with it, the first closed
 *   beside it; then the other foot back, the first to its own side level with
 *   it, the other closed. The square's side is a shoulder width (provisional);
 *   the feet and the hips move as in the step-touch.
 *
 * The optional waltz box adds a three-beat change in height and a turn around a
 * world-space pivot. A pair can share that pivot and a cue track, with one
 * dancer beginning backward. This action owns foot contacts.
 */
export namespace IAutoMovieMotionHumanDance {
  /** The parameters of `slowDanceSway`: a sway's size, beat and repetitions. */
  export interface ISlowDanceSway {
    /** How far the pelvis goes over each foot, metres; positive. */
    by: number;

    /**
     * The beat, seconds: each half of a sway, over one foot and back, takes
     * one.
     */
    beat: number;

    /**
     * How many sways, each over the left foot and then the right; a whole
     * number of at least 1.
     */
    count: number;
  }

  /** Parameters. */
  export interface IParams {
    /** The step. */
    kind: IAutoMovieMotionHumanDance.Kind;

    /** Beats per minute, positive; `dance.BPM` (120) when absent. */
    bpm?: number;

    /**
     * How many beats, a whole number of at least 1; 8 when absent. At the
     * default 120 beats a minute a beat is 0.5 s (`dance.BPM`), so 8 beats take
     * 4 s plus one beat.
     */
    count?: number;

    /**
     * A cue track to lock the beats to: beat `k` falls on the track's `k`-th
     * instant named `event` (`beat` when absent) at or after the action's
     * start, and the tempo is the mean interval of those instants, so `bpm` is
     * not read. The track is the performance's input, never audio. Unlocked,
     * the beats follow `bpm` from one period after the start.
     */
    lock?: IAutoMovieMotionHumanDance.ILock;

    /** The foot that steps first; `right` when absent. */
    side?: IAutoMovieMotionHumanDance.Side;

    /** Waltz timing and travel for the box step. Omitted keeps the basic square. */
    waltz?: IAutoMovieMotionHumanDance.IWaltz;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** The cue track a dance's beats lock to. */
  export interface ILock {
    /** Performance cue-track id whose instants entrain the dance beats. */
    of: string;

    /** Cue event name whose instants are used; defaults to beat. */
    event?: string;
  }

  /** The waltz timing and travel of the box step. */
  export interface IWaltz {
    /** Signed rotation through the last beat, in degrees. Defaults to zero. */
    turn?: number;

    /**
     * Shared pivot in world metres. Omitted uses this performer's starting
     * origin.
     */
    pivot?: IAutoMovieVector3;

    /**
     * World displacement of the pivot over the figure, metres: the line of
     * dance a led couple travels down the floor. Omitted keeps the pivot in
     * place.
     */
    travel?: IAutoMovieVector3;

    /** Step back on beat one, for the dancer facing the forward-stepping role. */
    reverse?: boolean;
  }

  /** The foot that steps first. */
  export type Side = "left" | "right";

  /**
   * Capture cases of the solo dance steps, eight beats at 120 bpm from quiet
   * standing. The steps.
   */
  export type Kind = "bounce" | "sway" | "stepTouch" | "boxStep";
}
