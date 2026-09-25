/** Reviewed dimensional prototypes owned by this model design file. */
import { fromReservation, group } from "../specs";
import { curtainEnvelope, type PrototypeSpec } from "../templates";
import { finishFaces, woodenChairFinishes } from "./finishes";

const primaryRearCurtain = {openingWidth:2.40,openingHeight:1.40,floorDrop:0.75} as const;
export const bedSizes = {
  primary:fromReservation("primary-bedroom-bed","z"),
  childTwo:fromReservation("bedroom-two-bed"),
  childThree:fromReservation("bedroom-three-bed"),
} as const;
export const bedMattressTop = (size:readonly [number,number,number]) => size[1]-0.40;
export const deskSizes = {
  childTwo:fromReservation("bedroom-two-desk","z"),
  childThree:fromReservation("bedroom-three-desk"),
} as const;

export const bedroomSpecs: readonly PrototypeSpec[] = [
  ...group("13-bedrooms.md", "src/models/furnishings/bedrooms.ts", [
    ["headboard-bed","bed",bedSizes.primary,"headboard bed-frame mattress bedding pillow",
      {mattressTop:bedMattressTop(bedSizes.primary),finishes:{...finishFaces("furniture-wood","headboard","bed-frame"),
        ...finishFaces("primary-bedding","mattress","bedding","pillow")}}],
    ["nightstand-lamp","cabinet",fromReservation("primary-bedroom-rear-nightstand"),"carcass drawer-front lamp-base lamp-shade",{bodyTop:0.55}],
    ["low-dresser","cabinet",fromReservation("primary-bedroom-dresser","z"),"carcass drawer-front handle leg"],
    ["child-desk","table",deskSizes.childTwo,"top leg shelf book container pencil"],
    ["desk-chair","chair",[0.45,0.82,0.48],"seat leg back",{finishes:woodenChairFinishes}],
    ["sliding-closet","shelf",fromReservation("bedroom-two-closet","z"),"carcass leaf handle rail rod shelf clothes casing"],
    ["primary-window-curtains","bath",curtainEnvelope(primaryRearCurtain),"rod bracket curtain",{curtain:primaryRearCurtain}],
    ["wardrobe-hanging","shelf",fromReservation("primary-wardrobe-hanging"),"rod shelf carcass clothes"],
    ["wardrobe-shelves","shelf",[1.10,1.78,0.55],"shelf carcass folded shoe-box basket"],
  ]),
];
