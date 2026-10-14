import type { IHumanViewerGenerationFiles } from "./IHumanViewerGenerationFiles.js";
import type { IHumanViewerSidecarFacts } from "./IHumanViewerSidecarFacts.js";

/**
 * Access to the published generation views for the catalogue.
 *
 * @evidence contracts/common.md#principled-implementation A selected head/body pair supplies independent existence and file-fact queries so the catalogue verifies both generation identities before admitting their bases.
 * @evidence contracts/common.md#clear-and-simple-design Only paired view paths and two narrow queries cross this seam; person construction stays with the numerical owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing or unread view is reported rather than replaced with separate legacy bases or a synthesized matching generation.
 * @evidence contracts/common.md#meaningful-documentation Comments specify repository-relative refusal paths, view existence and null while off-request file reading is unfinished.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This pair-reader input shape performs no packet scanning, inflation or generation-identity comparison itself.
 * @evidence contracts/performance.md#reuse-equivalent-work File facts are reusable only at their stamped bytes; head/body digest equality is separate from their common generation id.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The pair inputs borrow metadata queries without retaining raw view bytes or owning the background sidecar tasks.
 *
 * @author Samchon
 */
export interface IReadHumanViewerPublishedGenerationProps {
  /** Repository-relative paths of the two views, used in reasons. */
  files: IHumanViewerGenerationFiles;

  /**
   * Whether the selected head or body view file exists.
   *
   * @evidence contracts/common.md#principled-implementation Both selected view files must exist before their generation identities can establish a usable pair.
   * @evidence contracts/common.md#clear-and-simple-design The closed head/body query keeps path mapping with the pair's caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent companion view is not treated as a complete generation or substituted with another basis file.
   * @evidence contracts/common.md#meaningful-documentation The member identifies which selected view the existence result describes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This two-choice predicate chooses no filesystem stat or directory-search strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work View existence may change during publication; the capability promises no cached filesystem snapshot.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Checking view presence returns no view stream, byte buffer or file descriptor.
   */
  exists: (file: "head" | "body") => boolean;

  /**
   * A view's facts, or null while it is still being read off the request path.
   *
   * @evidence contracts/common.md#principled-implementation Pair validation receives the selected view's scanned identities and compressed-byte digest only after its asynchronous file read finishes.
   * @evidence contracts/common.md#clear-and-simple-design Packet scanning stays with the sidecar owner; the generation reader compares returned metadata.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null facts remain pending instead of assuming the selected head and body have matching generation ids.
   * @evidence contracts/common.md#meaningful-documentation The comment defines the pending null state and computation outside request handling.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This view-facts signature contains no packet inflation or structural-scan implementation.
   * @evidence contracts/performance.md#reuse-equivalent-work The provider validates facts against its current view stamp; an mtime/size provider can miss byte changes that preserve both stamp values, so returned digest authority is not independently fresh-byte proof.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Generation comparison borrows view metadata and leaves in-flight read retention and cleanup with the sidecar owner.
   */
  facts: (file: "head" | "body") => IHumanViewerSidecarFacts | null;
}
