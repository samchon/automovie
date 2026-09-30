import { portraitEyelashParameters } from "../anatomy/lash/portraitEyelashParameters";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";
import { millimetrePoint as p } from "../mesh/millimetrePoint";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

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
