/** Reviewed dimensional prototypes owned by this model design file. */
import { fromLReservations, fromReservation, group } from "../specs";
import type { PrototypeSpec } from "../templates";
import { finishFaces } from "./finishes";

const pantryPlan=fromLReservations("pantry-back-shelf","pantry-right-shelf");
export const laundryMachineSizes = {
  washer:fromReservation("laundry-washer","z"),
  dryer:fromReservation("laundry-dryer","z"),
} as const;

export const serviceRoomSpecs: readonly PrototypeSpec[] = [
  ...group("12-service-rooms.md", "src/models/furnishings/service-rooms.ts", [
    ["laundry-machine","appliance",laundryMachineSizes.washer,"appliance-body leaf door-ring glass handle control-panel appliance-interior drum",
      {laundry:"washer",finishes:{...finishFaces("white-enamel","appliance-body","leaf"),...finishFaces("stainless-steel","door-ring","drum")}}],
    ["laundry-folding-top","table",fromReservation("laundry-folding-top","z"),"top cleat",
      {finishes:{...finishFaces("stone-counter","top"),...finishFaces("greige-cabinet","cleat")}}],
    ["laundry-upper-storage","cabinet",fromReservation("laundry-upper-storage","z"),"carcass leaf",{finishAll:"greige-cabinet"}],
    ["mudroom-bench","shelf",fromReservation("laundry-shoe-bench","z"),"seat carcass shelf shoe",{finishes:{seat:"furniture-wood"}}],
    ["mudroom-coat-hooks","props",fromReservation("laundry-coat-hooks","z"),"board hook clothes"],
    ["pantry-l-shelf","shelf",pantryPlan.size,"shelf cleat",{lShelf:pantryPlan.lShelf}],
    ["pantry-containers","props",[0.80,0.30,0.25],"container lid box basket"],
    ["garage-shelving","shelf",fromReservation("garage-shelf"),"post shelf bin",
      {finishes:finishFaces("stainless-steel","post","shelf")}],
    ["garage-workbench","table",fromReservation("garage-workbench"),"top leg drawer-front handle"],
    ["garage-tool-board","props",fromReservation("garage-tool-board"),"board tool-steel tool-grip bin",
      {finishes:finishFaces("stainless-steel","tool-steel")}],
  ]),
];
