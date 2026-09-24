/**
 * docs/models/entablature.md의 주랑 목재 보, 서까래, 포치 보와 박공 트림, 제실 트러스,
 * 업무방·봉헌실 천장 보. 단면 치수는 문서 값이고 길이·높이·경사는 배치 쪽이 판정된 기준선과
 * 합성 지붕에서 유도해 넘긴다. 각 함수는 world m 좌표의 mesh를 돌려준다(한 가족의 여러
 * 변형을 한 part로 모은 표현). 서까래 처마 끝은 연직 절단 대신 경사에 수직인 끝면이다(한계).
 */
import type { IAutoMovieMesh } from "@automovie/interface";
import { planeHeight, type HeightPlane, type PlanPoint } from "../geometry/planar-domain";
import { box, cross, merged, orientedBox, unit, vec, type Vec } from "./mesh-kit";

/** 두 world 점 사이 부재: 단면 폭 width(수평 옆 방향), 깊이 depth(축과 옆에 수직), 윗면이 a→b 선. */
export const memberBelow = (a: Vec, b: Vec, width: number, depth: number): IAutoMovieMesh => {
  const axis = unit(vec(b.x - a.x, b.y - a.y, b.z - a.z));
  const side = unit(cross(vec(0, 1, 0), axis));
  const up = unit(cross(axis, side));
  const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  const mid = vec((a.x + b.x) / 2 - up.x * depth / 2, (a.y + b.y) / 2 - up.y * depth / 2, (a.z + b.z) / 2 - up.z * depth / 2);
  return orientedBox(mid, [axis, up, cross(axis, up)], [length / 2, depth / 2, width / 2]);
};

/** 두 world 점을 잇는 중심선 부재(정사각 또는 직사각 단면). */
export const memberAlong = (a: Vec, b: Vec, width: number, depth: number): IAutoMovieMesh => {
  const axis = unit(vec(b.x - a.x, b.y - a.y, b.z - a.z));
  const reference = Math.abs(axis.y) > 0.9 ? vec(1, 0, 0) : vec(0, 1, 0);
  const side = unit(cross(reference, axis));
  const up = unit(cross(axis, side));
  const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  return orientedBox(vec((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), [axis, up, cross(axis, up)], [length / 2, depth / 2, width / 2]);
};

/** 서까래 줄: 각 (처마 점, 뒷벽 점) 평면 선분 위, 지붕 하부 평면 underside 아래 0.08×0.12m. */
export const rafters = (runs: ReadonlyArray<[PlanPoint, PlanPoint]>, underside: HeightPlane): IAutoMovieMesh => merged(runs.map(([eave, back]) => {
  const a = vec(eave.x, planeHeight(underside, eave), eave.z);
  const b = vec(back.x, planeHeight(underside, back), back.z);
  return memberBelow(a, b, 0.08, 0.12);
}));

/** 제실 트러스 하나(z 위치). 평보 4.86~5.14m, 경사재는 지붕 하부 아래, 가운데 기둥, 버팀재 둘. */
export const sanctuaryTruss = (z: number, halfSpan: number, underside: (x: number) => number): { tie: IAutoMovieMesh; principal: IAutoMovieMesh; king: IAutoMovieMesh; strut: IAutoMovieMesh } => {
  const tieBottom = 4.86, tieTop = 5.14, ridge = underside(0);
  const tie = box(-halfSpan, halfSpan, tieBottom, tieTop, z - 0.11, z + 0.11);
  // 두 경사재는 용마루 축을 0.05m 넘겨 서로 파고들게 해 같은 변을 공유하지 않는다.
  const principal = merged([-1, 1].map((sx) => memberBelow(vec(sx * halfSpan, underside(sx * halfSpan), z), vec(-sx * 0.05, ridge + (ridge - underside(halfSpan)) / halfSpan * 0.05, z), 0.18, 0.2)));
  const king = box(-0.09, 0.09, tieTop, ridge - 0.2, z - 0.09, z + 0.09);
  const strut = merged([-1, 1].map((sx) => {
    const x = sx * halfSpan / 2;
    return memberAlong(vec(sx * 0.09, tieTop + 0.45, z), vec(x, underside(x) - 0.2, z), 0.14, 0.14);
  }));
  return { tie, principal, king, strut };
};

/** 천장 보 줄: x 범위 [west, east], z 위치들, 아랫면 2.92m·윗면 3.10m, 폭 0.12m. */
export const ceilingJoists = (west: number, east: number, zs: readonly number[], bottom: number, top: number): IAutoMovieMesh =>
  merged(zs.map((z) => box(west, east, bottom, top, z - 0.06, z + 0.06)));

/** 포치 보·코니스·경사 트림. front는 south-outer, apex는 삼각 막음 꼭대기. */
export const porchEntablature = (half: number, front: number, bottom: number, apex: number): { beam: IAutoMovieMesh; cornice: IAutoMovieMesh; raking: IAutoMovieMesh } => {
  const beamTop = bottom + 0.3;
  const beam = box(-half, half, bottom, beamTop, front - 0.3, front);
  const cornice = box(-half, half, beamTop - 0.1, beamTop, front, front + 0.08);
  const rise = (apex - beamTop) / half;
  const raking = merged([-1, 1].map((sx) => memberBelow(vec(sx * half, beamTop, front + 0.04), vec(-sx * 0.05, apex - rise * 0.05, front + 0.04), 0.08, 0.12)));
  return { beam, cornice, raking };
};
