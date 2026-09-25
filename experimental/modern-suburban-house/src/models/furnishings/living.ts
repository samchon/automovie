/** Reviewed dimensional prototypes owned by this model design file. */
import { fromReservation, group } from "../specs";
import type { PrototypeSpec } from "../templates";
import { finishFaces, upholsteredSeatFinishes } from "./finishes";
import { bedSizes } from "./bedrooms";

const bedRugSize=(size:readonly [number,number,number])=>
  [Math.max(size[0],size[2])+0.30,0.008,Math.min(size[0],size[2])+0.30] as const;
export const floorCoveringSizes={
  living:fromReservation("living-rug","z"),
  family:[1.70,0.008,1.55],
  entry:fromReservation("entry-mat"),
  primary:bedRugSize(bedSizes.primary),
  childTwo:bedRugSize(bedSizes.childTwo),
  childThree:bedRugSize(bedSizes.childThree),
} as const;

export const livingSpecs: readonly PrototypeSpec[] = [
  ...group("11-living.md", "src/models/furnishings/living.ts", [
    ["fabric-sofa","sofa",fromReservation("living-sofa","z"),"leg base seat-cushion back arm",{finishes:upholsteredSeatFinishes}],
    ["low-table","table",fromReservation("living-table","z"),"top leg"],
    ["reading-armchair","sofa",fromReservation("living-reading-chair"),"leg base seat-cushion back arm",{finishes:upholsteredSeatFinishes}],
    ["dark-bookcase","shelf",fromReservation("living-bookcase","z"),"carcass plinth shelf book",
      {finishes:finishFaces("dark-bookcase","carcass","plinth","shelf")}],
    ["floor-covering","mat",floorCoveringSizes.living,"field border",
      {borderWidth:0.04,finishes:{field:"muted-rug",border:"upholstery"}}],
    ["fireplace-insert-mantel","panel",[1.60,1.40,0.55],"firebox firebox-trim mantel"],
  ]),
];
