import { templePlan as p } from "../templePlan";
import { templeSiteCurbOuter as curb } from "./templeSiteCurbOuter";
import { templeSiteLines as l } from "./templeSiteLines";


export const apron = { west: p.eastOuter, east: curb.east, ...l.serviceApron };
