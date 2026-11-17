import type { IAutoMovieCamera } from "../scene/IAutoMovieCamera";
import type { IAutoMovieCameraCoverageEntry } from "./IAutoMovieCameraCoverageEntry";

/**
 * Data and callback contracts shared by the CompileCameraCoverage operations.
 *
 * @evidence contracts/development/design.md#principled-representation One staged camera, clip identity, ordered nonoverlapping intent entries and shot duration in seconds describe a coverage take; aspect is width divided by height.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileCameraCoverage passes the same inputs to compileCameraMove and publishes the entries' intent records; existing camera and coverage-entry contracts own their fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller supplies sorted nonoverlapping entries; empty entries mean a locked-off take, and move/framing refusals propagate.
 * @evidence contracts/development/common.md#meaningful-documentation Documents seconds, aspect, camera placement, entry order, empty take and failure behavior.
 */
export namespace IAutoMovieCompileCameraCoverage {
  /**
   * Compile one coverage take: the alternate angle another staged camera plays over a beat, as an {@link IAutoMovieShotCoverage} record.
   *
   * The camera clip comes from {@link compileCameraMove} with this camera as its parameter, so the side staging gave it is the side the angle plays from, and `cameraIntent` lists each entry's intent in entry order. The intent is guide metadata for a render host and never feeds the solve. Entries must be sorted by `start` and must not overlap, as for the hero take; an empty list yields a locked-off take with `cameraMotion: null` and no intent spans. Throws whatever {@link compileCameraMove} throws for a framing or move outside the grammar.
   *
   * @evidence contracts/development/design.md#principled-representation One staged camera, clip identity, ordered nonoverlapping intent entries and shot duration in seconds describe a coverage take; aspect is width divided by height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface compileCameraCoverage passes the same inputs to compileCameraMove and publishes the entries' intent records; existing camera and coverage-entry contracts own their fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller supplies sorted nonoverlapping entries; empty entries mean a locked-off take, and move/framing refusals propagate.
   * @evidence contracts/development/common.md#meaningful-documentation Documents seconds, aspect, camera placement, entry order, empty take and failure behavior.
   */
  export type IProps = {
    /** The covering camera, staged in the same scene as the hero. */
    camera: IAutoMovieCamera;

    /** Id the take's camera clip carries. */
    clipId: string;

    /** Frame entries with their intents, sorted by start and non-overlapping. */
    entries: IAutoMovieCameraCoverageEntry[];

    /** Shot length in seconds. */
    shotDuration: number;

    /** Frame width over height, as {@link compileCameraMove} reads it. */
    aspect?: number;
  };
}
