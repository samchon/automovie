import fs from "node:fs";
import path from "node:path";

import { isNodeError } from "./isNodeError";

/** Identifies missing paths, regular files, and paths that must not be followed. */
export function protectedFileKind(root: string, file: string): string {
  let target: string = root;
  const parts: string[] = file.split("/");
  for (let index: number = 0; index < parts.length; index += 1) {
    target = path.join(target, parts[index]);
    try {
      const stat: fs.Stats = fs.lstatSync(target);
      if (stat.isSymbolicLink()) return "symlink";
      if (index === parts.length - 1)
        return stat.isFile() ? "file" : "non-file";
      if (!stat.isDirectory()) return "non-file";
    } catch (error: unknown) {
      if (isNodeError(error) && error.code === "ENOENT") return "missing";
      throw error;
    }
  }
  return "non-file";
}
