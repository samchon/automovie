import { V3 } from "./V3.ts";

/**
 * Private reference rig marker, never a certified anatomical landmark.
 *
 * @evidence contracts/common.md#principled-implementation A structural Bone declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface Bone {
  /** Position of this channel in the source rig arrays, retained privately. */
  index: number;
  /** Unique source rig channel name; it is not a surface landmark name. */
  name: string;
  /** Parent channel index, or the source root sentinel when no parent exists. */
  parent: number;
  /** Position in the mesh's declared frame and units. */
  pos: V3;
  /** Columns of the rigid frame's orientation matrix. */
  ax: [V3, V3, V3];
}
