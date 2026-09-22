/**
 * 공간 owner가 준 평면/완성면/실제 지붕 하부로 engine의 볼록 cells를 만든다.
 * 이는 논리 경계이며 바닥/벽 mesh, 빈 공간 또는 충돌 통과를 보증하지 않는다.
 * 지붕이 방 본체를 덮지 못하면 누락을 상자로 채우지 않고 오류를 반환한다.
 */
import type { IAutoMovieConvexSpaceCell } from "@automovie/interface";
import {
  edgeInside, partitionPlan, rectanglePolygon,
  type HeightPlane, type PlanPoint, type PlanRectangle, type RoofPatch,
} from "./planar-domain";

export interface DoorPassage {
  id: string;
  boundary: string;
  room: string;
  adjacent: string;
  axis: "x" | "z";
  center: number;
  wallLow: number;
  wallHigh: number;
  width: number;
  height: number;
  frame: number;
  leafThickness: number;
  swing: "room-double" | "room-north" | "room-south";
}

/** 실제 wall-depth와 통과 폭에서 문턱 평면을 유도한다. */
export const passageRectangle = (door: DoorPassage, includeFrame: boolean): PlanRectangle => {
  const halfWidth = door.width / 2 + (includeFrame ? door.frame : 0);
  return door.axis === "x"
    ? { west: door.center - halfWidth, east: door.center + halfWidth,
      north: door.wallLow, south: door.wallHigh }
    : { west: door.wallLow, east: door.wallHigh,
      north: door.center - halfWidth, south: door.center + halfWidth };
};

/** CCW 다각형 위, floor 이상, ceiling 이하의 정확한 볼록 cell. */
export const polygonCell = (
  id: string, polygon: readonly PlanPoint[], floor: number, ceiling: HeightPlane,
): IAutoMovieConvexSpaceCell => ({
  id,
  planes: [
    ...polygon.map((point, i) => {
      const edge = edgeInside(point, polygon[(i + 1) % polygon.length]!);
      return { normal: { x: -edge.x, y: 0, z: -edge.z }, offset: edge.constant };
    }),
    { normal: { x: 0, y: -1, z: 0 }, offset: -floor },
    { normal: { x: -ceiling.x, y: 1, z: -ceiling.z }, offset: ceiling.constant },
  ],
});

/** 유한한 열린 마당 또는 낮은 천장 본체. 상한은 렌더 geometry가 아니다. */
export const levelCell = (
  id: string, rect: PlanRectangle, floor: number, ceiling: number,
): IAutoMovieConvexSpaceCell => polygonCell(
  id, rectanglePolygon(rect), floor, { x: 0, z: 0, constant: ceiling },
);

/** 실제 합성 지붕 조각별로 분해하고 방 평면 전체의 덮임을 요구한다. */
export const roofedCells = (
  id: string, rect: PlanRectangle, floor: number,
  roof: readonly RoofPatch[], verticalThickness: number,
): IAutoMovieConvexSpaceCell[] => {
  const bounds = rectanglePolygon(rect);
  let covered = 0;
  const cells = roof.flatMap((patch) => {
    const { inside } = partitionPlan(bounds, patch.polygon);
    if (inside.length === 0) return [];
    covered += area(inside);
    return [polygonCell(`${id}.${patch.id}`, inside, floor, {
      ...patch.height, constant: patch.height.constant - verticalThickness,
    })];
  });
  if (Math.abs(covered - area(bounds)) > 1e-6) {
    throw new Error(`${id}: 지붕 덮임 ${covered}m²가 본체 ${area(bounds)}m²와 다릅니다.`);
  }
  return cells;
};

/** 문틀 자리 없이 유효 통과 부피만, 해당 방 소유의 추가 cell로 만든다. */
export const thresholdCells = (
  room: string, doors: readonly DoorPassage[], floor: number,
): IAutoMovieConvexSpaceCell[] => doors.filter((door) => door.room === room)
  .map((door) => levelCell(
    `${room}.threshold.${door.id}`, passageRectangle(door, false),
    floor, floor + door.height,
  ));

/** XZ 면적(m²), CCW 다각형 입력. 덮임 검사는 카메라/시각 판단이 아니다. */
const area = (polygon: readonly PlanPoint[]): number => polygon.reduce((sum, a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return sum + a.x * b.z - b.x * a.z;
}, 0) / 2;
