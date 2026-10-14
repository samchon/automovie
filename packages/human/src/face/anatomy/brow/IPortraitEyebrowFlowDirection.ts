/**
 * One fibre endpoint within the supporting brow and its signed lateral sweep.
 * A tip below its root allows an upper-band hair to converge with lower hairs.
 *
 * The tip is a dimensionless fraction across the brow, and the bend is in
 * head millimetres measured along the eye's own anatomical lateral direction,
 * so one value serves both eyes.
 *
 *
 * @evidence contracts/common.md#principled-implementation A bounded cross-band tip fraction and signed anatomical lateral bend describe one authored guide's direction.
 * @evidence contracts/common.md#clear-and-simple-design Dimensionless tip position remains separate from head-millimetre sweep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A tip may lie below its root to express convergence; the control is neither a measured shaft length nor a per-person skin displacement.
 * @evidence contracts/common.md#meaningful-documentation The prose states lower/upper fractions and tail-positive anatomical bend shared by both eyes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEyebrowFlowDirection is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEyebrowFlowDirection declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEyebrowFlowDirection acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IPortraitEyebrowFlowDirection {
  /** Tip across the brow: lower boundary zero, upper boundary one. */
  tip: number;

  /** Signed lateral bend in mm; positive points toward the anatomical tail. */
  outwardBend: number;
}
