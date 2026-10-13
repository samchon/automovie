import { IAutoMovieScript } from "@automovie/interface";

/**
 * Create the existing two-knight one-beat engine script with unchanged logline/theme and optional modelRef contrast. The final partial spread can replace any script field for real source-tree/forge validation cases.
 */
export function makeScriptWrite(
  partial: Partial<IAutoMovieScript> = {}
): IAutoMovieScript {
  return ({
  logline: "Two knights duel at dawn.",
  theme: "honor answered in steel",
  cast: [
    { node: "knightA", character: "the challenger", modelRef: "stickman" },
    { node: "knightB", character: "the champion", modelRef: null },
  ],
  beats: [
    {
      id: "beat-1",
      name: "the charge",
      summary: "knightA charges knightB",
      durationHint: 3,
    },
  ],
  ...partial,
});
}
