import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * The standard person the connected person editor opens with and Reset
 * returns to: the CC0 reference face on the neutral body, one linked
 * identity, no shape, expression or pose authored. The basis ids are the
 * published generation's head and body view ids.
 *
 * @author Samchon
 */
export function connectedPersonStandardDocument(faceBasis: string, bodyBasis: string): IAutoMovieHumanPersonDocument {
  return {
    id: "connected-person",
    name: "CC0 connected person",
    population: "linked",
    face: { id: "connected-person-face", name: "reference face", basis: faceBasis, shape: {}, expression: {} },
    body: { id: "connected-person-body", name: "neutral body", basis: bodyBasis, shape: {} },
  };
}
