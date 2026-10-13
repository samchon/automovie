import { IAutoMovieGeneratedFile } from "./IAutoMovieGeneratedFile";

/**
 * One intended builder file and its pre-publication byte comparison status.
 *
 * @evidence contracts/common.md#principled-implementation statusesOf compares intended generated digests with current stored bytes before publication: typed AutoMovieGeneratedFileMissingError means created, differing bytes updated and identical bytes unchanged; this status is not a publication-success receipt.
 * @evidence contracts/common.md#clear-and-simple-design Inherits path, builder ownership, digest and source attribution rather than duplicating the manifest entry shape for write reporting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the typed missing-file observation permits creation; every other Error or non-Error throw propagates. Unchanged does not authorize an unowned overwrite or skip manifest admission.
 * @evidence contracts/common.md#meaningful-documentation Defines the pre-publication created, updated and already-current comparison while the inherited generated-file contract defines path and intended byte identity.
 * @author Samchon
 */
export interface IAutoMovieMaterializedFile extends IAutoMovieGeneratedFile {
  /** Whether intended bytes need creation, replacement, or no change, as measured before publication. */
  status: "created" | "updated" | "unchanged";
}
