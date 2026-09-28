# 남동측 관리실

## 작성 작업의 첫 방 {#office-volume}

<!--
@evidence principles/core/common.md#scope-preservation 우측 첫 방에 작성 책상·스툴 인출·소량 용기를 배정하고 기록실과 다른 사용 밀도를 유지한다.
@evidence principles/core/common.md#substantive-completion 책상은 동벽 가까이, 스툴은 서쪽 통로로 빠지고 문은 남쪽 벽 쪽으로 열리는 예약을 정한다.
@evidence principles/core/common.md#declared-basis 남동측 본체는 기준선에서 받고 책상 역할은 관리실 설정, 문턱 귀속은 층 배정에서 소비한다.
@evidence principles/design/spaces.md#space-topology 북쪽 기록실과는 닫힌 벽을 공유하고 서쪽 주랑 문만 실내 접근으로 둔다.
@evidence principles/design/spaces.md#space-boundary-authority administration은 내벽·바닥·천장과 해당 문턱을 맡고 동측 roof와 집기 prototype은 소비자로 남긴다.
@evidence principles/design/spaces.md#space-verification-address 서쪽 threshold·모서리·네 방위 외에 책상에서 문까지 역방향 접근으로 스툴/문 충돌을 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 작은 작성실 요구에 책상 동벽 배치와 스툴 서쪽 인출이라는 공간 방향을 더한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work administration의 단일 책상과 workstation의 좌석 인출 요구를 방 안 동서 방향으로 배정했다. 기록실을 통과하거나 가구 종류를 바꿀 이유가 없었다.
@evidence settings/30-interiors.md#administration 소량 도구와 용기의 작성 작업 영역을 문서 칸 선반 중심의 이웃 방과 구별한다.
@evidence settings/35-objects.md#workstation 책상 진입과 스툴 인출이 문 스윙에 겹치지 않도록 서쪽 통로를 예약한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 작성 책상과 소량 용기가 주된 쓰임이고 기록실의 선반 밀도로 대체되지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 동쪽 책상과 서쪽 스툴 인출, 남쪽 문 스윙이 명시돼 방 안 작업의 방향이 정해진다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 본체 경계와 문턱을 각각 building과 storey에서 받아 임의 면적을 추가하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 북쪽 공유벽은 닫히고 서쪽 직접 문만 실내 접근이라 기록실을 우회 통로로 쓰지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 관리실 내부 표면과 동측 roof·집기 prototype의 책임이 분리돼 있다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 책상에서 문으로 돌아오는 관찰은 정면 문턱 시점만으로 가려지는 스툴 방해를 묻는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 관리 업무라는 부모 용도에 동벽 책상과 서쪽 인출 방향을 추가했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 단일 책상과 좌석 인출을 한 방 안에 배정했고 가구 종류 변경이나 기록실 관통이 필요하지 않았다.
@evidenceReview settings/30-interiors.md#administration #9a40923 작성 도구/소량 용기의 밀도가 이웃 기록실과 구별되는 조건으로 본문에 있다.
@evidenceReview settings/35-objects.md#workstation #67623f4 문 스윙을 남벽 쪽으로 받아 서쪽 인출과 책상 진입을 함께 비워야 한다.
-->

공간 ID `administration`의 본체는 [기준선](../building.md#plan-datums) east-room~east-inner, office-back~south-inner에 있다. 북쪽은 기록실, 동·남쪽은 외벽, 서쪽은 주랑이다. 서쪽의 직접 문만이 실내 접근이며 기록실을 통과하는 숨은 연결문은 없다.

동측 spine 안 `door-administration`의 문턱 바닥과 통과 부피는 [층의 배정](../storey.md#threshold-support)에 따라 관리실에 포함하며 주랑 쪽 벽면에서 이 방 본체까지 이어진다.

[관리실](../../settings/30-interiors.md#administration)의 단일 작성 책상은 동쪽 벽 가까이 두고 스툴이 서쪽 통로 방향으로 빠질 공간을 예약한다. 작성 도구와 소량 용기를 써서 칸 선반 중심의 기록실과 밀도를 구별한다. 문 스윙은 방 안 남쪽 벽 쪽으로 수용하고 책상 진입과 겹치지 않게 한다. 낮은 목재 천장은 [동측 지붕](../roofs/east.md#east-roof) 하부에 속한다.

source `src/spaces/rooms/administration.ts`가 공간과 내벽·바닥·천장 전체를 소유한다. 서쪽 threshold, 네 안쪽 모서리, 중심 네 방위가 기본 관찰이다. 여기에 책상에서 열린 문까지의 역방향 접근을 확인한다. 실제 문·가구의 비충돌과 작성실 읽힘은 source 및 GPU 관찰 전까지 unverified다.
