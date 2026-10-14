import * as path from "node:path";

/** Longest package name npm accepts. */
const NPM_NAME_LIMIT: number = 214;

/**
 * Derive a lowercase project-name candidate from the target directory's basename.
 *
 * The basename is lowercased, each run of characters other than `a-z`, `0-9`, `.`, `_` and `-` becomes one `-`, the result is cut to npm's 214-character limit, and leading `-`, `.` or `_` and trailing `-` or `.` are removed. A basename with nothing left, such as a filesystem root, yields `automovie-project`. `run` passes the absolute target and hands the result to `renderScaffold` as the project name.
 *
 * This transformation does not validate npm's reserved names; `node_modules` and `favicon.ico` remain unchanged. Windows device names such as `con` also remain unchanged and are refused by `renderScaffold` before publication.
 *
 * @evidence contracts/common.md#principled-implementation Lowercasing and character replacement produce an unscoped-name candidate from the basename in the host's path syntax, then the 214-character cut precedes trimming so the result stays within that limit. This is normalization rather than complete npm admission: reserved names remain unchanged, while the downstream scaffold renderer separately refuses Windows device names.
 * @evidence contracts/common.md#clear-and-simple-design One pure function owns the directory-to-name rule, so `run` keeps only dispatch and the rule is checked without publishing a scaffold.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No directory name is special-cased; the fallback applies whenever normalization leaves an empty candidate, including an all-underscore basename whose characters are removed by leading trim.
 * @evidence contracts/common.md#meaningful-documentation The comment states each transformation in order, the limit, the fallback, the caller and consumer, and the difference between an unchanged npm reserved name and a device name refused by the renderer.
 * @evidence contracts/performance.md#efficient-algorithms Time and space are linear in the basename's length: one lowercase pass, one replacement and one slice; the final trim's trailing alternative can rescan a run of `-` and `.` that does not end the string, which is quadratic only within that run and bounded by the 214-character cut.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work `run` derives one name per scaffold request, so no equivalent derivation is requested twice.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function returns a new string and keeps no state, handle, or task.
 */
export function deriveAutoMovieProjectName(targetDir: string): string {
  const name: string = path
    .basename(targetDir)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .slice(0, NPM_NAME_LIMIT)
    .replace(/^[-._]+|[-.]+$/g, "");
  return name.length === 0 ? "automovie-project" : name;
}
