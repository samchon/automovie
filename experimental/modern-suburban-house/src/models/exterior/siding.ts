/** Reviewed dimensional prototypes owned by this model design file. */
import { group } from "../specs";
import type { PrototypeSpec } from "../templates";

export const sidingSpecs: readonly PrototypeSpec[] = [
  ...group("15-outdoor.md", "src/models/exterior/siding.ts", [
    ["lap-siding-board","panel",[1.00,0.17,0.03],"siding-face siding-butt siding-back siding-top siding-cut",{finishAll:"siding"}],
  ]),
];
