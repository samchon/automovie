/**
 * docs/spaces/roofs/assembly.md#roof-junctions의 지붕 합성.
 * 날개 단위(서측 외쪽, 남·북 주랑 외쪽, 동측 박공)는 겹치는 곳에서 가장
 * 높은 상면만 남겨 중정 네 안쪽 모서리에 골을 만든다. 제실과 포치는 각자
 * 한 단위이며 처마가 아래 날개 지붕 위에 떠 있어 아래 면을 지우지 않는다.
 * 각 조각은 원래 owner/surface/tier와 수직 두께를 유지한다.
 */
import { clipPlan, partitionPlan, simplifyPlan, type RoofPatch } from "../../geometry/planar-domain";
import type { RoofRules } from "../../geometry/roof-planes";
import { templeColonnadeRoof } from "./colonnade";
import { templeEastRoof } from "./east";
import { templePorchRoof } from "./porch";
import { templeSanctuaryRoof } from "./sanctuary";
import { templeWestRoof } from "./west";

/** 높이·두께·돌출은 m, 경사는 rad. 열린 마당의 논리 상한은 courtEave를 소비한다. */
export const templeRoofRules: RoofRules = {
  courtEave: 3.2,
  leanSlope: 12 * Math.PI / 180,
  gableSlope: 22 * Math.PI / 180,
  eastGableSlope: 19 * Math.PI / 180,
  normalThickness: 0.18,
  overhang: 0.35,
  eastWallSupport: 3.55,
  sanctuarySupport: 5.35,
  porchSupport: 4,
};

/** 날개 단위를 합성하고 제실·포치 단위를 덧붙인다. 입력 후보는 변경하지 않는다. */
export const templeRoofEnvelope = (): RoofPatch[] => [
  ...composeHighest([
    ...templeWestRoof(templeRoofRules),
    ...templeColonnadeRoof(templeRoofRules),
    ...templeEastRoof(templeRoofRules),
  ]),
  ...templeSanctuaryRoof(templeRoofRules),
  ...templePorchRoof(templeRoofRules),
];

/** 선언 순서가 동고면의 우선순위다. 겹침에서 가장 높은 상면만 남긴다. */
const composeHighest = (candidates: readonly RoofPatch[]): RoofPatch[] =>
  candidates.flatMap((candidate, index) => {
    let pieces = [candidate.polygon];
    candidates.forEach((other, otherIndex) => {
      if (otherIndex === index) return;
      const difference = {
        x: candidate.height.x - other.height.x,
        z: candidate.height.z - other.height.z,
        constant: candidate.height.constant - other.height.constant,
      };
      const coplanar = Math.max(
        Math.abs(difference.x), Math.abs(difference.z), Math.abs(difference.constant),
      ) < 1e-9;
      pieces = pieces.flatMap((piece) => {
        const { inside, outside } = partitionPlan(piece, other.polygon);
        if (inside.length === 0) return outside;
        const retained = coplanar
          ? index < otherIndex ? inside : []
          : clipPlan(inside, difference);
        return retained.length === 0 ? outside : [...outside, retained];
      });
    });
    return pieces.map(simplifyPlan).filter((polygon) => polygon.length > 0).map((polygon, part) => ({
      ...candidate, polygon, id: `${candidate.id}.piece-${part}`,
    }));
  });
