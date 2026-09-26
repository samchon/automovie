/**
 * 방 소유의 바닥 입력을 실체 구획과 보행 지지 영역으로 분리한다.
 * XZ·Y는 world m, 각 구획의 내부는 서로 겹치지 않아야 한다.
 * 문턱 실체는 틀 아래까지, support는 유효 폭까지만 연장한다.
 * 부재와 충돌하지 않는 통과 여유를 이 입력만으로 판정하지 않는다.
 */
import type { PlanRectangle } from "./planar-domain";
import { passageRectangle, type DoorPassage } from "./spatial-cells";

export interface FloorRegion extends PlanRectangle {
  id: string;
  floor: number;
}

export interface FloorSlab extends FloorRegion {
  bottom: number;
  opening: string | null;
}

export interface FloorInput {
  space: string;
  surface: string;
  slabs: FloorSlab[];
  supports: FloorRegion[];
}

/**
 * 방 본체·문 profile·층 두께만 소비하며 새 바닥 치수는 정하지 않는다.
 * 반환 구획은 후속 면 생성과 벽의 문턱 예약 제거가 함께 사용한다.
 */
export const roomFloorInput = (
  space: string,
  body: readonly FloorRegion[],
  doors: readonly DoorPassage[],
  thickness: number,
  thresholdLevel: number,
): FloorInput => {
  if (!Number.isFinite(thickness) || thickness <= 0) {
    throw new Error(`${space}/floor: 양의 유한한 구조체 두께가 필요합니다.`);
  }
  const thresholds = doors.filter((door) => door.room === space);
  return {
    space,
    surface: `surface.${space}.floor`,
    slabs: [
      ...body.map((region) => ({ ...region,
        bottom: region.floor - thickness, opening: null })),
      ...thresholds.map((door) => ({
        ...passageRectangle(door, true), id: `threshold.${door.id}`,
        floor: thresholdLevel, bottom: thresholdLevel - thickness, opening: door.id,
      })),
    ],
    supports: [
      ...body.map((region) => ({ ...region })),
      ...thresholds.map((door) => ({
        ...passageRectangle(door, false), id: `threshold.${door.id}`, floor: thresholdLevel,
      })),
    ],
  };
};
