/**
 * Result of parsing the command name and its outer arguments. Narrow it by
 * `command` before reading variant-specific fields.
 *
 * Help and version carry only their command. Create and add carry an admitted
 * target and scaffold options. The five production operations carry their
 * remaining tokens for their own option readers.
 */
export type AutoMovieCommand =
  | IAutoMovieHelpCommand
  | IAutoMovieVersionCommand
  | IAutoMovieCreateCommand
  | IAutoMovieAddCommand
  | IAutoMovieCaptureCommand
  | IAutoMovieInspectCommand
  | IAutoMovieRenderCommand
  | IAutoMovieReviewCommand
  | IAutoMovieCheckCommand;

/** Usage request from an empty token list or a lone `-h` or `--help` flag. */
interface IAutoMovieHelpCommand {
  /** Print the usage text. */
  command: "help";
}

/** Version request from a lone `-v` or `--version` flag. */
interface IAutoMovieVersionCommand {
  /** Print the installed package's version. */
  command: "version";
}

/** Create a standalone production or workspace at one target directory. */
interface IAutoMovieCreateCommand {
  /** Select the scaffold creation operation. */
  command: "create";

  /**
   * The nonblank directory token as supplied. Execution resolves it against the
   * current working directory. Spell a relative directory beginning with a
   * hyphen with a leading `./`.
   */
  directory: string;

  /** False creates one production. True creates a pnpm workspace root. */
  workspace: boolean;

  /**
   * False refuses a nonempty target. True allows writing the scaffold's files
   * there, replacing matching paths and retaining unrelated files.
   */
  force: boolean;

  /**
   * When omitted, execution derives or asks for the name. An explicit `--name`
   * is carried as supplied. The scaffold validates the chosen name.
   */
  name?: string;
}

/** Add a production to the workspace rooted at the current directory. */
interface IAutoMovieAddCommand {
  /** Select the workspace production operation. */
  command: "add";

  /** First segment of the target. Selects `movies/shorts` or `movies/series`. */
  family: "shorts" | "series";

  /**
   * Second segment of the target. It is one portable directory name with no
   * surrounding spaces.
   */
  directory: string;

  /**
   * False refuses a nonempty target. True allows replacing matching scaffold
   * paths and keeps unrelated files.
   */
  force: boolean;

  /**
   * When omitted, execution derives the name from `directory`. An explicit
   * `--name` is carried as supplied. The scaffold validates the chosen name.
   */
  name?: string;
}

/** Capture a production subject or stills from an encoded video file. */
interface IAutoMovieCaptureCommand {
  /** Select the capture option reader and host. */
  command: "capture";

  /** Remaining tokens in order. Capture validates them during execution. */
  args: string[];
}

/** Serve the Inspector page for a production or package subject module. */
interface IAutoMovieInspectCommand {
  /** Select the Inspector option reader and server. */
  command: "inspect";

  /** Remaining tokens in order. Inspect validates them during execution. */
  args: string[];
}

/** Draw and encode one production subject. */
interface IAutoMovieRenderCommand {
  /** Select the render option reader and video delivery path. */
  command: "render";

  /** Remaining tokens in order. Render validates them during execution. */
  args: string[];
}

/** Record Inspector playback or write or reopen a file-bound review. */
interface IAutoMovieReviewCommand {
  /** Select the review option reader. */
  command: "review";

  /** Remaining tokens in order. Review validates them during execution. */
  args: string[];
}

/** Read production observations or run and gate declared checks. */
interface IAutoMovieCheckCommand {
  /** Select the production check option reader. */
  command: "check";

  /** Remaining tokens in order. Check validates them during execution. */
  args: string[];
}
