import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * Declare lowerDentition scalar controls for the common document editor.
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
