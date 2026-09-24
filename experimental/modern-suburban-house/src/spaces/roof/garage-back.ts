/**
 * `roof.garage.back`: the back face of the garage's low gable roof.
 *
 * Design owner: `docs/spaces/roof/garage-back.md#garage-back-roof`. Region
 * X = [5.75, 11.70 + 0.35], Z = [back eave −6.70 − 0.35, ridge −3.50] under
 * Gback(Z) = 2.95 + (5/12)(Z + 6.70), underside 0.24 m lower (roof/00).
 */
import { GARAGE } from "../building";
import { PALETTE } from "../palette";
import { type IHousePart, part, rect, slopedSlab } from "../solids";
import { GARAGE_RIDGE_Z, OVERHANG, ROOF_THICKNESS, gBack } from "./junctions";

/**
 * Emit the garage back face.
 *
 * @evidence spaces/roof/garage-back.md 이 export는 roof/garage-back.md 한 설계 파일의 지붕 면을 실현한다.
 * @evidence spaces/roof/garage-back.md#garage-back-roof 차고 지붕 뒷면을 X = [5.75, 11.70 + 0.35], Z = [−6.70 − 0.35, GARAGE_RIDGE_Z −3.50]에 윗면 2.95 + (5/12)(Z + 6.70), 아래면 0.24 m 아래인 판 하나(roof-garage-back)로 만든다.
 * @evidence principles/core/source-units.md#source-scope-preservation garage-back-roof H2의 면만 만들고 차고 후벽·앞면·본채 벽을 만들지 않는다. 외곽·용마루·처마는 GARAGE·GARAGE_RIDGE_Z·OVERHANG에서만 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 호출할 때마다 같은 좌표의 닫힌 다면체를 slopedSlab으로 만들어 IHousePart로 반환하는 실제 함수다. 자리표시자나 빈 배열이 아니며 소비자(house.ts)가 더 계산할 것이 없다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 부모 roof/garage-back.md#garage-back-roof와 roof/00-junctions.md의 G 식·차고 처마·00-building의 차고 외곽를 대조했고 경계·경사·두께를 적힌 그대로 구현했다. 구현 중 부모를 고쳐야 하는 결함은 드러나지 않았다.
 */
export const buildGarageBackRoof = (): IHousePart[] => [
  part(
    "roof-garage-back",
    "roof/garage-back.ts",
    "roof",
    PALETTE.roof,
    slopedSlab({
      plan: rect([GARAGE.inner.x[0], GARAGE.outer.x[1] + OVERHANG.garage], [GARAGE.outer.z[0] - OVERHANG.garage, GARAGE_RIDGE_Z]),
      top: (_x, z) => gBack(z),
      thickness: ROOF_THICKNESS,
    }),
  ),
];
