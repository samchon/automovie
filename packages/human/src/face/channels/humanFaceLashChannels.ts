import { portraitEyelashParameters } from "../anatomy/lash/portraitEyelashParameters";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { millimetrePoint as p } from "../mesh/millimetrePoint";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare lashes scalar controls for the common document editor.
 */
export const humanFaceLashChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    ...portraitEyelashParameters.map((p) =>
      channel(
        "eye",
        `upperLashProfile.${p.id}`,
        p.meaning,
        p.unit,
        p.minimum,
        p.maximum,
        p.step,
        p.effect,
      ),
    ),
  ];
