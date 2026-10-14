/**
 * One admitted CLI request, discriminated by `command`.
 *
 * `help` and `version` carry nothing because they are standalone requests. `start` carries the target directory exactly as typed, relative or absolute, which `run` resolves against the working directory.
 *
 * @evidence contracts/common.md#principled-implementation A string-literal discriminated union lets TypeScript narrow each request by `command`, so `run` cannot read a `start` field on a help or version request; the `start` directory stays unresolved because resolution depends on the caller's working directory, which `run` owns.
 * @evidence contracts/common.md#clear-and-simple-design The union has exactly the three requests the CLI admits and only the two `start` facts the scaffold publication consumes, with no option bag for flags the parser refuses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No member encodes a default directory or a test fixture; `force` is always present as a boolean, so absence never stands for a hidden third state.
 * @evidence contracts/common.md#meaningful-documentation The comment says that help and version are standalone and carry nothing, that the directory is unresolved and who resolves it, and each `start` member says how `run` uses it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union is a compile-time type and chooses no algorithm or data structure at runtime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This union is a compile-time type and coordinates no work across requests or phases.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This union is a compile-time type and owns no retained state, handle, or task.
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
    };
