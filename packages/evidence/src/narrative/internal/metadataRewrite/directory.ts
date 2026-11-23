import fs from "node:fs";
import path from "node:path";

/** Resolves and validates a required comparison directory. */
export function directory(root: string, property: string): string {
  const resolved: string = path.resolve(root);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory())
    throw new Error(
      `${property}: expected an existing directory at ${resolved}.`,
    );
  return resolved;
}
