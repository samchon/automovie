import type {
  IEvidenceCheckAnalysis,
  IEvidenceConfig,
} from "@wrtnlabs/evidence";

import type { ProductionPathCapture } from "./ProductionPathCapture";

/**
 * Binds immutable path provenance to its exact factory config and native analysis.
 *
 * @evidence contracts/common.md#principled-implementation A weak map binds one evaluated native analysis to its exact original config and captured physical paths; lookups reject absent provenance and a different config identity.
 * @evidence contracts/common.md#clear-and-simple-design This static registry is the boundary between effectful capture/evaluation and pure later classification, avoiding mutable provenance fields on native analysis objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raw native analysis, equal-looking clone or later live filesystem walk is accepted as a replacement for evaluator registration.
 * @evidence contracts/common.md#meaningful-documentation The class and method comments explain weak lifetime, evaluator-only binding and rejection of unbound analyses.
 * @evidence contracts/performance.md#efficient-algorithms Bind/get use expected constant-time weak identity lookup; capture construction and saved metadata size belong to ProductionPathCapture and analyzeProductionPass.
 * @evidence contracts/performance.md#reuse-equivalent-work The same saved path object is reused for every classification of its analysis and exact config; a new evaluation has a different native analysis key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The registry does not extend analysis-key lifetime; each live analysis entry strongly references its config and saved metadata, with no fixed population bound or owned handle/task.
 */
export class ProductionAnalysisCapture {
  /** Weak ownership does not extend a native analysis or configuration lifetime. */
  private static readonly captures: WeakMap<
    IEvidenceCheckAnalysis,
    {
      config: IEvidenceConfig;
      paths: ProductionPathCapture;
    }
  > = new WeakMap();

  /**
   * Called only by the evaluator after its before/after topology capture agrees.
   *
   * @evidence contracts/common.md#principled-implementation The already evaluated analysis key receives its original config and path capture only after evaluator before/after topology agreement.
   * @evidence contracts/common.md#clear-and-simple-design This method records provenance without modifying the native report or graph.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller-owned evaluation boundary establishes admissibility; the method adds no inferred alias or label-based fallback.
   * @evidence contracts/common.md#meaningful-documentation The comment states evaluator-only post-agreement registration and the class documents its weak-key ownership.
   * @evidence contracts/performance.md#efficient-algorithms One weak-map set and a fixed-size wrapper allocation take expected constant time; stored path metadata is supplied rather than rebuilt.
   * @evidence contracts/performance.md#reuse-equivalent-work Subsequent lookups reuse the identical path object and config under the exact native analysis key.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The weak entry owns the wrapper and supplied references while the analysis key remains live; this method owns no independent handle or task.
   */
  public static bind(
    config: IEvidenceConfig,
    analysis: IEvidenceCheckAnalysis,
    paths: ProductionPathCapture,
  ): void {
    this.captures.set(analysis, { config, paths });
  }

  /**
   * Rejects unbound native analyses rather than supplementing them from live files.
   *
   * @evidence contracts/common.md#principled-implementation A weak lookup checks both the exact evaluated analysis and original config identity before returning saved path metadata.
   * @evidence contracts/common.md#clear-and-simple-design The single accessor makes snapshot provenance mandatory for all consumers rather than adding live recovery branches.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unbound analysis or different config throws; no equivalent JSON, ID decoding or live capture compensates for missing provenance.
   * @evidence contracts/common.md#meaningful-documentation The comment and error state the original-config/analyzeProductionPass capture requirement.
   * @evidence contracts/performance.md#efficient-algorithms One weak-map lookup and strict object comparison take expected constant time with no path traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work The returned capture is the same evaluator-owned object shared among classifications of the same analysis/config pair.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Lookup retains no new state or external resource; returned capture lifetime follows the existing weak registry entry and any caller reference.
   */
  public static get(
    config: IEvidenceConfig,
    analysis: IEvidenceCheckAnalysis,
  ): ProductionPathCapture {
    const capture:
      | { config: IEvidenceConfig; paths: ProductionPathCapture }
      | undefined = this.captures.get(analysis);
    if (capture === undefined || capture.config !== config)
      throw new Error(
        "Pass validation requires the original config and analysis captured by analyzeProductionPass.",
      );
    return capture.paths;
  }
}
