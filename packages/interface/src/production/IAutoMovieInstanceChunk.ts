import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieFormationBounds } from "./IAutoMovieFormationBounds";

/**
 * One independently regenerable range of a general instance set.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieInstanceChunk` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieInstanceChunk` for the asset spec generation provider choice system contract.
 */
export interface IAutoMovieInstanceChunk {
  /**
   * Zero-based stable chunk index.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `index` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `index` for the asset spec generation provider choice system contract.
   */
  index: number;

  /**
   * Inclusive first slot.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `start` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `start` for the asset spec generation provider choice system contract.
   */
  start: number;

  /**
   * Number of slots in this chunk.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `count` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `count` for the asset spec generation provider choice system contract.
   */
  count: number;

  /**
   * Exact world-space range bounds.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `bounds` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `bounds` for the asset spec generation provider choice system contract.
   */
  bounds: IAutoMovieFormationBounds;

  /**
   * Exact arithmetic centroid of the range.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `centroid` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `centroid` for the asset spec generation provider choice system contract.
   */
  centroid: IAutoMovieVector3;
}
