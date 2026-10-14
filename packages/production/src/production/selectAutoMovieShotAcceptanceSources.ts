import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import type { IAutoMovieCompiledShotSource } from "@automovie/interface";
import { isAutoMovieSourceOwnerBindingComplete } from "./isAutoMovieSourceOwnerBindingComplete";

/**
 * Retain completed sibling exports belonging to the exact executed shot owner.
 *
 * @evidence contracts/common.md#principled-implementation Exact branch, completion, target path/anchor and non-entry export identity select ordered sibling attribution; each selected record retains its own declared source digest.
 * @evidence contracts/common.md#clear-and-simple-design Shot materialization attribution consumes this projection after its entry edge was separately authenticated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A same-path unrelated owner cannot become a sibling, and completed declaration metadata does not execute acceptance exports or supply a physical verdict.
 * @evidence contracts/common.md#meaningful-documentation States target identity, source order, executed-entry exclusion and byte attribution.
 * @evidence contracts/performance.md#efficient-algorithms For B source edges, one filter/map scan costs O(B) plus address text and stores at most B small output records.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied admitted binding population is shared for this one attribution; no sibling result is retained across changed graph/source facts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output source facts transfer to compiled attribution and borrow scalar values, with no source bytes, handles or task retained.
 */
export function selectAutoMovieShotAcceptanceSources(props: {
  bindings: readonly IAutoMovieProductionEvidenceSourceOwnerBinding[];
  entry: IAutoMovieProductionEvidenceSourceOwnerBinding;
}): NonNullable<IAutoMovieCompiledShotSource["acceptanceSources"]> {
  const target: string = `${props.entry.targetPath}#${props.entry.targetAnchor}`;
  return props.bindings
    .filter(
      (candidate: IAutoMovieProductionEvidenceSourceOwnerBinding): boolean =>
        candidate.branch === "shots" &&
        isAutoMovieSourceOwnerBindingComplete(candidate) &&
        `${candidate.targetPath}#${candidate.targetAnchor}` === target &&
        !(
          candidate.sourcePath === props.entry.sourcePath &&
          candidate.exportName === props.entry.exportName
        ),
    )
    .map((candidate: IAutoMovieProductionEvidenceSourceOwnerBinding): NonNullable<IAutoMovieCompiledShotSource["acceptanceSources"]>[number] => ({
      path: candidate.sourcePath,
      export: candidate.exportName,
      digest: candidate.sourceDigest,
      target,
    }));
}
