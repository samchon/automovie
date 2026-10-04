import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The transported gather candidate returned by
 * `transportHumanFaceHairGatherStep`.
 *
 * The integrator still admits or rejects the point; this record is a proposal
 * that preserves the requested normal intent along the actual chord.
 *
 * @evidence contracts/common.md#principled-implementation Returns the proposed point with the offset datum and normal intent the next step continues from.
 * @evidence contracts/common.md#clear-and-simple-design Three named members replace an anonymous return type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A proposal, never an admitted station.
 * @evidence contracts/common.md#meaningful-documentation States the producer, units and the admission boundary.
 * @evidence contracts/modeling.md#spatial-conventions Point and offset are current head metres; normal intent is a dimensionless cosine.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator admits actual stations.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owner defines the skin boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 * @author Samchon
 */
export interface IHumanFaceHairGatherTransport {
  /** Proposed station, in current head-frame metres. */
  point: IAutoMovieVector3;
  /** Free offset from the skin carried to the next step, in metres. */
  offset: number;
  /** Dot product of the requested direction and the outward normal. */
  normalIntent: number;
}
