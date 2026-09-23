# 낮은 분수의 열린 중정

## 중앙의 열린 공간 {#court-volume}

<!--
@evidence principles/core/common.md#scope-preservation 중정의 열린 하늘·낮은 바닥·연속 석재 턱·중앙의 낮은 원형 수반과 한 물줄기를 함께 유지한다.
@evidence principles/core/common.md#substantive-completion 유한 논리 상한의 의미와 수반 외경 2.0m·테두리 0.52m·수위/물줄기 높이의 소비 입력을 정한다.
@evidence principles/core/common.md#declared-basis 중심은 경계 중점, 바닥은 층, 논리 상한은 주랑 처마 지지 높이를 소비하며 수반 수치는 model/system에 줄 설계 선택이다.
@evidence principles/design/spaces.md#space-topology 네 변이 같은 주랑에 열리고 남쪽 축의 단차로 진입하며 논리 상한은 물리 천장이나 새 층이 아니다.
@evidence principles/design/spaces.md#space-boundary-authority 바닥/턱은 중정 소유지만 분수 prototype을 복제하지 않고 논리 bounds로 시선·빛을 자르지 않는다.
@evidence principles/design/spaces.md#space-verification-address 모서리·중심 네 방위·남쪽 단차와 수반 둘레 여백을 보고 원 밖 물판이나 높은 잔형으로의 변형을 실패로 남긴다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 낮은 분수를 중정의 실제 산술 중심과 물면/테두리 상대 높이에 결속한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work fountain의 낮은 원형 수반과 services의 표시용 단일 물줄기를 적용해도 새 수조실이나 중정 추가가 필요하지 않았다. 공개 공간 상한은 표현용 논리 범위로만 정해 부모의 열린 하늘을 유지했다.
@evidence settings/30-interiors.md#fountain 수반을 경계 중점에 놓고 외경·낮은 테두리·단일 물줄기의 공간 입력을 제공한다.
@evidence settings/30-interiors.md#services 물면과 물줄기는 후속 model/system 소비 입력이며 실제 수리시설의 구현 결과로 주장하지 않는다.
@evidence settings/20-envelope.md#stone-floors 중정 바닥과 주랑 사이 연속 석재 턱을 실제 낮은 단면으로 남긴다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation 열린 하늘과 낮은 바닥, 원형 수반을 함께 두고 처마 지지 높이의 상한이 하늘을 닫는 지붕으로 바뀌지 않아 추가 나무·가림막·수조도 들어올 자리가 없다.
@evidenceReview principles/core/common.md#substantive-completion 상한 3.20m의 역할과 수반 외경·테두리·수위·물줄기의 상대 높이가 적혀 열린 중정도 유한한 공간으로 주소화된다.
@evidenceReview principles/core/common.md#declared-basis 상한은 assembly의 주랑 처마 지지 높이, 중심은 경계 중점에서 오고 수반 수치는 후속 model/system 입력으로 한정된다.
@evidenceReview principles/design/spaces.md#space-topology 네 변이 같은 주랑에 열린 채 남고 3.20m 상한이 물리 천장·새 층·닫힌 벽을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority 논리 bounds를 clipping에 쓰지 않고 중정 쪽 처마 slab과 상한의 겹침도 실제 roof에서 따로 읽게 해 수반 prototype을 이 파일이 가져가지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address 남쪽 한 단 threshold와 수반 둘레 보행 여백을 관찰 대상으로 두고 원 밖 물판·높은 잔형을 수반 owner의 실패로 구분했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation 낮은 분수 정체성을 중정 산술 중심과 테두리 대비 물높이라는 공간 결정에 묶었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work 수반과 단일 물줄기는 새 수조실 없이 들어가고 상한을 처마 높이로 옮겨도 부모의 열린 하늘을 유지해 settings를 고칠 이유가 없었다.
@evidenceReview settings/30-interiors.md#fountain 외경 2.0m·테두리 0.52m 수반이 경계 중점에 고정돼 다른 물체에 맞춰 옮겨지지 않는다.
@evidenceReview settings/30-interiors.md#services 물면·물줄기 높이를 후속 소비 입력으로만 적어 수리시설이 작동한다는 결과로 읽히지 않는다.
@evidenceReview settings/20-envelope.md#stone-floors Y=-0.12m 바닥과 주랑 사이 연속 석재 턱을 실제 단면으로 남겨 한 평면 포장으로 줄이지 않는다.
-->

공간 ID `courtyard`는 [기준선](../building.md#plan-datums)의 west-court~east-court, court-back~court-front 안에 있다. 완성면은 [층 높이](../storey.md#ground-storey)를 따르고 하늘은 열려 있다. 북·남·동·서 모두 같은 주랑에 접하며 새 문이나 닫힌 벽을 그 사이에 넣지 않는다. 주 출입 threshold는 남쪽 축의 한 단 내려가는 접점이다. 다른 가장자리의 연속 석재 턱도 실제 단면으로 남긴다.

논리 공간의 아래 경계는 완성 바닥 Y=-0.12m, 위 경계는 [주랑 처마의 공통 지지 높이](../roofs/assembly.md#roof-junctions) Y=3.20m를 소비한다. 처마대까지의 낮은 마당 공기 영역을 유한한 공간으로 식별하려는 설계 선택이다. 위 경계는 하늘을 닫는 천장이나 물리 지붕이 아니며 mesh·재료·그림자·보행 지지면을 만들지 않는다. 현재 평면과 두 높이로 닫힌 `cells` 범위를 선언하되, 그 범위를 비어 있는 통과 영역이라고 간주하지 않는다. 분수·돌출 처마·부재와 관찰 장비의 충돌은 실제 형상으로 별도 확인한다. 논리 상한은 관찰 위치의 공간 귀속에 쓰고 시선·조명·화면의 clipping에는 쓰지 않는다. 중정 안에서도 상한 너머의 하늘과 실제 지붕을 보며, 그 위에 숨은 층이나 두 번째 공간을 만들지 않는다.

중심은 경계의 산술 중점에서 유도하고 분수 역시 같은 중심에 놓는다. [분수 정체성](../../settings/30-interiors.md#fountain)을 소비해 수반 외경 2.0m, 테두리 높이 중정 바닥 위 0.52m, 물면은 테두리 아래 0.08m, 물줄기 높이는 물면 위 0.65m를 채택한다. 이는 model/system의 후속 소비 입력이며 아직 수반 mesh나 수리시설을 만든 결과가 아니다. 원형 수반의 전체 둘레가 벽이나 턱과 닿지 않고 돌아갈 공간을 남긴다. 나무·가림막·두 번째 수조를 넣지 않는다.

source `src/spaces/rooms/courtyard.ts`는 중정 공간·바닥/턱의 완결 표면을 소유하며 분수 prototype은 복제하지 않는다. 네 안쪽 모서리와 중심의 네 방위, 남쪽 단차 threshold, 중앙 수반의 보행 여백을 관찰한다. 물판이 원 밖으로 드러나거나 높은 잔형으로 읽히면 수반의 후속 owner가 실패한 것이며 공간 중심은 임의 이동시키지 않는다.
