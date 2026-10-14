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
 *
 * @evidence contracts/common.md#principled-implementation Appearance-resolved scalp layers and explicit named facial hair expansion form one ordered population for emission and Person contact; undefined/null facial hair contributes nothing. Registered source profiles remain authored geometry, not follicle inference.
 * @evidence contracts/common.md#clear-and-simple-design One selector shares the exact scalp/facial population between face assembly and body contact while population owners keep expansion rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No terminal facial shaft is omitted to evade assembled contact; absence is the supported no-population state. Appearance-resolved input is a prerequisite, not a synthesized legacy style.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies the resolved-document prerequisite, complete ordered population and unchanged saved input; returned scalp layer objects remain borrowed.
 * @evidence contracts/performance.md#efficient-algorithms Concatenation costs O(L) layers plus actual facial expansion/station work; this selector constructs no meshes or collision queries.
 * @evidence contracts/performance.md#reuse-equivalent-work Both geometry consumers share this selection rule; changed resolved inputs require new expansion and no cross-document result is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A fresh array and expanded facial profiles transfer, borrowing scalp records; no population history, external handle or task survives.
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
