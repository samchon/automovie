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
  type IScaffoldPublicationReceipt,
  planScaffoldPublication,
  publishScaffoldCandidate,
} from "./scaffoldPublication";

/**
 * Explicit permission to install into an existing scaffold directory.
 *
 * Existing files are replaced only when their captured ordinary single-link
 * identity still matches. Other directory entries never grant write authority.
 */
export interface IScaffoldPublicationOptions {
  /** Admit an existing root and permit exact captured single-link replacement. */
  force?: boolean;
}

/**
 * Error raised by the compatibility write API with its exact publication
 * receipt retained for recovery. Raised only after the exact observed effect
 * has been captured, so the receipt crosses the throwing boundary intact.
 *
 * @author Samchon
 */
export class ScaffoldPublicationError extends Error {
  /**
   * Exact candidate-wide effect observed before the compatibility call threw.
   */
  public readonly receipt: IScaffoldPublicationReceipt;

  public constructor(receipt: IScaffoldPublicationReceipt) {
    const failure = receipt.failure;
    super(
      failure === null
        ? "scaffold publication failed without a stopping entry"
        : `scaffold publication ${receipt.status}: ${JSON.stringify({
            completed: receipt.completed.map(({ entry, parentIdentity }) => ({
              parentIdentity,
              relative: entry.relative,
            })),
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
 * Materialize a `{ relativePath: content }` map under `location`, creating
 * parent directories as needed, and return the absolute paths written
 * (sorted).
 *
 * Refuses lexical escapes, colliding targets, linked physical parents, and
 * pathname successors. New files reserve their final slot directly; `force`
 * permits a populated root and replacement of exact captured ordinary
 * single-link files.
 * Rendering the map is {@link renderScaffold}'s job; this is its write half.
 *
 * @author Samchon
 */
export const writeFiles = (
  location: string,
  files: Record<string, string>,
  options?: IScaffoldPublicationOptions,
): string[] => {
  const receipt = publishFiles(location, files, options);
  if (receipt.status !== "completed")
    throw new ScaffoldPublicationError(receipt);
  // Code-unit order, not localeCompare: a scaffold must lay files down in the
  // same order on every host (localeCompare varies with host locale/ICU).
  return receipt.completed
    .map(({ entry }) => entry.target)
    .sort((a, b) => Number(a > b) - Number(a < b));
};

/**
 * Materialize a complete validated file candidate and report its exact
 * completed prefix or stopping effect.
 *
 * Candidate validation finishes before directory creation. Each new file is
 * then published relative to a captured native parent handle; the function
 * stops at the first refusal or partial result and never cleans up through a
 * mutable pathname.
 *
 * @author Samchon
 */
export const publishFiles = (
  location: string,
  files: Record<string, string>,
  options?: IScaffoldPublicationOptions,
): IScaffoldPublicationReceipt => {
  const base = path.resolve(process.cwd(), location);
  const candidate = planScaffoldPublication({ files, root: base });
  const force = options?.force === true;
  let baseOwnership: IScaffoldPhysicalDirectory | undefined;
  let directories: Map<string, IScaffoldPhysicalDirectory> | undefined;
  return publishScaffoldCandidate({
    candidate,
    publish: (entry) => {
      try {
        if (baseOwnership === undefined) {
          baseOwnership = ensureScaffoldBaseDirectory(base);
          assertScaffoldPhysicalDirectory(baseOwnership);
          if (fs.readdirSync(base).length > 0 && force === false)
            throw new Error(
              `target directory is not empty: ${base}; pass --force to scaffold into it anyway`,
            );
          assertScaffoldPhysicalDirectory(baseOwnership);
          directories = new Map([[baseOwnership.path, baseOwnership]]);
        }
        const parent = ensureScaffoldFileDirectory({
          base: baseOwnership,
          cache: directories!,
          directory: path.dirname(entry.target),
        });
        return writeScaffoldFile({
          base: baseOwnership,
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
