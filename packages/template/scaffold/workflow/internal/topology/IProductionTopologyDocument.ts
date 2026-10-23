import type { IEvidenceSourceFile } from "@wrtnlabs/evidence";

/** A narrative document and its headings from one immutable Evidence capture. */
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
