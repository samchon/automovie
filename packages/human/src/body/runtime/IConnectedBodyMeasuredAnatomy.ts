import type { ConnectedBodyHumeralHeadReading } from "./ConnectedBodyHumeralHeadReading";

/**
 * Completed humeral-head sphere fit observations with each radius's source and any actual acquisition record. Measured labels completion of the capped posed-skin query, not clinical qualification or a registered shoulder joint.
 *
 * @evidence contracts/common.md#principled-implementation The measured discriminator carries exactly the head readings paired by bone identity with their radius provenance.
 * @evidence contracts/common.md#clear-and-simple-design The radius-source union remains in ConnectedBodyHumeralHeadReading rather than duplicating provenance fields here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A completed fit does not promote a prior or target to an observed radius, or establish clinical anatomical validity.
 * @evidence contracts/common.md#meaningful-documentation The prose explains completion semantics and the preserved separation between fit geometry and source qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This completed-reading schema contains no numerical query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no result cache or measurement coordination.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased record acquires no skin mesh or observation task.
 *
 * @author Samchon
 */
export interface IConnectedBodyMeasuredAnatomy {
  /** The heads were measured. */
  status: "measured";

  /** One reading per humeral head. */
  heads: ConnectedBodyHumeralHeadReading[];
}
