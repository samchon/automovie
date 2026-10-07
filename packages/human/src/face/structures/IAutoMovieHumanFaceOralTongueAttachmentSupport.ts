import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/**
 * Same-source ventral tongue material boundary for an attached oral floor.
 * Native vertices and exact triangle seats identify one physical boundary;
 * source triangle membership separates attachment from free-surface contact.
 * This publisher convention does not register a clinical frenulum, hyoid
 * insertion or tongue volume measurement. It adds no personal geometry input.
 *
 * @evidence contracts/common.md#principled-implementation Native boundary vertices and ordered triangle seats retain the source's physical correspondence after shape and rigid performance.
 * @evidence contracts/common.md#clear-and-simple-design One qualified source record owns loop identity and attachment membership independently of personal numerical inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest-point list, source-name fallback or clinical mean replaces the actual source patch.
 * @evidence contracts/common.md#meaningful-documentation Separates physical source identity, authored attachment and unknown clinical insertion.
 * @evidence contracts/modeling.md#shared-boundaries The tongue and floor consumers read the same source material loop and membership.
 * @evidence contracts/modeling.md#spatial-conventions Native ordinals and barycentric weights are dimensionless; resolved points use the declared head-metre frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This registration defines no new anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Source attachment metadata adds no personal shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Normal tongue and floor consumers own the emitted population.
 * @evidenceExclude contracts/modeling.md#rendered-observation Shared tongue/floor assembly owns actual observation.
 * @evidence contracts/anatomy.md#anatomical-source The source publisher qualifies the ventral patch as an authored convention and preserves unknown frenulum/hyoid acquisition.
 * @evidenceExclude contracts/anatomy.md#permitted-range This source record declares no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Personal documents do not accept attachment vertices or curves.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralTongueAttachmentSupport {
  /** Canonical generation shared with the final connected oral source. */
  generation: string;

  /** Actual native tongue surface, separate from the skin's sample domain. */
  surface: string;

  /** Exact neutral/incidence/targets/attachments/material-region fingerprint. */
  nativeSha256: string;

  /** Ordered distinct native vertices of the actual ventral patch boundary. */
  nativeVertices: number[];

  /** Same boundary stations as actual native triangle/barycentric seats. */
  points: IAutoMovieHumanFaceAttachmentPoint[];

  /** Native triangle ordinals on the attached side of that boundary. */
  attachedTriangles: number[];

  /** Exact native population carried by the attached source patch. */
  attachedSourceVertices: number[];

  /** Coordinate frame of resolved source points, with no clinical reorientation. */
  frame: "head-metres-y-up-z-anterior";

  /** Source material assignment is authored rather than measured insertion. */
  qualification: "authoredConvention";
}
