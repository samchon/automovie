import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare mouth scalar controls for the common document editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Exposes oral cavity wall and chamber dimensions in the same detailed editor as lip shape.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Distinguishes the wall ratio from chamber millimetre dimensions while oral construction admits their combined clearance.
 */
export const humanFaceCavityChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    channel(
      "mouth",
      "cavityWall",
      "Oral straight-wall depth fraction",
      "ratio",
      0,
      0.95,
      0.05,
      "Increasing keeps the opening cross-section deeper before closing; selecting zero still adds a rim-connected lining",
    ),
    channel(
      "mouth",
      "cavityChamber.horizontalExpansion",
      "Oral chamber transverse expansion",
      "mm",
      0,
      30,
      0.1,
      "Adds internal half-width beyond the vestibule without widening the lip aperture",
    ),
    channel(
      "mouth",
      "cavityChamber.verticalExpansion",
      "Oral chamber vertical expansion",
      "mm",
      0,
      30,
      0.1,
      "Adds internal half-height beyond the vestibule without opening the lips",
    ),
    channel(
      "mouth",
      "cavityChamber.transitionDepth",
      "Oral vestibule transition depth",
      "mm",
      0.1,
      60,
      0.1,
      "Sets the depth at which the chamber expansion reaches full weight before the posterior taper",
    ),
  ];
