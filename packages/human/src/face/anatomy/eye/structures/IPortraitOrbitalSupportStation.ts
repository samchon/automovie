/**
 * One transverse upper-orbit section at a subject-owned brow datum. Distances
 * are head-frame millimetres; positive projection is anterior. The brow datum
 * and the samples above/below it follow the actual shared skin, not the hairs.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates forehead continuation, brow-pad support and superior sulcus at one orbital station.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Binds a retained brow datum to finite above/below section offsets and signed anterior projections.
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
