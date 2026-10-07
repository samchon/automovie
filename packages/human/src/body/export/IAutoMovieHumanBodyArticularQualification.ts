import type { IAutoMovieHumanBodyAnatomicalReference } from "../anatomy/generated/IAutoMovieHumanBodyAnatomicalReference";
import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "../anatomy/generated/IAutoMovieHumanBodyUnvalidatedGeometry";
import type { IAutoMovieHumanBodyArticularPartQualification } from "./IAutoMovieHumanBodyArticularPartQualification";

/**
 * Body-specific candidate qualification exported beside a primitive's
 * source-part correspondence.
 *
 * The reference describes the inspection report's neutral basis, never a
 * registered personal centre, clinical certification or a whole bone surface.
 * Interval arithmetic stays with the common correspondence; this record adds
 * only qualification, in the carrying primitive's source-member order.
 *
 * @evidence contracts/common.md#principled-implementation Qualification is joined by exact source ID beside the common interval owner instead of duplicating its formula.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the correspondence's anonymous qualification object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole skin and bones remain explicitly unavailable; no clinical revision or tissue is inferred.
 * @evidence contracts/common.md#meaningful-documentation States reference-only provenance, the member order and the unavailable whole anatomy.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularQualification {
  /** Supported body metadata version, distinct from the common partition. */
  version: 1;

  /** Concrete numerical inspector, never a clinical validation revision. */
  generatorRevision: "articular-head-inspection/1";

  /** Reported neutral reference basis, not a registered personal centre. */
  reference: IAutoMovieHumanBodyAnatomicalReference;

  /** No whole skin is generated or certified by this export. */
  skin: IAutoMovieHumanBodyUnvalidatedGeometry;

  /** Qualification records in the carrying primitive's source-member order. */
  parts: IAutoMovieHumanBodyArticularPartQualification[];
}
