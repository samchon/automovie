import { templePlan as p } from "../templePlan";
import { templeSiteCurbOuter as curb } from "./templeSiteCurbOuter";
import { templeSiteLines as l } from "./templeSiteLines";


/** Plan rectangle of the service apron east of the building, out to the east curb. */
export const apron = { west: p.eastOuter, east: curb.east, ...l.serviceApron };
