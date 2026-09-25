/** Reviewed dimensional prototypes owned by this model design file. */
import { fromReservation, group } from "../specs";
import type { PrototypeSpec } from "../templates";
import { finishFaces } from "./finishes";

const tubFootprint=fromReservation("tub-bathroom-tub","z");
export const bathMatSizes={shower:[0.65,0.008,0.45],tub:[0.80,0.008,0.45]} as const;

export const bathroomSpecs: readonly PrototypeSpec[] = [
  ...group("14-bathrooms.md", "src/models/furnishings/bathrooms.ts", [
    ["shared-toilet","toilet",[0.50,0.82,0.75],"ceramic toilet-seat lid handle",
      {finishes:finishFaces("white-enamel","ceramic","toilet-seat","lid")}],
    ["vanity-basin","cabinet",fromReservation("shower-bathroom-vanity","z"),"plinth carcass leaf countertop ceramic faucet handle accessory",
      {finishes:{...finishFaces("greige-cabinet","plinth","carcass","leaf"),
        ...finishFaces("stone-counter","countertop"),...finishFaces("white-enamel","ceramic","accessory"),
        ...finishFaces("stainless-steel","faucet")}}],
    ["wall-mirror","panel",fromReservation("powder-mirror"),"mirror-frame mirror",
      {finishes:finishFaces("mirror-silver","mirror")}],
    ["towel-bar","bath",[0.50,0.40,0.08],"rod bracket towel"],
    ["sliding-shower-booth","shower",fromReservation("shower-bathroom-booth"),"shower-tray glass rail handle faucet"],
    ["bathtub","tub",[tubFootprint[0],1.90,tubFootprint[2]],"ceramic faucet",{rimHeight:tubFootprint[1]}],
    ["tub-curtain-rail","bath",[0.10,2.05,1.80],"rail rod curtain"],
    ["bath-floor-mats","mat",bathMatSizes.shower,"field border",{borderWidth:0.04}],
    ["shower-niche-bottles","bath",[0.235,0.20,0.08],"container lid"],
  ]),
];
