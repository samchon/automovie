import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAnatomicalInspection } from "../anatomy/generated/IAutoMovieHumanBodyAnatomicalInspection";

/**
 * A source-ID partition with mathematical candidate qualification.
 * Reference provenance describes the report supplied by the inspector, never
 * a registered personal centre, clinical certification or a whole bone surface.
 * No requested context or editable anatomical document is restored from this.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the common interval owner and separates the candidate qualification from geometry identity.
 * @evidence contracts/common.md#clear-and-simple-design One readback combines two independently owned primitive namespaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tissue or held-out error is inferred from the target sphere.
 * @evidence contracts/common.md#meaningful-documentation States reference-only provenance and the unavailable whole anatomy.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularAssetCorrespondence {
  /** Actual primitive element binding admitted by the common reader. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;

  /** Body-specific metadata, with no duplicate interval formula. */
  qualification: {
    /** Supported body metadata version, distinct from the common partition. */
    version: 1;

    /** Concrete numerical inspector, never a clinical validation revision. */
    generatorRevision: "articular-head-inspection/1";

    /** Reported neutral reference basis, not a registered personal centre. */
    reference: IAutoMovieHumanBodyAnatomicalInspection["reference"];

    /** No whole skin is generated or certified by this export. */
    skin: IAutoMovieHumanBodyAnatomicalInspection["skin"];

    /** Qualification records in the carrying primitive's source-member order. */
    parts: {
      /** Exact source candidate ID, distinct from its complete bone. */
      id: `${IAutoMovieHumanBodyAnatomicalInspection["candidates"][number]["part"]}/head-candidate`;

      /** A fictional target rather than an imaging acquisition. */
      source: "target";

      /** Placement uses the reference rig and certifies no personal registration. */
      registration: "reference-rig-only";

      /** The sphere does not resolve a complete anatomical part. */
      partResolution: { status: "unavailable"; reason: "geometry-not-validated" };
    }[];
  };
}
