import type { IEvidenceMarkdownReference } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import { createContractDirectory } from "../utilities/createContractDirectory";
import { createContractRoot } from "../utilities/createContractRoot";

/**
 * Creates a reference only when the production's own contract file exists.
 *
 * Language and work contracts are adopted by the production, so they always
 * resolve under its own `docs/contracts`, even when a workspace keeps the
 * shared contracts elsewhere. The root stops above the family folder, so the
 * family owning the item stays in the citation address a host writes.
 *
 * @evidence contracts/development/implementation.md#principled-implementation One exact production-owned language/work file must exist before an H2 reference is returned; createContractDirectory and createContractRoot place both the probe and the root in the production's `docs/contracts`, and checklist/exclusion flags preserve requested semantics.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This builder owns optional local-contract admission and addresses for discovery, principle and obligation consumers; the owning tree is decided by createContractDirectory.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts File absence returns undefined rather than selecting a substitute from the shared tree or the retired `.agents/skills` location, which assertProductionContractLayout refuses before any factory runs.
 * @evidence contracts/development/implementation.md#efficient-algorithms One synchronous existence probe plus a fixed number of path/string operations costs O(p) text work for combined location/scope/file length, with no document-content read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All local contract consumers reuse the same addressing and flags; the existence probe is intentionally repeated per config build so installation edits remain visible.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The optional returned reference contains one selector; call-local paths expire at return and fs.existsSync leaves no owned open descriptor, task or retained cache.
 * @evidence contracts/development/common.md#meaningful-documentation The prose identifies the production's `docs/contracts` as owner, existence as the admission rule, and why the citation address retains its family.
 */
export function createLocalContractReference(props: {
  location: string;
  scope: "language" | "work";
  file: string;
  checklist: boolean;
  exclusion: boolean;
}): IEvidenceMarkdownReference | undefined {
  const directory: string = createContractDirectory(props, props.scope);
  if (!fs.existsSync(path.join(directory, props.scope, props.file)))
    return undefined;
  return {
    type: "markdown",
    root: createContractRoot(props, props.scope),
    files: [`${props.scope}/${props.file}`],
    symbol: "h2",
    ...(props.checklist ? { checklist: true } : {}),
    ...(props.exclusion ? {} : { noEvidenceExclude: true }),
  };
}
