import path from "node:path";

import { withinProductionDirectory } from "./withinProductionDirectory";

/** Tests whether an address belongs to this production's shared promoted body tree. */
export function sharedBody(
  root: string,
  filename: string,
  canonical: (filename: string, logicalRoot?: string) => string,
): boolean {
  return withinProductionDirectory(
    root,
    filename,
    path.resolve(root, "docs", "body"),
    canonical,
  );
}
