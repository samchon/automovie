import * as path from "node:path";

/** A placeholder's file name: `$` followed by one portable path segment. */
const PLACEHOLDER: RegExp = /^\$([a-zA-Z0-9_-][a-zA-Z0-9_.-]*)$/u;

/**
 * The repository skill path a scaffold placeholder stands for, or `null` when
 * the file is not a placeholder.
 *
 * A placeholder is a file under the scaffold's `.agents/skills` whose name is
 * `$` followed by the name of a repository item at the same place under the
 * repository's `.agents/skills`: `$documentation` stands for the whole
 * `documentation` folder and `development/$repair.md` for the single
 * `development/repair.md` file. The placeholder holds no text; the build copies
 * the item it names and the scaffold reader ships that item in its place, so
 * each shared text has one source.
 *
 * @param relative Scaffold-relative file path with the host's separator, as
 *   {@link listAutoMovieScaffoldFiles} returns it.
 * @returns The named item's path relative to `.agents/skills`, with `/`
 *   separators and the `$` removed, or `null`.
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
