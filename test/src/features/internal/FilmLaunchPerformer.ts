import type {
  IAutoMovieActionCall,
  IAutoMovieActionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";

/**
 * The launch unit's real performShot consumer accepts the existing draft and optional live target reader, whose world-space metres are sampled at shot-local seconds. The owning launch entry supplies authored flight and recoil expectations and delegates range/referential and bone-fallback cases; this callable type adds no assertion or independently discovered scenario.
 */
export type FilmLaunchPerformer = (
  draft: IAutoMovieActionCall[],
  targetAt?: (
    target: IAutoMovieActionTarget,
    seconds: number,
  ) => IAutoMovieVector3 | null,
) => IAutoMoviePerformedShot;
