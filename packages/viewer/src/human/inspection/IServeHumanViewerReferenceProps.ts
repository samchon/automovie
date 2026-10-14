import type { ServerResponse } from "node:http";

/**
 * Local photograph routes read existing images and never move or write them.
 *
 * @evidence contracts/common.md#principled-implementation Reference routes resolve existing local photographs and observation metadata independently of numerical basis authority.
 * @evidence contracts/common.md#clear-and-simple-design The read-only reference directory, pose record, document ids and response seam separate image serving from catalogue and GPU work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Photographs are display resources and are neither moved into mutable storage nor treated as hidden anatomical measurements by this contract.
 * @evidence contracts/common.md#meaningful-documentation Comments state read-only existing-image ownership, display-only pose metadata and the response's metadata/original-byte role.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reference request bindings choose no image matching, filesystem listing or stream buffering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Mutable local photographs are served without current-result caching authority; a matching document id alone cannot certify unchanged image bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Props borrow paths and the HTTP response; reference streaming owns its read stream and never transfers photograph ownership.
 *
 * @author Samchon
 */
export interface IServeHumanViewerReferenceProps {
  /** Parsed reference request. */
  url: URL;

  /** Response receiving metadata or the original image bytes. */
  response: ServerResponse;

  /**
   * Application-owned pose acquisition record file, read only as display metadata.
   */
  cameraPosesFile: string;

  /** Read-only directory of existing reference photographs. */
  referenceDirectory: string;

  /** Catalogue document identities to look up. */
  documents: readonly string[];

  /**
   * Serialize reference availability, camera/landmark metadata or the reference index and finish the response.
   *
   * @evidence contracts/common.md#principled-implementation Reference metadata answers expose local photograph availability and observations separately from image-byte streaming.
   * @evidence contracts/common.md#clear-and-simple-design JSON completion is borrowed from the server while reference resolution owns the metadata value.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The writer does not synthesize camera observations or pretend a missing photograph exists for a selected subject.
   * @evidence contracts/common.md#meaningful-documentation The comment names availability, camera/landmarks and index result shapes served through JSON.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This reference-response signature selects no photo matching, metadata parsing or JSON encoding algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference metadata describes current local files; equal document ids do not make separate response effects or changed photos equivalent.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources JSON metadata serialization owns no decoded photograph or read stream; the HTTP response remains server-owned.
   */
  json: (value: unknown) => void;
}
