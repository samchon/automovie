import { makeScriptWrite } from "./filmFixtures";
import type { IAutoMovieScript } from "@automovie/interface";

/**
 * Build the mount unit's existing horse/rider cast and beat-1 script without changing ids or values. The owning entry checks real performance/coupling output and authored rig failures; this constructor performs no assertion and its repeated use does not create a distinct resumed beat or renderer.
 */
export const createFilmMountScript: () => IAutoMovieScript = (): IAutoMovieScript =>
  makeScriptWrite({
    cast: [
      { node: "horse", character: "the steed", modelRef: "stickman" },
      { node: "rider", character: "the knight", modelRef: "stickman" },
    ],
    beats: [
      {
        id: "beat-1",
        name: "the ride",
        summary: "the knight rides the steed",
        durationHint: 2,
      },
    ],
  });
