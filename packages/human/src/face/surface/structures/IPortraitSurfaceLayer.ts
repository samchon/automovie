import type { IAutoMovieMeshDeformationField } from "@automovie/interface";

import { IPortraitSurfaceHost } from "./IPortraitSurfaceHost";

/**
 * A replaceable anatomical surface layer, such as cheek volume or a facial
 * crease. Fields use the engine's metre frame and are evaluated together on
 * the same unmodified surface. A layer changes skin, not a detached overlay.
 *
 * @evidence contracts/common.md#principled-implementation A layer is an id, an optional sample spacing and a function from the surface to engine fields, all evaluated together on the same unmodified surface, so a layer changes skin and is not a detached overlay.
 * @evidence contracts/common.md#clear-and-simple-design Three members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitSurfaceLayer carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the unit (engine metres), the deterministic composition role of the id and the sampling default.
 * @evidence contracts/modeling.md#spatial-conventions Fields are in the engine's metres and the sample spacing is in millimetres, both stated on the members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitSurfaceLayer is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitSurfaceLayer carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitSurfaceLayer decides no primitive population; it only describes data.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitSurfaceLayer carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitSurfaceLayer admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitSurfaceLayer defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitSurfaceLayer constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitSurfaceLayer owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitSurfaceLayer {
  /** Unique stable identity, used for deterministic composition order. */
  id: string;

  /** Optional maximum edge length in millimetres around this layer's fields. Omission preserves sampling. */
  sampleSpacing?: number;

  /**
   * Derive metric fields from this instance's actual surface attachments.
   *
   * @evidence contracts/common.md#principled-implementation The layer derives its metric fields from the instance's actual surface attachments, so fields follow component replacement rather than a copied coordinate.
   * @evidence contracts/common.md#clear-and-simple-design One function from the surface host to fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitSurfaceLayer.fields is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States that the fields use the engine's metre frame and derive from live attachments.
   * @evidence contracts/modeling.md#spatial-conventions Fields are in engine metres from a host whose positions are millimetres; the conversion is the layer factory's named step.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitSurfaceLayer.fields is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitSurfaceLayer.fields carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitSurfaceLayer.fields decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitSurfaceLayer.fields constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitSurfaceLayer.fields is a declaration and displays nothing itself; the parts built from it are observed by their owners.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitSurfaceLayer.fields carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitSurfaceLayer.fields admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitSurfaceLayer.fields defines no input through which a caller shapes a human form.
   */
  fields: (host: IPortraitSurfaceHost) => IAutoMovieMeshDeformationField[];
}
