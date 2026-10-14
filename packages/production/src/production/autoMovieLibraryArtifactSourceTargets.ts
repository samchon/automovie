import type { IAutoMovieMaterializedLibrary } from "@automovie/interface";

import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Resolve one generated library file to the exact owner that published it.
 *
 * The aggregate index is the sole library-wide file. Environment, model, and
 * context artifacts are all owner-produced families and therefore resolve
 * through the same materialized owner index. An unowned or multiply owned path
 * is an invariant failure rather than an aggregate fallback.
 *
 * @evidence contracts/common.md#principled-implementation The materialized owner index maps encoded environment/model/context file identities to their publishing owner; exactly one match is required except the library-wide aggregate index.
 * @evidence contracts/common.md#clear-and-simple-design Library compilation seals sourceTargets from its just-produced canonical index, avoiding another inference from output filenames or source paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or multiply owned paths throw instead of receiving library-wide fallback attribution, and encoded ids use the shared portable path owner.
 * @evidence contracts/common.md#meaningful-documentation States the aggregate exception, supported owned artifact families and exact single-owner refusal.
 * @evidence contracts/performance.md#efficient-algorithms For O owners and A total environment/model/context ids, one ordered scan costs O(O+A) plus id encoding/text comparison and retains all matching owner names; compiler use repeats this for every generated artifact rather than retaining a reverse index.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This attribution is derived from the current materialized index per file and no answer is cached across another publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The match array is local and its sole successful target transfers to a manifest entry; source owner arrays are borrowed, and no handle or task is acquired.
 * @author Samchon
 */
export function autoMovieLibraryArtifactSourceTargets(file: string, index: IAutoMovieMaterializedLibrary): string[] {
  if (file === "library/index.json") return ["library"];
  const candidates: string[] = [];
  for (const owner of index.owners) {
    const target: string = `library:${owner.branch}:${owner.owner}`;
    for (const environment of owner.environments)
      if (
        file ===
        `library/environments/${encodeAutoMoviePathSegment(environment)}.json`
      )
        candidates.push(target);
    for (const model of owner.models)
      if (file === `models/${encodeAutoMoviePathSegment(model)}.json`)
        candidates.push(target);
    for (const context of owner.contexts ?? [])
      if (
        file === `library/contexts/${encodeAutoMoviePathSegment(context)}.json`
      )
        candidates.push(target);
  }
  if (candidates.length !== 1)
    throw new Error(
      candidates.length === 0
        ? `Generated library artifact "${file}" has no exact owner in the materialized library index.`
        : `Generated library artifact "${file}" has ${candidates.length} owners in the materialized library index: ${candidates.join(", ")}.`,
    );
  return candidates;
}
