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
