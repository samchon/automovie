import fs from "node:fs";
import path from "node:path";

/** Lists canon paths in reading order, retaining legacy flat settings without rewriting them. */
export function readSettingsFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  const folders: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(entry.name);
    else if (entry.isDirectory() && entry.name !== "outline") {
      if (!/^[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(entry.name))
        throw new Error(
          `${path.join(root, entry.name)}: settings subject folders use NNN-lower-kebab-case.`,
        );
      folders.push(entry.name);
    } else if (entry.isSymbolicLink())
      throw new Error(
        `${path.join(root, entry.name)}: settings does not follow symbolic links.`,
      );
  }
  if (files.length && folders.length)
    throw new Error(`${root}: flat and classified settings cannot be mixed.`);
  const numbers: Set<string> = new Set<string>();
  const classified: string[] = [];
  for (const folder of folders.sort(
    (left: string, right: string): 1 | -1 | 0 =>
      left < right ? -1 : left > right ? 1 : 0,
  )) {
    if (numbers.has(folder.slice(0, 3)))
      throw new Error(
        `${root}: settings subject folders must have distinct order numbers.`,
      );
    numbers.add(folder.slice(0, 3));
    const used: Set<string> = new Set<string>();
    for (const entry of fs
      .readdirSync(path.join(root, folder), { withFileTypes: true })
      .sort((a: fs.Dirent<string>, b: fs.Dirent<string>): number =>
        a.name.localeCompare(b.name),
      )) {
      if (
        !entry.isFile() ||
        !/^[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u.test(entry.name)
      )
        throw new Error(
          `${path.join(root, folder, entry.name)}: settings subject folders hold numbered Markdown files only, without nesting.`,
        );
      if (used.has(entry.name.slice(0, 3)))
        throw new Error(
          `${path.join(root, folder)}: settings files must have distinct order numbers within their folder.`,
        );
      used.add(entry.name.slice(0, 3));
      classified.push(`${folder}/${entry.name}`);
    }
    if (!used.size)
      throw new Error(
        `${path.join(root, folder)}: an empty settings subject folder has no canon.`,
      );
  }
  return folders.length
    ? classified
    : files.sort((left: string, right: string): 1 | -1 | 0 =>
        left < right ? -1 : left > right ? 1 : 0,
      );
}
