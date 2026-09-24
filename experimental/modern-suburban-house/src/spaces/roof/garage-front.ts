/**
 * `roof.garage.front`: the front face of the garage's low gable roof.
 *
 * Design owner: `docs/spaces/roof/garage-front.md#garage-front-roof`. Region
 * X = [5.75, 11.70 + 0.35], Z = [ridge −3.50, front eave −0.30 + 0.35] under
 * Gfront(Z) = 2.95 − (5/12)(Z + 0.30), underside 0.24 m lower; the west edge
 * meets the shared wall's outer face X = 5.75 with no overhang (roof/00).
 */
import { GARAGE } from "../building";
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { GARAGE_RIDGE_Z, OVERHANG, ROOF_THICKNESS, gFront } from "./junctions";

/**
 * Emit the garage front face.
 *
 * @evidence spaces/roof/garage-front.md 이 export는 roof/garage-front.md 한 설계 파일의 지붕 면을 실현한다.
 * @evidence spaces/roof/garage-front.md#garage-front-roof 차고 지붕 앞면을 X = [5.75, 11.70 + 0.35], Z = [GARAGE_RIDGE_Z −3.50, −0.30 + 0.35]에 윗면 G(Z) = 2.95 − (5/12)(Z + 0.30), 아래면 0.24 m 아래인 판 하나(roof-garage-front)로 만든다. 차고 외곽은 building.ts의 GARAGE에서 받는다.
 * @evidence principles/core/source-units.md#source-scope-preservation garage-front-roof H2의 면만 만들고 차고 벽·뒷면·패널문을 만들지 않는다. 외곽·용마루·처마 0.35 m는 GARAGE·GARAGE_RIDGE_Z·OVERHANG에서만 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 호출할 때마다 같은 좌표의 닫힌 다면체를 slopedSlab으로 만들어 IHousePart로 반환하는 실제 함수다. 자리표시자나 빈 배열이 아니며 소비자(house.ts)가 더 계산할 것이 없다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 부모 roof/garage-front.md#garage-front-roof와 roof/00-junctions.md의 G 식·차고 처마 0.35 m·00-building의 차고 외곽를 대조했고 경계·경사·두께를 적힌 그대로 구현했다. 구현 중 부모를 고쳐야 하는 결함은 드러나지 않았다.
 */
export const buildGarageFrontRoof = (): IHousePart[] => [
  part(
    "roof-garage-front",
    "roof/garage-front.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect([GARAGE.inner.x[0], GARAGE.outer.x[1] + OVERHANG.garage], [GARAGE_RIDGE_Z, GARAGE.outer.z[1] + OVERHANG.garage]),
      top: (_x, z) => gFront(z),
      thickness: ROOF_THICKNESS,
    }),
  ),
];
