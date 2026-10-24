import type { IEvidenceSourceFile } from "@wrtnlabs/evidence";

/**
 * A narrative document and its headings from one immutable Evidence capture.
 *
 * @evidence contracts/common.md#principled-implementation The record joins a layer-relative authored path, its captured native source and ordered native heading identities, so topology consumes the same bytes and positions as Evidence.
 * @evidence contracts/common.md#clear-and-simple-design One structural record is shared by collection, layout validation and identity comparison; it introduces no secondary parser or filesystem owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fields preserve captured source identity, visible titles and explicit anchors; no fixture-specific alias or fallback version is encoded.
 * @evidence contracts/common.md#meaningful-documentation Member comments state relative spelling, captured-byte ownership, reading order, heading depth, anchor semantics and UTF-16 source-offset units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface declares data representation and selects no runtime algorithm; collection and validation functions own the scans and sorting over these records.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type coordinates no work or cache; collectTopologyDocuments owns reuse of native source and heading data.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires or releases no resources; callers retaining records own their captured-source references and heading arrays.
 */
export interface IProductionTopologyDocument {
  /** Path relative to the layer, preserving its authored spelling. */
  relative: string;

  /** Original captured text; topology never reopens the manuscript. */
  source: IEvidenceSourceFile;

  /** Native heading identities and source positions in reading order. */
  headings: {
    /** ATX depth; only H1 and H2 belong in narrative unit files. */
    level: number;

    /** Visible title, independent of its anchor. */
    title: string;

    /** Native resolved anchor, including an explicit authored anchor. */
    anchor: string;

    /** UTF-16 offset of the original heading line. */
    start: number;
  }[];
}
