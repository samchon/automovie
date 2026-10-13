import { IAutoMovieBeat, IAutoMovieScriptNode } from "@automovie/interface";
import type { validateScriptTree } from "../../../../packages/engine/src/validation/validateScriptTree";

function treeBeats (): IAutoMovieBeat[] { return [
  {
    id: "beat-1",
    name: "the loose",
    summary: "A looses the arrow",
    durationHint: 3,
  },
  { id: "beat-2", name: "the hit", summary: "B is struck", durationHint: 2 },
]; }

/** A full five-kind refinement tree over {@link treeBeats}. */
function createScriptTree (): IAutoMovieScriptNode[] { return [
  {
    id: "root",
    kind: "intent",
    parent: null,
    temporal: null,
    interactsWith: [],
    payload: { logline: "A hunter becomes the hunted.", theme: "reversal" },
  },
  {
    id: "act1",
    kind: "act",
    parent: "root",
    temporal: null,
    interactsWith: [],
    payload: { purpose: "the hunt turns" },
  },
  {
    id: "scene1",
    kind: "scene",
    parent: "act1",
    temporal: null,
    interactsWith: [],
    payload: {
      interiorExterior: "EXT",
      location: "forest clearing",
      timeOfDay: "dawn",
      description: null,
    },
  },
  {
    id: "grp",
    kind: "group",
    parent: "scene1",
    temporal: null,
    interactsWith: [],
    payload: { rationale: "the exchange of arrows" },
  },
  {
    id: "b1",
    kind: "beat",
    parent: "grp",
    temporal: null,
    interactsWith: ["b2"],
    payload: {
      beat: "beat-1",
      direction: "A twists back in the saddle and looses.",
      dialogue: [
        { speaker: "A", text: "Now!", anchor: 0.5 },
        { speaker: "B", text: "…", anchor: null },
      ],
      caption: "low sun, long shadows, the arrow leaves frame right",
    },
  },
  {
    id: "b2",
    kind: "beat",
    parent: "grp",
    temporal: "b1",
    interactsWith: ["b1"],
    payload: {
      beat: "beat-2",
      direction: "B takes the arrow and falls.",
      dialogue: [],
      caption: null,
    },
  },
]; }


/** Return an independent five-kind tree, matching flat header and two flat beats. */
export function createScriptTreeFixture(): Parameters<typeof validateScriptTree>[0] {
 return { tree: createScriptTree(), beats: treeBeats(), logline: "A hunter becomes the hunted.", theme: "reversal" };
}
