/** Reviewed dimensional prototypes owned by this model design file. */
import { fromReservation, group } from "../specs";
import type { PrototypeSpec } from "../templates";

export const serviceRoomSpecs: readonly PrototypeSpec[] = [
  ...group("12-service-rooms.md", "src/models/furnishings/service-rooms.ts", [
    ["laundry-machine","appliance",fromReservation("laundry-washer","z"),"appliance-body leaf door-ring glass handle control-panel appliance-interior drum"],
    ["laundry-folding-top","table",fromReservation("laundry-folding-top","z"),"top cleat"],
    ["laundry-upper-storage","cabinet",fromReservation("laundry-upper-storage","z"),"carcass leaf"],
    ["mudroom-bench","shelf",fromReservation("laundry-shoe-bench","z"),"seat carcass shelf shoe"],
    ["mudroom-coat-hooks","props",fromReservation("laundry-coat-hooks","z"),"board hook clothes"],
    ["pantry-l-shelf","shelf",fromReservation("pantry-back-shelf"),"shelf cleat"],
    ["pantry-containers","props",[0.80,0.30,0.25],"container lid box basket"],
    ["garage-shelving","shelf",fromReservation("garage-shelf"),"post shelf bin"],
    ["garage-workbench","table",fromReservation("garage-workbench"),"top leg drawer-front handle"],
    ["garage-tool-board","props",fromReservation("garage-tool-board"),"board tool-steel tool-grip bin"],
  ]),
];
