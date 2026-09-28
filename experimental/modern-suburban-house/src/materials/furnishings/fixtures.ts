/** Fixture surfaces and the two separate finishes of the closed fireplace. */
import {houseMaterial,type HouseFinish} from "../finish";
export const fixtureDiffuser={material:houseMaterial("light-diffuser","#F4F1E9",.36,{transmission:.35,ior:1.5,thickness:.012}),faces:["fixture-diffuser"],modelBindings:[{model:"fitting:flush-",faces:["fixture-diffuser"]},{model:"fitting:pendant-",faces:["fixture-diffuser"]},{model:"fitting:vanity-light",faces:["fixture-diffuser"]}]} satisfies HouseFinish;
export const fixtureGlass={material:houseMaterial("light-glass","#F4F1E9",.06,{transmission:.78,ior:1.5,thickness:.004,doubleSided:true}),faces:["fixture-glass"],modelBindings:[{model:"fitting:porch-sconce",faces:["fixture-glass"]}]} satisfies HouseFinish;
export const fixtureShade={material:houseMaterial("light-shade","#EDE9E0",.9,{doubleSided:true}),faces:["fixture-shade"],modelBindings:[{model:"fitting:pendant-",faces:["fixture-shade"]}]} satisfies HouseFinish;
export const fireboxBlack={material:houseMaterial("firebox-black","#1F1F20",.9),faces:["firebox","firebox-trim"],modelBindings:[{model:"fitting:fireplace",faces:["firebox","firebox-trim"]}]} satisfies HouseFinish;
export const mantelWood={material:houseMaterial("mantel-wood","#A87A4E",.5),faces:["mantel"],modelBindings:[{model:"fitting:fireplace",faces:["mantel"]}]} satisfies HouseFinish;
