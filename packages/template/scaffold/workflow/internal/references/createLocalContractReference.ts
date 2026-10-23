import type { IEvidenceMarkdownReference } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

/**
 * Creates a reference only when its effective local contract file exists.
 *
 * The root stops at `contracts/story`, so the family owning the item stays in the
 * citation address a host writes.
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
