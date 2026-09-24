# 하나로 이어지는 후면 공용부

## 공용부의 외곽과 열린 앞면 {#common-room-plan}
<!--
@evidence principles/core/common.md#scope-preservation kitchen-dining-family 한 방의 외곽, 앞쪽 두 열린 개구부와 닫힌 벽 구간, 세 기능 구역, 네 외벽 개구부 바인딩과 source owner를 맡는다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 X = [-5.50, 5.50], Z = [-10.45, -6.20] m와 living-common-opening X = [-5.00, -2.15], service-common-opening X = [-1.35, 3.07] m를 정한다.
@evidence principles/core/common.md#declared-basis 뒤·좌·우는 본채 외곽, 오른쪽 앞부분은 차고 접합에서 받고 세 기능의 위치는 03의 관계를 채택한 설정에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "하나의 연속 공간"을 문짝 없는 두 개구부와 팬트리 뒤 X = [3.22, 5.50] 닫힌 벽, 왼쪽 주방·중앙 식사·오른쪽 가족실 배치로 만든다.
@evidence principles/design/spaces.md#space-topology 공용부 앞쪽이 거실·서비스 접근·팬트리와 만나고 두 개구부로 거실·서비스 접근에 직접 연결되며 정원문으로 외부에 연결된다.
@evidence principles/design/spaces.md#space-boundary-authority 네 창/문 void는 각 입면 owner에서 소비하고 오른쪽 앞부분을 노출 외벽으로 중복 처리하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 두 진입에서 세 기능으로 가는 길, 정원문과 실제 외벽, 03의 공용부 시야와 각 구석 관찰을 반증 주소로 둔다.
@evidence settings/10-house.md#common-room 주방·식당·가족실을 완전 높이 칸막이 없이 한 방에 두고 주방은 왼쪽, 식탁은 정원 출입 가까이, 가족실은 오른쪽에 둔다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work common-room의 연속 공간·세 기능 위치를 대조했고 문짝 없는 living-common-opening·service-common-opening과 팬트리 뒤 X = [3.22, 5.50] 닫힌 벽으로 성립해 부모 수정이 없었다.
-->

