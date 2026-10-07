import { makeScriptWrite } from "./filmFixtures";

/** Preserve the attach scenario's existing script input and authored values. */
export const createFilmAttachScript = () =>
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
