import type { IAutoMovieBeat } from "@automovie/interface";

/** Return fresh authored beat records for the script-tree fixture. */
export function treeBeats(): IAutoMovieBeat[] {
  return [
    {
      id: "beat-1",
      name: "the loose",
      summary: "A looses the arrow",
      durationHint: 3,
    },
    { id: "beat-2", name: "the hit", summary: "B is struck", durationHint: 2 },
  ];
}
