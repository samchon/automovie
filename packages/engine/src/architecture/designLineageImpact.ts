import { IAutoMovieDesignImpact, IAutoMovieDesignLineage } from "@automovie/interface";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { validateDesignLineage } from "./validateDesignLineage";

/**
 * Name exactly the derived artifacts a set of changed identities invalidates.
 *
 * Impact walks the declared derivation edges backwards, so changing one opening
 * reaches the wall mesh cut around it, the finish pieces cut to that wall, the
 * door leaf hosted in it, the schedule line counting them, and the render that
 * drew them, and reaches nothing else. The untouched artifacts are returned
 * beside the invalidated ones because "only these" is a claim about the
 * complement, and a report naming one side alone cannot be checked.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-change-impact-visibility `designLineageImpact` reports the changed identities, transitively invalidated artifacts, and unaffected artifacts as stable sorted ids.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-change-impact-report `designLineageImpact` walks declared dependency edges and returns both the artifacts invalidated by a source change and the artifacts retained for follow-up planning.
 * @evidence requirements/evidence-and-provenance/generation-transformation-and-derivation.md#provenance-derivation-impact `designLineageImpact` traces each changed subject or derived artifact through direct and transitive consumers and names the unaffected derived complement.
 * @evidence specifications/evidence-and-provenance/generation-transformation-and-derivation.md#evp-derivation-reverse-impact-index The function computes the Engine lineage's reverse dependency index from declared identity edges and returns stable invalidated and unaffected sets.
 * @evidence requirements/interior/existing-conditions-phases-and-alternatives.md#interior-change-impact `designLineageImpact` propagates a changed tracked identity through declared derived consumers and returns both the stale candidates and the unaffected complement.
 * @evidence specifications/interior-space/construction-phases-and-alternatives.md#interior-space-phase-alternative-graph The impact walk supplies the graph's dependency-aware staleness subset without claiming domain-specific geometry, clearance, sound, or service inference.
 * @evidence requirements/external-inputs/credentials-rights-and-provenance.md#external-provenance-derivation-consumers `designLineageImpact` follows an external subject identity through every declared derived artifact and transitive Engine consumer in the lineage graph.
 * @evidence specifications/interchange-and-adoption/provenance-rights-and-secrets.md#interchange-derivation-consumer-reachability The reverse walk exposes reachable derived consumers and the unaffected complement without claiming upstream acquisition or rights provenance.
 * @evidence requirements/external-inputs/refresh-version-pinning-and-offline.md#external-refresh-impact-staleness `designLineageImpact` turns a refreshed source identity into the stable set of direct and transitive derived artifacts requiring replacement or review.
 * @evidence specifications/interchange-and-adoption/revision-refresh-and-offline-cache.md#interchange-refresh-staleness-propagation The impact result implements dependency-based staleness propagation inside Engine lineage while leaving refresh acquisition and adoption transactions upstream.
 * @evidence requirements/asset-authoring/external-assets.md#asset-external-replacement `designLineageImpact` reports the exact direct and transitive derived consumers invalidated when an external asset identity is replaced, together with the unaffected complement.
 * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-identity-failure-compatibility The reverse dependency walk implements the replacement-impact subset by refusing unknown identities and naming affected consumers without claiming adoption authority.
 * @evidence requirements/map/temporal-change.md#map-change-impact-staleness `designLineageImpact` walks direct and transitive world dependencies to return the derived artifacts invalidated by a changed identity and the unaffected complement.
 * @evidence specifications/world-and-site/temporal-state-and-staleness.md#world-site-change-provenance-staleness The stable impact result exposes exactly which declared world outputs become stale after a source or dependency change.
 * @evidence requirements/map/external-assets-and-placement.md#map-external-source-replacement A replaced external source identity is propagated through every declared derived consumer while unrelated world artifacts remain explicitly unaffected.
 * @evidence specifications/world-and-site/spatial-imports-and-placement.md#world-site-source-state-replacement The reverse dependency traversal implements the replacement-impact subset without claiming acquisition, conversion, or adoption authority.
 */
export const designLineageImpact = (
  lineage: IAutoMovieDesignLineage,
  changed: readonly string[],
): IAutoMovieDesignImpact => {
  requireValidLineage(lineage);
  const known = new Set([
    ...lineage.subjects.map((subject) => subject.id),
    ...lineage.derived.map((artifact) => artifact.id),
  ]);
  for (const id of changed)
    if (!known.has(id))
      throw new Error(
        `design lineage "${lineage.id}" has no identity "${id}" to trace`,
      );
  const dependents = new Map<string, string[]>();
  for (const artifact of lineage.derived)
    for (const input of artifact.inputs)
      dependents.set(input, [...(dependents.get(input) ?? []), artifact.id]);
  const derivedIds = new Set(lineage.derived.map((artifact) => artifact.id));
  const invalidated = new Set<string>();
  const visited = new Set<string>();
  const queue = [...changed];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    if (derivedIds.has(current)) invalidated.add(current);
    for (const dependent of dependents.get(current) ?? [])
      queue.push(dependent);
  }
  return {
    changed: [...new Set(changed)].sort(compareCodeUnits),
    invalidated: [...invalidated].sort(compareCodeUnits),
    unaffected: [...derivedIds]
      .filter((id) => !invalidated.has(id))
      .sort(compareCodeUnits),
  };
};

const requireValidLineage = (lineage: IAutoMovieDesignLineage): void => {
  const validated = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
};
