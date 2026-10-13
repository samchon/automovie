


/**
 * One graph-selectable Markdown target and its canonical address.
 *
 * @evidence contracts/common.md#principled-implementation Exact target address and original heading depth identify one native graph-selectable Markdown unit.
 * @evidence contracts/common.md#clear-and-simple-design An internal target value supports citation joins without retaining its full source body.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The target records original addressability without generating a text-review fingerprint or quality verdict.
 * @evidence contracts/common.md#meaningful-documentation Members document target path, anchor, depth and population-relative citation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased target-address record retains no Markdown body; markdownSourceOwnerTargets creates path/anchor strings for sourceOwnerBindingsOf, which releases its join map after producing the observation's string-only edges.
 *
 *
 * @author Samchon
 */
export interface IMarkdownSourceOwnerTarget {
  /** Exact native target anchor without a leading hash. */
  anchor: string;

  /** Original target heading depth used by the graph symbol selector. */
  depth: number;


  /** Canonical project-relative POSIX path of the target document. */
  path: string;

  /** Exact population-root-relative file and anchor used by source citations. */
  relativeTarget: string;
}
