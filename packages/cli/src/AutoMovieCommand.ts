/**
 * One admitted CLI request, discriminated by `command`.
 *
 * `help` and `version` carry nothing because they are standalone requests. `start` and `sync` carry their target exactly as typed; `run` resolves it against the working directory. Sync additionally carries its dry-run choice and optional explicit previous instruction root.
 *
 * @evidence contracts/development/design.md#principled-representation A string-literal discriminated union lets TypeScript narrow each request by `command`, so `run` cannot read a `start` field on a help or version request; the `start` directory stays unresolved because resolution depends on the caller's working directory, which `run` owns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The union has exactly the admitted standalone, creation and synchronization requests the CLI admits and only the two `start` facts the scaffold publication consumes, with no option bag for flags the parser refuses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member encodes a default directory or a test fixture; `force` is always present as a boolean, so absence never stands for a hidden third state.
 * @evidence contracts/development/common.md#meaningful-documentation The comment says that help and version are standalone and carry nothing, that the directory is unresolved and who resolves it, and each `start` member says how `run` uses it.
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
      /** Install the scaffold into `directory`. */
      command: "start";

      /** Target directory as typed, never blank; `run` resolves it against the working directory. */
      directory: string;

      /** Admit a non-empty target, as `publishFiles`' `force` option defines it. */
      force: boolean;
    }
  | {
      /** Update only generated production instructions. */
      command: "sync";
      /** One existing production directory, resolved by run. */
      directory: string;
      /** Inspect pending changes and conflicts without writing. */
      check: boolean;
      /** Explicit prior adopted instruction root for an unbased legacy installation. */
      baseline?: string;
    };
