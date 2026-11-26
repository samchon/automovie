import { type IAutoMoviePoseKeypointSidecar } from "@automovie/interface";
import { renderPoseKeypointSidecar as renderPoseKeypointSidecarImplementation } from "./internal/renderPoseKeypointSidecar.js";

/** Public operations for Auto Movie Render Pose Keypoint Sidecar. */
export namespace AutoMovieRenderPoseKeypointSidecar {
  /**
   * Serialize a pose-keypoint sidecar for the host to write: JSON indented by two
   * spaces, properties in declaration order, ending with one newline.
   *
   * The same sidecar always serializes to the same text, and an absent
   * `atmosphere` writes no key, so a fogless scene's file matches one written
   * before that field existed.
   */
  export function render(sidecar: IAutoMoviePoseKeypointSidecar): string {
    return renderPoseKeypointSidecarImplementation(sidecar);
  }
}
