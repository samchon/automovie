/** Reviewed dimensional prototypes owned by this model design file. */
import { fromReservation, group } from "../specs";
import type { PrototypeSpec } from "../templates";

export const housePropSpecs: readonly PrototypeSpec[] = [
  ...group("18-house-props.md", "src/models/furnishings/props.ts", [
    ["porch-mat-planter","props",[0.60,0.72,0.40],"field border container stem foliage"],
    ["kitchen-food-utensils","props",[0.65,0.38,0.50],"cutting-board container utensil bowl fruit"],
    ["linen-folded-towels","props",[0.28,0.12,0.32],"folded"],
  ]),
  ...group("19-room-accents.md", "src/models/furnishings/props.ts", [
    ["living-tabletop-props","props",[0.70,0.28,0.50],"book tray container stem foliage"],
    ["wall-art-indoor-plant","props",[0.60,0.52,0.40],"art-frame art-print container stem foliage"],
    ["sofa-throws","props",fromReservation("living-sofa","z"),"pillow folded"],
  ]),
];
