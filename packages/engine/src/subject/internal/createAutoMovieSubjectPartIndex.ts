import { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import { autoMovieSubjectAddress } from "./autoMovieSubjectAddress";

/*
 * Create a request-local lookup of parts by complete subject address. A model's
 * parts are indexed on its first lookup; duplicate addresses preserve the first
 * part, matching the previous Array.find rule. The caller keeps its model table
 * and parts unchanged during the request.
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
