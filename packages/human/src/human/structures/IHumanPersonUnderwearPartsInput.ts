import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyUnderwearParts } from "../../body/structures/IAutoMovieHumanBodyUnderwearParts";
import type { IHumanBodyUnderwearRegion } from "../../body/structures/IHumanBodyUnderwearRegion";

/**
 * Final Person parts and explicitly registered Body skin material fields.
 * Source-owned region membership excludes face and internal anatomy parts.
 * @evidence contracts/common.md#principled-implementation Actual Body-loop membership selects final mesh regions and their aligned source field.
 * @evidence contracts/common.md#clear-and-simple-design Final parts, prepared material and explicit region map form one assembly input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No part-name heuristic discovers clothing membership.
 * @evidence contracts/common.md#meaningful-documentation States source-owned membership and final geometry order.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The composition names fabric parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Prepared document defines controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Partition emits geometry.
 * @evidence contracts/modeling.md#spatial-conventions Final parts retain their existing metre frames; field order follows their actual vertices.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Partition constructs common edge samples.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final Person owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source and final model owners retain admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
 * @author Samchon
 */
export interface IHumanPersonUnderwearPartsInput {
  /** Final Person parts after placement and source/layer readings, retaining local transforms. */
  parts: IAutoMovieModel["parts"];

  /** Admitted material and rest coverage; omission returns the same final part population. */
  garment?: IAutoMovieHumanBodyUnderwearParts;

  /** Exact final part ids supplied by the owning Body composition loop. */
  regions: ReadonlyMap<string, Pick<IHumanBodyUnderwearRegion, "field" | "sources">>;
}
