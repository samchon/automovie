import * as fs from "node:fs";
import * as path from "node:path";

import type { IAutoMovieScaffoldSourceEntry } from "./IAutoMovieScaffoldSourceEntry";
import { listAutoMovieScaffoldFiles } from "./listAutoMovieScaffoldFiles";
import { scaffoldSharedSkillPath } from "./scaffoldSharedSkillPath";

/** Scaffold-relative directory, with the host's separator, holding every skill. */
const SKILLS: string = path.join(".agents", "skills");

/**
 * Read every shipped scaffold source, replacing each `$<name>` placeholder with the repository skill item it names.
 *
 * The scaffold's own files come from {@link listAutoMovieScaffoldFiles} with their text. A placeholder, as {@link scaffoldSharedSkillPath} defines it, must be empty; it is dropped, and the item it names under `skills` takes its place: a folder contributes every file {@link listAutoMovieScaffoldFiles} lists under it, and a file contributes itself, each at the item's path under the scaffold's `.agents/skills`. The scaffold may not author a file inside a folder a placeholder ships, so a shared skill has no second, partial owner; an authored file at a shipped file's path is left for {@link renderScaffoldEntries} to refuse as a collision.
 *
 * @param root Absolute scaffold directory.
 * @param skills Absolute directory holding the repository skill items, laid out as the repository's `.agents/skills`.
 * @returns The sources, the scaffold's own in listing order with each placeholder's items at its position.
 * @throws When a placeholder has text, when the item it names is missing, or when the scaffold authors a file inside a shipped folder.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Files are read as UTF-8 text like every other scaffold source; a folder item is listed by the same walker as the scaffold, so builder outputs and links inside it are excluded by the same policy; a shipped folder's files are found by a prefix match on the scaffold-relative path plus the separator, which cannot match a sibling whose name only starts with the folder's name.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The function owns reading sources and expanding placeholders, leaving the placeholder rule to `scaffoldSharedSkillPath`, the item location to the caller, and rendering and collision refusal to `renderScaffoldEntries`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No skill or file is named; every placeholder takes the same path, and a non-empty placeholder or an authored file inside a shipped folder is refused instead of being merged or discarded.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what is read, the placeholder's empty requirement, how folder and file items are placed, the refused overlap and the collision left to rendering, the output order, and what throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms The scaffold is listed once and each source file is read once; each placeholder adds one stat and one listing of its item, and the overlap check compares each authored path with each shipped folder prefix, costing authored files times shipped folders.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads the scaffold and the shared items as installed now, once per render.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Reads use `readFileSync` and `statSync`, which release their handles before returning; the listing lives only for the call, and the returned sources, one string per file, are owned by the caller.
 */
export const readAutoMovieScaffoldSources: (
  root: string,
  skills: string,
) => IAutoMovieScaffoldSourceEntry[] = (
  root: string,
  skills: string,
): IAutoMovieScaffoldSourceEntry[] => {
  const relatives: string[] = listAutoMovieScaffoldFiles(root);

  // Locate the shipped folders first, so an authored file inside one is refused wherever the walk meets it.
  const folders: string[] = [];
  for (const relative of relatives) {
    const shared: string | null = scaffoldSharedSkillPath(relative);
    if (shared === null) continue;
    const item: string = path.join(skills, shared);
    if (!fs.existsSync(item))
      throw new Error(
        `scaffold placeholder "${relative}" names a missing shared skill item: ${item}`,
      );
    if (fs.statSync(item).isDirectory())
      folders.push(path.join(SKILLS, shared) + path.sep);
  }

  const out: IAutoMovieScaffoldSourceEntry[] = [];
  for (const relative of relatives) {
    const content: string = fs.readFileSync(path.join(root, relative), "utf8");
    const shared: string | null = scaffoldSharedSkillPath(relative);
    if (shared === null) {
      const folder: string | undefined = folders.find(
        (prefix: string): boolean => relative.startsWith(prefix),
      );
      if (folder !== undefined)
        throw new Error(
          `scaffold file "${relative}" lies inside the shared skill folder "${folder}" that a placeholder ships`,
        );
      out.push({ content, relative });
      continue;
    }
    if (content.length !== 0)
      throw new Error(`scaffold placeholder "${relative}" must be empty`);

    // Ship the named item at its own path, never the placeholder.
    const item: string = path.join(skills, shared);
    const target: string = path.join(SKILLS, shared);
    if (fs.statSync(item).isDirectory())
      for (const file of listAutoMovieScaffoldFiles(item))
        out.push({
          content: fs.readFileSync(path.join(item, file), "utf8"),
          relative: path.join(target, file),
        });
    else out.push({ content: fs.readFileSync(item, "utf8"), relative: target });
  }
  return out;
};
