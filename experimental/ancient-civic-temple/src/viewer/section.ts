/**
 * 뷰어의 연직 단면 전송값. 현재 source의 environment에서 외피 실체를 모아
 * 정확한 단면 조각과, 건물 외곽 밖 대지 지면의 단면선을 만든다. 브라우저는
 * 이 값을 절단 평면 위에 그리기만 한다.
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
  // 지면은 Z에만 따르는 열린 윗면이므로 단면선으로 보낸다. 건물 외곽 안에는 없다.
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
