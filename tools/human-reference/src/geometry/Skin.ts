import { Bone } from "./Bone.ts";
import { V3 } from "./V3.ts";

/**
 * Combined private body and largest head skin component, without auxiliary eyes.
 *
 * @evidence contracts/common.md#principled-implementation A structural Skin declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface Skin {
  /** Source posture, kept distinct from clinical and generated rest-pose claims. */
  pose: "native-A" | "diagnostic-T";
  /** Combined unchanged body and qualified head-skin positions. */
  vertices: V3[];
  /** Source triangles remapped into the combined private vertex array. */
  triangles: [number, number, number][];
  /** Canonical source vertex index for seam connectivity; coordinates remain unchanged. */
  canon: Int32Array;
  /** Per-vertex origin: zero body, one head skin. */
  part: Uint8Array;
  /** Diagnostic group weights, GROUPS.length values per vertex. */
  gw: Float32Array;
  /** Body source rig channel lookup in this posture. */
  bones: Map<string, Bone>;
  /** Head source rig channel lookup; markers are not palpable landmarks. */
  headBones: Map<string, Bone>;
}
