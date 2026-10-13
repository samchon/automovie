import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/**
 * Scapula gliding over the posterior thoracic cage without a synovial joint.
 *
 * A glenohumeral arm elevation needs a separately resolved scapular motion; treating this as one ball joint or a static skin corrective loses the clavicle/scapula/upper-arm relationship. This conceptual contact names surfaces and carries no document-authored XYZ position or contact gap. The thoracic cage is a named group here, not one registered SourceRig bone; correspondence to actual rib/scapular source surfaces is not supplied by this type. A single literal Side constrains both references to that side; a left/right union permits independent choices and does not enforce same-side correlation.
 *
 * @evidence contracts/common.md#principled-implementation A single literal side relates the scapula's costal surface to same-side ribs without a synovial-joint claim; a union side parameter leaves reference correlation unenforced.
 * @evidence contracts/common.md#clear-and-simple-design One named contact type keeps sliding shoulder-girdle ownership separate from glenohumeral articular surface pairs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named conceptual surfaces do not establish source registration and do not prescribe an unregistered XYZ placement or contact gap.
 * @evidence contracts/common.md#meaningful-documentation The comment explains accompanying scapular motion, thoracic-group/source correspondence and the single-literal/union-side limitation; properties identify both conceptual surfaces.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The scapula/thorax reference type computes neither sliding trajectories nor skin corrections.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No contact-result reuse policy is encoded by these two anatomical references.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scapular surface descriptors own no collision objects, buffers or asynchronous tasks.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyScapulothoracicContact<
  Side extends AutoMovieHumanBodySide,
> {
  /** Anterior costal face of one scapula. */
  readonly scapula: {
    /** Named scapular structure in this anatomical relation vocabulary. */
    readonly structure: `${Side}Scapula`;

    /** Named contact surface; this declaration supplies no source registration. */
    readonly site: "costalSurface";
  };

  /** Same side's posterolateral rib-cage surface. */
  readonly thorax: {
    /** Thoracic skeletal group in this anatomical relation vocabulary. */
    readonly structure: "thoracicCage";

    /** Named rib-cage surface; this declaration supplies no source registration. */
    readonly site: `${Side}PosterolateralRibs`;
  };
}
