/**
 * `roof.main.front`: the main roof's front face.
 *
 * Design owner: `docs/spaces/roof/main-front.md#main-front-roof`, with its
 * region, height and edges from `roof/00-junctions.md`. The face covers
 * X = [LEFT_EAVE_X, 1.60], Z = [ridge −5.35, front eave 0.40] under
 * Mfront(Z) = 6.30 − (8/12) Z, minus the exposed front-gable triangle (the two
 * valleys and the front eave) and minus the chimney notch
 * X = [-6.30, -5.50] × Z = [-2.75, -1.65]. The engine builds convex faces only,
 * so the concave remainder is split into four convex pieces that share the
 * valley corners of `GABLE_CORNERS` exactly.
 */
import { PALETTE } from "../palette";
import { type IHousePart, part, slopedSlab } from "../solids";
import { CHIMNEY_PLAN, FRONT_EAVE_Z, GABLE, GABLE_CORNERS, LEFT_EAVE_X, MAIN_RIDGE_Z, ROOF_THICKNESS, SPLIT_X, mFront } from "./junctions";

const OWNER = "roof/main-front.ts";

/**
 * Emit the main front face pieces.
 *
 * @evidence spaces/roof/main-front.md 이 export는 roof/main-front.md 한 설계 파일의 지붕 면을 실현한다.
 * @evidence spaces/roof/main-front.md#main-front-roof 주 지붕 앞 절반에서 전면 박공 삼각형(GABLE_CORNERS)과 굴뚝 notch(CHIMNEY_PLAN X ≤ −5.50, Z = [−2.75, −1.65])를 뺀 나머지를 볼록 조각 네 개(roof-main-front-0…3)로 나눠 윗면 Mfront(Z) = 6.30 − (8/12)Z, 아래면 0.24 m 아래로 만든다. 골짜기 꼭짓점은 junctions의 공유 값을 그대로 쓴다.
 * @evidence principles/core/source-units.md#source-scope-preservation main-front-roof H2의 면만 만들고 박공 두 면·굴뚝·벽 머리를 만들지 않는다. 골짜기와 notch 꼭짓점은 roof/junctions.ts가 한 번 계산한 값만 쓴다.
 * @evidence principles/core/source-units.md#source-substantive-completion 호출할 때마다 같은 좌표의 닫힌 다면체를 slopedSlab으로 만들어 IHousePart로 반환하는 실제 함수다. 자리표시자나 빈 배열이 아니며 소비자(house.ts)가 더 계산할 것이 없다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 부모 roof/main-front.md#main-front-roof와 roof/00-junctions.md의 Mfront·골짜기 Z = −(9/8)·min(X − a, b − X)·굴뚝 notch를 대조했고 경계·경사·두께를 적힌 그대로 구현했다. 구현 중 부모를 고쳐야 하는 결함은 드러나지 않았다.
 */
export const buildMainFrontRoof = (): IHousePart[] => {
  const { apex, leftFoot, rightFoot } = GABLE_CORNERS;
  const [notchBack, notchFront] = CHIMNEY_PLAN.z;
  const notchRight = CHIMNEY_PLAN.x[1];
  // Where the left valley crosses the notch's front edge Z = -1.65.
  const valleyAtNotch = { x: GABLE.a - (8 / 9) * notchFront, z: notchFront };
  const top = (_x: number, z: number): number => mFront(z);
  const pieces = [
    // East of the gable ridge line: the ridge to the right valley and the front eave.
    [
      { x: GABLE.center, z: MAIN_RIDGE_Z },
      { x: SPLIT_X, z: MAIN_RIDGE_Z },
      { x: SPLIT_X, z: FRONT_EAVE_Z },
      rightFoot,
      apex,
    ],
    // West, behind the chimney notch.
    [
      { x: LEFT_EAVE_X, z: MAIN_RIDGE_Z },
      { x: GABLE.center, z: MAIN_RIDGE_Z },
      { x: GABLE.center, z: notchBack },
      { x: LEFT_EAVE_X, z: notchBack },
    ],
    // West, beside the notch, up to the left valley.
    [
      { x: notchRight, z: notchBack },
      { x: GABLE.center, z: notchBack },
      apex,
      valleyAtNotch,
      { x: notchRight, z: notchFront },
    ],
    // West, in front of the notch, to the left valley foot on the eave.
    [{ x: LEFT_EAVE_X, z: notchFront }, valleyAtNotch, leftFoot, { x: LEFT_EAVE_X, z: FRONT_EAVE_Z }],
  ];
  return pieces.map((plan, i) =>
    part(`roof-main-front-${i}`, OWNER, "roof", PALETTE.roof, slopedSlab({ plan, top, thickness: ROOF_THICKNESS })),
  );
};
