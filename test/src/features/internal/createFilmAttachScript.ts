import { IAutoMovieScript } from "@automovie/interface";
import { makeScriptWrite } from "./filmFixtures";
/** Create the existing salute beat with an imported knight and generated sword/shield cast entries through makeScriptWrite. This data factory declares attachment participants; it neither forges their models nor performs the beat. */
export const createFilmAttachScript: () => IAutoMovieScript = (): IAutoMovieScript =>
  makeScriptWrite({
    cast: [
      { node: "knight", character: "the knight", modelRef: "stickman" },
      { node: "sword", character: "the sword", modelRef: null },
      { node: "shield", character: "the shield", modelRef: null },
    ],
    beats: [
      {
        id: "beat-1",
        name: "the salute",
        summary: "the knight raises the sword",
        durationHint: 2,
      },
    ],
  });
