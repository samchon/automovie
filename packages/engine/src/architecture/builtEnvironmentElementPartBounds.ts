import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { builtPlacedPartBoxes } from "./builtPlacedPartBoxes";

/**
 * The world boxes one element's drawn parts fill, one per part.
 *
 * Answers the question {@link builtEnvironmentElementBounds} cannot: how much of a body's box is body. A shelf is a back panel and two boards, so its union box spans floor to head height and is mostly air, and anything standing on a board is inside it. A caller testing whether two placed things intersect, or which face one rests on, reads these boxes rather than the union. Every part box lies inside the union, so a part test can only withdraw a contact the union invented, and a single-part body yields exactly its union box.
 *
 * `null` for an element that was never declared and for a transform-only element, which draws nothing. Boxes are world-space, one per part with at least one vertex in the model's part order, measured where the environment's current operating state puts the element. An element whose model the record does not hold, or whose parts draw no vertex, gets one degenerate box at its world origin.
 *
 * Each call stages the whole element hierarchy, so a caller measuring many elements of one environment reads {@link builtEnvironmentPartBoxes} once instead.
 *
 * These are CPU boxes of finite stated or tessellated vertices under element-world and part-local TRS. Attached-bone transforms, skinning, animation, loaded external geometry and GPU Float32 evaluation are outside this measurement; enclosure of a rendered frame requires those extra effects to be absent or separately bounded.
 *
 * @evidence contracts/common.md#principled-implementation Reads the element's world matrix from the shared current-state staging and folds each part's transformed vertices into its binary64 axis-aligned box through `builtPlacedPartBoxes` under the stated static CPU premise.
 * @evidence contracts/common.md#clear-and-simple-design A lookup of the element and its model followed by the two shared measuring helpers, so this query owns only the per-element null rules and none of the staging or tessellation code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element or model; the null answers and the origin fallback are stated rules that the union query and the overlap and support queries share rather than special cases for one caller.
 * @evidence contracts/common.md#meaningful-documentation States why part boxes differ from the union, the containment that makes them safe to test, both null cases, the world frame, the part order, the operating state used, the origin fallback, and the whole-hierarchy cost per call.
 * @evidence contracts/performance.md#efficient-algorithms O(E + M + W + P + V) for the element and model scans, world staging cost W, model parts P and their vertices V, including tessellation cost for procedural parts. The batch query shares staging and a model index when many elements are measured.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one element per call over the caller's mutable record and keeps no staging between calls; building-wide reuse is `builtEnvironmentPartBoxes`.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The staged matrices are dropped on return; the caller owns the returned boxes, one per drawn part.
 * @author Samchon
 */
export const builtEnvironmentElementPartBounds: (environment: IAutoMovieBuiltEnvironment, elementId: string) => IAutoMovieSubjectBox[] | null = (
  environment: IAutoMovieBuiltEnvironment,
  elementId: string,
): IAutoMovieSubjectBox[] | null => {
  const element: IAutoMovieBuiltElement | undefined = environment.elements.find(
    (candidate: IAutoMovieBuiltElement): boolean => candidate.id === elementId,
  );
  if (element === undefined || element.model === null) return null;
  const modelId: string = element.model;
  const model: IAutoMovieModel | undefined = environment.models.find(
    (candidate: IAutoMovieModel): boolean => candidate.id === modelId,
  );
  return builtPlacedPartBoxes(
    model,
    builtEnvironmentWorldMatrices(environment).get(element.id)!,
  );
};
