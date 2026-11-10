import { assertProductionContractLayout } from "../../../internal/assertProductionContractLayout";
import { resolveSkillsDirectory } from "../../../internal/resolveSkillsDirectory";
import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { constructionStage } from "../constructionStage";
import { hasNaturalness } from "../hasNaturalness";
import { productionLayers } from "../productionLayers";

/**
 * Checks supported narrative routes and stage option shapes before graph creation.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Routes admit only their authored layers, long work alone admits an outline, each supported stage is disabled or evidence, resolveSkillsDirectory refuses a relative shared skills tree, and assertProductionContractLayout refuses production-owned contracts left in the retired skills location, both before any contract is probed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A single shape check precedes graph expansion; native Evidence owns claim and reference evaluation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same route and stage vocabulary applies to every production; it does not inspect graph results or confer approval.
 * @evidence contracts/development/common.md#meaningful-documentation Errors identify unsupported routes, layers, outline choices, stage values, a relative skills tree and each legacy contract directory with its new home.
 * @evidence contracts/development/implementation.md#efficient-algorithms The closed five-layer vocabulary bounds validation to constant time and storage, plus two directory existence probes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed vocabularies are reused within one call; there is no expensive computation or cross-call cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only local scalar values and the route array are allocated; the synchronous probes acquire no retained file handle or task.
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
    if (
      constructionStage(props, layer) !== "disabled" ||
      (hasNaturalness(layer) && props.naturalness.screenplay !== "disabled")
    )
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
  for (const layer of AUTHORED_LAYERS)
    for (const pass of ["construction", "naturalness"] as const) {
      if (pass === "naturalness" && !hasNaturalness(layer)) continue;
      const stage: unknown =
        pass === "construction"
          ? constructionStage(props, layer)
          : props.naturalness.screenplay;
      if (stage !== "disabled" && stage !== "evidence")
        throw new Error("Unknown stage: a layer is disabled or evidence.");
    }
  if ("scripts" in props.naturalness)
    throw new Error(
      "Scripts finish in construction; remove naturalness.scripts.",
    );
  if (
    "settings" in props.naturalness ||
    "brief" in props.naturalness ||
    "treatments" in props.naturalness
  )
    throw new Error("Settings, brief and treatments finish in construction.");
}
