import {
  AutoMovieBuiltPlacementBodyLocator,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPlacementBounds,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { IAutoMovieBuiltPlacementBody } from "./IAutoMovieBuiltPlacementBody";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";
import { resolveBuiltPlacementBody } from "./resolveBuiltPlacementBody";

/**
 * Resolve one building element or compact population to its current world box.
 *
 * An environment-owned element is measured as the union of the part boxes its spatial queries use, so this is not a second answer to "where does it stand". A compact population delegates to its one placement-bounds fold, is never expanded here, and throws for an `along-route` layout.
 *
 * A missing identity or a transform-only group answers `null`, because neither states a place a body occupies. An element the record locates but carries no vertices for, a runtime model reference or a model with no parts, resolves to the single world origin the record does state, and says so with the `element-origin-point` basis rather than passing a point off as geometry. The caller keeps the position it asked for, and every overlap or gap taken from that box carries the label that says it measured no volume.
 *
 * The point basis is selected by equal box corners and can also describe genuine degenerate geometry; it does not independently prove that the model's vertices were absent.
 *
 * These are CPU boxes of finite stated or tessellated vertices under element-world and part-local TRS. Attached-bone transforms, skinning, animation, loaded external geometry and GPU Float32 evaluation are outside this measurement; enclosure of a rendered frame requires those extra effects to be absent or separately bounded.
 *
 * @evidence contracts/common.md#principled-implementation Delegates to `resolveBuiltPlacementBody` with the single-element part query as its part source, so the element box is the union of its measured static CPU part boxes and the basis is read from whether that union is one point.
 * @evidence contracts/common.md#clear-and-simple-design A single-body entry point over the shared body resolution, which the pairwise and sweep overlap queries also use, so the three answer one rule for what a body's box is.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element, population or caller; the null answers and the origin-point label are stated rules, and the population fold's `along-route` refusal passes through.
 * @evidence contracts/common.md#meaningful-documentation States how each locator kind is measured, that populations stay compact and when their fold throws, both null cases, and what the `element-origin-point` basis tells the caller.
 * @evidence contracts/performance.md#efficient-algorithms An element pays the element/model scans, world staging and part tessellation/fold of `builtEnvironmentElementPartBounds`, then its part union. A population pays an O(R) scan of R populations plus `builtInstanceSetPlacementBounds`, including validation of all stored explicit transforms and a fold over the first count transforms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one locator per call and caches nothing across calls; the building-wide sweep resolves every body from one part table instead of calling this per body.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps nothing after returning; the caller owns the returned box.
 * @author Samchon
 */
export const builtEnvironmentPlacementBounds: (props: { environment: IAutoMovieBuiltEnvironment; target: AutoMovieBuiltPlacementBodyLocator; }) => IAutoMovieBuiltPlacementBounds | null = (props: {
  environment: IAutoMovieBuiltEnvironment;
  target: AutoMovieBuiltPlacementBodyLocator;
}): IAutoMovieBuiltPlacementBounds | null => {
  const body: IAutoMovieBuiltPlacementBody | null = resolveBuiltPlacementBody({
    environment: props.environment,
    target: props.target,
    parts: (elementId: string): IAutoMovieSubjectBox[] | null =>
      builtEnvironmentElementPartBounds(props.environment, elementId),
  });
  return body === null ? null : body.bounds;
};
