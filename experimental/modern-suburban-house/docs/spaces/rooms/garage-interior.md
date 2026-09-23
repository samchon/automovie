# 비워 둔 차고 내부

## 머드룸 연결과 비어 있는 바닥 {#garage-interior-plan}
<!--
@evidence principles/core/common.md#scope-preservation 빈 차고 내부의 경계 소비, 머드룸 문, 전면문·측면 창, 문턱과 차도, 천장 폐합, 바닥 바탕, 차량 배제와 source owner를 맡는다.
@evidence principles/core/common.md#substantive-completion 차량 점유를 비우고 설정의 선반·공구와 차고 구조를 후벽 수납과 내부 경로에 배정하며 문을 닫아도 머드룸으로 내부 관찰에 도달하게 한다.
@evidence principles/core/common.md#declared-basis 외곽·공유 벽은 attached-garage-extent, 바닥/천장 높이는 ground-threshold-datums, 천장은 garage-ceiling-closure, 바닥은 garage-ground-floor-base에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 차고 설정을 문 안쪽에 별도 턱이 없는 문턱 바닥과 머드룸 경유 관찰로 정하고 차량 대신 수납·경로에 바닥을 배정한다.
@evidence principles/design/spaces.md#space-topology garage는 ground-storey 부속 공간이고 서쪽 경계의 머드룸 문으로 집과, 전면문으로 차도와 연결된다.
@evidence principles/design/spaces.md#space-boundary-authority 두 번째 차고 상자나 외벽을 만들지 않고 머드룸의 높은 문턱/챌면은 laundry owner가 한 번 생성한다.
@evidence principles/design/spaces.md#space-verification-address 앞문·레일·천장·저장 가구를 넣은 뒤의 경계, 머드룸 접근, 각 코너의 실내 pose, 콘크리트 바닥과 문 구조의 읽힘을 검사한다.
@evidence settings/10-house.md#garage 자동차를 어떤 형태로도 저작하지 않고 내부 관찰을 머드룸 연결로 확보한다.
@evidence settings/00-production.md#delivery-scope 자동차가 전달물에 없으므로 주차용 가짜 실루엣·차량의 일부도 차고에 추가하지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 차량 금지·머드룸 관찰·콘크리트 바닥과 천장 요구, delivery-scope의 자동차 제외를 대조했고 빈 바닥과 수납 배정으로 성립해 부모 수정이 없었다.
-->

