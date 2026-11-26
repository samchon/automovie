import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { unionSubjectBoxes } from "../../film/unionSubjectBoxes";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";

/**
 * The world box one named element's placed geometry fills.
 *
 * The box is the union of {@link builtEnvironmentElementPartBounds}, measured at
 * the current operating state from static CPU vertices: tessellated primitives
 * and stated meshes. Placement resolution shares that part query directly
 * through its body resolver; this function is the element-specific union entry
 * point.
 *
 * `null` has two ordinary readings, and neither is a fault. An id this record
 * never declared resolves to nothing, because the caller is usually resolving a
 * locator that project source authored and an unresolved locator is a finding
 * for that caller to report rather than an engine refusal, which is why this
 * answers `null` where the space queries such as
 * {@link builtEnvironmentSpaceContentBounds} throw. A transform-only element
 * draws nothing, so it has no geometry box either: a grouping node standing
 * eight metres up is not something a camera can be aimed at.
 *
 * An element citing a runtime model reference, whose bytes this record never
 * holds, or whose parts draw no vertex, answers a degenerate box at its own
 * world origin rather than nothing, because that is the place the record does
 * state.
 *
 * One call stages the whole work's transform hierarchy, because an element's
 * world matrix is its ancestors' product. A caller resolving many elements of
 * one environment reads {@link builtEnvironmentPartBoxes} once instead.
 *
 * These are CPU boxes of finite stated or tessellated vertices under
 * element-world and part-local TRS. Attached-bone transforms, skinning,
 * animation, loaded external geometry and GPU Float32 evaluation are outside
 * this measurement; enclosure of a rendered frame requires those extra effects
 * to be absent or separately bounded.
 */
export function builtEnvironmentElementBounds(
  environment: IAutoMovieBuiltEnvironment,
  elementId: string,
): IAutoMovieSubjectBox | null {
  const parts: IAutoMovieSubjectBox[] | null =
    builtEnvironmentElementPartBounds(environment, elementId);
  return parts === null ? null : unionSubjectBoxes(parts);
}
