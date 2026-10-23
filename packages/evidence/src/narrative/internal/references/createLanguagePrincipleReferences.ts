import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import { createLocalContractReference } from "./createLocalContractReference";
import { layerFiles } from "./layerFiles";

/**
 * Selects the installed language's per-unit questions for one gate.
 *
 * Supported language modules place per-unit questions in naturalness, so their
 * construction selection is empty for those modules.
 *
 * @evidence contracts/common.md#principled-implementation Layer-specific candidate files are selected from the installed language principles or naturalness family, with every present file forming a per-unit H2 checklist and exclusions forbidden.
 * @evidence contracts/common.md#clear-and-simple-design Family selection is localized here while local-file admission and contract-relative addresses belong to createLocalContractReference.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing optional language files are omitted according to the sparse installed module; no default language or synthetic question is substituted.
 * @evidence contracts/common.md#meaningful-documentation The prose states per-unit ownership, gate selection and the supported modules that put their questions in naturalness.
 * @evidence contracts/performance.md#efficient-algorithms At most four candidate files each require one synchronous existence probe; mapping/filtering and allocated references have a fixed family bound with path-length-dependent string work.
 * @evidence contracts/performance.md#reuse-equivalent-work layerFiles and the local-reference builder centralize equivalent scope/address rules; installation state is observed for each build, not cached across edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the bounded returned references remain with the claim owner; intermediate optional arrays and paths expire after the call with no open handles or tasks.
 */
export function createLanguagePrincipleReferences(props: {
  location: string;
  layer: AuthoredLayer;
  gate: "layer" | "naturalness";
}): IEvidenceReference[] {
  const family: string =
    props.gate === "naturalness" ? "naturalness" : "principles";
  return layerFiles(props.layer)
    .map((file: string): IEvidenceMarkdownReference | undefined =>
      createLocalContractReference({
        location: props.location,
        scope: "language",
        file: `${family}/${file}`,
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
