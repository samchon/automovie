import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * An ordered source-authored nasal opening contour and its projection protocol.
 *
 * The producer maps the native boundary into the final generation's skin
 * exactly. Its fixed source-owned projection normal is expressed in head
 * metres, +X left, +Y up and +Z anterior. Orthogonal projection uses the first
 * actual contour point as origin; translation does not change the quantity.
 * This records an authored projected polygon, not clinical aperture, airway,
 * tissue segmentation or an individual's calibrated basal-view acquisition.
 * Changing its topology, normal or native mapping requires new generation
 * identity. Unordered sparse regions cannot stand in for this registration.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceNasalContour {
  /** Anatomical side, independent of camera or mirrored screen position. */
  side: "left" | "right";

  /** Final owning generation identity stamped by the upstream publisher. */
  generationSourceId: string;

  /** Closed source-projected reading protocol; no clinical equivalence. */
  protocol: "authored-source-projected-contour/1";

  /** Actual skin surface id addressed by orderedVertices. */
  surface: string;

  /** Unique skin vertex indices in the producer's oriented boundary order. */
  orderedVertices: number[];

  /** Parallel original native boundary witnesses, retained as provenance. */
  orderedNativeVertices: number[];

  /** Source-owned unit projection normal, rotated into the runtime head frame. */
  projectionNormal: IAutoMovieVector3;

  /** Producer's source basis, authored selection and acquisition limitations. */
  qualification: string;
}
