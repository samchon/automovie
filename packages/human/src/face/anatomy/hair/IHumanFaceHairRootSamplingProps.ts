import type { IAutoMovieHumanFaceHairDomain } from "../../structures/IAutoMovieHumanFaceHairDomain";

/**
 * Neutral source geometry and the registered growth chart consumed by area sampling.
 *
 * @evidence contracts/common.md#principled-implementation Neutral positions, source incidence and registered domain triangles retain one shared chart origin and resident ordering for area sampling.
 * @evidence contracts/common.md#clear-and-simple-design Indexed domain field types reuse the existing anatomical growth-domain contract instead of copying its triangle and origin shapes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Root seats are derived from actual supplied neutral geometry; the sampling inputs encode no finished-person catalogue or authored root coordinates.
 * @evidence contracts/common.md#meaningful-documentation Members specify original head-metre XYZ data, oriented correspondence and the shared domain owner's ordering and origin identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This sampling-props record chooses no area CDF or candidate search; createHumanFaceHairRoots owns compilation and mask rejection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The registered domain fields preserve shared provenance while the sampler owns its compiled neutral measure for subsequent layer requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Neutral arrays are borrowed by this input and copied into the sampler's derived triangles; the props object owns no file or task.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSamplingProps {
  /** Original neutral flat XYZ positions, head-frame metres. */
  positions: readonly number[];

  /** Original oriented faces, addressing the same coordinate population. */
  indices: readonly number[];

  /** Registered domain face ordinals retain the shared domain owner's identity and ordering. */
  triangles: Readonly<IAutoMovieHumanFaceHairDomain["triangles"]>;

  /** Registered neutral XYZ chart origin, in the shared domain owner's metre frame. */
  origin: Readonly<IAutoMovieHumanFaceHairDomain["origin"]>;
}
