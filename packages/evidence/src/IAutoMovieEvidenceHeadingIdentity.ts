

/**
 * Validated H2/H3/H4 records carry explicit anchor, parent lineage, title and original line.
 *
 * @evidence contracts/common.md#principled-implementation Validated H2/H3/H4 records carry explicit anchor, parent lineage, title and original line.
 * @evidence contracts/common.md#clear-and-simple-design One record supports target uniqueness and narrative counterpart identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lineage describes admitted topology and does not compare prose or visual behavior.
 * @evidence contracts/common.md#meaningful-documentation line is one-based and lineage joins current H2/H3/H4 anchors with slashes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; markdownIdentities admits lineages and validateHosts owns per-layer identity maps, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; markdownIdentities admits lineages and validateHosts owns per-layer identity maps, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; markdownIdentities admits lineages and validateHosts owns per-layer identity maps, while the caller or module owns the lifetime of its values.
 */
export interface IAutoMovieEvidenceHeadingIdentity {
  /** Explicit stable target or host address within its file. */
  anchor: string;

  /** Admitted authored unit depth, excluding the file title. */
  depth: 2 | 3 | 4;

  /** Slash-joined H2, H3 and H4 parent anchors in nesting order. */
  lineage: string;

  /** One-based source line of the visible heading. */
  line: number;

  /** Visible heading title without terminal explicit-anchor syntax. */
  title: string;
}
