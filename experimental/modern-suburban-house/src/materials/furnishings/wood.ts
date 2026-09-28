/** Oil-finished oak on pantry shelving and the mudroom plate; metre UVs carry grain. */
import {houseMaterial,type HouseFinish} from "../finish";

export const furnitureWood={
  material:houseMaterial("furniture-wood","#A87A4E",.50),
  faces:["board","shelf","cleat"],
  modelBindings:[
    {model:"fitting:mudroom-hooks",faces:["board"]},
    {model:"fitting:pantry-shelves",faces:["shelf","cleat"]},
  ],
  texture:{file:"furniture-oak.png",metres:[1,.15],projection:"local"},
} satisfies HouseFinish;
