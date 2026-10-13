import { type IScaffoldPublicationOptions } from "./IScaffoldPublicationOptions";
import * as path from "node:path";
import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { ensureScaffoldFileDirectory } from "./ensureScaffoldFileDirectory";
import { writeScaffoldFile } from "./writeScaffoldFile";
import { type IScaffoldPublicationEntry } from "./IScaffoldPublicationEntry";
import { type IScaffoldPublicationReceipt } from "./IScaffoldPublicationReceipt";
import { type ScaffoldFilePublicationOutcome } from "./ScaffoldFilePublicationOutcome";
import { planScaffoldPublication } from "./planScaffoldPublication";
import { publishScaffoldCandidate } from "./publishScaffoldCandidate";
import { assertScaffoldPhysicalDirectory } from "./assertScaffoldPhysicalDirectory";
import { ensureScaffoldBaseDirectory } from "./ensureScaffoldBaseDirectory";
import * as fs from "node:fs";


/**
 * Write a path-to-text map under `location` and return a receipt naming every completed file and the first entry that did not complete.
 *
 * The whole map is validated by {@link planScaffoldPublication} before the directory is created. Without `force`, a directory that already has an entry refuses the first file, so nothing is written. New files are created exclusively relative to captured parent directory handles, refusing linked parent directories; with `force`, existing ordinary single-link files are rewritten in place through verified descriptors. Publication stops at the first refusal or partial slot, and nothing is deleted. Directories created while preparing a failed entry can remain even when the receipt is refused.
 *
 * Every error thrown while preparing directories or before a file is written becomes a `create-failed` refusal for that file. Invalid input and an outcome that breaks the publication contract still throw.
 *
 * @param location Target directory, resolved against the working directory.
 * @param files UTF-8 text keyed by paths resolved against `location`; absolute keys are admitted when their targets remain below it.
 * @param options `force` admits a populated directory and in-place replacement.
 * @returns Frozen receipt of the attempt.
 *
 * @evidence contracts/common.md#principled-implementation Physical directory captures authorize new handle-relative file creation and forced descriptor-based replacement through writeScaffoldFile; the no-force emptiness probe reads one entry and revalidates the captured root, while prepared directories can remain after a later refusal.
 * @evidence contracts/common.md#clear-and-simple-design This function owns the root, emptiness and directory cache; publishScaffoldCandidate owns order and receipt status, ensureScaffoldFileDirectory owns descendant captures, and writeScaffoldFile dispatches create or replacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The catch maps any thrown error to a `create-failed` refusal, which is truthful because directory preparation creates no file, `writeScaffoldFile` documents that it throws only before any write, and `publishNativeScaffoldFile` returns its failures; no error is retried or hidden.
 * @evidence contracts/common.md#meaningful-documentation The comment states validation before mutation, the non-empty refusal, parent-handle creation, the stop rule, the no-delete rule, how thrown errors are reported, and each parameter.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in total bytes plus a constant number of directory captures per path segment of each file; the emptiness probe reads one entry instead of listing the root and runs only without `force`.
 * @evidence contracts/performance.md#reuse-equivalent-work Directory captures are cached per absolute path for this call only, and a cached directory is revalidated by identity before each use, so a replaced directory is refused rather than reused; captures are never shared across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call-local cache contains one capture per candidate directory; the emptiness probe attempts close in finally, while file adapters attempt every acquired handle's release and report failures. No close-error outcome proves release, and the receipt retains candidate bytes for its caller.
 * @author Samchon
 */
export const publishFiles: (location: string, files: Record<string, string>, options?: IScaffoldPublicationOptions) => IScaffoldPublicationReceipt = (
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
 * Create or capture the root and, without `force`, refuse one that already has an entry. Runs on the first file so an empty candidate touches nothing.
 */
const openScaffoldPublicationSession: (root: string, force: boolean) => IScaffoldPublicationSession = (
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

const hasDirectoryEntry: (directory: string) => boolean = (directory: string): boolean => {
  const listing: fs.Dir = fs.opendirSync(directory);
  try {
    return listing.readSync() !== null;
  } finally {
    listing.closeSync();
  }
};
