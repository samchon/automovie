/**
 * 지상층의 Y 기준과 공통 구조 예약(m).
 * docs/spaces/storey.md#ground-storey를 소비하며 물리 바닥은 방 소유다.
 * 낮은 천장 위는 공간으로 등록하지 않고 열린 마당 상한도 렌더하지 않는다.
 * @evidence spaces/storey.md 지상층 ID와 완성면·중정·도로·서비스 접점 높이, 구조 두께·널판 천장 높이를 한 값 객체로 둔다.
 * @evidenceReview spaces/storey.md #5d7106d # templeLevels 한 객체에 temple-ground와 네 접지 높이·slab·낮은 천장 예약이 있어 이 production의 층 높이 원천이 분산되지 않는다.
 * @evidence spaces/storey.md#ground-storey Y=0 완성면, 중정 -0.12, 도로 -0.24, 구조체 0.18, 낮은 천장 3.10과 예약 0.10·보 깊이 0.18을 설계 값 그대로 옮긴다.
 * @evidenceReview spaces/storey.md#ground-storey #60d7f43 # floor 0, courtyard −0.12, publicRoad −0.24와 구조체·천장·보 예약 값을 지상층 표와 수치별로 대조했다.
 * @evidence spaces/storey.md#threshold-support 문턱 바닥이 쓰는 완성면과 구조체 두께를 방 바닥과 같은 값으로 제공해 벽 두께 안 문턱 예약이 같은 높이를 쓴다.
 * @evidenceReview spaces/storey.md#threshold-support #6354225 # 모든 roomFloorInput이 templeLevels.floor와 slabThickness를 받아 문턱 slab과 방 slab이 같은 완성면·두께를 소비한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 높이와 예약만 가지며 바닥·천장 실체는 방 소유 함수가 만든다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이 export에는 숫자와 storey ID만 있고 바닥·천장 mesh를 생성하는 함수는 각 방 파일에 남는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 모든 방·벽·connector가 같은 층 기준을 받는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # storey 객체가 공통 floor·slab·ceiling 값을 제공해 방 cell과 외벽 하단 계산이 독립 높이 리터럴에 의존하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work storey.md의 층 하나와 완성면·예약 값을 그대로 옮겼고 바닥 결산(floors model 닫힘, 체적 66.849m³)과 문턱 connector가 이 값으로 성립했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # temple-ground 한 층의 수치가 부모 표와 같고 이 객체가 새 층·계단 높이를 도입하지 않아 설계층 수리는 없었다.
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
 * @evidenceReview spaces/storey.md #5d7106d # templeWallBottom은 대지·인접 바닥의 두 최저 입력을 받아 공통 외벽 하단 하나만 반환한다.
 * @evidence spaces/storey.md#wall-ground-contact 두 최저값 중 낮은 쪽에서 구조체 두께 0.18m를 뺀 값을 공통 외벽 하단으로 돌려준다.
 * @evidenceReview spaces/storey.md#wall-ground-contact #ca2c8ba # 반환식 Math.min(outsideContactMinimum, adjacentFloorMinimum)−slabThickness가 벽 하단의 부모 산식을 그대로 구현한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 외부 지면을 여기서 만들지 않고 호출자가 site의 지면과 실제 바닥에서 읽은 값만 받는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 함수의 두 매개변수로 접지값을 받으며 site grade mesh나 새 바닥 좌표를 이 층 파일에 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 두 입력이 유한하지 않으면 거부하고 아니면 하나의 하단 높이(m)를 반환한다. 접지 검증 결과는 주장하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 두 Number.isFinite guard가 비유한 접지값을 거부하고 성공 경로에서 하나의 m 단위 하단 수치를 반환한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work storey.md#wall-ground-contact의 식을 그대로 구현했고 현재 입력에서 하단 -0.42m가 나와 벽 실체와 기단이 지면 아래로 이어진다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # wall-ground-contact가 정한 min−0.18m 식을 그대로 쓰고 대지 높이는 호출자가 공급해 부모 접지 규칙을 수정하지 않았다.
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
