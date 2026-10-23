import type { IEvidenceMarkdownReference } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

/**
 * Creates a reference only when its effective local contract file exists.
 *
 * The root stops at `contracts/story`, so the family owning the item stays in the
 * citation address a host writes.
 *
 * @evidence contracts/common.md#principled-implementation One exact local language/work file must exist before an H2 reference is returned; the root stays at contracts/story so scope remains part of the citation and checklist/exclusion flags preserve requested semantics.
 * @evidence contracts/common.md#clear-and-simple-design This builder owns optional local-contract admission and addresses for discovery, principle and obligation consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts File absence returns undefined rather than selecting a substitute contract; literal family paths are the supported local production layout.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies existence as the admission rule and explains why the citation address retains its family.
 * @evidence contracts/performance.md#efficient-algorithms One synchronous existence probe plus a fixed number of path/string operations costs O(p) text work for combined location/scope/file length, with no document-content read.
 * @evidence contracts/performance.md#reuse-equivalent-work All local contract consumers reuse the same addressing and flags; the existence probe is intentionally repeated per config build so installation edits remain visible.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The optional returned reference contains one selector; call-local paths expire at return and fs.existsSync leaves no owned open descriptor, task or retained cache.
 */
export function createLocalContractReference(props: {
  location: string;
  scope: "language" | "work";
  file: string;
  checklist: boolean;
  exclusion: boolean;
}): IEvidenceMarkdownReference | undefined {
  const root: string = path.join(
    props.location,
    ".agents",
    "skills",
    "contracts",
    "story",
  );
  const file: string = `${props.scope}/${props.file}`;
  if (!fs.existsSync(path.join(root, props.scope, props.file)))
    return undefined;
  return {
    type: "markdown",
    root: path.relative(props.location, root).replaceAll("\\", "/"),
    files: [file],
    symbol: "h2",
    ...(props.checklist ? { checklist: true } : {}),
    ...(props.exclusion ? {} : { noEvidenceExclude: true }),
  };
}
