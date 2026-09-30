import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare cheek scalar controls for the common document editor.
 */
export const humanFaceCheekChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    channel(
      "cheek",
      "malar.projection",
      "Malar support projection",
      "mm",
      -5,
      10,
      0.1,
      "Increasing advances the zygomatic cheek support; decreasing recesses it.",
    ),
    channel(
      "cheek",
      "medial.projection",
      "Medial cheek support projection",
      "mm",
      -5,
      10,
      0.1,
      "Increasing advances the cheek beside the nose; decreasing recesses it.",
    ),
    channel(
      "cheek",
      "buccal.projection",
      "Buccal support projection",
      "mm",
      -5,
      10,
      0.1,
      "Increasing fills the lower lateral cheek; decreasing hollows it.",
    ),
    channel(
      "cheek",
      "foldDepth",
      "Nasolabial groove depth",
      "mm",
      0,
      3,
      0.05,
      "Increasing recesses the nasolabial path; decreasing flattens it.",
    ),
  ];
