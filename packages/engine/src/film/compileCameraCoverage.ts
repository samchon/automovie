import {
  IAutoMovieCamera,
  IAutoMovieCameraIntent,
  IAutoMovieShotCoverage,
} from "@automovie/interface";

import { IAutoMovieCameraCoverageEntry } from "./IAutoMovieCameraCoverageEntry";
import { compileCameraMove } from "./compileCameraMove";

/**
 * Compile one coverage take: the alternate angle another staged camera plays
 * over a beat, as an {@link IAutoMovieShotCoverage} record.
 *
 * The camera clip comes from {@link compileCameraMove} with this camera as its
 * parameter, so the side staging gave it is the side the angle plays from, and
 * `cameraIntent` lists each entry's intent in entry order. The intent is
 * guide metadata for a render host and never feeds the solve. Entries must be
 * sorted by `start` and must not overlap, as for the hero take; an empty list
 * yields a locked-off take with `cameraMotion: null` and no intent spans.
 * Throws whatever {@link compileCameraMove} throws for a framing or move
 * outside the grammar.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the hero take's framing grammar with the covering camera as the parameter, and derives the intent list from the same entries the move compiles, so the clip's spans and the intent records correspond one to one by construction.
 * @evidence contracts/common.md#clear-and-simple-design A thin assembler: `compileCameraMove` owns the path, `performShot` owns building the entries, and this function only pairs the clip with its intents under the covering camera's id, which keeps coverage and hero takes on one solve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no camera or move; the coverage camera goes through the same solve as the hero with no special path, and absent lens intent is left as the entries state it rather than filled in here.
 * @evidence contracts/common.md#meaningful-documentation States what a coverage take is, which camera parameterizes the solve, the intent order and its non-use by the solve, the entry precondition, the empty case and the errors passed through.
 * @evidence contracts/performance.md#efficient-algorithms One `compileCameraMove` call, whose cost is answered there, plus one linear pass over the entries for the intents.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per coverage camera per shot with that camera's own entries, so no two calls compute the same take.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned take references the entries' intent records and a fresh clip, both owned by the caller.
 */
export function compileCameraCoverage (props: {
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
}): IAutoMovieShotCoverage { return ({
  camera: props.camera.id,
  cameraMotion: compileCameraMove({
    clipId: props.clipId,
    camera: props.camera,
    entries: props.entries,
    shotDuration: props.shotDuration,
    aspect: props.aspect,
  }),
  cameraIntent: props.entries.map(
    (entry: IAutoMovieCameraCoverageEntry): IAutoMovieCameraIntent =>
      entry.intent,
  ),
}); }
