import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";

import { createLocalContractReference } from "./createLocalContractReference";

/** Selects the installed language's active open-world calibration questions. */
export function createLanguageDiscoveryReferences(
  location: string,
): IEvidenceReference[] {
  const reference: IEvidenceMarkdownReference | undefined =
    createLocalContractReference({
      location,
      scope: "language",
      file: "discovery/questions.md",
      checklist: false,
      exclusion: true,
    });
  return reference === undefined ? [] : [reference];
}