`garage`는 ground-storey의 부속 공간이다. 외곽·공유 벽·안쪽 면은 [차고 외곽 owner](../00-building.md#attached-garage-extent), 바닥/천장 높이는 [문턱 datum](../01-storeys.md#ground-threshold-datums)을 소비한다. 독립적으로 두 번째 차고 상자나 외벽을 만들지 않는다. [머드룸 문](laundry.md#laundry-plan)은 이 방 서쪽 경계에 실제 개구부로 바인딩되고 실내 진입 뒤의 평탄 대기도 같은 결정을 받는다.

정면의 [garage-front-door와 상부 이동 예약](../envelope/front.md#garage-front-opening), 측면의 [garage-right-window](../envelope/right.md#garage-right-window)를 소비한다. 문턱 바닥은 바깥 벽면까지 이어져 [차도](../site/driveway.md#driveway-plan)에 닿으며 문 안쪽에 별도 턱을 만들지 않는다. 실제 문틀/레일·창호 부재는 아직 미완료다. 문이 닫혀도 머드룸을 통해 내부 관찰에 도달한다. 차량 점유는 비우고 [설정이 요구하는 선반·공구와 차고 구조](../../settings/10-house.md#garage)를 [후벽 수납](#garage-storage-use)과 [내부 경로](#garage-use-routes)에 배정한다. [전달물](../../settings/00-production.md#delivery-scope)에 자동차가 없으므로 자동차·주차용 가짜 실루엣·차량의 일부는 추가하지 않는다.

`src/spaces/rooms/garage-interior.ts`가 완결 내부를 소유한다. 앞문·문 레일·천장·저장 가구를 넣은 뒤의 경계와 머드룸 접근, 각 코너의 실내 pose, 콘크리트 바닥과 문 구조의 읽힘을 검사한다. 실제 room/storey binding·동선·부재·GPU 관찰은 unverified다.

이 방에서 보이는 천장은 [차고 천장 폐합](../09-ceiling-assembly.md#garage-ceiling-closure)의 동일 경계를 소비한다. 공통 바탕은 garage 구조 owner가 맡고 이 방은 자기 전체 천장 마감과 벽 접촉을 통합한다. 지붕 아래 빈 부피나 문 레일을 숨기기 위해 천장을 올리거나 임의 구멍을 남기지 않는다.

바닥은 [낮은 차고 바탕](../10-ground-floor.md#garage-ground-floor-base)의 동일 윗면을 소비하고 [전면 문턱](../10-ground-floor.md#ground-threshold-junctions)까지 연속해서 이 방 owner가 마감한다. 머드룸의 높은 문턱/챌면은 laundry owner가 한 번 생성하며 이 방에서 별도 단이나 판을 포개지 않는다. 실제 지표와 바탕 아래 지지는 아직 미완료다.

## 후벽 선반과 공구 작업대 {#garage-storage-use}
<!--
@evidence principles/core/common.md#scope-preservation 후벽 선반, 공구 작업대와 서랍, 공구판, 사람 작업 바닥, 전면문 이동과 측면 창과의 관계를 맡는다.
@evidence principles/core/common.md#substantive-completion 선반 X = [7.15, 8.85] m·높이 2.05 m와 다섯 선반을 0.20 m부터 0.40 m 간격으로, 작업대 X = [9.00, 10.20] m·상면 0.90 m, 서랍 +Z 최대 0.45 m를 정한다.
@evidence principles/core/common.md#declared-basis 높이는 본채 바닥이 아닌 차고 완성 바닥 기준이며 공구 종류·수·원형은 후속 저작이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 선반·공구 수납을 후벽에 모아 중앙 바닥과 머드룸 대기를 비우는 배치로 만든다.
@evidence principles/design/spaces.md#space-topology 수납을 garage 후벽에 두고 오른쪽 창을 가로지르는 높은 옆벽 수납을 두지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 후벽 안쪽 면과 차고 바닥 datum은 원래 owner에서 받고 상부 문 이동 예약 뒤에 수납을 둔다.
@evidence principles/design/spaces.md#space-verification-address 점유/순높이/간섭과 빈 차고의 읽힘, 측면 고정창의 안쪽 깊이와 손잡이 접근을 검사한다.
@evidence settings/10-house.md#garage 선반·공구 수납을 후벽 선반 X = [7.15, 8.85] m, 공구 작업대 X = [9.00, 10.20] m와 공구판의 공간 예약으로 두고 중앙 바닥과 머드룸 대기를 비운다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 선반·공구 수납과 차고문 레일/상부 구조를 대조했고 수납을 레일 뒤 후벽에 두어 성립해 부모 수정이 없었다.
-->

같은 garage/ground-storey의 후벽에 수납을 모아 중앙 바닥과 서쪽 머드룸 대기를 비운다. 선반의 평면 예약은 X = [7.15, 8.85] m, Z는 [차고 후벽 안쪽 면](../00-building.md#attached-garage-extent)부터 -5.85 m까지이며 전체 높이는 차고 바닥 위 2.05 m다. 다섯 선반의 상면 높이는 차고 바닥 위 0.20 m부터 0.40 m 간격으로 산출한다. 기둥·선반 두께·상자/용기는 이 몸체 안에 담으며 앞쪽으로 쌓아 [통로](#garage-use-routes)를 줄이지 않는다. 사람이 서는 선반 앞 바닥은 X가 선반 폭과 같고 Z = [-5.85, -4.80] m다.

공구 작업대는 X = [9.00, 10.20] m, Z는 선반과 같은 후벽 깊이의 예약이며 상면은 차고 바닥 위 0.90 m다. 아래 공구 서랍은 +Z 방향으로 최대 0.45 m 펼치고, 열린 서랍 앞의 사람 작업 바닥은 같은 X 폭에서 Z = [-5.40, -4.80] m다. 후벽의 공구판/걸린 공구는 같은 X 범위, 후벽에서 앞으로 0.15 m 이내, 바닥 위 높이 1.10–2.10 m에 둔다. 공구 종류와 수·세부 원형은 후속 저작이지만 살아 있는 기계 작동이나 전기 성능을 주장하지 않는다.

이 높이들은 본채 바닥이 아닌 [차고 완성 바닥](../01-storeys.md#ground-threshold-datums)을 기준으로 한다. 선반/작업대는 [상부 문 이동 예약](../envelope/front.md#garage-front-opening) 뒤쪽이며 오른쪽 창을 가로지르는 높은 옆벽 수납은 두지 않는다. [측면 고정창](../envelope/right.md#garage-right-window)의 안쪽 깊이와 손잡이/창대를 포함한 접근은 내부 경로에서 검사한다. 모든 몸체·원형·반복·상자/공구 placement와 그 그림자는 아직 미구현이다. 완결 내부 owner는 `src/spaces/rooms/garage-interior.ts`를 유지하며 실제 점유/순높이/간섭과 빈 차고의 읽힘은 unverified다.

## 문을 닫은 차고의 내부 접근 {#garage-use-routes}
<!--
@evidence principles/core/common.md#scope-preservation 머드룸 하부 대기에서 선반·작업대·측면 창·전면문 안쪽으로 가는 세 경로와 열린 전면문으로 나가는 경로, 추가 관찰을 맡는다.
@evidence principles/core/common.md#substantive-completion 서쪽 세로 경로 X = [5.95, 6.95] m, 가운데 가로 경로 Z = [-4.75, -3.85] m, 오른쪽 세로 접근 X = 10.35 m부터의 띠를 정한다.
@evidence principles/core/common.md#declared-basis 경로 끝은 후벽 수납 전면, 차고 오른쪽 안쪽 면, 실내 창호 돌출 한계에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 문을 닫은 상태에서도 머드룸 차고 쪽 하부 대기를 기점으로 선반·작업대·측면 창·닫힌 전면문 안쪽에 닿는 경로를 배정하고 기둥/수직 레일을 관통하는 경로를 만들지 않는다.
@evidence principles/design/spaces.md#space-topology 서쪽 세로·가운데 가로 두 경로와 문 앞 대기의 겹침을 연결로 넘기고 새 room이나 숨은 통로를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 문 레일 점유는 전면문 owner가 정한 값으로 경로에서 제외한다.
@evidence principles/design/spaces.md#space-verification-address 수납·서랍·작업자와 바구니 이동을 같이 놓은 평면, 차고 바닥 기준 단면, 닫힌/열린 패널과 레일, 머드룸 한 단 왕복을 추가한다.
@evidence settings/00-production.md#use-profile 기존 사용체로 바구니 회전과 양방향 경로를 검사한다.
@evidence settings/00-production.md#operative-subjects 가족을 사용 조건일 뿐 인물로 모델링하지 않고 차량을 전달 밖에 두므로 이 경로 검사는 캐릭터/차량 저작이 아니다.
@evidence obligations/design/spaces.md#space-access-circulation 머드룸에서 차고의 수납·창·전면문까지 두 문 상태 모두의 입출입 경로를 배정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 머드룸 관찰 경로·닫힌 기준 상태와 use-profile을 차고 내부 경로에 적용했고 X = [5.95, 6.95] m 세로 경로와 Z = [-4.75, -3.85] m 가로 경로가 성립해 부모 수정이 없었다.
-->

머드룸의 [차고 쪽 하부 대기](laundry.md#laundry-plan)에서 같은 garage 내부의 선반, 작업대, 측면 창, 닫힌 전면문 안쪽으로 이동한다. 서쪽 세로 경로는 X = [5.95, 6.95] m, Z는 [후벽 수납의 전면](#garage-storage-use)부터 -0.95 m까지다. 가운데 가로 경로는 X가 서쪽 세로 경로의 왼쪽 끝부터 [차고 오른쪽 안쪽 면](../00-building.md#attached-garage-extent)에서 [실내 창호 돌출 한계](../06-openings.md#external-opening-interface)만큼 물린 지점까지, Z = [-4.75, -3.85] m다. 설계 입력에서 두 경로와 문 앞 대기의 겹치는 부분을 연결로 넘기며 새 room이나 숨은 통로를 만들지 않는다. 오른쪽 창 쪽 세로 접근은 X = 10.35 m부터 같은 안쪽 한계까지, Z는 후벽 수납의 전면부터 가운데 가로 경로의 앞쪽 끝까지다.

[선반/서랍 앞 작업](#garage-storage-use)은 위 가로 경로의 뒤쪽에 있고, 문 레일은 [전면문 owner](../envelope/front.md#garage-front-opening)가 정한 실점유로 경로에서 제외한다. 세로 경로의 앞쪽 끝에서 닫힌 전면문을 확인하고, 전면문을 열어 [차도](../site/driveway.md#driveway-plan)로 나갈 때는 정면 개구부의 실제 유효 폭 안으로 돌아 진입한다. 기둥/수직 레일을 관통해 직선으로 나가는 경로를 만들지 않는다. 두 문 상태 모두 [머드룸을 통한 입출입](../../settings/10-house.md#garage)을 유지한다.

수납 몸체·물건·열린 서랍·작업자와 바구니 이동을 같이 놓은 평면, 차고 바닥 기준의 수납/창/천장 단면, 닫힌/열린 전면 패널과 레일, 머드룸 한 단을 오가는 양방향 경로를 [전체 관찰](../04-observations.md#spatial-observation-derivation)에 더한다. [가족은 사용 조건이고 차량은 전달 밖](../../settings/00-production.md#operative-subjects)이므로 캐릭터/차량을 저작하는 지시가 아니라 기존 [사용체](../../settings/00-production.md#use-profile)의 통행 검사다. 나머지 코너와 바닥의 기본 관찰도 생략하지 않는다. 실제 geometry·수납 높이·바구니 회전·모든 코너의 자기 공간 안 pose·프레임은 unverified다.
