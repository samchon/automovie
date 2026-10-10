import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/**
 * Same-source ventral tongue material boundary for an attached oral floor.
 * Native vertices and exact triangle seats identify one physical boundary;
 * source triangle membership separates attachment from free-surface contact.
 * This publisher convention does not register a clinical frenulum, hyoid
 * insertion or tongue volume measurement. It adds no personal geometry input.
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
