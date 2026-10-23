import {
  EvidenceChecker,
  type IEvidenceCheckAnalysis,
  type IEvidenceConfig,
  type IEvidenceConfigPlan,
  createEvidenceConfigPlan,
} from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "./IProductionClaimOwner";
import type { IProductionConfigProps } from "./IProductionConfigProps";
import type { IProductionGateKey } from "./IProductionGateKey";
import type { IProductionPassValidation } from "./IProductionPassValidation";
import { classifyProductionPassDiagnostics } from "./classifyProductionPassDiagnostics";
import { ProductionAnalysisCapture } from "./internal/ProductionAnalysisCapture";
import { ProductionPathCapture } from "./internal/ProductionPathCapture";
import { productionLayers } from "./internal/productionLayers";
import { validationOwner } from "./internal/validationOwner";

/**
 * Evaluates the full native graph and binds its path snapshot for classification.
 *
 * Reuse the returned analysis with this exact config. Raw Evidence evaluations
 * lack this provenance and are rejected by pass classification. A topology
 * change during evaluation requires a fresh capture; no report is rewritten.
 *
 * @evidence contracts/common.md#principled-implementation Native Evidence evaluation is bracketed by physical-path captures and admitted only when their signatures agree; the original config and resulting analysis are bound together before classification, so later scope decisions use captured aliases rather than the live filesystem.
 * @evidence contracts/common.md#clear-and-simple-design The evaluator owns effectful capture and evaluation, while classification is delegated to the pure snapshot consumer; the native report is returned intact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Topology changes and unowned routes throw instead of retrying or rewriting diagnostics; the evidence lifecycle uses no fixture names or foreign method replacement.
 * @evidence contracts/common.md#meaningful-documentation The prose states original-config provenance, raw-analysis rejection, concurrent topology failure and preservation of native reports.
 * @evidence contracts/performance.md#efficient-algorithms Two captures traverse protected entries when support claims exist, resolve selector prefixes and sort alias/version tables; native evaluation scans selected inputs, then classification joins their graphs. Time and memory grow with captured paths, bytes, claims, references and graph edges; no fixed workload bound is imposed.
 * @evidence contracts/performance.md#reuse-equivalent-work The completed native analysis and its saved aliases are shared across later classifications through weak identity binding. Each call evaluates anew because current bytes and filesystem topology can change and an equal config alone cannot establish equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This call awaits one native evaluation and retains before/after metadata until classification returns; thrown failures discard local state. The weak capture registry retains metadata only while its analysis key remains live; native evaluator handle ownership remains with EvidenceChecker.
 */
export async function analyzeProductionPass(
  config: IEvidenceConfig,
  configFile: string,
  key: IProductionGateKey,
): Promise<IProductionPassValidation> {
  const {
    props,
  }: { props: IProductionConfigProps; owners: IProductionClaimOwner[] } =
    validationOwner(config);
  if (!productionLayers(props).includes(key.layer))
    throw new Error("The production route does not author this layer.");
  const plan: IEvidenceConfigPlan = createEvidenceConfigPlan(
    config,
    configFile,
  );
  const protectSupport: boolean = (props.supportClaims?.length ?? 0) > 0;
  const before: ProductionPathCapture = new ProductionPathCapture(
    props.location,
    plan,
    protectSupport,
  );
  const analysis: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(plan);
  const captured: ProductionPathCapture = new ProductionPathCapture(
    props.location,
    plan,
    protectSupport,
    analysis,
  );
  if (before.signature !== captured.signature)
    throw new Error(
      "Production path topology changed during evaluation; capture a fresh analysis.",
    );
  validationOwner(config);
  ProductionAnalysisCapture.bind(config, analysis, captured);
  return classifyProductionPassDiagnostics(config, key, analysis);
}
