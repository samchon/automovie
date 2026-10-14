import type fs from "node:fs";

import { withAutoMovieFileSystem } from "../../../../packages/production/src/project/withAutoMovieFileSystem";

/** Enter the actual production AsyncLocalStorage scope, preserving the task's result, promise or thrown value. The existing dependency unit owns both asynchronous cases; this wrapper creates no context store or task and the supplied operation owns descendant completion. */
export const withTestFileSystem: <T>(
  fileSystem: typeof fs,
  task: () => T,
) => T = <T>(fileSystem: typeof fs, task: () => T): T =>
  withAutoMovieFileSystem(fileSystem, task);
