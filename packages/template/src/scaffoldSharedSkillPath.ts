import * as path from "node:path";

/** A placeholder's file name: `$` followed by one portable path segment. */
const PLACEHOLDER: RegExp = /^\$([a-zA-Z0-9_-][a-zA-Z0-9_.-]*)$/u;

/**
 * The repository skill path a scaffold placeholder stands for, or `null` when the file is not a placeholder.
 *
 * A placeholder is a file under the scaffold's `.agents/skills` whose name is `$` followed by the name of a repository item at the same place under the repository's `.agents/skills`: `$documentation` stands for the whole `documentation` folder and `development/$repair.md` for the single `development/repair.md` file. The placeholder holds no text; the build copies the item it names and the scaffold reader ships that item in its place, so each shared text has one source.
 *
 * @param relative Scaffold-relative file path with the host's separator, as {@link listAutoMovieScaffoldFiles} returns it.
 * @returns The named item's path relative to `.agents/skills`, with `/` separators and the `$` removed, or `null`.
 *
 * @evidence contracts/common.md#principled-implementation The path is split on the host separator that the listing uses, and the item path keeps every directory between `.agents/skills` and the placeholder, so a placeholder at any depth names the item at the same depth; the name must be one portable segment other than `.` or `..`, so the result cannot leave `.agents/skills`.
 * @evidence contracts/common.md#clear-and-simple-design One predicate owns the placeholder rule for both the build step that copies the named items and the reader that ships them, so the two cannot disagree on which files are placeholders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule depends only on the `$` prefix and the location under `.agents/skills`, with no list of particular skills or files.
 * @evidence contracts/common.md#meaningful-documentation The comment defines a placeholder, gives both the folder and file forms, states what the build and the reader do with it, and describes the parameter's separator and the result's form.
 * @evidence contracts/performance.md#efficient-algorithms Splitting the path and testing one name is linear in the path length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call classifies one path from its text alone; there is no shared work to reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only call-local component arrays are allocated; no filesystem resource is acquired.
 */
export const scaffoldSharedSkillPath: (relative: string) => string | null = (
  relative: string,
): string | null => {
  const parts: string[] = relative.split(path.sep);
  if (parts.length < 3 || parts[0] !== ".agents" || parts[1] !== "skills")
    return null;
  const match: RegExpExecArray | null = PLACEHOLDER.exec(parts.at(-1)!);
  if (match === null || match[1] === "." || match[1] === "..") return null;
  return [...parts.slice(2, -1), match[1]!].join("/");
};
