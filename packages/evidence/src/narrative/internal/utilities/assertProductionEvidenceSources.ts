import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionGatePass } from "../../ProductionGatePass";
import { AUTHORED_LAYERS } from "../AUTHORED_LAYERS";
import { assertSupportClaims } from "../assertSupportClaims";
import { hasNaturalness } from "../hasNaturalness";

/**
 * Validates the exact claim scopes and each layer's stage names.
 *
 * @evidence contracts/common.md#principled-implementation Runtime configuration is admitted only when route, lifecycle, stage vocabulary, exact custom-claim scope and support/authored boundaries agree; unsupported tuple shapes, duplicate names and work-owned review requirements throw before claim construction.
 * @evidence contracts/common.md#clear-and-simple-design One admission boundary checks related route/stage/scope invariants before factories materialize claims, while assertSupportClaims owns physical support-tree isolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Asset routing has no narrative work claims, short routing authors screenplay alone and screenplay alone has a separate naturalness pass; these are declared production routes rather than consumer-specific repairs.
 * @evidence contracts/common.md#meaningful-documentation The comment names scope and stage validation, and every throw identifies its invalid route, relation, stage, tuple or ownership condition.
 * @evidence contracts/performance.md#efficient-algorithms For c custom claims, s scope entries and r references, repeated scope/name searches cost O(c*s + r); support validation additionally scans protected directories/aliases and compares selector prefixes against captured boundaries, so filesystem size and path resolution can dominate.
 * @evidence contracts/performance.md#reuse-equivalent-work The fixed layer vocabulary and scalar stage vocabulary are shared across checks; live support-tree admission is refreshed for each config build, and no stale acceptance result is cached across contract/filesystem changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Names and filtered scope arrays are local and scale with custom configuration; support traversal owns only synchronous observations and temporary visited sets, with no retained handle, task or admission cache.
 */
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
      throw new Error(
        "Only screenplay has a naturalness pass; scripts finish in construction.",
      );
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
