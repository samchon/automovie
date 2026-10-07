import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import { resolveHumanFaceBrows } from "@automovie/human/face/anatomy/brow/resolveHumanFaceBrows";
import { createHumanFacePeriocularDefaults } from "@automovie/human/face/anatomy/eye/createHumanFacePeriocularDefaults";

/**
 * Materialize the face owner's omitted tissue stack or brow populations before
 * one scalar is edited. Otherwise introducing the first explicit member would
 * remove neighboring default tissues or the other brow population. Explicit
 * selections retain their sparse meaning.
 * All records are copied, and an unavailable owner default stays unavailable.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Preserves neighboring omitted-default tissues when the first tissue control is applied.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Reads the face owner's exact default conversion and retains explicit sparse selections without changing the caller's document.
 * @author Samchon
 */
export function prepareConnectedPersonCatalogueInput(
  basis: IAutoMovieHumanFaceBasis,
  document: IAutoMovieHumanPersonDocument,
  path: readonly string[],
): IAutoMovieHumanPersonDocument {
  if (path[0] !== "face") return document;
  if (path[1] === "brows" && document.face.brows === undefined) {
    const brows = resolveHumanFaceBrows(basis, document.face.brows);
    return {
      ...document,
      face: { ...document.face, brows: structuredClone(brows) },
    };
  }
  if (
    path[1] === "periocularTissues" &&
    document.face.periocularTissues === undefined
  ) {
    const tissues = createHumanFacePeriocularDefaults(basis, document.face);
    return tissues === undefined
      ? document
      : {
          ...document,
          face: {
            ...document.face,
            periocularTissues: structuredClone(tissues),
          },
        };
  }
  return document;
}
