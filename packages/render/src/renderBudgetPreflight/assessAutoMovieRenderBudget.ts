import { type IAutoMovieRenderTextureResidency, IAutoMovieRenderTextureSource, autoMovieRenderTextureDigest, autoMovieRenderSubjectOfCompiledShot, deriveAutoMovieSemanticMask, evaluateAutoMovieRenderBudget, measureAutoMovieRenderInventory, sealAutoMovieRenderTarget } from "@automovie/engine";
import { IAutoMovieCompiledShotSource, IAutoMovieRenderBudget, IAutoMovieRenderTargetAsset, IAutoMovieRenderTargetRenderer, IAutoMovieRenderTargetSettings } from "@automovie/interface";
import { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment";


/**
 * Measure one compiled shot and check it against the budget a render job
 * targets.
 *
 * The whole chain in one place, because every link has to read the same
 * artifact: the subject feeds both the mask and the inventory, so a colour in
 * the mask and a cost in the report name one owner, and the sealed target binds
 * the verdict to the renderer that produced it.
 *
 * A job with no renderer identity produces `not-run` and says so. That is the
 * honest outcome and the only safe one: a budget verdict is a claim about a
 * specific renderer drawing specific bytes, so a report measured against an
 * invented target would be a stale report nothing could detect.
 *
 * @evidence requirements/rendering/budgets.md#rendering-budget-decision `assessAutoMovieRenderBudget` carries the conservative measurement basis and deterministic budget decision.
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Measures the lowered render inventory, including expanded geometry and resident resource costs, before evaluating its limits.
 * @evidence requirements/rendering/budgets.md#rendering-expansion-bounds Measures the materialized subject inventory so bounded instances and procedural expansion are charged to the report.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-canonical-fingerprint Seals the renderer, settings, protocol revision, and ordered dependency fields into the target returned with the assessment.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Binds every caller-declared frame dependency path and exact byte digest into the assessed render target.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `assessAutoMovieRenderBudget` exposes that responsibility through the package-independent system contract.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-target-dependency-fingerprint Canonicalizes the declared render-content dependencies through the versioned target sealer before publishing the budget verdict.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-target-fingerprint-protocol Returns the target whose digest includes the protocol revision and canonical ordered field encoding.
 * @author Samchon
 */
export const assessAutoMovieRenderBudget = (props: {
  /** Fully builder-owned shot artifact. */
  compiled: IAutoMovieCompiledShotSource;
  /** Shot id the artifact belongs to. */
  shot: string;
  /** Limits the job targets, or `null` for a production declaring none. */
  budget: IAutoMovieRenderBudget | null;
  /** Renderer identity, or `null` when the host reported none. */
  renderer: IAutoMovieRenderTargetRenderer | null;
  /** Settings the frame is drawn under. */
  settings: IAutoMovieRenderTargetSettings;
  /** Bytes the drawn frame depends on. */
  assets: readonly IAutoMovieRenderTargetAsset[];
  /** Actual host-decoded upload and sharing facts for required source assets. */
  textures?: readonly IAutoMovieRenderTextureSource[];
  /** Other live shots and context-retained storage supplied by the capture host. */
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
    const subject = autoMovieRenderSubjectOfCompiledShot({
      compiled: props.compiled,
      textures: props.textures,
      textureResidency: props.textureResidency,
    });
    const mask = deriveAutoMovieSemanticMask(subject);
    const targetBase = sealAutoMovieRenderTarget({
      renderer: props.renderer,
      settings: props.settings,
      assets: props.assets,
    });
    const inventory = measureAutoMovieRenderInventory({ subject, mask, settings: targetBase.settings });
    const required = new Set(inventory.textures.flatMap((row) => row.assets ?? (row.asset === null ? [] : [row.asset])));
    const target = sealAutoMovieRenderTarget({ renderer: props.renderer, settings: targetBase.settings,
      assets: props.assets, textureDigest: autoMovieRenderTextureDigest(
        (props.textures ?? []).filter((source) => required.has(source.asset)), props.textureResidency,
      ),
    });
    const report = evaluateAutoMovieRenderBudget({
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
    // Every refusal below this line names a contradiction in the artifact -- two
    // claimants of one semantic id, a node citing a model the shot does not
    // carry, a setting that cannot be sealed -- and none of them names the shot,
    // because none of them knows it. A film of a hundred shots is where that
    // costs an hour, so the shot is added here and the original is preserved as
    // the cause rather than replaced by a summary of it.
    // `String(error)` rather than a narrowing on `Error`: everything thrown
    // below this line comes from the engine and is an `Error`, so the other arm
    // would be a branch no input can reach and no test could honestly cover.
    throw new Error(
      `render budget preflight could not measure shot "${props.shot}": ${String(error)}`,
      { cause: error },
    );
  }
};
