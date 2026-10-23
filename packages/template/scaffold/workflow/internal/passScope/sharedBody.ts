import path from "node:path";

import { canonicalProductionPath as canonical } from "../../canonicalProductionPath";

/** Tests whether an address belongs to this production's shared promoted body tree. */
export function sharedBody(root: string, filename: string): boolean {
  const base: string = `${canonical(path.resolve(root, "docs", "body"))}/`;
  const target: string = canonical(filename);
  return target === base.slice(0, -1) || target.startsWith(base);
}
