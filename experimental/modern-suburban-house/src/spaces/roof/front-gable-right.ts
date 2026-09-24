/**
 * `roof.front-gable.right`: the east face of the front gable, toward the stair
 * window.
 *
 * Design owner: `docs/spaces/roof/front-gable-right.md#front-gable-right-roof`.
 * The exposed face is the triangle from the apex down the right valley to its
 * foot on the front eave and back along the ridge X = -3.775; height
 * F(X) = 6.30 + (9/12)(b − X), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, slopedSlab } from "../solids";
import { GABLE_CORNERS, ROOF_THICKNESS, gable } from "./junctions";

/**
 * Emit the gable's east face.
 *
 * @evidence spaces/roof/front-gable-right.md 이 export는 roof/front-gable-right.md 한 설계 파일의 지붕 면을 실현한다.
 * @evidence spaces/roof/front-gable-right.md#front-gable-right-roof 전면 박공의 오른쪽 경사면을 ridgeFront(−3.775, 0.40)·apex(−3.775, −2.222)·rightFoot(−1.444, 0.40) 삼각형 위에 윗면 F(X) = 6.30 + (9/12)(b − X), 아래면 0.24 m 아래인 판 하나로 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation front-gable-right-roof H2의 삼각 면만 만들고 왼쪽 면·주 지붕·박공 벽을 만들지 않는다. 세 꼭짓점은 GABLE_CORNERS에서만 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 호출할 때마다 같은 좌표의 닫힌 다면체를 slopedSlab으로 만들어 IHousePart로 반환하는 실제 함수다. 자리표시자나 빈 배열이 아니며 소비자(house.ts)가 더 계산할 것이 없다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 부모 roof/front-gable-right.md#front-gable-right-roof와 roof/00-junctions.md의 F(X)·골짜기·앞 처마 0.40 m를 대조했고 경계·경사·두께를 적힌 그대로 구현했다. 구현 중 부모를 고쳐야 하는 결함은 드러나지 않았다.
 */
export const buildFrontGableRightRoof = (): IHousePart[] => {
  const { rightFoot, apex, ridgeFront } = GABLE_CORNERS;
  return [
    part("roof-front-gable-right", "roof/front-gable-right.ts", "roof", PALETTE.roof, slopedSlab({ plan: [apex, rightFoot, ridgeFront], top: (x) => gable(x), thickness: ROOF_THICKNESS })),
  ];
};
