import type { IAutoMovieCompiledShotSource } from "../production/IAutoMovieCompiledShotSource.js";
import type { IAutoMovieRenderTargetSettings } from "./IAutoMovieRenderTargetSettings.js";

/**
 * Compiled-shot appearance and host raster settings for a target identity.
 * `AutoMovieRenderBudgetPreflight.targetSettingsOfShot` reads authored tone
 * mapping when present and uses delivery otherwise; dimensions and pixelRatio
 * are caller-provided drawing-buffer facts, not browser observations made by
 * this helper.
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
