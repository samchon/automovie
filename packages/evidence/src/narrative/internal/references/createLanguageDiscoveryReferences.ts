import type {
  IEvidenceMarkdownReference,
  IEvidenceReference,
} from "@wrtnlabs/evidence";

import { createLocalContractReference } from "./createLocalContractReference";

/**
 * Selects the installed language's active open-world calibration questions.
 *
 * @evidence contracts/common.md#principled-implementation An installed language discovery/questions.md becomes an ordinary H2 coverage target with truthful exclusions; absence produces an empty reference list.
 * @evidence contracts/common.md#clear-and-simple-design The helper gives language calibration its own optional target while delegating local contract-root addressing to one shared builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional language selection reflects installed project contracts and does not force a language or fabricate replacement questions.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies active installed-language calibration questions; the optional local-reference result determines whether any claim target exists.
 * @evidence contracts/performance.md#efficient-algorithms One synchronous existence probe and fixed-size object/array construction are independent of manuscript length; path work scales with location text.
 * @evidence contracts/performance.md#reuse-equivalent-work createLocalContractReference supplies shared local-root and option semantics, and its existence observation refreshes every config build.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The zero-or-one reference array is caller-owned; there is no persistent language state, open descriptor or background task.
 */
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
