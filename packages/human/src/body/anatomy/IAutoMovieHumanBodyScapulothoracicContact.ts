import type { AutoMovieHumanBodySide } from "./AutoMovieHumanBodySide";

/**
 * Scapula gliding over the posterior thoracic cage without a synovial joint.
 *
 * A glenohumeral arm elevation needs a separately resolved scapular motion;
 * treating this as one ball joint or a static skin corrective loses the
 * clavicle/scapula/upper-arm relationship. This contact binds named generated
 * surfaces and carries no document-authored XYZ position or contact gap.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyScapulothoracicContact<
  Side extends AutoMovieHumanBodySide,
> {
  /** Anterior costal face of one scapula. */
  readonly scapula: { readonly structure: `${Side}Scapula`; readonly site: "costalSurface" };
  /** Same side's posterolateral rib-cage surface. */
  readonly thorax: { readonly structure: "thoracicCage"; readonly site: `${Side}PosterolateralRibs` };
}
