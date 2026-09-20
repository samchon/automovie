import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare cheek scalar controls for the common document editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Exposes malar, medial, buccal and nasolabial detail with independent cheek ownership.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Keeps cheek projections and groove depth in millimetres while the cheek component owns shared-skin attachment.
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
