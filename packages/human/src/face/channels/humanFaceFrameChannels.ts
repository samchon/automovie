import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare frame scalar controls for the common document editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Exposes facial width, length and named foundation projections through the detailed editor.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Carries signed foundation dimensions into the shared host profile, leaving the host to admit their combined deformation.
 */
export const humanFaceFrameChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    channel(
      "frame",
      "widthScale",
      "Nasion-centred facial width",
      "ratio",
      0.7,
      1.3,
      0.01,
      "Increasing widens the common facial foundation; decreasing narrows it.",
    ),
    channel(
      "frame",
      "lengthScale",
      "Nasion-centred facial length",
      "ratio",
      0.7,
      1.3,
      0.01,
      "Increasing lengthens the common facial foundation; decreasing shortens it.",
    ),
    channel(
      "frame",
      "jawWidth",
      "Mandibular angle breadth",
      "mm",
      -8,
      8,
      0.1,
      "Increasing moves both gonial supports laterally; decreasing draws them medially.",
    ),
    channel(
      "frame",
      "chinHeight",
      "Gnathion inferior extent",
      "mm",
      -8,
      8,
      0.1,
      "Increasing lowers the chin; decreasing raises it.",
    ),
    channel(
      "frame",
      "chinProjection",
      "Pogonion anterior prominence",
      "mm",
      -8,
      8,
      0.1,
      "Increasing advances the chin; decreasing recesses it.",
    ),
    channel(
      "frame",
      "foreheadProjection",
      "Frontal midline prominence",
      "mm",
      -8,
      8,
      0.1,
      "Increasing advances the forehead; decreasing recesses it.",
    ),
    channel(
      "frame",
      "browProjection",
      "Superior-orbit foundation projection",
      "mm",
      -8,
      8,
      0.1,
      "Increasing advances both brow supports before eyelid fitting; decreasing recesses them without moving the aperture basis.",
    ),
    channel(
      "frame",
      "templeWidth",
      "Temporal breadth",
      "mm",
      -8,
      8,
      0.1,
      "Increasing widens both temporal supports; decreasing narrows them.",
    ),
  ];
