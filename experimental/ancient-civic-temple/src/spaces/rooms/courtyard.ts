/**
 * docs/spaces/rooms/courtyard.md#court-volume의 열린 중정과 분수 소비 입력.
 * 유한 cell 상한은 관찰 귀속용이며 천장 mesh/그림자/clipping이 아니다.
 * 수반과 물줄기는 후속 prototype/system 소유로 geometry를 여기서 복제하지 않는다.
 */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import type { FloorBoundaryFace } from "../../geometry/floor-faces";
import { roomFloorInput } from "../../geometry/floor-input";
import { levelCell } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeRoofRules } from "../roofs/assembly";
import { templeLevels as y } from "../storey";

export const templeCourtyardPlan = {
  west: p.westCourt, east: p.eastCourt, north: p.courtBack, south: p.courtFront,
} as const;

/** 열린 중정의 낮은 실체 바닥. 분수 밑에 별도 가짜 지면을 놓지 않는다. */
export const templeCourtyardFloor = () => roomFloorInput(
  "courtyard", [{ ...templeCourtyardPlan, id: "body", floor: y.courtyard }],
  [], y.slabThickness, y.floor,
);

/**
 * docs/spaces/rooms/courtyard.md#court-volume의 연속 석재 턱 표면 소유.
 * 물리적으로 주랑 slab의 끝인 수직 노출면을 중정 소유에 귀속하되 복제하지
 * 않는다. 실제 입력 좌표에 일치하는 면만 선택하고 아래쪽 매입 면은 제외한다.
 */
export const templeCourtyardOwnsCurb = (face: FloorBoundaryFace): boolean => {
  if (face.space !== "colonnade" || face.direction === "top" || face.direction === "bottom") return false;
  const withinHeight = face.corners.every((v) => v.y >= y.courtyard && v.y <= y.floor);
  if (!withinHeight) return false;
  const onX = (x: number) => face.corners.every((v) =>
    v.x === x && v.z >= p.courtBack && v.z <= p.courtFront,
  );
  const onZ = (z: number) => face.corners.every((v) =>
    v.z === z && v.x >= p.westCourt && v.x <= p.eastCourt,
  );
  return onX(p.westCourt) || onX(p.eastCourt) || onZ(p.courtBack) || onZ(p.courtFront);
};

export const templeCourtyard = (): IAutoMovieBuiltSpace => ({
  id: "courtyard", kind: "courtyard", parent: y.storey, fidelity: "exact",
  cells: [levelCell("courtyard.body", templeCourtyardPlan, y.courtyard, templeRoofRules.supportHeight)],
});

/** 방 경계의 산술 중심과 m 단위 부재 입력. 분수의 구현 완료를 뜻하지 않는다. */
export const templeFountainInputs = () => ({
  center: { x: (p.westCourt + p.eastCourt) / 2, y: y.courtyard,
    z: (p.courtBack + p.courtFront) / 2 },
  outerDiameter: 2,
  rimHeight: y.courtyard + 0.52,
  waterHeight: y.courtyard + 0.52 - 0.08,
  jetTop: y.courtyard + 0.52 - 0.08 + 0.65,
});
