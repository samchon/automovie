import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import { resolveHumanFaceBrows } from "@automovie/human/face/anatomy/brow/resolveHumanFaceBrows";
import { createHumanFacePeriocularDefaults } from "@automovie/human/face/anatomy/eye/createHumanFacePeriocularDefaults";

/**
 * Materialize the face owner's omitted tissue stack or brow populations before editing one scalar. Introducing the first explicit member otherwise replaces neighboring implicit defaults. Explicit populations retain their sparse meaning. Only materialized default subtrees are copied; untouched document branches remain borrowed, and an unavailable tissue default stays unavailable.
 *
 * @evidence contracts/common.md#principled-implementation Only wholly omitted brows or periocular tissues use their canonical face owner's defaults, preserving the distinction between omission and an explicit sparse population.
 * @evidence contracts/common.md#clear-and-simple-design Two catalogue path prefixes delegate anatomical defaults to their existing owners and copy only the inserted subtree and document shells.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default dimensions or populations are invented locally, and unavailable defaults and already explicit selections remain unchanged.
 * @evidence contracts/common.md#meaningful-documentation The comment explains implicit-neighbor preservation and copied versus borrowed branches without claiming admission.
 * @evidence contracts/performance.md#efficient-algorithms Path dispatch is constant work; owner default derivation and cloning scale with the selected basis/default population, while other branches are not cloned here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each edit needs an independently writable inserted default subtree; this adapter retains no default cache and returns the original document when no materialization is needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned document shells/default copies belong to the editing transaction; this function retains no handle, timer or cross-call state. The panel owns documents surviving publication.
 *
 * @author Samchon
 */
export function prepareConnectedPersonCatalogueInput(
  basis: IAutoMovieHumanFaceBasis,
  document: IAutoMovieHumanPersonDocument,
  path: readonly string[],
): IAutoMovieHumanPersonDocument {
  if (path[0] !== "face") return document;
  if (path[1] === "brows" && document.face.brows === undefined) {
    const brows: ReturnType<typeof resolveHumanFaceBrows> = resolveHumanFaceBrows(basis, document.face.brows);
    return {
      ...document,
      face: { ...document.face, brows: structuredClone(brows) },
    };
  }
  if (
    path[1] === "periocularTissues" &&
    document.face.periocularTissues === undefined
  ) {
    const tissues: ReturnType<typeof createHumanFacePeriocularDefaults> = createHumanFacePeriocularDefaults(basis, document.face);
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
