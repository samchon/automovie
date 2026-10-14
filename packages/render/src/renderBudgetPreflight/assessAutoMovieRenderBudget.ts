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
 * @evidence contracts/common.md#principled-implementation A compiled-shot subject supplies both inventory and semantic ownership; settings and renderer are sealed into the target, and only required texture assets contribute to its upload identity. Missing graphics identity produces not-run rather than an invented renderer.
 * @evidence contracts/common.md#clear-and-simple-design The preflight composes engine subject, mask, inventory, target and budget operations without duplicating their validators; the shot-specific wrapper adds context while preserving the original cause.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No renderer is fabricated and contradictory engine inputs are rethrown with their cause; the same compiled artifact feeds both owner attribution and cost measurement.
 * @evidence contracts/common.md#meaningful-documentation The comment explains attributable target identity, and input members name compiled ownership, limits, decoded texture facts and context residency; nullable assessment fields distinguish no report from incomplete analysis.
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
    const subject: ReturnType<typeof autoMovieRenderSubjectOfCompiledShot> = autoMovieRenderSubjectOfCompiledShot({
      compiled: props.compiled,
      textures: props.textures,
      textureResidency: props.textureResidency,
    });
    const mask: ReturnType<typeof deriveAutoMovieSemanticMask> = deriveAutoMovieSemanticMask(subject);
    const targetBase: ReturnType<typeof sealAutoMovieRenderTarget> = sealAutoMovieRenderTarget({
      renderer: props.renderer,
      settings: props.settings,
      assets: props.assets,
    });
    const inventory: ReturnType<typeof measureAutoMovieRenderInventory> = measureAutoMovieRenderInventory({ subject, mask, settings: targetBase.settings });
    const required: Set<string> = new Set(inventory.textures.flatMap((row: (typeof inventory.textures)[number]): string[] => row.assets ?? (row.asset === null ? [] : [row.asset])));
    const target: ReturnType<typeof sealAutoMovieRenderTarget> = sealAutoMovieRenderTarget({ renderer: props.renderer, settings: targetBase.settings,
      assets: props.assets, textureDigest: autoMovieRenderTextureDigest(
        (props.textures ?? []).filter((source: IAutoMovieRenderTextureSource): boolean => required.has(source.asset)), props.textureResidency,
      ),
    });
    const report: ReturnType<typeof evaluateAutoMovieRenderBudget> = evaluateAutoMovieRenderBudget({
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
