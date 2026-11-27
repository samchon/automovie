import type { IEvidenceMarkdownReference } from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import { createContractDirectory } from "../utilities/createContractDirectory";
import { createContractRoot } from "../utilities/createContractRoot";

/*
 * Creates a reference only when the production's own contract file exists.
 *
 * Language and work contracts are adopted by the production, so they always
 * resolve under its own `docs/contracts`, even when a workspace keeps the
 * shared contracts elsewhere. The root stops above the family folder, so the
 * family owning the item stays in the citation address a host writes.
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
