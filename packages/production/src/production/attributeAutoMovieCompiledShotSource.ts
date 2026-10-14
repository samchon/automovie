import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import type { IAutoMovieCompiledShotSource } from "@automovie/interface";
import { selectAutoMovieShotAcceptanceSources } from "./selectAutoMovieShotAcceptanceSources";

/**
 * Attach exact authenticated entry and sibling identities to materialized shot output.
 *
 * @evidence contracts/common.md#principled-implementation One immutable result copy preserves all materialized fields and records graph-selected entry identity plus completed sibling attributions; legacy null entry retains existing output without manufacturing ownership.
 * @evidence contracts/common.md#clear-and-simple-design Materialization owns runtime output and this boundary owns the source attribution DTO, reusing the sibling selector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authenticated owner is inferred from a source path, null legacy input receives no invented edge and neither input is mutated.
 * @evidence contracts/common.md#meaningful-documentation States admission premise, copied result, legacy absence and resolver-owned review/final requirements.
 * @evidence contracts/performance.md#efficient-algorithms Shallow shot copying costs its top-level field population and sibling selection scans B bindings; nested runtime arrays are referenced rather than rebuilt.
 * @evidence contracts/performance.md#reuse-equivalent-work Already materialized nested data and admitted edge scalars are shared by the new attribution record, without cross-build cached ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned shallow copy and sibling metadata transfer to the build attempt; original nested values retain their caller ownership and no handle opens.
 */
export function attributeAutoMovieCompiledShotSource(props: {
  value: IAutoMovieCompiledShotSource;
  bindings: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[];
  entry: IAutoMovieProductionEvidenceSourceOwnerBinding | null;
}): IAutoMovieCompiledShotSource {
  return props.entry === null
    ? { ...props.value }
    : {
        ...props.value,
        sourceOwner: {
          branch: props.entry.branch,
          path: props.entry.sourcePath,
          export: props.entry.exportName,
          digest: props.entry.sourceDigest,
          target: `${props.entry.targetPath}#${props.entry.targetAnchor}`,
        },
        acceptanceSources: selectAutoMovieShotAcceptanceSources({
          bindings: props.bindings,
          entry: props.entry,
        }),
      };
}
