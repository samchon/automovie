import type { IAutoMovieHumanBodyAnatomicalReference } from "../anatomy/generated/IAutoMovieHumanBodyAnatomicalReference";
import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "../anatomy/generated/IAutoMovieHumanBodyUnvalidatedGeometry";
import type { IAutoMovieHumanBodyArticularPartQualification } from "./IAutoMovieHumanBodyArticularPartQualification";

/**
 * Body candidate qualification beside a primitive's source-part correspondence.
 *
 * The reference describes the inspection report's neutral basis, without personal centre registration, clinical certification or a whole bone surface. The common correspondence owns intervals; this record adds qualification in the carrying primitive's source-member order.
 *
 * @evidence contracts/common.md#principled-implementation Metadata version, concrete inspector revision, neutral reference, unresolved skin and ordered candidate members describe the report actually joined to the primitive.
 * @evidence contracts/common.md#clear-and-simple-design Body-specific qualifications remain separate from generic accessor intervals and from saved editable documents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A numerical generator revision and reference basis cannot certify personal centres, complete skin or clinical anatomy.
 * @evidence contracts/common.md#meaningful-documentation Members identify version/revision ownership, neutral-reference meaning, skin unavailability and required source-member order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The articular metadata schema performs no source-member matching or numerical inspection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Ordered qualification typing does not memoize mutable primitive metadata or geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema owns no writer, accessor buffer, inspector lifetime or external resource.
 *
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
