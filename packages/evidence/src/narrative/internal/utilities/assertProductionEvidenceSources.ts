import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { hasNaturalness } from "../hasNaturalness";
import { productionLayers } from "../productionLayers";

/**
 * Checks supported narrative routes and stage option shapes before graph creation.
 *
 * @evidence contracts/common.md#principled-implementation Routes admit only their authored layers, long work alone admits an outline, and each supported stage is disabled or evidence.
 * @evidence contracts/common.md#clear-and-simple-design A single shape check precedes graph expansion; native Evidence owns claim and reference evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same route and stage vocabulary applies to every production; it does not inspect graph results or confer approval.
 * @evidence contracts/common.md#meaningful-documentation Errors identify unsupported routes, layers, outline choices and stage values.
 * @evidence contracts/performance.md#efficient-algorithms The closed four-layer vocabulary bounds validation to constant time and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The fixed vocabularies are reused within one call; there is no expensive computation or cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only local scalar values and the route array are allocated; no file handle or task is acquired.
 */
export function assertProductionEvidenceSources(
  props: IProductionConfigProps,
): void {
  if (!["long", "short", "short-with-settings", "asset"].includes(props.mode))
    throw new Error("Unknown production route.");
  const routed: readonly AuthoredLayer[] = productionLayers(props);
  for (const layer of AUTHORED_LAYERS) {
    if (routed.includes(layer)) continue;
    if (
      props.construction[layer] !== "disabled" ||
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
          ? props.construction[layer]
          : props.naturalness.screenplay;
      if (stage !== "disabled" && stage !== "evidence")
        throw new Error("Unknown stage: a layer is disabled or evidence.");
    }
  if ("scripts" in props.naturalness)
    throw new Error(
      "Scripts finish in construction; remove naturalness.scripts.",
    );
  if ("settings" in props.naturalness || "treatments" in props.naturalness)
    throw new Error("Settings and treatments finish in construction.");
}
