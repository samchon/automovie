import { IAutoMovieCamera, IAutoMovieShotCoverage } from "@automovie/interface";

import { IAutoMovieCameraCoverageEntry } from "./IAutoMovieCameraCoverageEntry";
import { compileCameraMove } from "./compileCameraMove";

/**
 * Compile one beat's coverage take (#1187): the alternate angle another staged
 * camera plays over the beat, paired with its per-span intent as one
 * {@link IAutoMovieShotCoverage} record. The move compiles through the same
 * {@link compileCameraMove} framing grammar the hero take uses (the camera is a
 * parameter, so a side camera's staged bearing frames its own angle), and the
 * deterministic solve stays the only consumer of the geometry: the intent
 * records ride as guide metadata, never back into the math.
 *
 * Entries carry the same precondition as the hero take's: sorted by `start`,
 * non-overlapping (the shot builder gates that). An empty list is a locked-off
 * covering camera: `cameraMotion: null`, no intent spans, the same convention
 * as a shot with no `frame` action.
 */
export const compileCameraCoverage = (props: {
  camera: IAutoMovieCamera;
  clipId: string;
  entries: IAutoMovieCameraCoverageEntry[];
  shotDuration: number;
  /** Frame width over height, as {@link compileCameraMove} reads it. */
  aspect?: number;
}): IAutoMovieShotCoverage => ({
  camera: props.camera.id,
  cameraMotion: compileCameraMove({
    clipId: props.clipId,
    camera: props.camera,
    entries: props.entries,
    shotDuration: props.shotDuration,
    aspect: props.aspect,
  }),
  cameraIntent: props.entries.map((entry) => entry.intent),
});
