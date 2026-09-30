import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare dentition scalar controls for the common document editor.
 */
export const humanFaceUpperDentalChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    channel(
      "dentition",
      "row.halfWidth",
      "Maxillary arch transverse semiaxis",
      "mm",
      12,
      40,
      0.1,
      "Increasing widens the arch without resizing individual crowns; decreasing narrows it.",
    ),
    channel(
      "dentition",
      "row.depth",
      "Maxillary arch posterior semiaxis",
      "mm",
      8,
      35,
      0.1,
      "Increasing curves lateral crowns farther posteriorly; decreasing flattens the arch.",
    ),
    channel(
      "dentition",
      "row.gap",
      "Nominal inter-crown arch clearance",
      "mm",
      0,
      2,
      0.01,
      "Increasing separates crowns along the guide; decreasing packs them more closely.",
    ),
    channel(
      "dentition",
      "placement.lift",
      "Whole maxillary row superior placement",
      "mm",
      -4,
      8,
      0.1,
      "Increasing raises the upper row behind the lip; decreasing lowers it.",
    ),
    channel(
      "dentition",
      "placement.recess",
      "Whole maxillary row posterior placement",
      "mm",
      0,
      15,
      0.1,
      "Increasing recesses the row; decreasing advances it.",
    ),
  ];
