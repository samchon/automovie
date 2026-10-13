/**
 * One document as the index page lists it.
 *
 * Labels and sections are catalogue navigation metadata, while the id selects a document address that still requires ordinary numerical admission. Pending rejected catalogue candidates can also be listed for selection; listing alone supplies no successful frame verdict.
 *
 * @evidence contracts/common.md#principled-implementation Id, domain and content-derived section identify one catalogue navigation entry while numerical admission remains with its selected domain owner.
 * @evidence contracts/common.md#clear-and-simple-design The projection contains only display/search/grouping fields rather than carrying numerical documents or validation state into index UI.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Listed or pending catalogue identity does not bypass admission or imply healthy constructed geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes navigation metadata, selected-address identity, pending candidates and later numerical admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This entry type implements no content classification, filtering or DOM rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Labels and ids do not establish numerical cache equivalence; source/document digest authority stays with the catalogue.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ordinary navigation strings acquire no worker or GPU handle and remain index-owner data.
 *
 * @author Samchon
 */
export interface IHumanViewerIndexEntry {
  /** Address `doc` value that opens it. */
  id: string;

  /** Text shown for it. */
  label: string;

  /** Numerical domain, which the face and body filters select. */
  domain: "face" | "body" | "person";

  /** Heading it is listed under. */
  section: string;
}
