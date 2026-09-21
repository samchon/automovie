# 낮은 분수의 열린 중정

## 중앙의 열린 공간 {#court-volume}

공간 ID `courtyard`는 [기준선](../building.md#plan-datums)의 west-court~east-court, court-back~court-front 안에 있다. 완성면은 [층 높이](../storey.md#ground-storey)를 따르고 하늘은 열려 있다. 북·남·동·서 모두 같은 주랑에 접하며 새 문이나 닫힌 벽을 그 사이에 넣지 않는다. 주 출입 threshold는 남쪽 축의 한 단 내려가는 접점이다. 다른 가장자리의 연속 석재 턱도 실제 단면으로 남긴다.

중심은 경계의 산술 중점에서 유도하고 분수 역시 같은 중심에 놓는다. [분수 정체성](../../settings/30-interiors.md#fountain)을 소비해 수반 외경 2.0m, 테두리 높이 중정 바닥 위 0.52m, 물면은 테두리 아래 0.08m, 물줄기 높이는 물면 위 0.65m를 채택한다. 이는 model/system의 후속 소비 입력이며 아직 수반 mesh나 수리시설을 만든 결과가 아니다. 원형 수반의 전체 둘레가 벽이나 턱과 닿지 않고 돌아갈 공간을 남긴다. 나무·가림막·두 번째 수조를 넣지 않는다.

source `src/spaces/rooms/courtyard.ts`는 중정 공간·바닥/턱의 완결 표면을 소유하며 분수 prototype은 복제하지 않는다. 네 안쪽 모서리와 중심의 네 방위, 남쪽 단차 threshold, 중앙 수반의 보행 여백을 관찰한다. 물판이 원 밖으로 드러나거나 높은 잔형으로 읽히면 수반의 후속 owner가 실패한 것이며 공간 중심은 임의 이동시키지 않는다.
