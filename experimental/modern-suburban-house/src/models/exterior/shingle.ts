/** Reviewed dimensional prototypes owned by this model design file. */
import { group } from "../specs";
import type { PrototypeSpec } from "../templates";

export const shingleSpecs: readonly PrototypeSpec[] = [
  ...group("15-outdoor.md", "src/models/exterior/shingle.ts", [
    ["asphalt-shingle-strip","panel",[1.00,0.15,0.01],"shingle-face shingle-butt shingle-back shingle-cut roof-flashing"],
  ]),
];
