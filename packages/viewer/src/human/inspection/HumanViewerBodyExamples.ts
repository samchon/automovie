import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * Application-owned body parameter sets. The Human document owns channel and
 * joint semantics; this transport adds no geometry, range or acceptance rule.
 *
 * @evidence contracts/common.md#principled-implementation Pick preserves the body document owner's shape, pose, shoulder and underwear channel types; readHumanViewerStandardBodies and readHumanViewerStandardPeople add identity and basis without redefining anatomy or admission.
 * @evidence contracts/common.md#clear-and-simple-design Names the four application-authored body state fields reused by both standard body and paired-person catalogue producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The schema supplies no catalogue values, preset geometry, physiological bounds or special cases; the application's example data and Human domain admission remain their owners.
 * @evidence contracts/common.md#meaningful-documentation Identifies application ownership and the body document's channel semantics; this record alone proves no numerical or visual validity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The Pick/Record alias erases at runtime; enumeration, document construction and hashing belong to the standard catalogue readers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing these field types avoids competing channel definitions; runtime cache equivalence still requires each resulting document, paired basis and builder digest.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Example state objects are supplied by the application and borrowed by catalogue producers; this type introduces no worker, renderer, lifetime manager or population cap.
 */
export type HumanViewerBodyExamples = Record<string,
  Pick<IAutoMovieHumanBodyBasisDocument, "shape" | "pose" | "shoulders" | "underwear">
>;
