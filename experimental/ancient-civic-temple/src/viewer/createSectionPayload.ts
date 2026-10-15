import { envelopeSolids } from "../review/envelopeSolids";
import { sectionProfile } from "../review/sectionProfile";
import { templePlan as p } from "../spaces/templePlan";
import { createTempleEnvironment } from "../spaces/createTempleEnvironment";
import { templeSiteExtent as e } from "../spaces/site/templeSiteExtent";
import { templeSiteGrade } from "../spaces/site/templeSiteGrade";
import { templeSiteGradeBreaks } from "../spaces/site/templeSiteGradeBreaks";


/**
 * Vertical section of the current envelope on the x or z plane at `offset`: exact solid pieces plus
 * the site ground lines outside the building footprint.
 */
export const createSectionPayload = (axis: "x" | "z", offset: number) => {
  const built = createTempleEnvironment();
  const solids = envelopeSolids({ walls: built.walls, roof: built.roof, trim: built.trim, floors: built.floors.inputs });
  const pieces = sectionProfile(solids, axis, offset);
  // Ground is an open top surface depending only on Z; send section lines outside the footprint.
  const [lo, hi] = axis === "x" ? [e.north, e.south] : [e.west, e.east];
  const [inLo, inHi] = axis === "x" ? [p.northOuter, p.southOuter] : [p.westOuter, p.eastOuter];
  const crossesFootprint = axis === "x" ? offset > p.westOuter && offset < p.eastOuter : offset > p.northOuter && offset < p.southOuter;
  const spans = crossesFootprint ? [[lo, inLo], [inHi, hi]] : [[lo, hi]];
  const ground = spans.map(([a, b]) => {
    const us = axis === "x" ? [a!, ...templeSiteGradeBreaks.filter((z) => z > a! && z < b!), b!] : [a!, b!];
    return us.map((u) => ({ u, y: templeSiteGrade(axis === "x" ? u : offset) }));
  });
  return { axis, offset, pieces, ground };
};
