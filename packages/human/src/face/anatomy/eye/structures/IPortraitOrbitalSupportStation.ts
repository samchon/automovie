/**
 * One transverse upper-orbit section at a subject-owned brow datum. Distances
 * are head-frame millimetres; positive projection is anterior. The brow datum
 * and the samples above/below it follow the actual shared skin, not the hairs.
 *
 * @evidence contracts/common.md#principled-implementation A transverse section at a subject-owned brow datum is fixed by three samples, the forehead transition above the datum, the brow at it and the sulcus below it, each with its projection, and taking them from the actual shared skin keeps them attached to it.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of a name, an anchor and three sample descriptions consumed by one function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each field states its role and sign, and the record states that the brow datum and the samples follow the actual skin and not the hairs.
 * @evidence contracts/modeling.md#spatial-conventions Distances are head millimetres and positive projection is anterior, as the record and its fields state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record is one section of a displacement layer and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 *
 * @author Samchon
 */
export interface IPortraitOrbitalSupportStation {
  /** Stable station identity within this eye's support group. */
  name: string;

  /** Retained skin vertex on the brow arc, supplied by the subject. */
  anchor: number;

  /** Height/projection of the forehead transition above the brow datum. */
  forehead: { height: number; projection: number };

  /** Requested movement of the brow-pad support at its skin datum. */
  browProjection: number;

  /** Positive distance below the datum and signed sulcus surface projection. */
  sulcus: { descent: number; projection: number };
}
