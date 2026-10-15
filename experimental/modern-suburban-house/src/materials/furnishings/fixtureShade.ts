import {type HouseFinish} from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";
/** Fixture surfaces and the two separate finishes of the closed fireplace. */
export const fixtureShade={material:houseMaterial("light-shade","#EDE9E0",.9,{doubleSided:true}),faces:["fixture-shade"],modelBindings:[{model:"fitting:pendant-",faces:["fixture-shade"]}]} satisfies HouseFinish;
