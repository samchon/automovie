/** Reviewed dimensional prototypes owned by this model design file. */
import { group } from "./specs";
import type { PrototypeSpec } from "./templates";

export const plantingSpecs: readonly PrototypeSpec[] = [
  ...group("16-planting.md", "src/models/planting.ts", [
    ["site-tree-prototypes","plant",[6.00,8.00,6.00],"bark foliage"],
    ["site-shrub-prototype","plant",[0.90,0.80,0.90],"bark foliage"],
  ]),
];
