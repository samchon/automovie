import type { IAutoMovieModel } from "@automovie/interface";
import type { IAutoMovieLegacyPropArticulation } from "./IAutoMovieLegacyPropArticulation";

/**
 * A prop spec as the `forgeProp` tool accepts it, a crude primitive proxy with
 * rich meaning: body, affordances, self-declared articulation.
 *
 * @evidence contracts/common.md#principled-implementation The resident prop record joins a scene node, model and nullable articulation; toEnginePropSpec lowers its historical articulation before forgeProp admission.
 * @evidence contracts/common.md#clear-and-simple-design AutoMovieProject owns keyed stored prop read/write and engine validation while the record owns compatibility shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rigid null articulation remains null and the type does not certify semantic profile or geometry validity.
 * @evidence contracts/common.md#meaningful-documentation States scene join identity, proxy model and nullable rigid-prop meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Node/model/articulation data performs no forging; conversion and forgeProp admission own geometry work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A stored prop id does not establish equivalent geometry or driver output after edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resident prop values own their model and nullable articulation without acquiring transaction handles.
 * @author Samchon
 */
export interface IAutoMovieLegacyPropSpec {
  /**
   * The scene node this prop will occupy (the staging join key).
   */
  node: string;

  /**
   * The prop model: generated, skeleton-less, primitive parts.
   */
  model: IAutoMovieModel;

  /**
   * Self-declared moving parts, or `null` for a rigid prop.
   */
  articulation: IAutoMovieLegacyPropArticulation | null;
}
