import { assertProductionContractLayout } from "../../../internal/assertProductionContractLayout";
import { resolveSkillsDirectory } from "../../../internal/resolveSkillsDirectory";
import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { constructionStage } from "../constructionStage";
import { productionLayers } from "../productionLayers";

/*
 * Checks supported narrative routes and stage option shapes before graph
 * creation.
 */
export function assertProductionEvidenceSources(
  props: IProductionConfigProps,
): void {
  if (!["long", "short", "asset"].includes(props.mode))
    throw new Error("Unknown production route.");

  // A relative shared tree or a production still keeping its own contracts
  // in the retired skills location is refused before any contract is probed.
  resolveSkillsDirectory(props);
  assertProductionContractLayout(props.location);

  const routed: readonly AuthoredLayer[] = productionLayers(props);
  for (const layer of AUTHORED_LAYERS) {
    if (routed.includes(layer)) continue;
    if (constructionStage(props, layer) !== "disabled")
      throw new Error(
        "Layers outside the production route must stay disabled.",
      );
  }
  if (props.mode !== "long" && props.construction.index === "evidence")
    throw new Error("Only long productions author a settings outline.");
  if (props.mode === "asset" && (props.claims?.length ?? 0) > 0)
    throw new Error(
      "Asset productions use supportClaims rather than narrative claims.",
    );
  if (
    props.construction.index !== undefined &&
    props.construction.index !== "disabled" &&
    props.construction.index !== "evidence"
  )
    throw new Error("Unknown outline stage.");
  for (const layer of AUTHORED_LAYERS) {
    const stage: unknown = constructionStage(props, layer);
    if (stage !== "disabled" && stage !== "evidence")
      throw new Error("Unknown stage: a layer is disabled or evidence.");
  }
}
