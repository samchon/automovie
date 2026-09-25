/** Reviewed dimensional prototypes owned by this model design file. */
import { group } from "../specs";
import type { PrototypeSpec } from "../templates";

export const exteriorTrimSpecs: readonly PrototypeSpec[] = [
  ...group("15-outdoor.md", "src/models/exterior/trim.ts", [
    ["exterior-corner-trim","panel",[0.10,2.75,0.10],"exterior-trim"],
  ]),
];
