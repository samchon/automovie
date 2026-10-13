import * as fs from "node:fs";
import * as path from "node:path";

import {
  type IScaffoldPhysicalDirectory,
  assertScaffoldPhysicalDirectory,
  ensureScaffoldBaseDirectory,
  ensureScaffoldFileDirectory,
  writeScaffoldFile,
} from "./scaffoldFileSnapshot";
import {
  type IScaffoldPublicationEntry,
  type IScaffoldPublicationReceipt,
  type ScaffoldFilePublicationOutcome,
  planScaffoldPublication,
  publishScaffoldCandidate,
} from "./scaffoldPublication";

/**
 * Options for publishing a scaffold into a directory.
 *
 * @evidence contracts/common.md#principled-implementation The single flag is an explicit opt-in because both effects it grants, admitting a populated root and rewriting an existing file, overwrite state the user owns.
 * @evidence contracts/common.md#clear-and-simple-design One optional boolean mirrors the CLI's one `--force` switch; there is no separate flag per effect because the CLI exposes none.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Force grants no authority over links or multiply linked files; the replacement path in `scaffoldFileSnapshot` still requires one ordinary single-link file whose captured identity holds.
 * @evidence contracts/common.md#meaningful-documentation The comment states both effects of `force`, the limits on replacement, and that omission means a new or empty root only.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An options record with one boolean chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The force switch only changes admission and coordinates no work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This options object holds no state beyond its single boolean and owns no resource.
 * @author Samchon
 */
export interface IScaffoldPublicationOptions {
  /**
   * Admit a non-empty target directory and replace existing files in place.
   * A file is replaced only when it is an ordinary file with exactly one link
   * whose identity did not change between capture and write. Omitted or
   * `false` refuses a non-empty directory before writing anything.
   */
  force?: boolean;
}

/**
 * Error thrown when a scaffold publication did not complete, carrying the
 * receipt so the caller can see which files exist.
 *
 * The message lists the completed relative paths and the stopping entry with
 * its status, refusal reason or partial byte count, and parent identity. The
 * stopping outcome's own error becomes `cause`.
 *
 * @evidence contracts/common.md#principled-implementation The error is built from the frozen receipt after publication stopped, so the throwing form loses none of the observed effect; `cause` uses the standard `ErrorOptions` chaining for the native error.
 * @evidence contracts/common.md#clear-and-simple-design One error class serves both throwing callers, `writeFiles` and the CLI, and holds the receipt instead of copying its fields onto the error.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constructor accepts a completed receipt and then reports a failure without a stopping entry instead of refusing; it is constructed only after a `status` check in both callers.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the message contains, where the native cause goes, and that `receipt` is kept for recovery.
 * @evidence contracts/performance.md#efficient-algorithms Building the message maps the completed list once and serializes it once, linear in completed files; it runs only on the failure path.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each failed publication raises its own error; there is no repeated work for the constructor to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The error keeps the receipt, and with it every planned file's bytes, alive for as long as the error object is held; it holds no descriptor.
 * @author Samchon
 */
export class ScaffoldPublicationError extends Error {
  /** Receipt of the publication that did not complete. */
  public readonly receipt: IScaffoldPublicationReceipt;

  /** @param receipt Receipt whose status is not `completed`. */
  public constructor(receipt: IScaffoldPublicationReceipt) {
    const failure: IScaffoldPublicationReceipt["failure"] = receipt.failure;
    super(
      failure === null
        ? "scaffold publication failed without a stopping entry"
        : `scaffold publication ${receipt.status}: ${JSON.stringify({
            completed: receipt.completed.map(
              ({
                entry,
                parentIdentity,
              }: IScaffoldPublicationReceipt["completed"][number]): {
                parentIdentity: string;
                relative: string;
              } => ({
                parentIdentity,
                relative: entry.relative,
              }),
            ),
            failure: {
              bytesWritten:
                failure.outcome.status === "partial"
                  ? failure.outcome.bytesWritten
                  : undefined,
              parentIdentity:
                failure.outcome.status === "partial"
                  ? failure.outcome.parentIdentity
                  : undefined,
              reason:
                failure.outcome.status === "refused"
                  ? failure.outcome.reason
                  : undefined,
              relative: failure.entry.relative,
              status: failure.outcome.status,
            },
          })}`,
      { cause: failure?.outcome.error },
    );
    this.name = "ScaffoldPublicationError";
    this.receipt = receipt;
  }
}

/**
 * Write a `{ relativePath: content }` map under `location` and return the
 * absolute paths written, sorted by UTF-16 code unit.
 *
 * This is the throwing form of {@link publishFiles}: it applies the same
 * validation and writes, and throws {@link ScaffoldPublicationError} when the
 * receipt is not `completed`. Files written before the failure are left in
 * place. Rendering the map is {@link renderScaffold}'s job.
 *
 * @param location Target directory, resolved against the working directory.
 * @param files Map from root-relative path to UTF-8 text.
 * @param options `force` admits a populated directory and in-place
 *   replacement.
 * @returns Absolute paths of every file written, sorted.
 *
 * @evidence contracts/common.md#principled-implementation The comparator uses the string relational operators, which compare UTF-16 code units independent of locale, so the returned order is the same on every host; `localeCompare` would vary with the host's ICU data.
 * @evidence contracts/common.md#clear-and-simple-design The function adds only the throw and the sort to `publishFiles`, so validation and writing have one implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Files written before a failure are not deleted, because removal through a pathname could reach a different file; the receipt in the thrown error says what remains.
 * @evidence contracts/common.md#meaningful-documentation The comment states the relation to `publishFiles`, the thrown error, that earlier files stay on failure, the sort order, and the meaning of each parameter.
 * @evidence contracts/performance.md#efficient-algorithms Beyond `publishFiles`, the cost is one map and one comparison sort of the written paths, n log n in file count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This wrapper performs one publication per call; repeating a call repeats its writes as the effects require.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The receipt is released when the function returns unless it travels inside the thrown error; only the path array is returned, and `publishFiles` owns every descriptor.
 * @author Samchon
 */
