import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Separate static atlas parts and diagnostic materials appended by the body
 * builder before resident-model admission.
 *
 * @evidence contracts/common.md#principled-implementation Reuses resident model part and material types consumed by the person and static exporters.
 * @evidence contracts/common.md#clear-and-simple-design Only the two appended populations travel together.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts A transport record.
 * @evidence contracts/common.md#meaningful-documentation States the downstream admission stage.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each part and its separate material preserve its atlas identity through material-grouped static export.
 * @evidenceExclude contracts/modeling.md#parameter-channels No channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The adapter owns emission.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Resident meshes own coordinates.
 * @evidenceExclude contracts/modeling.md#shared-boundaries No boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The adapter observes the parts.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source resources own provenance.
 * @evidenceExclude contracts/anatomy.md#permitted-range No range admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Generated output only.
 * @author Samchon
 */
export interface IHumanBodyAtlasParts {
  /** Posed static parts with independent anatomical identities. */
  parts: IAutoMovieModel["parts"];

  /** A separate diagnostic finish per part preserves export correspondence. */
  materials: IAutoMovieModel["materials"];
}
