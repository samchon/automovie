import type {
  IAutoMovieRenderTextureResidency,
  IAutoMovieRenderTextureSource,
} from "../index.js";
import type { IAutoMovieCompiledShotSource } from "../production/IAutoMovieCompiledShotSource.js";
import type { IAutoMovieRenderBudget } from "./IAutoMovieRenderBudget.js";
import type { IAutoMovieRenderTargetAsset } from "./IAutoMovieRenderTargetAsset.js";
import type { IAutoMovieRenderTargetRenderer } from "./IAutoMovieRenderTargetRenderer.js";
import type { IAutoMovieRenderTargetSettings } from "./IAutoMovieRenderTargetSettings.js";

/**
 * Compiled-shot cost inputs and caller-observed graphics/texture facts. assessAutoMovieRenderBudget returns not-run without renderer identity; otherwise it measures and seals a target under the supplied settings and budget. Absent textures/residency remain unmeasured rather than fabricated zero costs.
 *
 * @evidence contracts/development/design.md#principled-representation Absent textures/residency remain unmeasured rather than fabricated zero costs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface assessAutoMovieRenderBudget exchanges compiled, shot, budget, renderer, settings, assets, textures, textureResidency; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent textures/residency remain unmeasured rather than fabricated zero costs.
 * @evidence contracts/development/common.md#meaningful-documentation Compiled-shot cost inputs and caller-observed graphics/texture facts. assessAutoMovieRenderBudget returns not-run without renderer identity; otherwise it measures and seals a target under the supplied settings and budget. The prose and members document how assessAutoMovieRenderBudget interprets and admits these values.
 */
export interface IAutoMovieAssessRenderBudgetProps {
  /** Fully builder-owned shot artifact. */
  compiled: IAutoMovieCompiledShotSource;
  /** Shot id the artifact belongs to. */
  shot: string;
  /** Explicit limits selected by the caller, or null to evaluate without a declared budget. */
  budget: IAutoMovieRenderBudget | null;
  /** Caller-supplied graphics identity, or null when no such observation is supplied. */
  renderer: IAutoMovieRenderTargetRenderer | null;
  /** Intended target settings supplied for measurement and sealing. */
  settings: IAutoMovieRenderTargetSettings;
  /** Caller-supplied asset identity records for the intended target. */
  assets: readonly IAutoMovieRenderTargetAsset[];
  /** Supplied decoded upload and sharing observations; the caller owns their acquisition and truth. */
  textures?: readonly IAutoMovieRenderTextureSource[];
  /** Supplied context/other-shot residency observations; this helper acquires no capture host. */
  textureResidency?: IAutoMovieRenderTextureResidency;
}
