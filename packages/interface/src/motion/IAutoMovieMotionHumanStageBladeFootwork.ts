/**
 * Controls for one grounded stage mark shift with a padded blade silhouette.
 * The motion law owns parameter admission and supplies independent editing cues
 * for the footfalls and the optional prop beat.
 */
export namespace IAutoMovieMotionHumanStageBladeFootwork {
  /**
   * Selects the stage shift's timing, foot clearance and spinal follow. Fencing
   * uses a lifted step, kendo a low glide, and the armoured style a deliberate
   * lifted shift. The foil, epee and sabre styles give each fencing weapon its
   * own cadence: the foil the general fencing step, the epee a shorter, more
   * measured step and the sabre a longer, quicker one.
   */
  export type Style =
    /**
     * The general fencing step: 0.55 s for a shift of 0.14 stature, a foot lift
     * of 0.014 stature (`stageBladeFootwork` profiles, provisional film
     * timings).
     */
    | "fencing"
    /** The same step as `fencing`: 0.55 s, 0.14 stature. */
    | "foil"
    /** A shorter, more measured step: 0.65 s, 0.12 stature. */
    | "epee"
    /** A longer, quicker step: 0.45 s, 0.15 stature. */
    | "sabre"
    /** A low glide with the foot along the floor: 0.62 s, 0.12 stature. */
    | "kendo"
    /** A deliberate lifted shift in armour: 0.85 s, 0.11 stature. */
    | "armoured";

  /**
   * A horizontal travel direction in the performer's entry frame. Forward and
   * back use its facing line, and left and right use its lateral axis.
   */
  export type Direction = "forward" | "back" | "left" | "right";

  /**
   * One stage mark shift, ending with both feet settled. An optional editing
   * cue can be placed independently on the same action clock.
   */
  export interface IParams {
    /** Support cadence and clearance of the moving foot. */
    style: Style;

    /** Travel along or across the performer's entry heading. */
    direction: Direction;

    /** Preferred forward lead. Absent, read it from the entry feet. */
    lead?: "left" | "right";

    /**
     * Horizontal travel in metres. Absent, the style's share of the stature
     * (0.11 to 0.15, about 0.19 to 0.26 m at a stature of 1.75 m); at most 0.23
     * of the stature, about 0.4 m (`stageBladeFootwork`, provisional).
     */
    distance?: number;

    /**
     * Positive stage duration in seconds. Absent, the style's length from 0.45
     * s (`sabre`) to 0.85 s (`armoured`) at the reference hip
     * (`stageBladeFootwork`, provisional); the foot moves in two windows within
     * it.
     */
    duration?: number;

    /** Share in [0, 1] at which to emit the independent `propCue` editing event. */
    propCue?: number;
  }
}
