import type { Stats } from "node:fs";
import * as fs from "node:fs/promises";
import { productionBinderStripAuthoringMarkers } from "./productionBinderStripAuthoringMarkers";

/**
 * Read an initially regular nonlinked Markdown leaf and remove supported author markers.
 *
 * @evidence contracts/common.md#principled-implementation Initial lstat rejects a link or nonfile before ordinary Node UTF-8 read and marker stripping; the separate path read is not a descriptor-bound identity fence.
 * @evidence contracts/common.md#clear-and-simple-design Grouped indexes and units share one initial leaf-admission and transformation rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsafe initial leaf observations refuse rather than following them intentionally, but replacement between lstat and read remains outside this admission proof.
 * @evidence contracts/common.md#meaningful-documentation Defines the regular-leaf premise, decoded transformed string and propagated native refusal; decoding does not reject every malformed UTF-8 sequence.
 * @evidence contracts/performance.md#efficient-algorithms Metadata plus full B-byte read/decode and marker scan determine work and string/buffer residency.
 * @evidence contracts/performance.md#reuse-equivalent-work One decoded current string feeds marker processing; there is no cross-read cache keyed only by a pathname.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Node readFile owns transient handles and only the transformed text escapes; no watcher or persistent byte buffer is retained.
 */
export async function productionBinderReadPhysicalMarkdown(target: string): Promise<string> {
    const linked: Stats = await fs.lstat(target);
    if (linked.isSymbolicLink() || !linked.isFile())
        throw new Error(`${target}: authored documents must be regular files.`);
    return productionBinderStripAuthoringMarkers(await fs.readFile(target, "utf8"));
}
