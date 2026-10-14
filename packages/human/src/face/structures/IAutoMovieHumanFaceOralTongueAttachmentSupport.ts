import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/**
 * Same-source ventral tongue material boundary for an attached oral floor.
 * Native vertices and exact triangle seats identify one physical boundary;
 * source triangle membership separates attachment from free-surface contact.
 * This publisher convention does not register a clinical frenulum, hyoid
 * insertion or tongue volume measurement. It adds no personal geometry input.
 * Current oral generation, source identity and pose consumers do not read this
 * optional support. It therefore supplies declared publisher correspondence,
 * without runtime boundary admission or generated floor attachment.
 *
 * @evidence contracts/common.md#principled-implementation Native vertices, actual facet seats and attached-side populations describe intended same-source ventral correspondence separately from free-surface contact; current consumers have not integrated this registration.
 * @evidence contracts/common.md#clear-and-simple-design Generation/surface/hash provenance, ordered boundary seats and attached populations occupy distinct source domains under one explicit head-metre frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No runtime consumer currently checks these witnesses or constructs their floor attachment, and the authored boundary establishes no frenulum, hyoid insertion, clinical volume or personal coordinate input.
 * @evidence contracts/common.md#meaningful-documentation Every index/frame/qualification member states intended source ownership while the declaration explicitly identifies the implementation gap.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This unconsumed record executes no boundary validation, hash comparison or attachment construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Intended source identity implements no runtime correspondence cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The publisher owns arrays; this declaration creates no tongue/floor mesh or query.
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
