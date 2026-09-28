/** Painted fixed cabinetry and the separate pale stone countertop surfaces. */
import { houseMaterial, type HouseFinish } from "../finish";

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

export const lightCountertop = {
  material:houseMaterial("light-countertop","#E4E0D8",0.30),
  faces:["countertop","top"],
  modelBindings:[{model:"fitting:kitchen-",faces:["countertop"]},{model:"fitting:vanity-",faces:["countertop"]},{model:"fitting:laundry-top",faces:["top"]}],
} satisfies HouseFinish;

/** Muted cloth on the small hanging-garment blocking proxies. */
export const storedCloth = {
  material:houseMaterial("stored-cloth","#B7AFA3",0.92),
  faces:["clothes"],
  modelBindings:[
    {model:"fitting:bedroom-sliding-closet",faces:["clothes"]},
    {model:"fitting:wardrobe-hanging",faces:["clothes"]},
  ],
} satisfies HouseFinish;
