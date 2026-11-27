import {
  type IAutoMovieCameraCoverageEntry,
  IAutoMovieCameraIntent,
  type IAutoMovieCompileCameraCoverage,
  IAutoMovieShotCoverage,
} from "@automovie/interface";

import { compileCameraMove } from "./compileCameraMove";

/*
 * Compile one coverage take: the alternate angle another staged camera plays
 * over a beat, as an IAutoMovieShotCoverage record.
 *
 * The camera clip comes from compileCameraMove with this camera as its
 * parameter, so the side staging gave it is the side the angle plays from, and
 * `cameraIntent` lists each entry's intent in entry order. The intent is guide
 * metadata for a render host and never feeds the solve. Entries must be sorted
 * by `start` and must not overlap, as for the hero take; an empty list yields a
 * locked-off take with `cameraMotion: null` and no intent spans. Throws
 * whatever compileCameraMove throws for a framing or move outside the
 * grammar.
 */
export function compileCameraCoverage(
  props: IAutoMovieCompileCameraCoverage.IProps,
): IAutoMovieShotCoverage {
  return {
    camera: props.camera.id,
    cameraMotion: compileCameraMove({
      clipId: props.clipId,
      camera: props.camera,
      entries: props.entries,
      shotDuration: props.shotDuration,
      aspect: props.aspect,
      frameRate: props.frameRate,
    }),
    cameraIntent: props.entries.map(
      (entry: IAutoMovieCameraCoverageEntry): IAutoMovieCameraIntent =>
        entry.intent,
    ),
  };
}
