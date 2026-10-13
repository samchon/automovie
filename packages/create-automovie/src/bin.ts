#!/usr/bin/env node
import { run } from "automovie";

/**
 * Creates a project-owned production through the package-manager creator
 * convention.
 *
 * The adapter preserves the launch executable and user arguments, inserts the
 * canonical `start` action, and returns the canonical CLI exit status. It owns
 * no parallel template or hidden authoring state, so `create-automovie` and the
 * main CLI always materialize the same reviewable project source. Preserving
 * the complete call also makes the canonical target checks and scaffold bytes
 * part of this creator's observable contract.
 *
 * A lone `-h`, `--help`, `-v` or `--version` is passed through without `start`,
 * so it prints help or the version; every other argument list, an empty one
 * included, is prefixed with `start`. The script position is replaced by the
 * literal `create-automovie`, which `run` skips, and an absent executable
 * position falls back to `process.execPath`.
 *
 * @param argv Package-manager process arguments, including the executable and
 *   creator command positions.
 * @returns The canonical CLI exit status for the delegated scaffold operation:
 *   0 on success, 1 after an error message on stderr.
 * @evidence contracts/common.md#principled-implementation Rebuilds a process vector of executable, a script placeholder `run` discards, and the user arguments with `start` inserted, so the creator reuses run's admission and publication unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Owns no template, parsing or publication; everything after the argv rewrite is `automovie`'s `run`, so both entry points write the same bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The standalone list `-h`, `--help`, `-v`, `--version` restates the flags `readAutoMovieCommandArguments` treats as standalone, so a change there must be mirrored here; the `process.execPath` fallback fills a position `run` never reads.
 * @evidence contracts/common.md#meaningful-documentation States the help and version passthrough, the `start` insertion for every other list, the placeholder and executable positions, and the exit codes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Copies argv once with `slice` and a spread; there is no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One delegation per process invocation, and `run` performs the work once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds only the rebuilt argv array until `run` returns; the module guard assigns `process.exitCode` instead of exiting, so queued output drains.
 * @evidence contracts/portability.md#os-neutral-implementation Passes Node's already split argv strings through without joining or quoting and resolves no path itself; the target directory stays a token that `run` resolves against the working directory with `node:path`.
 * @author Samchon
 */
export const runCreateAutoMovie = (
  argv: readonly string[] = process.argv,
): number => {
  const arguments_ = argv.slice(2);
  const standalone =
    arguments_.length === 1 &&
    ["-h", "--help", "-v", "--version"].includes(arguments_[0]!);
  return run([
    argv[0] ?? process.execPath,
    "create-automovie",
    ...(standalone ? arguments_ : ["start", ...arguments_]),
  ]);
};

if (require.main === module) process.exitCode = runCreateAutoMovie();
