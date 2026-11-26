import { AutoMovieEngineRenderSubject, AutoMovieEngineRenderTexture, AutoMovieEngineRenderSemanticMask, AutoMovieEngineRenderTarget, AutoMovieEngineRenderMeasure } from "@automovie/engine";
import type {
  IAutoMovieAssessRenderBudgetProps,
  IAutoMovieRenderBudgetAssessment,
  IAutoMovieRenderTextureSource,
} from "@automovie/interface";

/**
 * Measure one caller-supplied compiled shot against an explicitly supplied
 * budget, renderer identity, settings, assets, decoded texture/residency facts
 * and, for a directly rendered film, its most demanding optics and shading,
 * whose film stage targets join the texture totals. The subject feeds both mask
 * ownership and inventory measurement; the sealed target names those supplied
 * inputs rather than proving that a renderer drew a frame.
 *
 * A null renderer produces not-run without inventing graphics identity. The
 * helper performs no draw, capture-host acquisition or texture allocation, and
 * the caller owns the provenance of its observation records.
 *
 * Maintained callers are tests and the internal budget-helper chain.
 * ProductionDesign.renderBudgets has no current execution reader wiring this
 * assessment into an automatic render-job gate; accepting an explicit budget
 * here does not establish that integration.
 */
export const assessAutoMovieRenderBudget: (
  props: IAutoMovieAssessRenderBudgetProps,
) => IAutoMovieRenderBudgetAssessment = (
  props: IAutoMovieAssessRenderBudgetProps,
): IAutoMovieRenderBudgetAssessment => {
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
    // The film's settings are a draw-scene fact no compiled shot carries, so
    // they join the subject here, where the inventory reads them.
    const subject: ReturnType<typeof AutoMovieEngineRenderSubject.autoMovieRenderSubjectOfCompiledShot> = {
      ...AutoMovieEngineRenderSubject.autoMovieRenderSubjectOfCompiledShot({
        compiled: props.compiled,
        textures: props.textures,
        textureResidency: props.textureResidency,
      }),
      ...(props.film === undefined ? {} : { film: props.film }),
    };
    const mask: ReturnType<typeof AutoMovieEngineRenderSemanticMask.deriveAutoMovieSemanticMask> =
      AutoMovieEngineRenderSemanticMask.deriveAutoMovieSemanticMask(subject);
    const targetBase: ReturnType<typeof AutoMovieEngineRenderTarget.sealAutoMovieRenderTarget> =
      AutoMovieEngineRenderTarget.sealAutoMovieRenderTarget({
        renderer: props.renderer,
        settings: props.settings,
        assets: props.assets,
      });
    const inventory: ReturnType<typeof AutoMovieEngineRenderMeasure.measureAutoMovieRenderInventory> =
      AutoMovieEngineRenderMeasure.measureAutoMovieRenderInventory({
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
    const target: ReturnType<typeof AutoMovieEngineRenderTarget.sealAutoMovieRenderTarget> =
      AutoMovieEngineRenderTarget.sealAutoMovieRenderTarget({
        renderer: props.renderer,
        settings: targetBase.settings,
        assets: props.assets,
        textureDigest: AutoMovieEngineRenderTexture.autoMovieRenderTextureDigest(
          (props.textures ?? []).filter(
            (source: IAutoMovieRenderTextureSource): boolean =>
              required.has(source.asset),
          ),
          props.textureResidency,
        ),
      });
    const report: ReturnType<typeof AutoMovieEngineRenderTarget.evaluateAutoMovieRenderBudget> =
      AutoMovieEngineRenderTarget.evaluateAutoMovieRenderBudget({
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
