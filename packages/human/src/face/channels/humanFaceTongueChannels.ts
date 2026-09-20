import { portraitTongueParameters } from "../anatomy/tongue/portraitTongueParameters";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare tongue scalar controls for the common document editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Connects native tongue dimensions to numerical editing without duplicating their ranges.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Maps tongue parameter IDs and bounds to tongue profile leaves with a millimetre editing step.
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
