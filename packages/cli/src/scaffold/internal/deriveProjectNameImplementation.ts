import * as path from "node:path";

import { AUTOMOVIE_DEFAULT_PROJECT_NAME } from "./AUTOMOVIE_DEFAULT_PROJECT_NAME";

/*
 * Derive a lowercase project-name candidate from the target directory's
 * basename.
 *
 * The basename is lowercased, each run of characters other than `a-z`, `0-9`,
 * `.`, `_` and `-` becomes one `-`, the result is cut to npm's 214-character
 * limit, and leading `-`, `.` or `_` and trailing `-` or `.` are removed. A
 * basename with nothing left, such as a filesystem root, yields
 * `AUTOMOVIE_DEFAULT_PROJECT_NAME`. `selectProjectNameImplementation` passes a
 * `create` request's absolute target, `run` passes an `add` request's directory
 * segment, and `run` hands the result to the template renderer as the project
 * name.
 *
 * This transformation does not validate npm's reserved names; `node_modules`
 * and `favicon.ico` remain unchanged. Windows device names such as `con` also
 * remain unchanged and are refused by `AutoMovieTemplateScaffold.create` before
 * any file is written.
 */
export function deriveProjectNameImplementation(targetDir: string): string {
  const name: string = path
    .basename(targetDir)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .slice(0, NPM_NAME_LIMIT)
    .replace(/^[-._]+|[-.]+$/g, "");
  return name.length === 0 ? AUTOMOVIE_DEFAULT_PROJECT_NAME : name;
}

/*
 * Longest package name npm accepts.
 */
const NPM_NAME_LIMIT: number = 214;
