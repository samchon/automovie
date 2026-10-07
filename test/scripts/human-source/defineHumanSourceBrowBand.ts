import type { IAutoMovieHumanFacePeriocularBrowBand } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularBrowBand";

import { HUMAN_SOURCE_BROW_BAND_SELECTION } from "./HUMAN_SOURCE_BROW_BAND_SELECTION.ts";
import type { IHumanSourceMirror } from "./structures/IHumanSourceMirror.ts";

/**
 * Bind the shared source-authored brow band to the canonical skin and preserve
 * the actual card replacement identity and finish. The head skin transports
 * this band through its existing endpoints; source-card vertices never stand
 * in for skin implantation coordinates or clinical follicle evidence.
 */
export function defineHumanSourceBrowBand(
  side: "left" | "right",
  generation: string,
  mirror: IHumanSourceMirror,
  nativeToFace: (vertex: number) => number,
  replaceVertices: number[],
  material: string,
  sourceSha256: string[],
): IAutoMovieHumanFacePeriocularBrowBand {
  const selection = HUMAN_SOURCE_BROW_BAND_SELECTION;
  const row = (vertices: readonly number[]): number[] =>
    vertices.map((vertex) =>
      nativeToFace(side === "left" ? vertex : mirror.twin[vertex]),
    );
  const upper = row(selection.upper),
    lower = row(selection.lower);
  if (
    upper.length !== lower.length ||
    new Set([...upper, ...lower]).size !== upper.length + lower.length
  )
    throw new Error(
      `Periocular brow band: ${side} host boundaries are incomplete or overlap.`,
    );
  if (
    replaceVertices.length !== 62 ||
    new Set(replaceVertices).size !== replaceVertices.length
  )
    throw new Error(
      `Periocular brow band: ${side} source card replacement differs from its authored footprint.`,
    );
  return {
    sourceId: selection.sourceId,
    generation,
    sourceSha256: [...new Set([...selection.sourceSha256, ...sourceSha256])],
    surface: "Human",
    upper,
    lower,
    replaceSurface: "Human.eyebrow001",
    replaceVertices: [...replaceVertices],
    material,
    qualification: "authoredConvention",
  };
}
