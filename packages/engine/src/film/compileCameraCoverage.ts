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
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing Compiles an alternate staged camera and its per-span intent through the same subject-framing solver as the hero take.
 * @evidence requirements/camera/scope-and-identity.md#camera-shot-distinction Keeps the alternate camera id and motion separate from the hero shot camera while compiling both from the same beat.
 * @evidence requirements/camera/scope-and-identity.md#camera-take-lineage Carries each coverage take's camera id, motion, and ordered intent spans without merging them into the elected hero take.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations compileCameraCoverage realizes landmark-based framing: Compile one beat's coverage take (#1187): the alternate angle another staged camera plays over the beat, paired with its per-span intent as one {@link IAutoMovieShotCoverage} record. The move compiles through the same {@link compileCameraMove} framing grammar the hero take uses (the camera is a parameter, so a side camera's staged bearing frames its own angle), and the deterministic solve stays the only consumer of the geometry: the intent records ride as guide metadata, never back into the math. Entries carry the same precondition as the hero take's: sorted by `start`, non-overlapping (the shot builder gates that). An empty list is a locked-off covering camera: `cameraMotion: null`, no intent spans, the same convention as a shot with no `frame` action.
 * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-camera-authority-spatial-binding Preserves one independent camera identity and timed intent record for the coverage branch while retaining the common shot source.
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
