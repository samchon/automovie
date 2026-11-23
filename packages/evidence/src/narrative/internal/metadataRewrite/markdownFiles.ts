import fs from "node:fs";
import path from "node:path";

/** Inventories Markdown paths without following directory symlinks. */
export function markdownFiles(
  root: string,
  directoryPath: string = root,
): string[] {
  return fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .flatMap((entry: fs.Dirent<string>): string[] => {
      const target: string = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) return markdownFiles(root, target);
      if (
        (!entry.isFile() && !entry.isSymbolicLink()) ||
        !entry.name.endsWith(".md")
      )
        return [];
      return [path.relative(root, target).replaceAll("\\", "/")];
    });
}
