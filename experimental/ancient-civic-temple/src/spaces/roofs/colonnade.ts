/**
 * docs/spaces/roofs/colonnade.md의 남북 덮개. 북쪽은 min(N,G),
 * 남쪽은 Z 박공에서 포치 처마 폭의 notch를 뺀다. 합성 전 후보만 반환한다.
 * 접힌 면이나 notch 분할도 완결된 주랑 지붕의 같은 표면 소유에 남긴다.
 */
import { clipPlan, rectanglePolygon, type HeightPlane, type RoofPatch } from "../../geometry/planar-domain";
import { gablePlanes, type RoofRules } from "../../geometry/roof-planes";
import { templePlan as p } from "../building";
import { templeSanctuaryRoof } from "./sanctuary";

export const templeColonnadeRoof = (rules: RoofRules): RoofPatch[] => {
  const base: HeightPlane = {
    x: 0, z: -Math.tan(rules.slope),
    constant: rules.supportHeight + Math.tan(rules.slope) * p.courtBack,
  };
  const planes = [base, ...templeSanctuaryRoof(rules).map((r) => r.height)];
  const northBounds = rectanglePolygon({
    west: p.westRoom - rules.overhang, east: p.eastRoom + rules.overhang,
    north: p.sanctuaryFront - rules.overhang, south: p.courtBack + rules.overhang,
  });
  const north = planes.flatMap((height, i) => {
    let polygon = northBounds;
    for (const other of planes) {
      polygon = clipPlan(polygon, {
        x: other.x - height.x, z: other.z - height.z,
        constant: other.constant - height.constant,
      });
    }
    return polygon.length === 0 ? [] : [{
      id: `roof-colonnade.north.${i}`, owner: "roof-colonnade",
      surface: "surface.roof-colonnade.upper", polygon, height,
    }];
  });
  const southBounds = [
    { west: p.westCourt - rules.overhang, east: p.eastCourt + rules.overhang,
      north: p.courtFront - rules.overhang, south: p.entranceFront },
    { west: p.westCourt - rules.overhang, east: p.westPorchOuter - rules.overhang,
      north: p.entranceFront, south: p.southOuter + rules.overhang },
    { west: p.eastPorchOuter + rules.overhang, east: p.eastCourt + rules.overhang,
      north: p.entranceFront, south: p.southOuter + rules.overhang },
  ];
  const south = southBounds.flatMap((bounds, i) => gablePlanes(
    "roof-colonnade", `roof-colonnade.south.${i}`, bounds, "z",
    p.courtFront, (p.southOuter + p.southInner) / 2,
    rules.supportHeight, rules.slope,
  ));
  return [...north, ...south];
};
