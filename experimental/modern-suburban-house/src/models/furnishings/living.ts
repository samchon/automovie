/** Reviewed dimensional prototypes owned by this model design file. */
import { fromReservation, group } from "../specs";
import type { PrototypeSpec } from "../templates";

export const livingSpecs: readonly PrototypeSpec[] = [
  ...group("11-living.md", "src/models/furnishings/living.ts", [
    ["fabric-sofa","sofa",fromReservation("living-sofa","z"),"leg base seat-cushion back arm"],
    ["low-table","table",fromReservation("living-table","z"),"top leg"],
    ["reading-armchair","sofa",fromReservation("living-reading-chair"),"leg base seat-cushion back arm"],
    ["dark-bookcase","shelf",fromReservation("living-bookcase","z"),"carcass plinth shelf book"],
    ["floor-covering","mat",fromReservation("living-rug","z"),"field border"],
    ["fireplace-insert-mantel","panel",[1.60,1.40,0.55],"firebox firebox-trim mantel"],
  ]),
];
