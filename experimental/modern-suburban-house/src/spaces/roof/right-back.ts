/**
 * `roof.right.back`: the back face of the main building's lower right roof.
 *
 * Design owner: `docs/spaces/roof/right-back.md#right-back-roof`. Region
 * X = [1.60, RIGHT_EAVE_X], Z = [back eave −11.10, ridge −5.35] under
 * Rback(Z) = 5.95 + (7/12)(Z + 10.70), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { BACK_EAVE_Z, MAIN_RIDGE_Z, RIGHT_EAVE_X, ROOF_THICKNESS, SPLIT_X, rBack } from "./junctions";

/**
 * Emit the right low roof back face.
 *
 * @evidence spaces/roof/right-back.md 이 export는 roof/right-back.md 한 설계 파일의 지붕 면을 실현한다.
 * @evidence spaces/roof/right-back.md#right-back-roof 오른쪽 낮은 지붕 뒷면을 X = [SPLIT_X 1.60, RIGHT_EAVE_X 6.15], Z = [BACK_EAVE_Z −11.10, MAIN_RIDGE_Z −5.35]에 윗면 5.95 + (7/12)(Z + 10.70), 아래면 0.24 m 아래인 판 하나(roof-right-back)로 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation right-back-roof H2의 면만 만들고 앞면·단차 벽·오른쪽 박공 벽을 만들지 않는다. 경계는 junctions 공유 값만 쓴다.
 * @evidence principles/core/source-units.md#source-substantive-completion 호출할 때마다 같은 좌표의 닫힌 다면체를 slopedSlab으로 만들어 IHousePart로 반환하는 실제 함수다. 자리표시자나 빈 배열이 아니며 소비자(house.ts)가 더 계산할 것이 없다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 부모 roof/right-back.md#right-back-roof와 roof/00-junctions.md의 R 식·뒤 처마를 대조했고 경계·경사·두께를 적힌 그대로 구현했다. 구현 중 부모를 고쳐야 하는 결함은 드러나지 않았다.
 */
export const buildRightBackRoof = (): IHousePart[] => [
  part("roof-right-back", "roof/right-back.ts", "roof", PALETTE.roof, slopedSlab({ plan: rect([SPLIT_X, RIGHT_EAVE_X], [BACK_EAVE_Z, MAIN_RIDGE_Z]), top: (_x, z) => rBack(z), thickness: ROOF_THICKNESS })),
];
