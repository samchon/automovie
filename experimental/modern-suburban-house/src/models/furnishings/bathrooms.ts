/** Reviewed dimensional prototypes owned by this model design file. */
import { fromReservation, group } from "../specs";
import type { PrototypeSpec } from "../templates";

export const bathroomSpecs: readonly PrototypeSpec[] = [
  ...group("14-bathrooms.md", "src/models/furnishings/bathrooms.ts", [
    ["shared-toilet","toilet",[0.50,0.82,0.75],"ceramic toilet-seat lid handle"],
    ["vanity-basin","cabinet",fromReservation("shower-bathroom-vanity","z"),"plinth carcass leaf countertop ceramic faucet handle accessory"],
    ["wall-mirror","panel",fromReservation("powder-mirror"),"mirror-frame mirror"],
    ["towel-bar","bath",[0.50,0.40,0.08],"rod bracket towel"],
    ["sliding-shower-booth","shower",fromReservation("shower-bathroom-booth"),"shower-tray glass rail handle faucet"],
    ["bathtub","tub",fromReservation("tub-bathroom-tub","z"),"ceramic faucet"],
    ["tub-curtain-rail","bath",[1.80,2.05,0.10],"rail rod curtain"],
    ["bath-floor-mats","mat",[0.65,0.008,0.45],"field border"],
    ["shower-niche-bottles","bath",[0.235,0.20,0.08],"container lid"],
  ]),
];
