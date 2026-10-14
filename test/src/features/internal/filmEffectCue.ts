import { IAutoMovieFilmTimeline } from "@automovie/interface";

/** Return the existing mist cue and apply partial fields last by a shallow spread. Caller overrides retain their original values/references and may intentionally violate admission for the owning tests. */
export const filmEffectCue: (
  partial?: Partial<{
    id: string;
    recipe: "world-zone";
    zone: string;
    startFrame: number;
    durationFrames: number;
    intensity: number;
  }>,
) => {
  id: string;
  recipe: "world-zone";
  zone: string;
  startFrame: number;
  durationFrames: number;
  intensity: number;
} = (
  partial: Partial<IAutoMovieFilmTimeline["tracks"]["effects"][number]> = {},
): IAutoMovieFilmTimeline["tracks"]["effects"][number] => ({
  id: "mist",
  recipe: "world-zone",
  zone: "yard",
  startFrame: 12,
  durationFrames: 12,
  intensity: 0.5,
  ...partial,
});
