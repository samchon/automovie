import { IAutoMovieRenderTargetAsset } from "@automovie/interface";

import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/*
 * Assets shorthand: pair paths with digests already proved elsewhere.
 */
export function autoMovieRenderTargetAssets(
  entries: Readonly<Record<string, string>>,
): IAutoMovieRenderTargetAsset[] {
  return Object.keys(entries)
    .sort(compareAutoMovieRenderIds)
    .map((path: string): { path: string; digest: string } => ({
      path,
      digest: entries[path]!,
    }));
}
