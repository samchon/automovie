import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import { createLocalContractReference } from "./createLocalContractReference";
import { layerFiles } from "./layerFiles";

/**
 * Selects the installed language's per-unit questions for one family.
 *
 * A language module's principles apply to every construction; its
 * `naturalness/` questions apply to scripts construction, the one layer that
 * selects the expression family.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Layer-specific candidate files are selected from the installed language principles or expression family, with every present file forming a per-unit H2 checklist and exclusions forbidden.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Family selection is localized here while local-file admission and contract-relative addresses belong to createLocalContractReference.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing optional language files are omitted according to the sparse installed module; no default language or synthetic question is substituted.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states per-unit ownership, family selection and which construction answers the expression family.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four candidate files each require one synchronous existence probe; mapping/filtering and allocated references have a fixed family bound with path-length-dependent string work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work layerFiles and the local-reference builder centralize equivalent scope/address rules; installation state is observed for each build, not cached across edits.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the bounded returned references remain with the claim owner; intermediate optional arrays and paths expire after the call with no open handles or tasks.
 */
export function createLanguagePrincipleReferences(props: {
  location: string;
  layer: AuthoredLayer;
  family: "principles" | "naturalness";
}): IEvidenceReference[] {
  return layerFiles(props.layer)
    .map((file: string): IEvidenceMarkdownReference | undefined =>
      createLocalContractReference({
        location: props.location,
        scope: "language",
        file: `${props.family}/${file}`,
        checklist: true,
        exclusion: false,
      }),
    )
    .filter(
      (
        reference: IEvidenceMarkdownReference | undefined,
      ): reference is IEvidenceMarkdownReference => reference !== undefined,
    );
}
