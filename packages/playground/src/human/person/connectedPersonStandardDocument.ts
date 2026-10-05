import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * The standard person the connected person editor opens with and Reset
 * returns to: the CC0 reference face on the neutral body, one linked
 * identity, no shape, expression or pose authored. The basis ids are the
 * published generation's head and body view ids.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Starts the person from the neutral body document on the published body view.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Starts the person from the CC0 reference face document on the published head view.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Names the exact body view revision the starting document is bound to.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Names the exact head view revision the starting face is replayed on.
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
