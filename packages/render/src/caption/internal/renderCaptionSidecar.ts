import type { IAutoMovieCaptionSidecar } from "@automovie/interface";

/**
 * Serialize a caption sidecar for the host to write: two-space indented JSON in
 * declaration order, followed by one newline.
 */
export const renderCaptionSidecar: (
  sidecar: IAutoMovieCaptionSidecar,
) => string = (sidecar: IAutoMovieCaptionSidecar): string =>
  `${JSON.stringify(sidecar, null, 2)}\n`;
