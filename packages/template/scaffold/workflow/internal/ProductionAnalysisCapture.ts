import type {
  IEvidenceCheckAnalysis,
  IEvidenceConfig,
} from "@wrtnlabs/evidence";

import type { ProductionPathCapture } from "./ProductionPathCapture";

/** Binds immutable path provenance to its exact factory config and native analysis. */
export class ProductionAnalysisCapture {
  /** Weak ownership does not extend a native analysis or configuration lifetime. */
  private static readonly captures: WeakMap<
    IEvidenceCheckAnalysis,
    {
      config: IEvidenceConfig;
      paths: ProductionPathCapture;
    }
  > = new WeakMap();

  /** Called only by the evaluator after its before/after topology capture agrees. */
  public static bind(
    config: IEvidenceConfig,
    analysis: IEvidenceCheckAnalysis,
    paths: ProductionPathCapture,
  ): void {
    this.captures.set(analysis, { config, paths });
  }

  /** Rejects unbound native analyses rather than supplementing them from live files. */
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
