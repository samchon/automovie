import type { IDentalSurfaceAnchor } from "./IDentalSurfaceAnchor";

/**
 * Reproducible clinical landmark registration on one exact basis revision.
 * The registration's author supplies evidence for landmark identity and the
 * acquisition frame. A mesh's highest visible pixel supplies neither.
 * Incisal/cusp and gingival zenith anchors follow their actual surfaces as
 * those positions change; the separately registered cervical axis stays with
 * the crown. An identifier records provenance without certifying its truth.
 *
 * @author Samchon
 */
export interface IDentalClinicalRegistration {
  /** Exact source basis to which the resident anchors were registered. */
  basisRevision: string;

  /** Local provenance locator for landmark identification and acquisition. */
  registrationId: string;

  /** Stationary crown references, directed from incisal toward cervical. */
  axis: { incisal: IDentalSurfaceAnchor; cervical: IDentalSurfaceAnchor };

  /** Registered incisal margin or buccal cusp point of the clinical height. */
  incisalOrCusp: IDentalSurfaceAnchor;

  /** Registered gingival zenith; it follows its actual surface interpolation. */
  gingivalZenith: IDentalSurfaceAnchor;
}
