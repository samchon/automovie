import {type HouseFinish} from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";
/** Shade surfaces of the light fixtures. */
export const fixtureShade={material:houseMaterial("light-shade","#EDE9E0",.9,{doubleSided:true}),faces:["fixture-shade"],modelBindings:[{model:"fitting:pendant-",faces:["fixture-shade"]}]} satisfies HouseFinish;
