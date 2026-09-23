/**
 * 지상층의 Y 기준과 공통 구조 예약(m).
 * docs/spaces/storey.md#ground-storey를 소비하며 물리 바닥은 방 소유다.
 * 낮은 천장 위는 공간으로 등록하지 않고 열린 마당 상한도 렌더하지 않는다.
 */
export const templeLevels = {
  storey: "temple-ground",
  building: "temple",
  floor: 0,
  courtyard: -0.12,
  publicRoad: -0.24,
  serviceApproach: 0,
  slabThickness: 0.18,
  lowCeiling: 3.1,
  ceilingBoardReserve: 0.1,
  exposedBeamDepth: 0.18,
} as const;

/**
 * maps 산출물에서 읽은 외벽 접촉선의 최저 높이를 받는다.
 * docs/spaces/storey.md#wall-ground-contact의 식을 구현한다.
 * 외부 지면은 여기서 발명하지 않으며 비유한 값은 거부한다.
 * 인접 최저 완성면도 호출자가 실제 바닥/석단에서 유도해 전달한다.
 * 반환값은 공통 외벽 하단(m)이며 접지 검증 결과가 아니다.
 */
export const templeWallBottom = (
  outsideContactMinimum: number,
  adjacentFloorMinimum: number,
): number => {
  if (!Number.isFinite(outsideContactMinimum) ||
      !Number.isFinite(adjacentFloorMinimum)) {
    throw new Error("temple/storey: 실제 지면과 인접 바닥의 유한한 최저 높이가 필요합니다.");
  }
  return Math.min(outsideContactMinimum, adjacentFloorMinimum) -
    templeLevels.slabThickness;
};

/**
 * docs/spaces/storey.md#wall-ground-contact의 maps 이전 잠정 외부 접촉 최저값.
 * 판정된 건물 측 최저 외부 접점(정문 도로)이며 대지 후보나 Y=0 일괄값이 아니다.
 * maps가 더 낮은 접촉을 공급하면 호출자가 그 값으로 대체한다.
 */
export const templeProvisionalExteriorContact = (): number => templeLevels.publicRoad;
