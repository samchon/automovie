import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * An ordered source-authored nasal opening contour and its projection protocol.
 *
 * The producer maps the native boundary into the final generation's skin
 * exactly. Contour positions use head metres; the fixed source-owned unit
 * projection normal is a dimensionless direction in +X left, +Y up and +Z
 * anterior axes. Orthogonal projection uses the first
 * actual contour point as origin; translation does not change the quantity.
 * This records an authored projected polygon, not clinical aperture, airway,
 * tissue segmentation or an individual's calibrated basal-view acquisition.
 * Changing its topology, normal or native mapping requires new generation
 * identity. Unordered sparse regions cannot stand in for this registration.
 *
 * @evidence contracts/common.md#principled-implementation Ordered original-native boundary witnesses and final skin indices retain same-generation source correspondence; readHumanFaceNasalContour projects actual performed points in the fixed source-normal plane.
 * @evidence contracts/common.md#clear-and-simple-design A closed versioned authored protocol separates source identity, anatomical side, contour order and explicit qualification from runtime camera selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader checks unique mappings, ordered simple nondegenerate contours and a unit normal within its existing numerical tolerance; projected polygon measures do not become clinical airway or calibrated basal-view observations.
 * @evidence contracts/common.md#meaningful-documentation Metre positions versus dimensionless normal, first-point projection origin and generation-change requirements preserve the actual authored measurement protocol.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This registration record performs no polygon projection or area/chord measurement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Native witnesses define source correspondence, not a projected-contour cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source arrays retain no performed points or camera/render resources here.
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
