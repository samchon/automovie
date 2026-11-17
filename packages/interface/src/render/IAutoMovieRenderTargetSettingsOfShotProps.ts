import type { IAutoMovieCompiledShotSource } from "../production/IAutoMovieCompiledShotSource.js";
import type { IAutoMovieRenderTargetSettings } from "./IAutoMovieRenderTargetSettings.js";

/**
 * Compiled-shot appearance and host raster settings for a target identity. autoMovieRenderTargetSettingsOfShot reads authored tone mapping when present and uses delivery otherwise; dimensions and pixelRatio are caller-provided drawing-buffer facts, not browser observations made by this helper.
 *
 * @evidence contracts/development/design.md#principled-representation Compiled-shot appearance and host raster settings for a target identity. autoMovieRenderTargetSettingsOfShot reads authored tone mapping when present and uses delivery otherwise; dimensions and pixelRatio are caller-provided drawing-buffer facts, not browser observations made by this helper.
 * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieRenderTargetSettingsOfShot exchanges compiled, width, height, pixelRatio, delivery; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Compiled-shot appearance and host raster settings for a target identity. autoMovieRenderTargetSettingsOfShot reads authored tone mapping when present and uses delivery otherwise; dimensions and pixelRatio are caller-provided drawing-buffer facts, not browser observations made by this helper.
 * @evidence contracts/development/common.md#meaningful-documentation Compiled-shot appearance and host raster settings for a target identity. autoMovieRenderTargetSettingsOfShot reads authored tone mapping when present and uses delivery otherwise; dimensions and pixelRatio are caller-provided drawing-buffer facts, not browser observations made by this helper. The prose and members document how autoMovieRenderTargetSettingsOfShot interprets and admits these values.
 */
export interface IAutoMovieRenderTargetSettingsOfShotProps {
  /** Fully builder-owned shot artifact. */
  compiled: IAutoMovieCompiledShotSource;
  /** Drawing-buffer width in pixels. */
  width: number;
  /** Drawing-buffer height in pixels. */
  height: number;
  /** Device pixel ratio the capture host pins. */
  pixelRatio: number;
  /** The delivery's own tone mapping, for a scene that declares none. */
  delivery: IAutoMovieRenderTargetSettings["toneMapping"];
}
