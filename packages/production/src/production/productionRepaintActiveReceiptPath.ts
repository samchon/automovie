import path from "node:path";
import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Tracked pointer selecting one current rendition receipt for a shot.
 *
 * The shared portable segment encoder addresses the mutable active pointer under renditions/active. This operation does not select a receipt, inspect bytes or commit that pointer.
 *
 * @evidence contracts/common.md#principled-implementation One encoded shot segment forms the POSIX-relative active JSON address consumed by the tracked pointer owner.
 * @evidence contracts/common.md#clear-and-simple-design Namespace spelling stays separate from the selection ledger and atomic pointer publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Long-id hashing and reserved-name handling remain the shared encoder's contract; the computed address implies no selected or current rendition.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies a mutable pointer address and distinguishes it from selection/receipt observation.
 * @evidence contracts/performance.md#efficient-algorithms Shot encoding scans its text and may hash a long UTF-8 segment before fixed-component joining; time/storage follow identifier length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This path expression owns no selection request coordinator or retained shot-address table.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Encoder/join temporaries expire at return or throw; only the address string escapes without a file, lock or task.
 */
export const productionRepaintActiveReceiptPath: (shot: string) => string = (shot: string): string =>
  path.posix.join(
    "renditions",
    "active",
    `${encodeAutoMoviePathSegment(shot)}.json`,
  );
