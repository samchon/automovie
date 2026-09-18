import { IAutoMovieProductionDeliverable } from "./IAutoMovieProductionDeliverable";
import { IAutoMovieProductionDeliverableFile } from "./IAutoMovieProductionDeliverableFile";
import { IAutoMovieProductionRenditionDelivery } from "./IAutoMovieProductionRenditionDelivery";

/**
 * One materialized production deliverable in the aggregate render ledger.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `IAutoMovieProductionRenderedDeliverable` as the portable data boundary for the rendering lowering ownership requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `IAutoMovieProductionRenderedDeliverable` for the spec render state isolation system contract.
 */
export interface IAutoMovieProductionRenderedDeliverable {
  /**
   * Exact id declared by production design.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `id` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `id` for the spec render state isolation system contract.
   */
  id: string;
  /**
   * Exact kind declared by production design.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `kind` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `kind` for the spec render state isolation system contract.
   */
  kind: IAutoMovieProductionDeliverable["kind"];
  /**
   * Byte-exact owned output files.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `files` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `files` for the spec render state isolation system contract.
   */
  files: IAutoMovieProductionDeliverableFile[];
  /**
   * Timeline duration, or null for a still-only deliverable.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `runtimeSeconds` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `runtimeSeconds` for the spec render state isolation system contract.
   */
  runtimeSeconds: number | null;
  /**
   * Rendered frame count, or null when the kind has no video frame clock.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `frameCount` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `frameCount` for the spec render state isolation system contract.
   */
  frameCount: number | null;
  /**
   * Actual codec name, or null for unencoded text/image artifacts.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `codec` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `codec` for the spec render state isolation system contract.
   */
  codec: string | null;
  /**
   * Repaint provenance when this feature was conformed from selected visual
   * renditions. Absent for deterministic delivery and non-feature outputs.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `rendition` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `rendition` for the spec render state isolation system contract.
   */
  rendition?: IAutoMovieProductionRenditionDelivery;
}
