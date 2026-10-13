/** Name of the viewer group drawing one planting cluster's batches.
 *
 * @evidence contracts/common.md#principled-implementation Prefix the unchanged cluster id with planting: so the viewer group and semantic claim identify both branch and leaf batches as one cluster.
 * @evidence contracts/common.md#clear-and-simple-design One shared name owns the engine/viewer join without importing either renderer objects or botanical derivation into the mask.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The group prefix is the declared supported batching contract; different cluster ids remain distinct and no fixture changes the name.
 * @evidence contracts/common.md#meaningful-documentation The comment states the group role and exact cluster-id preservation; batches are not assigned separate ownership colors here.
 * @evidence contracts/performance.md#efficient-algorithms One concatenation costs O(L) bytes/time for cluster-id length L with no member scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Group construction and mask derivation reuse the same name law; strings require no retained cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string owns no branches, leaves, group handle or lifecycle task.
 */
export const autoMoviePlantingNodeName: (cluster: string) => string = (cluster: string): string =>
  `planting:${cluster}`;
