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
