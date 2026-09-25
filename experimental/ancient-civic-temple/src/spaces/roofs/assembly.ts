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

/**
 * 높이·두께·돌출은 m, 경사는 rad. 열린 마당의 논리 상한은 courtEave를 소비한다.
 * @evidence spaces/roofs/assembly.md 지지 높이·경사·두께·돌출의 지붕 규칙 값을 둔다.
 * @evidence spaces/roofs/assembly.md#roof-junctions 주랑 처마 3.20, 동측 외벽 3.55, 제실 5.35, 포치 4.00m와 외쪽 12·박공 22·동측 박공 19도, 법선 두께 0.18, 돌출 0.35m를 설계 값 그대로 옮긴다.
 * @evidence principles/core/source-units.md#source-scope-preservation 규칙 값만 가지며 각 roof owner가 자기 지지선에서 이 값을 소비한다.
 * @evidence principles/core/source-units.md#source-substantive-completion RoofRules 타입 값으로 다섯 roof owner와 공간 cell·마당 상한이 같은 규칙을 받는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work roofs/assembly.md의 네 지지 높이·세 경사·두께·돌출을 그대로 옮겼다. 19도·5.35m 수정은 이미 부모 문서에서 이루어졌고 겹침 스캔이 코핑과의 관통 0을 확인했다.
 * @evidenceReview spaces/roofs/assembly.md # 지붕 합성 파일의 공통 높이·경사·두께·돌출을 RoofRules 한 값으로 제공하고 각 후보 owner가 이를 소비한다.
 * @evidenceReview spaces/roofs/assembly.md#roof-junctions # courtEave 3.2, eastWallSupport 3.55, sanctuarySupport 5.35, porchSupport 4와 경사 12/22/19도·두께 0.18·돌출 0.35가 원본 입력과 같다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 경사·지지 값 객체만 내고 실제 patch polygon이나 roof surface는 별도 지붕 함수가 정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # RoofRules 타입의 유한 literal이 다섯 roof 함수를 호출할 때 같은 인자로 들어가 개별 후보의 미정 경사가 없다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 부모에서 이미 수리한 동측 19도·제실 지지 5.35m를 이 값 객체에 맞췄고 1cm 겹침 스캔에서 코핑 관통 0을 확인했다.
 */
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

/**
 * 날개 단위를 합성하고 제실·포치 단위를 덧붙인다. 입력 후보는 변경하지 않는다.
 * @evidence spaces/roofs/assembly.md 날개 단위를 합성하고 제실·포치 단위를 덧붙인 지붕 조각 배열을 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 날개 후보가 겹치는 곳에서 가장 높은 상면만 남기고 제실 몸체·현관 몸체를 비우며, 각 조각의 owner·surface·tier·두께를 바꾸지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 서측→주랑→동측 순서의 겹침 해소와 plane 교차선 절단을 거친 볼록 조각 배열을 돌려주며 입력 후보를 변경하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work roofs/assembly.md#roof-junctions의 세 합성 단위, 최대 상면 합성, 네 골, 떠 있는 제실·포치 처마를 그대로 구현했다. 높이 차이 막음의 뒷면은 roofSlab 조립(environment) 쪽에서 드러나 부모를 고쳤고 이 합성 자체는 부모 결함을 드러내지 않았다.
 * @evidenceReview spaces/roofs/assembly.md # 서측·남북 주랑·동측 후보를 composeHighest로 한 날개에 합친 뒤 제실과 포치를 별도 patch로 더한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation # 날개 후보만 서로 높이를 비교하고 제실·포치는 차집합으로 자르지 않으며 분할 조각에 원본 owner·tier·두께를 보존한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion # 후보 교차 polygon을 partitionPlan과 clipPlan으로 잘라 동고면은 선언 순서 하나만 남기는 RoofPatch 배열을 실제 반환한다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work # 네 모서리 골과 떠 있는 제실 처마는 부모의 최대 상면 합성으로 구현되고 막음 뒷면은 junctions 수리 뒤 environment가 별도 face로 냈다.
 */
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
