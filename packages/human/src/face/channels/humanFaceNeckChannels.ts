import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";

/**
 * Declare neck scalar controls for the common document editor.
 */
export const humanFaceNeckChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    channel(
      "neck",
      "submentalProjection",
      "Submental anterior fullness",
      "mm",
      0,
      40,
      0.5,
      "Increasing projects the anterior collar-to-neck transition without changing its endpoint positions or tangents",
    ),
  ];
