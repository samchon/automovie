import { encodeAutoMoviePathSegment } from "./contentIdentity";
import { AUTOMOVIE_SUBJECT_INSPECTION_ROOT } from "./AUTOMOVIE_SUBJECT_INSPECTION_ROOT";

/**
 * Build the inspection-relative directory from production, shot and resolved subject identity.
 *
 * @evidence contracts/common.md#principled-implementation Each identity is encoded as one portable path segment under the fixed inspection root.
 * @evidence contracts/common.md#clear-and-simple-design Publisher and artifact verifier use one directory representation separate from render-bundle paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Encoding alone does not admit a physical namespace or symlink ancestry; no caller spelling creates a second resolved-subject directory.
 * @evidence contracts/common.md#meaningful-documentation The result uses slash-separated project-relative addresses and is not delivery evidence.
 * @evidence contracts/performance.md#efficient-algorithms Encoding/join work and output size follow identity text lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared segment encoder is reused by publication and exact artifact-path reconstruction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned path text escapes and no filesystem handle or directory cache is acquired.
 */
export function inspectionDirectory(
  productionId: string,
  shot: string,
  subject: string
): string { return [
    AUTOMOVIE_SUBJECT_INSPECTION_ROOT,
    encodeAutoMoviePathSegment(productionId),
    encodeAutoMoviePathSegment(shot),
    encodeAutoMoviePathSegment(subject),
  ].join("/"); }
