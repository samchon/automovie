import { IAutoMovieCompiledFilmEffect } from "@automovie/interface";

import { nodeCanonicalDigest } from "./nodeCanonicalDigest";

/** Deep-clone the supplied runtime, apply the existing mutation callback and recompute inner/outer digests without their digest fields. This enables field-admission cases to reach the field owner instead of failing on stale digests; the original runtime is unchanged. */
export const resealFilmEffect: (
  runtime: IAutoMovieCompiledFilmEffect,
  mutate: (draft: IAutoMovieCompiledFilmEffect) => void,
) => IAutoMovieCompiledFilmEffect = (
  runtime: IAutoMovieCompiledFilmEffect,
  mutate: (draft: IAutoMovieCompiledFilmEffect) => void,
): IAutoMovieCompiledFilmEffect => {
  const draft: IAutoMovieCompiledFilmEffect = structuredClone(runtime);
  mutate(draft);
  draft.effect.digest = nodeCanonicalDigest({
    ...draft.effect,
    digest: undefined,
  });
  draft.digest = nodeCanonicalDigest({ ...draft, digest: undefined });
  return draft;
};
