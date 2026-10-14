


/**
 * Parsed identity and the body of one screenplay file.
 *
 * @evidence contracts/common.md#principled-implementation Governed H1 and ordered explicit heading units accompany source text needed for draft annotation admission.
 * @evidence contracts/common.md#clear-and-simple-design Construction identity excludes source body while final reading carries it for structural checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Title, depth, anchor, lineage and order must be preserved; literal audience language still requires author judgment.
 * @evidence contracts/common.md#meaningful-documentation Members state sole parsed title, annotation inspection source and validated ordered units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased screenplay input acquires no buffer or task; the caller's readFinal callback supplies source/unit records and validateAutoMovieFinalScreenplayPopulation holds them only while comparing against the caller-owned construction map.
 *
 * @author Samchon
 */
export interface IAutoMovieScreenplayDocumentIdentity {

  /** The sole parsed H1 title, without its Markdown heading marker. */
  title: string;

  /** Complete source text inspected for premature evidence annotations. */
  source: string;

  /**
   * Ordered, explicitly anchored units already validated by the Markdown parser.
   */
  units: readonly {
    anchor: string;
    depth: 2 | 3 | 4;
    lineage: string;
    title: string;
  }[];
}
