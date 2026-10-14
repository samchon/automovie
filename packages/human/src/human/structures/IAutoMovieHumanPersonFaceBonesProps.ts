import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * Inputs for available face jaw/eye frame resolution: actual face basis, evaluated shape/expression and the actual head carry placing that face in person metre Y-up/+Z-forward coordinates. Face articulation/source registrations decide available bone frames; other optical/oral/hair fields are outside this narrow reader. These borrowed inputs must match the same evaluation and do not prove clinical joint placement or current rendered anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Same-evaluation source shape/expression and actual head carry locate available face articulation frames under the body head.
 * @evidence contracts/common.md#clear-and-simple-design Canonical face basis, narrow document projection and head-transform owner supply the resolver without another rig schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source registration does not fabricate a jaw/eye frame, and callback/typed inputs do not certify patient joints or current GPU placement.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre axes, narrowed anatomy scope, evaluation correspondence and source availability boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input schema performs no articulation or frame composition; concrete resolver/face owners execute those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reusing admitted source/shape context is resolver behavior rather than a cache implemented by this carrier.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring borrowed context acquires no skeleton resource or task; actual caller/evaluator owns its lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFaceBonesProps {
  /** The face basis. */
  basis: IAutoMovieHumanFaceBasis;

  /** The face document's shape and expression. */
  document: Pick<IAutoMovieHumanFaceBasisDocument, "shape" | "expression">;

  /** The head transform that placed the face on the body. */
  head: IAutoMovieHumanPersonHeadTransform;
}
