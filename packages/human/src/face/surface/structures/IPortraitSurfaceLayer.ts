import type { IAutoMovieMeshDeformationField } from "@automovie/interface";
import { IPortraitSurfaceHost } from "./IPortraitSurfaceHost";

/**
 * A replaceable anatomical surface layer, such as cheek volume or a facial
 * crease. Fields use the engine's metre frame and are evaluated together on
 * the same unmodified surface. A layer changes skin, not a detached overlay.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Identifies a replaceable anatomical layer whose fields derive from the resident skin rather than a detached overlay.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Couples each stable layer ID to a metric field factory evaluated against the unmodified shared host.
 */
export interface IPortraitSurfaceLayer {
  /** Unique stable identity, used for deterministic composition order. */
  id: string;

  /** Optional maximum edge length in millimetres around this layer's fields. Omission preserves sampling. */
  sampleSpacing?: number;

  /** Derive metric fields from this instance's actual surface attachments. */
  fields: (host: IPortraitSurfaceHost) => IAutoMovieMeshDeformationField[];
}
