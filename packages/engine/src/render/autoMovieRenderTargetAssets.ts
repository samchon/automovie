import {
  AutoMovieContentDigest,
  IAutoMovieRenderTargetAsset,
} from "@automovie/interface";

import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/** Assets shorthand: pair paths with digests already proved elsewhere. */
export const autoMovieRenderTargetAssets = (
  entries: Readonly<Record<string, AutoMovieContentDigest>>,
): IAutoMovieRenderTargetAsset[] =>
  Object.keys(entries)
    .sort(compareAutoMovieRenderIds)
    .map((path) => ({ path, digest: entries[path]! }));
