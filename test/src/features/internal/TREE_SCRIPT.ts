import { IAutoMovieScript } from "@automovie/interface";
import { screenplayBeat } from "./screenplayBeat";
import { screenplayNode } from "./screenplayNode";
/** The original shared intent, act, scene, group and two-beat tree with its dialogue and caption values; consumers borrow this module-owned record and clone fields before variations. */
export const TREE_SCRIPT: IAutoMovieScript = {
  logline: "flat logline (ignored when a tree exists)",
  theme: "flat theme",
  cast: [],
  beats: [
    screenplayBeat("duel", "The duel"),
    screenplayBeat("aftermath", "The aftermath"),
  ],
  tree: [
    screenplayNode({
      id: "root",
      parent: null,
      kind: "intent",
      payload: { logline: "A knight faces his rival.", theme: "honor" },
    }),
    screenplayNode({
      id: "act1",
      parent: "root",
      kind: "act",
      payload: { purpose: "the rivalry breaks" },
    }),
    screenplayNode({
      id: "scene1",
      parent: "act1",
      kind: "scene",
      payload: {
        interiorExterior: "EXT",
        location: "castle courtyard",
        timeOfDay: "dawn",
        description: "Mist over the flagstones.",
      },
    }),
    screenplayNode({
      id: "grp",
      parent: "scene1",
      kind: "group",
      payload: { rationale: "the exchange" },
    }),
    screenplayNode({
      id: "b1",
      parent: "grp",
      kind: "beat",
      payload: {
        beat: "duel",
        direction: "A lunges; B parries.",
        dialogue: [
          { speaker: "knightA", text: "Yield!", anchor: 1.5 },
          { speaker: "knightB", text: "Never.", anchor: null },
        ],
        caption: "two knights clash at dawn",
      },
    }),
    screenplayNode({
      id: "b2",
      parent: "scene1",
      kind: "beat",
      payload: {
        beat: "aftermath",
        direction: "Dust settles.",
        dialogue: [],
        caption: null,
      },
    }),
  ],
};
