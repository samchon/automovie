import { resolveHumanFaceFacialHair } from "../anatomy/hair/resolveHumanFaceFacialHair";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceHair } from "../structures/IAutoMovieHumanFaceHair";

/**
 * Read the complete admitted scalp and named facial population for assembly.
 * The caller supplies the appearance-resolved document; saved input remains
 * unchanged. This same expansion is used by face emission and Person body
 * contact so terminal shafts cannot disappear from the assembled clearance.
 *
 * @evidence contracts/common.md#principled-implementation Returns all actual emitted population definitions through their sole facial resolver and unchanged scalp records.
 * @evidence contracts/common.md#clear-and-simple-design One coupled assembly reader serves both Person builders without duplicating site expansion or source lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No face population is replaced by scalp, brow or lash completion and no source field is synthesized.
 * @evidence contracts/common.md#meaningful-documentation States appearance-resolution precondition, saved input ownership and complete assembly membership.
 * @author Samchon
 */
export function resolveHumanFaceHairLayers(
  basis: IAutoMovieHumanFaceBasis,
  document: IAutoMovieHumanFaceBasisDocument,
): IAutoMovieHumanFaceHair.Layer[] {
  return [
    ...(document.hair?.layers ?? []),
    ...(document.facialHair === undefined || document.facialHair === null
      ? [] : resolveHumanFaceFacialHair(document.facialHair, basis).layers),
  ];
}
