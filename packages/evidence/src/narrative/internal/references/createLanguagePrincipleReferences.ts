import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import { createLocalContractReference } from "./createLocalContractReference";
import { layerFiles } from "./layerFiles";

/*
 * Selects the installed language's construction principles for one layer.
 *
 * Language-specific screenplay questions follow the same unit scope as the
 * shared ones.
 */
export function createLanguagePrincipleReferences(props: {
  location: string;
  layer: AuthoredLayer;
}): IEvidenceReference[] {
  return layerFiles(props.layer)
    .map((file: string): IEvidenceMarkdownReference | undefined =>
      createLocalContractReference({
        location: props.location,
        scope: "language",
        file: `principles/${file}`,
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
