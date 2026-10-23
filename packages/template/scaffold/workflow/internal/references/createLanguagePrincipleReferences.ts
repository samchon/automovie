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
