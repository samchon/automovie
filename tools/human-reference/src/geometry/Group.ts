/**
 * Source rig partitions for diagnostics; these are not anatomical skin boundaries.
 *
 * @evidence contracts/common.md#principled-implementation A structural Group declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export type Group =
  | "trunk"
  | "neck"
  | "head"
  | "upperarm_l"
  | "lowerarm_l"
  | "hand_l"
  | "upperarm_r"
  | "lowerarm_r"
  | "hand_r"
  | "thigh_l"
  | "calf_l"
  | "foot_l"
  | "thigh_r"
  | "calf_r"
  | "foot_r";
