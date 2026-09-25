/** Reviewed dimensional prototypes owned by this model design file. */
import { group } from "../specs";
import type { PrototypeSpec } from "../templates";
import { woodenChairFinishes } from "./finishes";

export const outdoorFurnitureSpecs: readonly PrototypeSpec[] = [
  ...group("15-outdoor.md", "src/models/furnishings/outdoor.ts", [
    ["terrace-table","table",[1.40,0.75,0.80],"top leg"],
    ["terrace-chair","chair",[0.50,0.85,0.55],"seat leg back",{finishes:woodenChairFinishes}],
  ]),
];
