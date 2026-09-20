import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare neck scalar controls for the common document editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Exposes submental projection as a millimetre edit on the neck profile.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Keeps submental projection within its scalar envelope while cervical construction owns endpoint and tangent continuity.
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
