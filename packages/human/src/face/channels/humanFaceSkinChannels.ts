import { portraitSkinParameters } from "../anatomy/skin/portraitSkinParameters";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare skin scalar controls for the common document editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Connects native skin-shape parameters to numerical detail editing.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Preserves each skin parameter ID, unit, interval and effect instead of defining a second skin-shape vocabulary.
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
