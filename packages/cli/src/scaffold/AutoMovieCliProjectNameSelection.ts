/** Inputs used to choose a project name for a `create` request. */
export interface AutoMovieCliProjectNameSelection {
  /** Target directory as typed. */
  directory: string;

  /** The working directory the target resolves against. */
  cwd: string;

  /** The typed `--name`, if any. */
  name?: string;
}
