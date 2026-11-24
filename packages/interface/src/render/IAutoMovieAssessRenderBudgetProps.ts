import type {
  IAutoMovieRenderTextureResidency,
  IAutoMovieRenderTextureSource,
} from "../index.js";
import type { IAutoMovieCompiledShotSource } from "../production/IAutoMovieCompiledShotSource.js";
import type { IAutoMovieRenderBudget } from "./IAutoMovieRenderBudget.js";
import type { IAutoMovieRenderFilm } from "./IAutoMovieRenderFilm.js";
import type { IAutoMovieRenderTargetAsset } from "./IAutoMovieRenderTargetAsset.js";
import type { IAutoMovieRenderTargetRenderer } from "./IAutoMovieRenderTargetRenderer.js";
import type { IAutoMovieRenderTargetSettings } from "./IAutoMovieRenderTargetSettings.js";

/**
 * Compiled-shot cost inputs and caller-observed graphics/texture facts.
 * assessAutoMovieRenderBudget returns not-run without renderer identity;
 * otherwise it measures and seals a target under the supplied settings and
 * budget. Absent textures/residency remain unmeasured rather than fabricated
 * zero costs.
 */
export interface IAutoMovieAssessRenderBudgetProps {
  /** Fully builder-owned shot artifact. */
  compiled: IAutoMovieCompiledShotSource;
  /** Shot id the artifact belongs to. */
  shot: string;
  /**
   * Explicit limits selected by the caller, or null to evaluate without a
   * declared budget.
   */
  budget: IAutoMovieRenderBudget | null;
  /**
   * Caller-supplied graphics identity, or null when no such observation is
   * supplied.
   */
  renderer: IAutoMovieRenderTargetRenderer | null;
  /** Intended target settings supplied for measurement and sealing. */
  settings: IAutoMovieRenderTargetSettings;
  /** Caller-supplied asset identity records for the intended target. */
  assets: readonly IAutoMovieRenderTargetAsset[];
  /**
   * Supplied decoded upload and sharing observations; the caller owns their
   * acquisition and truth.
   */
  textures?: readonly IAutoMovieRenderTextureSource[];
  /**
   * Supplied context/other-shot residency observations; this helper acquires no
   * capture host.
   */
  textureResidency?: IAutoMovieRenderTextureResidency;
  /**
   * The film's optics and shading at its most demanding second, whose film
   * stage targets are measured at `settings`' raster; absent for a shot drawn
   * without optics.
   */
  film?: IAutoMovieRenderFilm;
}
