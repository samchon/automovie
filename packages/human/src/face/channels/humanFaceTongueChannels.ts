import { portraitTongueParameters } from "../anatomy/tongue/portraitTongueParameters";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare tongue scalar controls for the common document editor.
 */
export const humanFaceTongueChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    ...portraitTongueParameters.map((p) =>
      channel(
        "tongue",
        p.id,
        p.meaning,
        "mm",
        p.minimum,
        p.maximum,
        0.1,
        p.effect,
      ),
    ),
  ];
