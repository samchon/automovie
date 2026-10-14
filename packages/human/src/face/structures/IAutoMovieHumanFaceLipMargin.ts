import type { IAutoMovieHumanFaceNativeLipMargin } from "./IAutoMovieHumanFaceNativeLipMargin";
import type { IAutoMovieHumanFaceVertexLipMargin } from "./IAutoMovieHumanFaceVertexLipMargin";

/**
 * Two source-registered contact trajectories on the contact's lips surface.
 *
 * Existing resident vertex chains retain their original registration. A
 * material course instead carries native facet seats and original source
 * stops without inventing resident vertices. The common margin reader admits
 * both representations and supplies canonical performed points. Source rest
 * ordering does not prove performed ordering or contact: the closure and gap
 * owners verify the actual graph, tissue budget and residual independently.
 *
 * @evidence contracts/common.md#principled-implementation The union preserves registered resident chains and native-facet material courses; readHumanFaceLipMarginPoints produces performed points and source identities through their actual representation.
 * @evidence contracts/common.md#clear-and-simple-design Two canonical alternatives share one margin reader without inventing vertices for an interior source seat.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest order or source identity alone does not prove performed contact, closure or budget admission; those owners evaluate actual geometry separately.
 * @evidence contracts/common.md#meaningful-documentation Resident versus material trajectories and source-rest versus performed ordering are distinguished, including unchanged engine interpolation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union implements no trajectory interpolation or contact pass.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It shares a reader contract but caches no performed points.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source arrays remain with their owners; the union creates no query or closure state.
 *
 * @author Samchon
 */
export type IAutoMovieHumanFaceLipMargin =
  | IAutoMovieHumanFaceVertexLipMargin
  | IAutoMovieHumanFaceNativeLipMargin;
