import { type IAutoMovieAssetUse, IAutoMovieAssetProvenance } from "@automovie/interface";

/**
 * Find an exact production/kind/owner resource use on a present asset record.
 *
 * @evidence contracts/common.md#principled-implementation Optional absence returns false; one supplied use must match all three exact identity fields.
 * @evidence contracts/common.md#clear-and-simple-design Model sidecars/proxies and motion sidecars share the same authorization predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An authorized declaration alone is not an actual dependency; consumed-resource accounting separately checks that reverse direction.
 * @evidence contracts/common.md#meaningful-documentation States exact equality, supported resource kinds and absent-record refusal.
 * @evidence contracts/performance.md#efficient-algorithms Visits U uses until a match with input-length identity comparisons and constant auxiliary storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No authorization result is retained across later ledger observations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The boolean acquires no resource and keeps no record reference.
 *
 * @author Samchon
 */
export function hasActiveAssetUse(
  record: IAutoMovieAssetProvenance | undefined,
  productionId: string,
  kind: "model-resource" | "model-proxy" | "motion-resource",
  owner: string,
): boolean { return record?.uses.some(
    (use: IAutoMovieAssetUse) : boolean =>
      use.production === productionId &&
      use.consumer.kind === kind &&
      use.consumer.id === owner,
  ) === true; }
