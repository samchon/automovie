/** Reviewed dimensional prototypes owned by this model design file. */
import { fromReservation, group } from "../specs";
import { curtainEnvelope, type PrototypeSpec } from "../templates";
import { woodenChairFinishes } from "./finishes";

const primaryRearCurtain = {openingWidth:2.40,openingHeight:1.40,floorDrop:0.75} as const;

export const bedroomSpecs: readonly PrototypeSpec[] = [
  ...group("13-bedrooms.md", "src/models/furnishings/bedrooms.ts", [
    ["headboard-bed","bed",fromReservation("primary-bedroom-bed","z"),"headboard bed-frame mattress bedding pillow",{mattressTop:0.60}],
    ["nightstand-lamp","cabinet",fromReservation("primary-bedroom-rear-nightstand"),"carcass drawer-front lamp-base lamp-shade",{bodyTop:0.55}],
    ["low-dresser","cabinet",fromReservation("primary-bedroom-dresser","z"),"carcass drawer-front handle leg"],
    ["child-desk","table",fromReservation("bedroom-two-desk","z"),"top leg shelf book container pencil"],
    ["desk-chair","chair",[0.45,0.82,0.48],"seat leg back",{finishes:woodenChairFinishes}],
    ["sliding-closet","shelf",fromReservation("bedroom-two-closet","z"),"carcass leaf handle rail rod shelf clothes casing"],
    ["primary-window-curtains","bath",curtainEnvelope(primaryRearCurtain),"rod bracket curtain",{curtain:primaryRearCurtain}],
    ["wardrobe-hanging","shelf",fromReservation("primary-wardrobe-hanging"),"rod shelf carcass clothes"],
    ["wardrobe-shelves","shelf",[1.10,1.78,0.55],"shelf carcass folded shoe-box basket"],
  ]),
];
