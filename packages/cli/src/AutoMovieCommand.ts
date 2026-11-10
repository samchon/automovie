/**
 * One admitted CLI request, discriminated by `command`.
 *
 * `help` and `version` carry nothing because they are standalone requests. `create`, `add` and `sync` carry their targets exactly as typed; `run` resolves them against the working directory. An explicit `name` is carried as typed; `run` chooses the name when it is absent.
 *
 * @evidence contracts/development/design.md#principled-representation Each variant carries exactly what its command needs after admission, so `run` performs no further argument parsing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A closed union over the command name lets `run` switch on one field, and the workspace family is a closed pair instead of a free path.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No variant has an escape field for unparsed tokens.
 * @evidence contracts/development/common.md#meaningful-documentation Every variant and member states its meaning and who resolves it.
 */
export type AutoMovieCommand =
  | {
      /** Print the usage text. */
      command: "help";
    }
  | {
      /** Print this package's version. */
      command: "version";
    }
  | {
      /** Install a single production, or with `workspace` a workspace root, into `directory`. */
      command: "create";

      /** Target directory as typed, never blank; `run` resolves it against the working directory. */
      directory: string;

      /** Install a pnpm workspace root instead of a single production. */
      workspace: boolean;

      /** Admit a non-empty target, as `publishFiles`' `force` option defines it. */
      force: boolean;

      /** Package name as typed; absent, `run` derives or asks for one. */
      name?: string;
    }
  | {
      /** Add one production to the workspace whose root is the working directory. */
      command: "add";

      /** `shorts` for brief → screenplay, `series` for the whole long route. */
      family: "shorts" | "series";

      /** The production's directory under `movies/<family>`, one admitted path segment. */
      directory: string;

      /** Admit a non-empty production directory, as `publishFiles`' `force` option defines it. */
      force: boolean;

      /** Package name as typed; absent, `run` derives one from the directory segment. */
      name?: string;
    }
  | {
      /** Update only generated instructions. */
      command: "sync";

      /** The directory holding `AGENTS.md`, resolved by run. */
      directory: string;

      /** Inspect pending changes and conflicts without writing. */
      check: boolean;

      /** Explicit prior adopted instruction root; the files it supplies govern over stored sync state. */
      baseline?: string;
    };
