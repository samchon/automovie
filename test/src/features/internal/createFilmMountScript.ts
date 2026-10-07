import { makeScriptWrite } from "./filmFixtures";

/** Preserve the mount scenario's existing script input and authored values. */
export const createFilmMountScript = () =>
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
