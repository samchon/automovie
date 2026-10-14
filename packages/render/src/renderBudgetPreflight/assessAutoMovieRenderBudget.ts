import {
  type IAutoMovieRenderTextureResidency,
  IAutoMovieRenderTextureSource,
  autoMovieRenderSubjectOfCompiledShot,
  autoMovieRenderTextureDigest,
  deriveAutoMovieSemanticMask,
  evaluateAutoMovieRenderBudget,
  measureAutoMovieRenderInventory,
  sealAutoMovieRenderTarget,
} from "@automovie/engine";
import {
  IAutoMovieCompiledShotSource,
  IAutoMovieRenderBudget,
  IAutoMovieRenderTargetAsset,
  IAutoMovieRenderTargetRenderer,
  IAutoMovieRenderTargetSettings,
} from "@automovie/interface";

import { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment";

/**
 * Measure one caller-supplied compiled shot against an explicitly supplied budget, renderer identity, settings, assets and decoded texture/residency facts. The subject feeds both mask ownership and inventory measurement; the sealed target names those supplied inputs rather than proving that a renderer drew a frame.
 *
 * A null renderer produces not-run without inventing graphics identity. The helper performs no draw, capture-host acquisition or texture allocation, and the caller owns the provenance of its observation records.
 *
 * Maintained callers are tests and the internal budget-helper chain. ProductionDesign.renderBudgets has no current execution reader wiring this assessment into an automatic render-job gate; accepting an explicit budget here does not establish that integration.
 *
 * @evidence contracts/common.md#principled-implementation A compiled-shot subject supplies both inventory and semantic ownership; settings and renderer are sealed into the target, and only required texture assets contribute to its upload identity. Missing graphics identity produces not-run rather than an invented renderer.
 * @evidence contracts/common.md#clear-and-simple-design The preflight composes engine subject, mask, inventory, target and budget operations without duplicating validators. Its shot-specific wrapper normally retains the thrown cause, but String(error) can itself throw for an uninspectable thrown object before that wrapper is constructed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No renderer is fabricated and the same compiled artifact feeds ownership and measurement. The catch still assumes diagnostic string conversion succeeds; a failed coercion can replace the intended context/cause wrapper and remains an unresolved failure-path limitation.
 * @evidence contracts/common.md#meaningful-documentation Documents explicit input ownership, supplied target identity, not-run versus incomplete analysis and the current internal/test-only caller boundary; it claims neither an observed draw nor automatic ProductionDesign.renderBudgets execution.
 * @evidence contracts/performance.md#efficient-algorithms Cost is the delegated inventory and mask traversal plus a linear filter over texture sources; the target is sealed twice because measured required assets are needed to compute its final texture digest.
 * @evidence contracts/performance.md#reuse-equivalent-work One subject and mask serve both inventory measurement and budget attribution; all sharing is confined to this artifact and the supplied renderer, settings, assets and residency facts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The assessment retains the inventory, mask, report and sealed target until its caller discards them; it neither acquires the renderer nor owns texture allocation or host tasks.
 */
export const assessAutoMovieRenderBudget: (props: {
  compiled: IAutoMovieCompiledShotSource;
  shot: string;
  budget: IAutoMovieRenderBudget | null;
  renderer: IAutoMovieRenderTargetRenderer | null;
  settings: IAutoMovieRenderTargetSettings;
  assets: readonly IAutoMovieRenderTargetAsset[];
  textures?: readonly IAutoMovieRenderTextureSource[];
  textureResidency?: IAutoMovieRenderTextureResidency;
}) => IAutoMovieRenderBudgetAssessment = (props: {
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
}): IAutoMovieRenderBudgetAssessment => {
  if (props.renderer === null)
    return {
      shot: props.shot,
      status: "not-run",
      reason:
        "the capture host reported no graphics identity, so no render target could be sealed and no budget verdict is attributable to a renderer",
      report: null,
      inventory: null,
      mask: null,
      target: null,
    };
  try {
    const subject: ReturnType<typeof autoMovieRenderSubjectOfCompiledShot> =
      autoMovieRenderSubjectOfCompiledShot({
        compiled: props.compiled,
        textures: props.textures,
        textureResidency: props.textureResidency,
      });
    const mask: ReturnType<typeof deriveAutoMovieSemanticMask> =
      deriveAutoMovieSemanticMask(subject);
    const targetBase: ReturnType<typeof sealAutoMovieRenderTarget> =
      sealAutoMovieRenderTarget({
        renderer: props.renderer,
        settings: props.settings,
        assets: props.assets,
      });
    const inventory: ReturnType<typeof measureAutoMovieRenderInventory> =
      measureAutoMovieRenderInventory({
        subject,
        mask,
        settings: targetBase.settings,
      });
    const required: Set<string> = new Set(
      inventory.textures.flatMap(
        (row: (typeof inventory.textures)[number]): string[] =>
          row.assets ?? (row.asset === null ? [] : [row.asset]),
      ),
    );
    const target: ReturnType<typeof sealAutoMovieRenderTarget> =
      sealAutoMovieRenderTarget({
        renderer: props.renderer,
        settings: targetBase.settings,
        assets: props.assets,
        textureDigest: autoMovieRenderTextureDigest(
          (props.textures ?? []).filter(
            (source: IAutoMovieRenderTextureSource): boolean =>
              required.has(source.asset),
          ),
          props.textureResidency,
        ),
      });
    const report: ReturnType<typeof evaluateAutoMovieRenderBudget> =
      evaluateAutoMovieRenderBudget({
        inventory,
        budget: props.budget,
        mask,
        target,
      });
    return {
      shot: props.shot,
      status: report.status,
      reason: null,
      report,
      inventory,
      mask,
      target,
    };
  } catch (error) {
    // Add the caller's shot id to engine validation context and retain the original thrown value as the cause; String(error) contributes only the diagnostic representation.
    throw new Error(
      `render budget preflight could not measure shot "${props.shot}": ${String(error)}`,
      { cause: error },
    );
  }
};
