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
