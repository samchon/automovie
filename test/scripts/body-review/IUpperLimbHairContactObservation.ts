import type { IUpperLimbSignedSurfaceObservation } from "./IUpperLimbSignedSurfaceObservation";

/** Complete source admission of one immutable pre-contact input. */
export interface IUpperLimbHairContactObservation {
  /** The actual stage, before contact changes any placed hair vertex. */
  stage: "placed-hair-before-body-contact";

  /** The source producers' common metre frame. */
  frame: "+Y up, +Z forward, +X left; person-model metres";

  /** Copied body vertex population seen by the normal contact consumer. */
  bodyVertices: number;

  /** Actual generated ribbon or card vertex population. */
  hairVertices: number;

  /** The actual document's clearance supplied to contact, metres. */
  clearanceMetres: number;

  /** Observation snapshot immutability; no mutation experiment is performed. */
  frozen: boolean;

  /** Whole retained source surface admitted by the existing validator. */
  full: IUpperLimbSignedSurfaceObservation;

}
