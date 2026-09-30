import { portraitSkinParameters } from "../anatomy/skin/portraitSkinParameters";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare skin scalar controls for the common document editor.
 */
export const humanFaceSkinChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    ...portraitSkinParameters.map((p) =>
      channel(
        "skin",
        p.id,
        p.meaning,
        p.unit,
        p.minimum,
        p.maximum,
        p.step,
        p.effect,
      ),
    ),
  ];