`kitchen-dining-family`는 ground-storey의 방 하나다. 마감 안쪽 X = [-5.50, 5.50], Z = [-10.45, -6.20] m로 택한다. 뒤·좌·우는 [본채 외곽 경계](../00-building.md#main-building-extent), 앞쪽은 거실·서비스 접근·팬트리와 만나는 Z = [-6.20, -6.05] 경계다. 오른쪽 앞부분은 [차고의 뒤쪽 접합](../00-building.md#attached-garage-extent)에 닿으므로 본채 오른쪽 전체를 노출 외벽으로 처리하지 않는다. 주방·식당·가족실은 이 방 안의 기능 구역이며 [설정](../../settings/10-house.md#common-room)처럼 완전 높이 칸막이로 나누지 않는다.

`living-common-opening`은 앞쪽 경계의 X = [-5.00, -2.15], Y = [0, 2.40] m, `service-common-opening`은 X = [-1.35, 3.07], Y = [0, 2.40] m의 열린 개구부다. 문짝은 없다. 각각 [거실](living.md#living-plan), [서비스 접근의 뒤쪽 띠](service.md#service-access-plan)를 직접 잇는다. 팬트리 뒤쪽 X = [3.22, 5.50] 구간은 닫힌 벽으로 남긴다. 넓은 개구부의 상인방/지지 부재는 [방 사이 한 벽체](../07-boundary-assembly.md#interior-boundary-ownership)가 이 방 소스에 배정한 전면 칸막이 구조 바탕 안에서 해결한다.

[설정이 03에서 채택한 관계](../../settings/10-house.md#common-room)대로 주방은 왼쪽, 식사는 정원 출입 가까운 중앙, 가족실은 오른쪽에 둔다. [kitchen-rear-window](../envelope/rear.md#kitchen-rear-window), [garden-door](../envelope/rear.md#garden-door), [family-rear-window](../envelope/rear.md#family-rear-window), [family-right-window](../envelope/right.md#family-right-window)를 같은 방의 외벽에 바인딩한다. 아래 공간 예약은 정원문 안쪽 대기와 주방 창 아래 상판 높이를 소비하며 기구·가구의 바닥 점유와 통행을 먼저 대조하기 위한 것이다. 실제 가구·설비 geometry나 fit-out 완료가 아니다. 앞쪽 두 개구부 사이의 통행과 정원문 진입을 식탁 의자 사이로만 배정하지 않는다. `src/spaces/rooms/common.ts`가 전체 내부를 소유한다. 두 진입에서 세 기능으로 가는 길, 정원문과 실제 외벽, 03의 공용부 시야 및 각 구석 관찰은 unverified다.

## 왼쪽 벽 주방의 기구와 작업 점유 {#common-kitchen-wall-reservation}
<!--
@evidence principles/core/common.md#scope-preservation 왼쪽/후면 L형 하부장, 냉장고, 레인지와 오븐, 전자레인지, 두 상부장, 기기 문 작동과 열린 기기 앞 작업을 모두 배정한다.
@evidence principles/core/common.md#substantive-completion 일곱 점유 owner의 평면·높이·방향 표, 상판 0.91 m, 냉장고/오븐 문 +X 최대 0.55 m, 열린 기기 앞 작업 영역 두 곳을 정한다.
@evidence principles/core/common.md#declared-basis 높이는 1층 완성 바닥 기준, 서벽·후벽은 공용부 안쪽 경계를 참조하고 수치는 제품 규격 인용이 아니라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주방 설비 목록을 레인지를 후면 창 아래가 아닌 왼쪽 벽에 두고 전자레인지 자리에 상부장을 겹치지 않는 배치로 만든다.
@evidence principles/design/spaces.md#space-topology 주방을 kitchen-dining-family 내부의 기능 구역으로 두고 별도 room이나 칸막이를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 뒤쪽 상판은 주방 창의 높이 상한을 소비하고 L형 두 띠의 교차 코너 몸체를 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 기기 형상·열림 범위·점유 충돌·창/상부장 단면과 03의 읽힘, 문/서랍을 닫은 상태의 거실 쪽 진입을 반증 관찰로 둔다.
@evidence settings/10-house.md#kitchen-equipment 왼쪽/후면 L형 하부장·두 상부장과 냉장고·레인지와 오븐·전자레인지를 벽 주방에 배정하고 두 번째 수도꼭지를 창 앞에 넣지 않는다.
@evidence settings/00-production.md#use-profile 열린 냉장고/오븐 앞 작업에 사람 점유체의 깊이를 X, 폭을 Z로 적용한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work kitchen-equipment의 기기 목록·"두 수도꼭지를 필수 중복 설비로 해석하지 않는다"와 use-profile을 L형 벽 주방에 적용했고 열린 기기 작업과 통로가 분리돼 부모 수정이 없었다.
-->

이 주방은 위 kitchen-dining-family/ground-storey 내부의 기능 구역이며 별도 room이나 칸막이가 없다. [주방 설비 설정](../../settings/10-house.md#kitchen-equipment)을 위한 왼쪽/후면 L형 수납, 냉장고·레인지·전자레인지의 공간을 아래처럼 예약한다. X/Z는 방과 같은 world 좌표이고 높이는 [1층 완성 바닥](../01-storeys.md#storey-datums) 위의 값이다. 표의 서벽·후벽은 [공용부 안쪽 경계](#common-room-plan)의 해당 면을 참조한다. 수납장 깊이와 손잡이·전면 돌출도 이 외곽 안에 포함해야 한다. 실제 제품 규격으로 인용하는 수치가 아니다.

| 점유 owner | 평면 예약 | 높이/방향과 접합 |
| --- | --- | --- |
| 왼쪽 하부장 띠 | X는 서벽에서 -4.85 m까지, Z는 후벽에서 -7.40 m까지, 아래 레인지 점유 제외 | 상판 상면 높이 0.91 m. 작업면은 +X. |
| 뒤쪽 하부장 띠 | X는 서벽에서 -2.15 m까지, Z는 후벽에서 -9.80 m까지 | 같은 상판 높이. 작업면은 +Z이며 왼쪽 띠와 겹친 모서리는 한 수납 코너다. |
| 냉장고 | X는 서벽에서 -4.70 m까지, Z = [-7.40, -6.45] m | 높이 1.85 m, +X 전면의 위 양문/아래 서랍 예약. |
| 레인지와 아래 오븐 | X는 서벽에서 왼쪽 하부장 전면까지, Z = [-9.50, -8.70] m | 조리면은 상판 높이, 오븐은 +X 전면. 후면 창 바로 아래가 아니라 왼쪽 벽에 둔다. |
| 레인지 위 전자레인지 | X는 서벽에서 -5.10 m까지, Z는 레인지와 같음 | 하단 1.45 m·상단 1.85 m, +X 전면. 같은 자리에 별도 상부장을 겹치지 않는다. |
| 왼쪽 상부장 | X는 서벽에서 -5.15 m까지, Z = [-8.70, -7.40] m | 하단 1.45 m·상단 2.35 m. 냉장고/전자레인지 예약과 분리한다. |
| 뒤쪽 짧은 상부장 | X = [-3.00, -2.15] m, Z는 후벽에서 -10.10 m까지 | 같은 상부장 높이. 주방 창/바깥 문과 겹치지 않는 오른쪽 짧은 끝이다. |

뒤쪽 상판은 [주방 창의 높이 상한](../envelope/rear.md#kitchen-rear-window)을 지키며 창 앞에 높은 장이나 두 번째 수도꼭지를 넣지 않는다. 바닥의 L형 두 띠는 영역의 합집합으로 소비하고 교차 코너의 몸체를 복제하지 않는다. [섬](#common-island-reservation)과 사이가 작업 통로다. 냉장고 문/서랍은 +X로 최대 0.55 m, 오븐 아래 경첩 문은 +X로 최대 0.55 m까지 펼치는 작동 예약이다. 그 밖의 손잡이를 더해 통로를 잠식하는 제품/원형은 이 공간 입력으로 되돌려 고친다.

열린 냉장고 앞 작업 점유는 X = [-4.15, -3.70], Z = [-7.40, -6.45] m, 열린 오븐 앞은 X = [-4.30, -3.70], Z = [-9.50, -8.70] m로 둔다. 사용자는 +X 쪽에서 기기를 향하고 [사람 점유체](../../settings/00-production.md#use-profile)의 깊이를 X, 폭을 Z에 적용한다. 작업 중에는 해당 주방 통로를 통과 동선으로 주장하지 않으며 중앙 서비스에서 정원으로 가는 [별도 경로](#common-clear-routes)를 유지한다. 문/서랍을 닫았을 때의 거실 쪽 주방 진입과 작업 자세는 따로 검사한다. 실제 기기 형상·열림 범위·점유 충돌·창/상부장 단면과 03의 읽힘은 unverified다.

## 싱크 섬과 세 좌석의 점유 {#common-island-reservation}
<!--
@evidence principles/core/common.md#scope-preservation 섬의 몸체·작업면·좌석면, 싱크/수도꼭지, 식기세척기와 열린 문 앞 작업, 세 스툴과 그 사용 점유를 맡는다.
@evidence principles/core/common.md#substantive-completion 섬 X = [-3.65, -2.60], Z = [-8.70, -6.45] m, 싱크 X = [-3.55, -3.05], Z = [-8.60, -8.10] m, 스툴 Z 중심을 -8.30 m에서 0.70 m 간격으로 세 개 산출하는 규칙을 정한다.
@evidence principles/core/common.md#declared-basis 상판 높이는 벽 주방에서 받고 수치는 배관/전기 연결이나 기기 성능의 검증이 아니라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "섬의 설거지/준비 면과 좌석 면을 구분"을 서쪽 작업면·동쪽 좌석면과 동쪽 끝 0.30 m 무릎 공간으로 만든다.
@evidence principles/design/spaces.md#space-topology 섬을 공용부 안에 두고 거실에서 들어오는 개구부를 막는 벽이나 섬 끝 기둥을 세우지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 식기세척기 작업 Z를 벽 주방 오븐 작동 구간과 겹치지 않게 배치하고 좌석 뒤 여유를 주 동선 폭에 더하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 가장 좁은 곳, 싱크/식기세척기와 맞은편 기기, 03에서 싱크 섬과 세 좌석이 읽히는지를 반증 관찰로 둔다.
@evidence settings/10-house.md#kitchen-equipment 싱크와 수도꼭지가 있는 섬과 식기세척기를 섬 설비로 둔다.
@evidence settings/10-house.md#common-room 섬 앞 좌석 3개를 개수·pitch 규칙으로 배치한다.
@evidence settings/00-production.md#build-allocation 스툴 원형/다리/등받이는 models, 세 개 배치는 instances가 이 공간 입력을 소비하도록 역할을 나눈다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work common-room의 섬 좌석 3개, kitchen-equipment의 섬 싱크, use-profile의 사람 폭을 대조했고 0.70 m 간격 세 좌석과 무릎 공간이 들어가 부모 수정이 없었다.
-->

섬은 같은 공용부의 X = [-3.65, -2.60], Z = [-8.70, -6.45] m에 놓는다. 상판 높이는 [벽 주방](#common-kitchen-wall-reservation)과 같다. 서쪽 -X는 작업면, 동쪽 +X는 세 스툴의 좌석면이다. 수납 몸체는 상판의 동쪽 끝에서 0.30 m 물려 무릎 공간을 남기고, 외곽 밖으로 상판이나 손잡이를 추가하지 않는다. 거실에서 들어오는 개구부를 가로막는 벽이나 섬 끝 기둥을 세우지 않는다.

[주방 설비의 섬 싱크/수도꼭지](../../settings/10-house.md#kitchen-equipment)의 상판 예약은 X = [-3.55, -3.05], Z = [-8.60, -8.10] m다. 수도꼭지는 이 평면에서 상판 위 0.40 m 이내에 두며 외벽 창과 별개인 섬의 설비다. 식기세척기는 같은 섬의 -X 전면에서 Z = [-8.05, -7.45] m, 몸체 깊이 0.60 m의 예약을 받는다. 아래 경첩 문은 서쪽으로 최대 0.60 m 펼친다. 열린 문 앞 작업 점유는 X = [-4.85, -4.25], Z = [-8.10, -7.40] m다. 벽 주방의 오븐 작동 구간과 Z가 겹치지 않게 배치했다. 이 예약은 배관/전기 연결이나 기기 작동 성능의 검증이 아니다.

스툴은 [섬 앞 좌석 3개 요구](../../settings/10-house.md#common-room)를 받는 -X 방향의 세 좌석이다. Z 중심은 -8.30 m에서 0.70 m 간격으로 세 개를 산출한다. 각 좌석의 의자·착석/뒤로 물린 사용 점유는 섬 동쪽 끝부터 X = -1.65 m까지, 중심 Z의 양옆 0.325 m 안에 예약한다. [사람 폭](../../settings/00-production.md#use-profile)을 좌석 폭에 맞춰 줄이지 않는다. 좌석 높이는 바닥 위 0.64 m이며 실제 원형/다리/등받이는 models, 세 개 배치는 instances가 이 공간 입력을 소비할 때 저작한다. 세 좌석을 하나의 긴 가구라고 바꾸거나 좌석 뒤 여유를 주 동선의 폭에 더하지 않는다.

서쪽 작업 통로, 섬의 뒤쪽 회전, 세 좌석과 식탁 사이를 [경로 예약](#common-clear-routes)과 대조한다. 개수·pitch·사용 범위에서 파생한 실제 점유와 가장 좁은 곳, 싱크/식기세척기와 맞은편 기기, 03에서 싱크 섬과 세 좌석이 읽히는지는 unverified다.

## 여섯 식사 좌석과 정원문 대기 {#common-dining-reservation}
<!--
@evidence principles/core/common.md#scope-preservation 식탁 상판, 여섯 좌석의 반복 규칙과 사용 점유, 정원문 대기와의 분리, 주 동선의 통과 위치를 맡는다.
@evidence principles/core/common.md#substantive-completion 상판 X = [-0.35, 1.35], Z = [-8.40, -7.50] m, 높이 0.75 m와 긴 양변 X 중심을 0 m에서 1.00 m 간격으로 두는 규칙, 양 끝 각 한 좌석을 정한다.
@evidence principles/core/common.md#declared-basis 식탁 치수는 여섯 좌석 요구와 뒤쪽 문 대기를 함께 담기 위한 저작 선택이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 가족과 손님의 6개 좌석을 두 반복 규칙으로 생성하고 수작업 복제 좌표나 불투명 점유 상자를 최종 가구로 쓰지 않게 한다.
@evidence principles/design/spaces.md#space-topology 식사 구역을 공용부 중앙에 두고 뒤쪽 좌석 끝과 garden-door 안쪽 대기를 분리한다.
@evidence principles/design/spaces.md#space-boundary-authority 정원문 안쪽 대기는 rear owner, 주 동선은 common-clear-routes에서 받고 좌석 점유의 합집합과 전체 bbox를 구별한다.
@evidence principles/design/spaces.md#space-verification-address 의자 수·반복·방/층 binding, 꺼낸 여섯 좌석과 문짝/경로의 충돌, 03의 식사 자리 읽힘을 반증 관찰로 둔다.
@evidence settings/10-house.md#common-room 식탁을 후면 정원 출입 가까이에 두고 가족과 손님이 함께 앉는 6개 좌석을 배정한다.
@evidence settings/00-production.md#use-profile 각 좌석 폭 방향 사용 점유를 중심 양옆 0.325 m, 깊이를 상판 끝에서 바깥으로 0.75 m로 두어 사람 점유체를 줄이지 않고 소비한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work common-room의 6개 좌석·정원 출입 근접과 use-profile의 사람 폭을 대조했고 X = [-0.35, 1.35], Z = [-8.40, -7.50] m 상판 주위에 여섯 사용 점유가 문 대기와 분리돼 부모 수정이 없었다.
-->

식사 구역은 같은 공용부 중앙에 두고 정원문 앞을 비운다. 식탁 상판 평면은 X = [-0.35, 1.35], Z = [-8.40, -7.50] m, 높이는 바닥 위 0.75 m다. 치수는 [가족과 손님이 함께 앉는 여섯 좌석 요구](../../settings/10-house.md#common-room)와 뒤쪽 문 대기를 같이 담기 위한 저작 선택이다. 식탁 다리/의자는 이 범위를 소비할 원형으로 저작하되 상판 아래 다리 때문에 좌석별 무릎 공간이 사라지면 원형과 배치를 함께 고친다.

긴 양변에는 각 두 좌석을 두고 X 중심은 0 m에서 1.00 m 간격으로 산출한다. 각 좌석의 폭 방향 사용 점유는 중심 X의 양옆 0.325 m, 깊이는 상판의 해당 Z 끝에서 바깥으로 0.75 m다. 양 끝에는 각 한 좌석을 두며 Z는 식탁 중심의 양옆 0.325 m, X는 해당 식탁 끝에서 바깥으로 0.75 m다. 이 폭은 [사람 점유체](../../settings/00-production.md#use-profile)를 줄이지 않고 소비한다. 의자는 식탁을 향한다. 이 두 반복 규칙으로 모두 여섯 좌석을 생성하며 수작업 복제 좌표나 여섯 개의 불투명 점유 상자를 최종 가구로 쓰지 않는다.

위 점유는 의자를 꺼내 앉는 범위까지 포함한다. 실제 의자 자체의 크기와 구분하며, 사용 중 의자 뒤를 통로라고 세지 않는다. 검사에는 식탁과 각 좌석 점유의 합집합을 사용한다. 전체 축정렬 bbox의 빈 모서리를 의자 몸체로 잘못 해석하지 않는다. 뒤쪽 좌석 끝과 [garden-door 안쪽 대기](../envelope/rear.md#garden-door)는 분리되어야 하며 [주 동선](#common-clear-routes)은 식탁 오른쪽과 뒤쪽을 지난다. 의자 수·반복·방/층 binding, 꺼낸 여섯 좌석과 문짝/경로의 실제 충돌·03의 식사 자리 읽힘은 unverified다.

## 오른쪽 가족실의 좌석과 창 접근 {#common-family-reservation}
<!--
@evidence principles/core/common.md#scope-preservation 가족실 소파와 낮은 테이블, 두 창의 하부 접근, 측면 통로, 후속 소품의 책임을 맡는다.
@evidence principles/core/common.md#substantive-completion 소파 최대 점유 X = [3.25, 5.35] m·Z = -7.15 m부터 앞쪽 안쪽 면·높이 0.90 m, 테이블 X = [3.40, 4.50], Z = [-8.35, -7.80] m·높이 0.42 m를 정한다.
@evidence principles/core/common.md#declared-basis 소파 뒤쪽 면은 기존 팬트리와의 닫힌 경계, 통로 목표는 0.90 m, 창대 돌출은 06에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 가족실의 소파와 낮은 테이블을 -Z 정원/창 쪽을 향하게 두고 테이블 오른쪽으로 창에 돌아갈 공간을 남기는 배치를 더한다.
@evidence principles/design/spaces.md#space-topology 가족실을 공용부의 오른쪽 기능 구역으로 두고 별도 벽/문/방 id를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 소파 뒤쪽 면을 common-room-plan이 닫아 둔 팬트리 경계에 대고 그 앞에 별도 벽을 세우지 않으며 두 창 void는 입면 owner에서 소비한다.
@evidence principles/design/spaces.md#space-verification-address 서비스 진입에서 좌석과 두 창으로의 접근, 앉은 시야, 03의 세 기능과 점유/그림자 읽힘을 반증 관찰로 둔다.
@evidence settings/10-house.md#common-room 우측 가족실 좌석에 소파와 낮은 테이블을 두고 주 통과 경로를 그 사이에만 두지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work common-room의 우측 가족실·소파와 낮은 테이블, use-profile의 0.90 m 통로를 대조했고 창 쪽 측면 통로가 유지돼 부모 수정이 없었다.
-->

가족실은 같은 공용부의 오른쪽이며 [설정](../../settings/10-house.md#common-room)이 요구한 소파와 낮은 테이블을 둔다. 소파의 최대 점유는 X = [3.25, 5.35] m, Z는 -7.15 m에서 [공용부 앞쪽 안쪽 면](#common-room-plan)까지, 높이 0.90 m로 하고 -Z의 정원/창 쪽을 향한다. 뒤쪽 면은 기존 팬트리와의 닫힌 경계에 닿으며 방 앞쪽에 별도 벽을 세우지 않는다. 낮은 테이블은 X = [3.40, 4.50], Z = [-8.35, -7.80] m, 높이 0.42 m의 예약이다. 둘 사이 여유는 앉고 일어나는 자리이며 주 통과 경로를 그 사이에만 두지 않는다.

[family-rear-window](../envelope/rear.md#family-rear-window)와 [family-right-window](../envelope/right.md#family-right-window)의 하부와 창대 접근을 높은 책장/스크린으로 막지 않는다. 소파 왼쪽은 중앙의 주 경로에서 접근하고 테이블의 오른쪽으로는 창 쪽으로 돌아갈 공간을 남긴다. [창대/손잡이 돌출](../06-openings.md#external-opening-interface)을 포함해 이 측면의 통로 폭을 읽고 커튼·걸레받이·소품 이후에도 [연속 통로 폭 목표](../../settings/00-production.md#use-profile)인 0.90 m를 유지한다. 별도 벽/문/방 id를 만들거나 소파를 식당 의자로 대신하지 않는다.

소파/테이블 원형과 러그·조명·소품은 후속 단계의 저작이다. 공간 입력은 models/instances가 소비하고 방 안쪽의 완결 면 책임은 `src/spaces/rooms/common.ts`에 유지한다. 서비스 진입에서 좌석과 두 창으로의 접근, 앉은 시야·03 공용부의 세 기능과 실제 점유/그림자 읽힘은 unverified다.

## 가구 작업 영역을 돌아가는 공용 동선 {#common-clear-routes}
<!--
@evidence principles/core/common.md#scope-preservation 서비스 개구부에서 정원문까지의 주 경로 두 띠, 가족실 분기, 거실에서 주방을 거쳐 합류하는 후면 띠와 필요한 관찰을 맡는다.
@evidence principles/core/common.md#substantive-completion 오른쪽 띠 X = 2.10 m부터, 뒤쪽 띠 X = -1.50 m부터, 주방 후면 띠 X = [-4.85, -0.35], Z = [-9.80, -8.70] m를 정한다.
@evidence principles/core/common.md#declared-basis 띠의 끝은 service-common-opening과 garden-door 안쪽 대기, 공용부 벽 안쪽 면에서 받고 0.90 m 목표는 use-profile에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "주방 작업대나 식탁 사이만이 유일한 통로가 되지 않게"를 service-common-opening에서 garden-door 안쪽 대기로 꺾이는 오른쪽·뒤쪽 두 띠와 living-common-opening에서 벽 기구와 섬 사이로 들어가 후면 띠로 합류하는 별도 주방 경로로 만든다.
@evidence principles/design/spaces.md#space-topology 같은 kitchen-dining-family 안의 경로이며 벽/문/새 복도를 추가하지 않고 두 띠가 꺾여 정원문 대기에 닿는다.
@evidence principles/design/spaces.md#space-boundary-authority 대기를 경로 위에 별도 바닥으로 겹치지 않고 열린 기기 앞 작업 공간을 통과 폭으로 중복 계상하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 닫힌/열린 기구·의자 사용 점유를 함께 놓은 평면, 섬과 벽 주방 단면, 정원문/의자/후면 띠 단면, 두 진입의 왕복 시야를 관찰로 든다.
@evidence settings/00-production.md#use-profile 바구니 포함 사용 점유체의 양방향 이동과 0.90 m 이상 통로 목표를 주 경로에 적용한다.
@evidence settings/10-house.md#common-room service-common-opening에서 들어와 garden-door 안쪽 대기로 가는 오른쪽·뒤쪽 두 띠를 두어 주방 작업대나 식탁 사이만이 유일한 통로가 되지 않게 한다.
@evidence obligations/design/spaces.md#space-access-circulation service-common-opening에서 garden-door 안쪽 대기와 가족실 좌석으로 가는 두 띠를 손잡이·사용 점유로 줄이지 않고 living-common-opening에서 기기를 닫은 기준 상태의 작업면 사이로 후면 띠에 합류하는 주방 경로를 배정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work common-room의 유일 통로 금지와 use-profile의 바구니 포함 사용 점유체를 주 경로에 적용했고 가구 예약을 돌아가는 띠가 성립해 부모 수정이 없었다.
-->

같은 kitchen-dining-family 내부의 경로이며 벽/문/새 복도를 추가하지 않는다. [service-common-opening](#common-room-plan)에서 정원으로 가는 주 경로의 오른쪽 띠는 X = 2.10 m부터 그 개구부의 오른쪽 끝까지, Z = -9.25 m부터 공용부 앞쪽 안쪽 면까지다. 뒤쪽 띠는 X = -1.50 m부터 같은 개구부 오른쪽 끝까지, Z는 공용부 후벽 안쪽 면부터 -9.25 m까지다. 두 띠가 꺾여 [garden-door 안쪽 대기](../envelope/rear.md#garden-door)에 닿는다. 대기를 이 경로 위에 별도 바닥으로 겹치지 않는다. 오른쪽 띠에서 가족실 좌석으로 분기한다. 창·문·가구의 손잡이나 사용 점유로 이 띠를 줄이지 않는다.

거실에서 주방으로는 [living-common-opening](#common-room-plan) 중 벽 기구와 섬 사이로 들어간다. 기기를 닫은 기준 상태에서 작업면 사이를 따라 후면의 X = [-4.85, -0.35], Z = [-9.80, -8.70] m 띠로 돌아 위 뒤쪽 주 경로에 합류한다. 냉장고가 다른 하부장보다 돌출한 구간은 그 몸체 외곽에서 순폭을 읽는다. 이 후면 띠는 식탁의 긴 변 좌석과 끝 좌석 사이 빈 모서리를 지나며 실제 좌석별 점유를 대조한다. 열린 기기 앞 작업 공간을 다른 사람의 통과 폭으로 중복 계상하지 않는다.

주 경로에서는 [바구니 포함 사용 점유체](../../settings/00-production.md#use-profile)의 양방향 이동과 0.90 m 이상 통로 목표를 확인한다. 주방의 열린 기기 작업은 해당 H2의 별도 사용 자세로 검사한다. 필요한 관찰은 바닥 평면에 닫힌/열린 기구·의자 사용 점유를 함께 놓은 대조, 섬과 벽 주방의 단면, 정원문/의자/후면 띠 단면, 두 진입에서 각 기능과 정원으로 갔다 돌아오는 시야다. 외곽 좌표의 산술을 실제 충돌·도달성 판정으로 바꾸지 않는다. 전체 방의 threshold·코너·중심 방향과 03의 추가 질문은 [관찰 owner](../04-observations.md#spatial-observation-derivation)가 유지하며 모든 실제 순폭·경로·프레임은 unverified다.
