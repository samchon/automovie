/**
 * docs/spaces/roofs/assembly.md#roof-junctions의 piecewise 최대 높이 합성.
 * 후보 평면 영역을 실제 교차선으로 잘라 겹치지 않는 상면 영역을 반환한다.
 * 각 조각은 원래 owner/surface를 유지한다. 하부는 동일 경사 평행면이다.
 * 반환값은 방 cell과 외피가 공유하는 기하 입력이며 닫힌 roof mesh나
 * 시각 검증 결과는 아니다. 내부 slab/단면을 별도 덧붙이지 않는다.
 */
import { clipPlan, partitionPlan, type RoofPatch } from "../../geometry/planar-domain";
import type { RoofRules } from "../../geometry/roof-planes";
import { templeColonnadeRoof } from "./colonnade";
import { templeEastRoof } from "./east";
import { templePorchRoof } from "./porch";
import { templeSanctuaryRoof } from "./sanctuary";
import { templeWestRoof } from "./west";

/** 경사는 rad, 나머지는 m. 열린 마당의 논리 상한도 supportHeight를 소비한다. */
export const templeRoofRules: RoofRules = {
  supportHeight: 3.55,
  slope: 22 * Math.PI / 180,
  overhang: 0.35,
  verticalThickness: 0.18 / Math.cos(22 * Math.PI / 180),
};

/** 선언 순서가 동고면의 우선순위다. 입력과 후보는 변경하지 않는다. */
export const templeRoofEnvelope = (): RoofPatch[] => {
  const candidates = [
    ...templeSanctuaryRoof(templeRoofRules),
    ...templeWestRoof(templeRoofRules),
    ...templeEastRoof(templeRoofRules),
    ...templeColonnadeRoof(templeRoofRules),
    ...templePorchRoof(templeRoofRules),
  ];
  return candidates.flatMap((candidate, index) => {
    let pieces = [candidate.polygon];
    candidates.forEach((other, otherIndex) => {
      if (otherIndex === index) return;
      const difference = {
        x: candidate.height.x - other.height.x,
        z: candidate.height.z - other.height.z,
        constant: candidate.height.constant - other.height.constant,
      };
      const coplanar = Math.max(
        Math.abs(difference.x), Math.abs(difference.z),
        Math.abs(difference.constant),
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
    return pieces.map((polygon, part) => ({
      ...candidate, polygon, id: `${candidate.id}.piece-${part}`,
    }));
  });
};
