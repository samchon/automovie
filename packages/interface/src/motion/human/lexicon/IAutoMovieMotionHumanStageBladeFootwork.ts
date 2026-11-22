/**
 * Controls for one grounded stage mark shift with a padded blade silhouette.
 * The motion law owns parameter admission and supplies independent editing
 * cues for the footfalls and the optional prop beat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the shot-local controls, frame, scale and named prop event.
 * @evidence contracts/development/design.md#principled-representation Direction is read from the entry body's heading, position in metres and time in seconds. A normalized prop cue is independent of support.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One stage mark shift takes its style, direction, optional lead, travel distance, duration and editing cue. Runtime owner is motions/src/lexicon/stageBladeFootwork.ts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No equipment target, physical impact, score or outcome is inferred by the controls.
 */
export namespace IAutoMovieMotionHumanStageBladeFootwork {
  /**
   * Selects the stage shift's timing, foot clearance and spinal follow.
   * Fencing uses a lifted step, kendo a low glide, and the armoured style a
   * deliberate lifted shift. The foil, epee and sabre styles give each
   * fencing weapon its own cadence: the foil the general fencing step, the
   * epee a shorter, more measured step and the sabre a longer, quicker one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the profile selected by each literal and the visible motion it controls.
   * @evidence contracts/development/design.md#principled-representation The closed union selects a dimensionless profile name. The runtime profile supplies normalized footfall windows and distances and timing scaled to the body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members match the profiles owned by `stageBladeFootwork`, which validates the name against its profile table before planning.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every style selects a complete stage profile. None implies a sport rule, target or equipment contact.
   */
  export type Style =
    | "fencing"
    | "foil"
    | "epee"
    | "sabre"
    | "kendo"
    | "armoured";

  /**
   * A horizontal travel direction in the performer's entry frame. Forward
   * and back use its facing line, and left and right use its lateral axis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the entry heading, axes and meaning of the four directions.
   * @evidence contracts/development/design.md#principled-representation A direction names one cardinal axis and sign in the horizontal entry frame. Distance is a separate scalar in metres. The closed union excludes vertical or diagonal choices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `stageBladeFootwork` admits the direction against its direction table and uses it to select both the displacement axis and the first foot.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The shared stage action supports all four horizontal directions. Their relation to the actor and lead is independent of the scene or style.
   */
  export type Direction = "forward" | "back" | "left" | "right";

  /**
   * One stage mark shift, ending with both feet settled. An optional editing
   * cue can be placed independently on the same action clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the shift's style and floor direction, optional lead and scale overrides, and cue timing.
   * @evidence contracts/development/design.md#principled-representation Closed literals select style, direction and optional lead. `stageBladeFootwork` checks positive duration in seconds, positive travel up to its stature limit in metres, and a cue share in [0, 1].
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLexiconBladeParams` exposes these inputs to registered action authors. The `stageBladeFootwork` law owns admission, body-scaled defaults and support scheduling.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each optional override can be supplied independently. An absent cue creates no prop event, and an authored cue supplies timing without inferring a hit or score.
   */
  export interface IParams {
    /** Support cadence and clearance of the moving foot. */
    style: Style;

    /** Travel along or across the performer's entry heading. */
    direction: Direction;

    /** Preferred forward lead. Absent, read it from the entry feet. */
    lead?: "left" | "right";

    /** Horizontal travel in metres. Defaults to a body-scaled stage distance. */
    distance?: number;

    /** Positive stage duration in seconds. Defaults to a body-scaled edit length. */
    duration?: number;

    /** Share in [0, 1] at which to emit the independent `propCue` editing event. */
    propCue?: number;
  }
}
