import { IAutoMovieSemanticMask } from "@automovie/interface";

import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/**
 * Project the complete current semantic payload into one field/collection order.
 *
 * @evidence contracts/common.md#principled-implementation Explicit fields retain every v2 semantic value except its self-declared digest; entries, node joins and unaddressed gaps are sorted by stable ids. Typed/schema-admitted inputs are required because this projection is not a value validator.
 * @evidence contracts/common.md#clear-and-simple-design Digest computation and pretty sidecar serialization share this owner so changing a field cannot make written payload identity drift from hashed payload identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No entry or gap is omitted for size, fixture or consumer; unknown-field refusal belongs to verifyAutoMovieSemanticMask before sidecar projection.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies current complete payload, digest exclusion, sort order and admission responsibility; returned records/arrays are fresh while immutable scalar values are preserved.
 * @evidence contracts/performance.md#efficient-algorithms E entries and G gaps require O(E log E+G log G) ordering plus each entry's node sort, with output storage proportional to all entries, nodes and gaps.
 * @evidence contracts/performance.md#reuse-equivalent-work Hash and sidecar consumers reuse the identical projection law; verification and serialization still recompute because a caller can mutate mask fields, so no persistent identity-only cache is claimed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh payload objects transfer to the caller and local sort arrays are temporary; no color buffer, file handle or serialization task is retained.
 */
export function canonicalAutoMovieSemanticMaskPayload(
  mask: Omit<IAutoMovieSemanticMask, "digest">,
): Omit<IAutoMovieSemanticMask, "digest"> {
  return {
    version: mask.version,
    protocol: mask.protocol,
    background: mask.background,
    entries: [...mask.entries]
      .sort(
        (
          left: IAutoMovieSemanticMask["entries"][number],
          right: IAutoMovieSemanticMask["entries"][number],
        ): number => compareAutoMovieRenderIds(left.id, right.id),
      )
      .map(
        (
          entry: IAutoMovieSemanticMask["entries"][number],
        ): IAutoMovieSemanticMask["entries"][number] => ({
          id: entry.id,
          kind: entry.kind,
          label: entry.label,
          color: entry.color,
          owner: entry.owner,
          nodes: [...entry.nodes].sort(compareAutoMovieRenderIds),
          slot:
            entry.slot === null
              ? null
              : {
                  instanceSet: entry.slot.instanceSet,
                  index: entry.slot.index,
                },
        }),
      ),
    unaddressed: [...mask.unaddressed]
      .sort(
        (
          left: IAutoMovieSemanticMask["unaddressed"][number],
          right: IAutoMovieSemanticMask["unaddressed"][number],
        ): number =>
          compareAutoMovieRenderIds(left.instanceSet, right.instanceSet),
      )
      .map(
        (
          gap: IAutoMovieSemanticMask["unaddressed"][number],
        ): IAutoMovieSemanticMask["unaddressed"][number] => ({
          instanceSet: gap.instanceSet,
          slots: gap.slots,
          reason: gap.reason,
          remedy: gap.remedy,
        }),
      ),
  };
}
