import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare lowerDentition scalar controls for the common document editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Exposes mandibular arch dimensions and placement through the detailed editor.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Carries lower dentition millimetre controls into the jaw-owned profile without changing upper dentition settings.
 */
export const humanFaceLowerDentalChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    channel(
      "lowerDentition",
      "row.halfWidth",
      "Mandibular arch transverse semiaxis",
      "mm",
      10,
      35,
      0.1,
      "Increasing widens the lower arch without resizing crowns; decreasing narrows it.",
    ),
    channel(
      "lowerDentition",
      "row.depth",
      "Mandibular arch posterior semiaxis",
      "mm",
      8,
      35,
      0.1,
      "Increasing curves lateral lower crowns farther posteriorly; decreasing flattens the arch.",
    ),
    channel(
      "lowerDentition",
      "placement.drop",
      "Lower cervical plane inferior placement",
      "mm",
      0,
      15,
      0.1,
      "Increasing lowers the lower arch behind its lip; decreasing raises it.",
    ),
    channel(
      "lowerDentition",
      "placement.recess",
      "Whole mandibular row posterior placement",
      "mm",
      0,
      15,
      0.1,
      "Increasing recesses lower enamel; decreasing advances it.",
    ),
  ];
