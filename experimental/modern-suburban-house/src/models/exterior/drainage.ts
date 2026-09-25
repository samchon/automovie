/** Reviewed dimensional prototypes owned by this model design file. */
import { group } from "../specs";
import type { PrototypeSpec } from "../templates";

export const drainageSpecs: readonly PrototypeSpec[] = [
  ...group("15-outdoor.md", "src/models/exterior/drainage.ts", [
    ["eave-gutter-downspout","panel",[1.00,0.08,0.12],"gutter downspout",{finishAll:"charcoal-metal"}],
  ]),
];
