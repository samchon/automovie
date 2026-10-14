import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOcclusionOptions } from "../../face/structures/IAutoMovieHumanFaceOcclusionOptions";

/**
 * Legacy person builder source context: actual face/body bases and optional face-owned occlusion bake policy. Anatomy/source admission stays with their builders; the legacy seam compiler needs compatible neutral skin loops and supported rig reach. Omitted occlusion retains the face owner's default policy. These borrowed records must remain unchanged for compiled evaluator reuse and do not supply a personal asset or current viewport qualification.
 *
 * @evidence contracts/common.md#principled-implementation Separate canonical face/body sources and face occlusion options preserve existing anatomy/evaluation owners for the legacy paired builder.
 * @evidence contracts/common.md#clear-and-simple-design Three explicit inputs leave geometry admission, seam correspondence and baking implementations with their dedicated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Typed bases do not certify compatible/healthy geometry or clinical proportions, and optional occlusion does not stand in for anatomy or current GPU observation.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies legacy source pairing, neutral loop/reach requirements, omission policy and unchanged borrowed context.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This source input schema runs no compiler, bake or topology traversal; concrete builders own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compile-once source reuse is builder behavior rather than caching implemented by these input members.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no source fetch, bake task or renderer; actual caller/builder context owns source buffer lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBuilderProps {
  /** The face basis. */
  face: IAutoMovieHumanFaceBasis;

  /** The body basis. */
  body: IAutoMovieHumanBodyBasis;

  /** The face producer's occlusion bake, or none. */
  occlusion?: IAutoMovieHumanFaceOcclusionOptions;
}
