import { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import { autoMovieSubjectAddress } from "./autoMovieSubjectAddress";

/**
 * Create a request-local lookup of parts by complete subject address. A model's parts are indexed on its first lookup; duplicate addresses preserve the first part, matching the previous Array.find rule. The caller keeps its model table and parts unchanged during the request.
 *
 * @evidence contracts/common.md#principled-implementation Indexes complete prototype-part addresses and inserts only absent keys, preserving first-match identity for duplicate part ids while avoiding a new scan for every subject comparison.
 * @evidence contracts/common.md#clear-and-simple-design One lazy lookup serves a diff revision's part comparisons; model selection and subject classification remain with diffAutoMovieSubjects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty requests and missing models do not traverse part arrays, duplicate ids are not changed to last-match selection, and mutable artifacts have no global or revision-id cache.
 * @evidence contracts/common.md#meaningful-documentation States lazy indexing, complete address keys, duplicate precedence and the unchanged-table premise for one request.
 * @evidence contracts/performance.md#efficient-algorithms For Q lookups and P parts in models actually queried, expected map work is O(Q+P) plus address-string construction, replacing repeated per-model linear scans.
 * @evidence contracts/performance.md#reuse-equivalent-work Each queried model is indexed once and its first-match entries serve subsequent lookups; untouched models have no index allocation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned lookup retains the model table and at most one part reference per distinct queried address; its owning diff request releases the closure and maps on return or throw.
 */
export function createAutoMovieSubjectPartIndex(
  models: ReadonlyMap<string, IAutoMovieModel>,
): (modelId: string, address: string) => IAutoMovieModelPart | undefined {
  const indexes: Map<string, Map<string, IAutoMovieModelPart>> = new Map();
  return (
    modelId: string,
    address: string,
  ): IAutoMovieModelPart | undefined => {
    let parts: Map<string, IAutoMovieModelPart> | undefined =
      indexes.get(modelId);
    if (parts === undefined) {
      const model: IAutoMovieModel | undefined = models.get(modelId);
      if (model === undefined) return undefined;
      parts = new Map();
      for (const part of model.parts) {
        const key: string = autoMovieSubjectAddress(
          "prototype-part",
          model.id,
          part.id,
        );
        if (!parts.has(key)) parts.set(key, part);
      }
      indexes.set(modelId, parts);
    }
    return parts.get(address);
  };
}
