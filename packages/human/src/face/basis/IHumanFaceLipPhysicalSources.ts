import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

import type { IHumanFaceMaterialAttachment } from "../structures/IHumanFaceMaterialAttachment";

/**
 * Physical aliases and material interpolation from one complete lip margin.
 * The registration belongs to one figure instance. Material numeric IDs are
 * exact-key ordinals in their separate domain, never native vertex numbers.
 *
 * @evidence contracts/common.md#principled-implementation Physical aliases retain their typed source definitions.
 * @evidence contracts/common.md#clear-and-simple-design One identity lookup and one domain/ID attachment lookup serve finishing and placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material keys are not parsed as legacy numeric vertices.
 * @evidence contracts/common.md#meaningful-documentation States instance ownership and separate material ID meaning.
 * @evidence contracts/modeling.md#shared-boundaries Aliases and parent weights are supplied by one registration owner.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Contains identifiers and coefficients rather than coordinates.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring value.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Contains source correspondence only.
 * @evidenceExclude contracts/modeling.md#rendered-observation The joined consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Reads registered support rather than clinical measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source and contact owners admit support.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal coordinates.
 * @author Samchon
 */
export interface IHumanFaceLipPhysicalSources {
  /** Reader identity to its actual domain and nonnegative numeric source ID. */
  sources: ReadonlyMap<string, IAutoMovieMeshPhysicalSource>;

  /** Material domain, then numeric ID, to original source interpolation. */
  materialAttachments: ReadonlyMap<
    string,
    ReadonlyMap<number, IHumanFaceMaterialAttachment>
  >;
}
