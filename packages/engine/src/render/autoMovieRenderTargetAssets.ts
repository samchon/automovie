import { IAutoMovieRenderTargetAsset } from "@automovie/interface";

import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/** Assets shorthand: pair paths with digests already proved elsewhere. */
export const autoMovieRenderTargetAssets: (
  entries: Readonly<Record<string, string>>,
) => IAutoMovieRenderTargetAsset[] = (
  entries: Readonly<Record<string, string>>,
): IAutoMovieRenderTargetAsset[] =>
  Object.keys(entries)
    .sort(compareAutoMovieRenderIds)
    .map((path: string): { path: string; digest: string } => ({
      path,
      digest: entries[path]!,
    }));
