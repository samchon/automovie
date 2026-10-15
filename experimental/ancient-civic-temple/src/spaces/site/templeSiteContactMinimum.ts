import { templePlan as p } from "../templePlan";
import { templeSiteGrade } from "./templeSiteGrade";

/**
 * Lowest ground along the outer wall contact line, consumed by wall-ground-contact.
 * Grade is monotonic in Z, so take the lower north/south endpoint.
 */


export const templeSiteContactMinimum = (): number => Math.min(templeSiteGrade(p.northOuter), templeSiteGrade(p.southOuter));