export const writeFiles = (
  location: string,
  files: Record<string, string>,
  options?: IScaffoldPublicationOptions,
): string[] => {
  const receipt: IScaffoldPublicationReceipt = publishFiles(
    location,
    files,
    options,
  );
  if (receipt.status !== "completed")
    throw new ScaffoldPublicationError(receipt);
  return receipt.completed
    .map(
      ({ entry }: IScaffoldPublicationReceipt["completed"][number]): string =>
        entry.target,
    )
    .sort((left: string, right: string): number =>
      left < right ? -1 : left > right ? 1 : 0,
    );
};

/**
 * Write a `{ relativePath: content }` map under `location` and return a
 * receipt naming every completed file and the first entry that did not
 * complete.
 *
 * The whole map is validated by {@link planScaffoldPublication} before the
 * directory is created. Without `force`, a directory that already has an entry
 * refuses the first file, so nothing is written. Each file is then created
 * exclusively relative to its captured parent directory handle, refusing
 * linked parent directories. Publication stops at the first refusal or
 * partial slot, and nothing is deleted.
 *
 * Every error thrown while preparing directories or before a file is written
 * becomes a `create-failed` refusal for that file. Invalid input and an
 * outcome that breaks the publication contract still throw.
 *
 * @param location Target directory, resolved against the working directory.
 * @param files Map from root-relative path to UTF-8 text.
 * @param options `force` admits a populated directory and in-place
 *   replacement.
 * @returns Frozen receipt of the attempt.
 *
 * @evidence contracts/common.md#principled-implementation Directories are captured by physical identity and each file is created relative to the held parent handle by `writeScaffoldFile`, so a renamed or linked directory cannot redirect a write; emptiness is tested by reading one entry from `fs.opendirSync`, and the root is revalidated after that read so the answer belongs to the captured directory.
 * @evidence contracts/common.md#clear-and-simple-design This function owns the target root, the emptiness rule, and the per-publication directory cache; ordering and receipt status belong to `publishScaffoldCandidate`, and descriptor work to `scaffoldFileSnapshot`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The catch maps any thrown error to a `create-failed` refusal, which is truthful because directory preparation creates no file, `writeScaffoldFile` documents that it throws only before any write, and `publishNativeScaffoldFile` returns its failures; no error is retried or hidden.
 * @evidence contracts/common.md#meaningful-documentation The comment states validation before mutation, the non-empty refusal, parent-handle creation, the stop rule, the no-delete rule, how thrown errors are reported, and each parameter.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in total bytes plus a constant number of directory captures per path segment of each file; the emptiness probe reads one entry instead of listing the root and runs only without `force`.
 * @evidence contracts/performance.md#reuse-equivalent-work Directory captures are cached per absolute path for this call only, and a cached directory is revalidated by identity before each use, so a replaced directory is refused rather than reused; captures are never shared across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The directory cache grows by one capture per distinct directory in the candidate and is released when the function returns; the emptiness probe closes its directory handle in `finally`, and each file descriptor is closed inside `writeScaffoldFile` before its outcome returns.
 * @author Samchon
 */
export const publishFiles = (
  location: string,
  files: Record<string, string>,
  options?: IScaffoldPublicationOptions,
): IScaffoldPublicationReceipt => {
  const root: string = path.resolve(location);
  const candidate: readonly IScaffoldPublicationEntry[] =
    planScaffoldPublication({ files, root });
  const force: boolean = options?.force === true;
  let session: IScaffoldPublicationSession | undefined;
  return publishScaffoldCandidate({
    candidate,
    publish: (
      entry: IScaffoldPublicationEntry,
    ): ScaffoldFilePublicationOutcome => {
      try {
        session ??= openScaffoldPublicationSession(root, force);
        const parent: IScaffoldPhysicalDirectory = ensureScaffoldFileDirectory(
          {
            base: session.base,
            cache: session.directories,
            directory: path.dirname(entry.target),
          },
        );
        return writeScaffoldFile({
          base: session.base,
          bytes: Uint8Array.from(entry.bytes),
          force,
          parent,
          target: entry.target,
        });
      } catch (error) {
        return Object.freeze({
          error,
          reason: "create-failed" as const,
          status: "refused" as const,
        });
      }
    },
  });
};

/** Captured root and descendant directories for one `publishFiles` call. */
interface IScaffoldPublicationSession {
  base: IScaffoldPhysicalDirectory;
  directories: Map<string, IScaffoldPhysicalDirectory>;
}

/**
 * Create or capture the root and, without `force`, refuse one that already
 * has an entry. Runs on the first file so an empty candidate touches nothing.
 */
const openScaffoldPublicationSession = (
  root: string,
  force: boolean,
): IScaffoldPublicationSession => {
  const base: IScaffoldPhysicalDirectory = ensureScaffoldBaseDirectory(root);
  if (force === false) {
    if (hasDirectoryEntry(base.path))
      throw new Error(
        `target directory is not empty: ${base.path}; pass --force to scaffold into it anyway`,
      );
    assertScaffoldPhysicalDirectory(base);
  }
  return {
    base,
    directories: new Map<string, IScaffoldPhysicalDirectory>(),
  };
};

const hasDirectoryEntry = (directory: string): boolean => {
  const listing: fs.Dir = fs.opendirSync(directory);
  try {
    return listing.readSync() !== null;
  } finally {
    listing.closeSync();
  }
};
