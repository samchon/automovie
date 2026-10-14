


/**
 * One exact H2 unit carried by a production-owned contract or design owner.
 *
 * @evidence contracts/common.md#principled-implementation Explicit H2 anchor, title and canonical LF span digest identify one governed authored unit.
 * @evidence contracts/common.md#clear-and-simple-design One unit representation serves design-owner and local contract inventories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest identifies exact canonical content rather than semantic prose quality.
 * @evidence contracts/common.md#meaningful-documentation Members state anchor form and SHA-256 span denominator.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased H2 identity declaration allocates no content. Observation suppliers own its anchor/title/digest strings; library owner-context construction indexes supplied design-unit addresses for one attempt, while compileAutoMovieLibrary preserves the supplied contracts inventory by reference in its snapshotAuthoring aggregate.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionEvidenceUnit {

  /** Stable evidence address without the leading `#`. */
  anchor: string;

  /** Human-readable heading text without its evidence anchor. */
  title: string;

  /** SHA-256 of this H2's canonical LF text through the next H2 or EOF. */
  digest: string;
}
