/**
 * One transverse upper-orbit section at a subject-owned brow datum. Distances
 * are head-frame millimetres; positive projection is anterior. The brow datum
 * and the samples above/below it follow the actual shared skin, not the hairs.
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
