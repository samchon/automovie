import type { IAutoMovieMeshDeformationField } from "@automovie/interface";

import { IPortraitSurfaceHost } from "./IPortraitSurfaceHost";

/**
 * A replaceable anatomical surface layer, such as cheek volume or a facial
 * crease. Fields use the engine's metre frame and are evaluated together on
 * the same unmodified surface. A layer changes skin, not a detached overlay.
 *
 * @author Samchon
 */
export interface IPortraitSurfaceLayer {
  /** Unique stable identity, used for deterministic composition order. */
  id: string;

  /** Optional maximum edge length in millimetres around this layer's fields. Omission preserves sampling. */
  sampleSpacing?: number;

  /** Derive metric fields from this instance's actual surface attachments. */
  fields: (host: IPortraitSurfaceHost) => IAutoMovieMeshDeformationField[];
}
