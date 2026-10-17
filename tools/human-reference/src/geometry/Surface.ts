import { V3 } from "./V3.ts";

/**
 * Private geometric surface plus explicit seam connectivity; no source data belongs in product output.
 *
 * @evidence contracts/common.md#principled-implementation A structural Surface declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface Surface {
  /** Physical source positions in one declared frame. */
  vertices: V3[];
  /** Private oriented source triangle addresses. */
  triangles: [number, number, number][];
  /** Connectivity-only canonical source vertex addresses. */
  weld: Int32Array;
  /** Per-triangle origin: zero body, one head skin. */
  part: Uint8Array;
  /** Optional per-vertex source influence maps; these are not a product rig. */
  weights?: Map<number, number>[];
}
