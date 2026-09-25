/** Reviewed dimensional prototypes owned by this model design file. */
import { fromReservation, group } from "../specs";
import type { PrototypeSpec } from "../templates";

export const kitchenDiningSpecs: readonly PrototypeSpec[] = [
  ...group("10-kitchen-dining.md", "src/models/furnishings/kitchen-dining.ts", [
    ["kitchen-base-run","cabinet",fromReservation("common-kitchen-back-base"),"plinth carcass leaf drawer-front handle countertop"],
    ["kitchen-wall-cabinet","cabinet",fromReservation("common-kitchen-left-wall-cabinet","z"),"carcass leaf handle"],
    ["kitchen-refrigerator","appliance",fromReservation("common-fridge","z"),"appliance-body leaf drawer-front handle appliance-interior"],
    ["kitchen-range","appliance",fromReservation("common-range","z"),"appliance-body cooktop burner control-panel leaf appliance-glass handle appliance-interior"],
    ["kitchen-microwave","appliance",fromReservation("common-microwave","z"),"appliance-body leaf appliance-glass control-panel"],
    ["kitchen-island","cabinet",fromReservation("common-island","z"),"plinth carcass leaf drawer-front handle countertop basin faucet"],
    ["kitchen-dishwasher","appliance",fromReservation("common-dishwasher"),"appliance-body leaf control-panel handle appliance-interior"],
    ["kitchen-island-stool","chair",[0.40,0.64,0.40],"seat leg footrest"],
    ["dining-table","table",fromReservation("common-dining-table"),"top apron leg"],
    ["dining-chair","chair",[0.45,0.85,0.50],"seat leg back"],
  ]),
];
