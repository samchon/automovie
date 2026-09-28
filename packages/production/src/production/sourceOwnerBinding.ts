import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import type { IAutoMovieCompiledShotSource } from "@automovie/interface";

/**
 * Read completion from an enforced graph edge's declared stage.
 *
 * Execution, acceptance attribution, and library publication share this
 * predicate. `reviewed` remains an observation of optional legacy review
 * metadata; it does not decide completion. Callers separately authenticate
 * the selected owner, source bytes, and current physical observations.
 *
 * @evidence requirements/production-evidence/graph.md#agent-production-evidence-shape-stage Admits completed evidence edges and the compatible review declaration while refusing incomplete or unenforced stages.
 * @evidence specifications/production-evidence/graph.md#spec-authoring-production-evidence-shape-stage Uses the graph's enforced evidence-or-review completion state for runtime owner admission.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-derivation-output-lineage Gives execution and publication one completion condition without replacing exact source ownership and digest checks.
 * @author Samchon
 */
export const isAutoMovieSourceOwnerBindingComplete = (
  binding: IAutoMovieProductionEvidenceSourceOwnerBinding,
): boolean =>
  binding.enforced &&
  (binding.stage === "evidence" || binding.stage === "review");

/**
 * Retain completed non-entry exports belonging to one executed shot owner.
 *
 * The builder calls this after resolving its entry edge. Selection preserves
 * source order and exact target identity, excludes the executed export, and
 * leaves every sibling's own source digest in the compiled attribution. It
 * neither executes acceptance exports nor supplies a physical verdict.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Attributes acceptance exports to the same exact authored target as their executed shot without making them runtime builders.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-derivation-output-lineage Carries completed sibling source edges and their digests into derived shot acceptance attribution.
 * @author Samchon
 */
export const selectAutoMovieShotAcceptanceSources = (props: {
  bindings: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[];
  entry: IAutoMovieProductionEvidenceSourceOwnerBinding;
}): NonNullable<IAutoMovieCompiledShotSource["acceptanceSources"]> => {
  const target = `${props.entry.targetPath}#${props.entry.targetAnchor}`;
  return props.bindings
    .filter(
      (candidate) =>
        candidate.branch === "shots" &&
        isAutoMovieSourceOwnerBindingComplete(candidate) &&
        `${candidate.targetPath}#${candidate.targetAnchor}` === target &&
        !(
          candidate.sourcePath === props.entry.sourcePath &&
          candidate.exportName === props.entry.exportName
        ),
    )
    .map((candidate) => ({
      path: candidate.sourcePath,
      export: candidate.exportName,
      digest: candidate.sourceDigest,
      target,
    }));
};

/**
 * Attach resolved execution and sibling identities to one materialized shot.
 *
 * The builder supplies the value after engine materialization and an entry
 * already authenticated by the owner resolver. This boundary owns the complete
 * compiled attribution record, including its absence for legacy source scope.
 * It preserves every materialized field and never mutates either input. Review
 * and final admission remain the resolver's responsibility.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Carries the authenticated entry and completed sibling exports into the actual compiled shot consumed by render and acceptance services.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-derivation-output-lineage Composes exact source paths, export names, source digests and authored targets with the materialized shot while preserving legacy absence.
 * @author Samchon
 */
export const attributeAutoMovieCompiledShotSource = (props: {
  value: IAutoMovieCompiledShotSource;
  bindings: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[];
  entry: IAutoMovieProductionEvidenceSourceOwnerBinding | null;
}): IAutoMovieCompiledShotSource =>
  props.entry === null
    ? { ...props.value }
    : {
        ...props.value,
        sourceOwner: {
          branch: props.entry.branch,
          path: props.entry.sourcePath,
          export: props.entry.exportName,
          digest: props.entry.sourceDigest,
          target: `${props.entry.targetPath}#${props.entry.targetAnchor}`,
        },
        acceptanceSources: selectAutoMovieShotAcceptanceSources({
          bindings: props.bindings,
          entry: props.entry,
        }),
      };

/**
 * Resolve one executed export to its exact graph-selected authored owner.
 *
 * Source path and export name choose the candidate edge. The runtime-provided
 * owner is then checked against that edge rather than against a global target
 * population, and the source digest is checked against the bytes about to run.
 * Review and final callers additionally require a completed enforced edge.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-evidence Binds execution and result attribution to the exact completed source export and refuses a stale or mismatched owner edge.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-derivation-output-lineage Preserves the exact source and authored-target edge that compilation admits and derived output carries.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-freshness Resolves target, source path, export, and source digest as one current identity and fails closed when it is absent, ambiguous, stale, mismatched, or incomplete.
 * @author Samchon
 */
export const resolveAutoMovieSourceOwnerBinding = (props: {
  bindings:
    | readonly IAutoMovieProductionEvidenceSourceOwnerBinding[]
    | undefined;
  branch: string;
  sourcePath: string;
  exportName: string;
  /** Runtime owner claim, when this entry protocol carries one. */
  owner?: string;
  sourceDigest: IAutoMovieProductionEvidenceSourceOwnerBinding["sourceDigest"];
  /** Compatibility name for requiring evidence completion at admission. */
  requireReviewed: boolean;
}) => {
  const candidates = (props.bindings ?? []).filter(
    (binding) =>
      binding.branch === props.branch &&
      binding.sourcePath === props.sourcePath &&
      binding.exportName === props.exportName,
  );
  const address = `${props.sourcePath}#${props.exportName}`;
  if (candidates.length === 0)
    return {
      success: false as const,
      binding: null,
      reason: "missing" as const,
      message: `Source export "${address}" has no graph-selected owner edge in branch "${props.branch}".`,
    };
  if (candidates.length !== 1)
    return {
      success: false as const,
      binding: null,
      reason: "ambiguous" as const,
      message: `Source export "${address}" has ${candidates.length} graph-selected owner edges in branch "${props.branch}". Keep one exact authored target on the executed export.`,
    };
  const binding = candidates[0]!;
  const selectedOwner = `${binding.targetPath}#${binding.targetAnchor}`;
  if (props.owner !== undefined && selectedOwner !== props.owner)
    return {
      success: false as const,
      binding: null,
      reason: "owner" as const,
      message: `Source export "${address}" is graph-bound to "${selectedOwner}", not runtime owner "${props.owner}".`,
    };
  if (binding.sourceDigest !== props.sourceDigest)
    return {
      success: false as const,
      binding: null,
      reason: "digest" as const,
      message: `Source export "${address}" is bound at source digest ${binding.sourceDigest}, but execution supplied ${props.sourceDigest}.`,
    };
  if (props.requireReviewed && !isAutoMovieSourceOwnerBindingComplete(binding))
    return {
      success: false as const,
      binding: null,
      // Preserve the public refusal category used by existing consumers.
      reason: "review" as const,
      message: `Source export "${address}" has no completed enforced owner edge for "${selectedOwner}".`,
    };
  return {
    success: true as const,
    binding,
    reason: null,
    message: null,
  };
};
