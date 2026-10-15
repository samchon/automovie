import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Painted fixed cabinetry and the separate pale stone countertop surfaces. */
export const greigeCabinet = {
  material:houseMaterial("greige-cabinet","#8A7F72",0.50),
  faces:["plinth","carcass","leaf","drawer-front","cleat"],
  modelBindings:[
    {model:"fitting:kitchen-",faces:["plinth","carcass","leaf","drawer-front"]},
    {model:"fitting:vanity-",faces:["plinth","carcass","leaf"]},
    {model:"fitting:laundry-upper",faces:["carcass","leaf"]},
    {model:"fitting:laundry-top",faces:["cleat"]},
  ],
} satisfies HouseFinish;

