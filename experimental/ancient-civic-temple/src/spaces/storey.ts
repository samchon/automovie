/**
 * 지상층의 Y 기준과 공통 구조 예약(m).
 * docs/spaces/storey.md#ground-storey를 소비하며 물리 바닥은 방 소유다.
 * 낮은 천장 위는 공간으로 등록하지 않고 열린 마당 상한도 렌더하지 않는다.
 * @evidence spaces/storey.md 지상층 ID와 완성면·중정·도로·서비스 접점 높이, 구조 두께·널판 천장 높이를 한 값 객체로 둔다.
 * @evidence spaces/storey.md#ground-storey Y=0 완성면, 중정 -0.12, 도로 -0.24, 구조체 0.18, 낮은 천장 3.10과 예약 0.10·보 깊이 0.18을 설계 값 그대로 옮긴다.
 * @evidence spaces/storey.md#threshold-support 문턱 바닥이 쓰는 완성면과 구조체 두께를 방 바닥과 같은 값으로 제공해 벽 두께 안 문턱 예약이 같은 높이를 쓴다.
 * @evidence principles/core/source-units.md#source-scope-preservation 높이와 예약만 가지며 바닥·천장 실체는 방 소유 함수가 만든다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 모든 방·벽·connector가 같은 층 기준을 받는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work storey.md의 층 하나와 완성면·예약 값을 그대로 옮겼고 바닥 결산(floors model 닫힘, 체적 66.849m³)과 문턱 connector가 이 값으로 성립했다.
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
 * 대지 지면(docs/spaces/site.md#site-grade)에서 읽은 외벽 접촉선의 최저 높이를 받는다.
 * docs/spaces/storey.md#wall-ground-contact의 식을 구현한다.
 * 외부 지면은 여기서 발명하지 않으며 비유한 값은 거부한다.
 * 인접 최저 완성면도 호출자가 실제 바닥/석단에서 유도해 전달한다.
 * 반환값은 공통 외벽 하단(m)이며 접지 검증 결과가 아니다.
 * @evidence spaces/storey.md 외벽 공통 하단을 실제 지면 최저 접촉과 인접 최저 완성면에서 유도하는 식을 구현한다.
 * @evidence spaces/storey.md#wall-ground-contact 두 최저값 중 낮은 쪽에서 구조체 두께 0.18m를 뺀 값을 공통 외벽 하단으로 돌려준다.
 * @evidence principles/core/source-units.md#source-scope-preservation 외부 지면을 여기서 만들지 않고 호출자가 site의 지면과 실제 바닥에서 읽은 값만 받는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 두 입력이 유한하지 않으면 거부하고 아니면 하나의 하단 높이(m)를 반환한다. 접지 검증 결과는 주장하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work storey.md#wall-ground-contact의 식을 그대로 구현했고 현재 입력에서 하단 -0.42m가 나와 벽 실체와 기단이 지면 아래로 이어진다.
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
