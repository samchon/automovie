import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/**
 * Scapula gliding over the posterior thoracic cage without a synovial joint.
 *
 * A glenohumeral arm elevation needs a separately resolved scapular motion; treating this as one ball joint or a static skin corrective loses the clavicle/scapula/upper-arm relationship. This contact binds named generated surfaces and carries no document-authored XYZ position or contact gap.
 *
 * @evidence contracts/common.md#principled-implementation A shared side parameter relates the scapula's anterior costal surface to same-side posterolateral ribs without misclassifying the interface as synovial.
 * @evidence contracts/common.md#clear-and-simple-design One named contact type keeps sliding shoulder-girdle ownership separate from glenohumeral articular surface pairs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record exposes named generated surfaces rather than prescribing an unregistered XYZ placement or contact gap.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why scapular motion accompanies arm elevation, and property comments identify the two contacting anatomical surfaces.
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
    /** Named bone carrying the source contact surface. */
    readonly structure: `${Side}Scapula`;

    /** Registered contact address in the carrying bone's source anatomy. */
    readonly site: "costalSurface";
  };

  /** Same side's posterolateral rib-cage surface. */
  readonly thorax: {
    /** Named bone carrying the source contact surface. */
    readonly structure: "thoracicCage";

    /** Registered contact address in the carrying bone's source anatomy. */
    readonly site: `${Side}PosterolateralRibs`;
  };
}
