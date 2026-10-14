import type { validateScriptTree } from "@automovie/engine";
import { createScriptTree } from "./createScriptTree";
import { treeBeats } from "./treeBeats";

/** Return an independent five-kind tree, matching flat header and two flat beats. */
export function createScriptTreeFixture(): Parameters<
  typeof validateScriptTree
>[0] {
  return {
    tree: createScriptTree(),
    beats: treeBeats(),
    logline: "A hunter becomes the hunted.",
    theme: "reversal",
  };
}
