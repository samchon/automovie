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
import { productionLayers } from "./internal/productionLayers";
import { validationOwner } from "./internal/validationOwner";

/** Evaluates the original full active graph once through the public evidence API. */
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
  const analysis: IEvidenceCheckAnalysis = await EvidenceChecker.evaluate(plan);
  validationOwner(config);
  return classifyProductionPassDiagnostics(config, key, analysis);
}
