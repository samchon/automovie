import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionConstructionStageMixin } from "../../ProductionConstructionStageMixin";
import type { ProductionGatePass } from "../../ProductionGatePass";
import type { ProductionStage } from "../../ProductionStage";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { assertSupportClaims } from "../assertSupportClaims";
import { hasNaturalness } from "../hasNaturalness";
import { resolveConstruction } from "./resolveConstruction";

/** Validates the exact claim scopes and each layer's stage names. */
export function assertProductionEvidenceSources(
  props: IProductionConfigProps,
): void {
  assertSupportClaims(props);
  if (!["long", "short", "asset"].includes(props.mode))
    throw new Error("Unknown production route.");
  const routed: string[] | readonly AuthoredLayer[] =
    props.mode === "long"
      ? AUTHORED_LAYERS
      : props.mode === "short"
        ? ["screenplay"]
        : [];
  for (const layer of AUTHORED_LAYERS) {
    if (routed.includes(layer)) continue;
    if (
      resolveConstruction(props.construction[layer])[0] !== "disabled" ||
      (hasNaturalness(layer) && props.naturalness[layer] !== "disabled")
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
  if (props.lifecycle !== "independent-evidence-v1")
    throw new Error("Unknown production evidence lifecycle.");
  if (!Array.isArray(props.gate?.claimScopes))
    throw new Error("Evidence-only work claims require exact gate scopes.");
  const names: Set<string> = new Set<string>();
  for (const claim of props.claims ?? []) {
    const scopes: {
      name: string;
      layer: AuthoredLayer;
      pass: ProductionGatePass;
    }[] = props.gate.claimScopes.filter(
      (scope: {
        name: string;
        layer: AuthoredLayer;
        pass: ProductionGatePass;
      }): boolean => scope.name === claim.name,
    );
    if (typeof claim.name !== "string" || scopes.length !== 1)
      throw new Error("Every work claim needs one exact gate scope.");
    if (names.has(claim.name))
      throw new Error("Work claim names must be unique.");
    names.add(claim.name);
    for (const reference of Array.isArray(claim.reference)
      ? claim.reference
      : [claim.reference])
      if (reference.requireReview === true)
        throw new Error("Work claims cannot require review rows.");
  }
  for (const scope of props.gate.claimScopes) {
    if (
      !AUTHORED_LAYERS.includes(scope.layer) ||
      (scope.pass !== "construction" && scope.pass !== "naturalness")
    )
      throw new Error("Unknown work claim layer/pass scope.");
    if (scope.pass === "naturalness" && !hasNaturalness(scope.layer))
      throw new Error("Only scripts and screenplay have a naturalness pass.");
    if (!routed.includes(scope.layer))
      throw new Error("A work claim cannot own an inactive production layer.");
    if (
      !(props.claims ?? []).some(
        (claim: IEvidenceClaim): boolean => claim.name === scope.name,
      )
    )
      throw new Error("Gate scope names an absent work claim.");
  }
  if (
    props.construction.index !== undefined &&
    props.construction.index !== "disabled" &&
    props.construction.index !== "evidence"
  )
    throw new Error("Unknown outline stage.");
  for (const layer of AUTHORED_LAYERS)
    for (const pass of ["construction", "naturalness"] as const) {
      if (pass === "naturalness" && !hasNaturalness(layer)) continue;
      const declaration: ProductionStage | ProductionConstructionStageMixin =
        pass === "construction"
          ? props.construction[layer]
          : props.naturalness[layer as "scripts" | "screenplay"];
      if (
        Array.isArray(declaration) &&
        (pass !== "construction" ||
          layer !== "screenplay" ||
          declaration.length !== 2 ||
          typeof declaration[1] !== "boolean")
      )
        throw new Error("Only screenplay accepts a scripts source tuple.");
      const stage: ProductionStage =
        pass === "construction"
          ? resolveConstruction(props.construction[layer])[0]
          : props.naturalness[layer as "scripts" | "screenplay"];
      if (stage !== "disabled" && stage !== "evidence")
        throw new Error("Unknown stage: a layer is disabled or evidence.");
    }
  if ("settings" in props.naturalness || "treatments" in props.naturalness)
    throw new Error("Settings and treatments finish in construction.");
}
