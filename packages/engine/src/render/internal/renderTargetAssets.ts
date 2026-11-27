import { IAutoMovieRenderTargetAsset } from "@automovie/interface";

import { compareRenderIds } from "./compareRenderIds";

/*
 * Assets shorthand: pair paths with digests already proved elsewhere.
 */
export function renderTargetAssets(
  entries: Readonly<Record<string, string>>,
): IAutoMovieRenderTargetAsset[] {
  return Object.keys(entries)
    .sort(compareRenderIds)
    .map((path: string): { path: string; digest: string } => ({
      path,
      digest: entries[path]!,
    }));
}
