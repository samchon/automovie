import type { IAutoMoviePoseKeypointSidecar } from "@automovie/interface";

/**
 * Serialize a pose-keypoint sidecar for the host to write: JSON indented by two
 * spaces, properties in declaration order, ending with one newline.
 *
 * The same sidecar always serializes to the same text, and an absent
 * `atmosphere` writes no key, so a fogless scene's file matches one written
 * before that field existed.
 */
export const renderPoseKeypointSidecar: (
  sidecar: IAutoMoviePoseKeypointSidecar,
) => string = (sidecar: IAutoMoviePoseKeypointSidecar): string =>
  `${JSON.stringify(sidecar, null, 2)}\n`;
