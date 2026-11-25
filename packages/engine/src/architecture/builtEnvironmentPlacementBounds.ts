import {
  type IAutoMovieBuiltEnvironmentPlacementBounds,
  type IAutoMovieBuiltPlacementBody,
  IAutoMovieBuiltPlacementBounds,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";
import { resolveBuiltPlacementBody } from "./resolveBuiltPlacementBody";

/**
 * Resolve one building element or compact population to its current world box.
 *
 * An environment-owned element is measured as the union of the part boxes its
 * spatial queries use, so this is not a second answer to "where does it stand".
 * A compact population delegates to its one placement-bounds fold, is never
 * expanded here, and throws for an `along-route` layout.
 *
 * A missing identity or a transform-only group answers `null`, because neither
 * states a place a body occupies. An element the record locates but carries no
 * vertices for, a runtime model reference or a model with no parts, resolves to
 * the single world origin the record does state, and says so with the
 * `element-origin-point` basis rather than passing a point off as geometry. The
 * caller keeps the position it asked for, and every overlap or gap taken from
 * that box carries the label that says it measured no volume.
 *
 * The point basis is selected by equal box corners and can also describe
 * genuine degenerate geometry; it does not independently prove that the model's
 * vertices were absent.
 *
 * These are CPU boxes of finite stated or tessellated vertices under
 * element-world and part-local TRS. Attached-bone transforms, skinning,
 * animation, loaded external geometry and GPU Float32 evaluation are outside
 * this measurement; enclosure of a rendered frame requires those extra effects
 * to be absent or separately bounded.
 */
export const builtEnvironmentPlacementBounds: (
  props: IAutoMovieBuiltEnvironmentPlacementBounds.IProps,
) => IAutoMovieBuiltPlacementBounds | null = (
  props: IAutoMovieBuiltEnvironmentPlacementBounds.IProps,
): IAutoMovieBuiltPlacementBounds | null => {
  const body: IAutoMovieBuiltPlacementBody | null = resolveBuiltPlacementBody({
    environment: props.environment,
    target: props.target,
    parts: (elementId: string): IAutoMovieSubjectBox[] | null =>
      builtEnvironmentElementPartBounds(props.environment, elementId),
  });
  return body === null ? null : body.bounds;
};
