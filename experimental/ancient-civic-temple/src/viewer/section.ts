/**
 * Vertical section payload for the viewer. Envelope solids from the current
 * source environment produce exact section pieces and site ground lines outside
 * the building footprint. The browser draws these values on the cutting plane.
 */
import { envelopeSolids } from "../review/envelope-overlaps";
import { sectionProfile } from "../review/section-profile";
import { templePlan as p } from "../spaces/building";
import { createTempleEnvironment } from "../spaces/environment";
import { templeSiteExtent as e, templeSiteGrade, templeSiteGradeBreaks } from "../spaces/site/extent";

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

export type SectionPayload = ReturnType<typeof createSectionPayload>;
