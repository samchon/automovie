/**
 * `roof.main.back`: the main roof's back face.
 *
 * Design owner: `docs/spaces/roof/main-back.md#main-back-roof`. Region
 * X = [LEFT_EAVE_X, 1.60], Z = [back eave −11.10, ridge −5.35] under
 * Mback(Z) = 6.30 + (8/12)(Z + 10.70), underside 0.24 m lower (roof/00).
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { BACK_EAVE_Z, LEFT_EAVE_X, MAIN_RIDGE_Z, ROOF_THICKNESS, SPLIT_X, mBack } from "./junctions";

/**
 * Emit the main back face.
 *
 * @evidence spaces/roof/main-back.md 이 export는 roof/main-back.md 한 설계 파일의 지붕 면을 실현한다.
 * @evidence spaces/roof/main-back.md#main-back-roof 주 지붕 영역 뒤 절반 X = [LEFT_EAVE_X −6.15, SPLIT_X 1.60], Z = [BACK_EAVE_Z −11.10, MAIN_RIDGE_Z −5.35]에 윗면 Mback(Z) = 6.30 + (8/12)(Z + 10.70), 아래면 0.24 m 아래인 판 하나(roof-main-back)를 만든다. 오른쪽 단차 벽은 만들지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation main-back-roof H2의 면과 아래면만 만들고 단차 벽(envelope/right.ts)·전면 박공·용마루 너머 면을 만들지 않는다. 경계 값은 roof/junctions.ts의 공유 상수와 Mback에서만 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 호출할 때마다 같은 좌표의 닫힌 다면체를 slopedSlab으로 만들어 IHousePart로 반환하는 실제 함수다. 자리표시자나 빈 배열이 아니며 소비자(house.ts)가 더 계산할 것이 없다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 부모 roof/main-back.md#main-back-roof와 roof/00-junctions.md의 Mback·처마 0.40 m·두께 0.24 m를 대조했고 경계·경사·두께를 적힌 그대로 구현했다. 구현 중 부모를 고쳐야 하는 결함은 드러나지 않았다.
 */
export const buildMainBackRoof = (): IHousePart[] => [
  part("roof-main-back", "roof/main-back.ts", "roof", PALETTE.roof, slopedSlab({ plan: rect([LEFT_EAVE_X, SPLIT_X], [BACK_EAVE_Z, MAIN_RIDGE_Z]), top: (_x, z) => mBack(z), thickness: ROOF_THICKNESS })),
];
