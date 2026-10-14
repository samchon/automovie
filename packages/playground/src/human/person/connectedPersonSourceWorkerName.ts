import type { IConnectedPersonSourceUrls } from "./IConnectedPersonSourceUrls";

/**
 * Give a module worker the same resolved source URLs through its standard name.
 * Its static worker import stays recognizable to the production bundler. Only
 * source selection is encoded; no definition or numerical document is carried.
 * Omission preserves the published loader. The name also states the role the
 * one human worker entry loads (`worker=person`).
 *
 * @evidence contracts/common.md#principled-implementation The standard worker name carries the person role and the same caller-resolved head/body source pair consumed by page and numerical worker loaders.
 * @evidence contracts/common.md#clear-and-simple-design Encoding only role/source locations preserves the static module-worker entry and separates source selection from definition bytes and authored person documents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission invents no generation payload and a worker name does not substitute for the ordinary source/schema/pairing checks.
 * @evidence contracts/common.md#meaningful-documentation The comment names standard-name propagation, static bundler entry, omitted-source behavior and absence of asset/document payloads.
 * @evidence contracts/performance.md#efficient-algorithms URLSearchParams encodes the fixed role and at most two source strings in O(u) time/storage for total URL length u; no definition bytes or geometry are traversed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A cheap fixed-field worker name is produced for a requested worker acquisition; the helper retains no previous string or numerical result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The helper acquires no worker or fetch task and retains only its returned ordinary selection string with the caller.
 *
 * @author Samchon
 */
export function connectedPersonSourceWorkerName(
  source: IConnectedPersonSourceUrls | undefined,
): string {
  return new URLSearchParams(
    source === undefined
      ? { worker: "person" }
      : { worker: "person", headSource: source.head, bodySource: source.body },
  ).toString();
}
