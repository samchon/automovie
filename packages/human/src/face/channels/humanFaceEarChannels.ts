import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * Declare ear scalar controls for the common document editor.
 */
export const humanFaceEarChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    channel(
      "ear",
      "heightScale",
      "Pinna vertical outline",
      "ratio",
      0.5,
      2,
      0.01,
      "Increasing elongates the pinna; decreasing shortens it.",
    ),
    channel(
      "ear",
      "depthScale",
      "Pinna anterior-posterior outline",
      "ratio",
      0.3,
      1.8,
      0.01,
      "Increasing broadens the pinna's sagittal extent; decreasing narrows it.",
    ),
    channel(
      "ear",
      "projection",
      "Pinna projection beyond temporal skin",
      "mm",
      1,
      25,
      0.1,
      "Increasing projects the posterior pinna rim; decreasing draws it closer to the head.",
    ),
    channel(
      "ear",
      "centerY",
      "Pinna centre elevation",
      "mm",
      -25,
      30,
      0.1,
      "Increasing raises the whole pinna; decreasing lowers it.",
    ),
    channel(
      "ear",
      "centerZ",
      "Pinna centre anterior placement",
      "mm",
      -90,
      -10,
      0.1,
      "Increasing moves the pinna forward; decreasing moves it posteriorly.",
    ),
  ];
