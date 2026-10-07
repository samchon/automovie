import type { IAutoMovieMeshSeparationQuery } from "@automovie/engine";

/**
 * The two compiled separation readers of one hair host skin.
 *
 * `source` reads the binary64 resident snapshot and `represented` its exact
 * Float32 buffer preimage. Both are compiled once by the hair builder from the
 * same current skin, so a complete row or cell is certified only when both
 * frames prove the requested gap. The readers are pure over their immutable
 * snapshots apart from spending the caller's shared budget.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the source and represented proofs that every emitted row and cell must pass.
 * @evidence contracts/common.md#clear-and-simple-design Two named readers replace repeated anonymous reader pairs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither frame substitutes for the other.
 * @evidence contracts/common.md#meaningful-documentation States the producer, both coordinate frames and their purity.
 * @evidence contracts/modeling.md#spatial-conventions Both readers use the current head-local metre frame; only their coordinate representation differs.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries Both readers read the same host skin that bounds every hair row and cell.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived readers, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairSeparationReaders {
  /** Separation reader over the binary64 source skin snapshot. */
  source: IAutoMovieMeshSeparationQuery;

  /** Separation reader over the exact Float32 representation of that skin. */
  represented: IAutoMovieMeshSeparationQuery;
}
