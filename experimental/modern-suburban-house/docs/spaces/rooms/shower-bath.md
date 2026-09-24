# 복도 뒤쪽 샤워 욕실

## 침실을 통과하지 않는 샤워실 {#shower-bath-plan}
<!--
@evidence principles/core/common.md#scope-preservation shower-bathroom의 경계와 네 공유 벽, 복도 쪽 단일 문, 기구 사용 예약의 소비, 카펫 끝과 창 없음을 맡는다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 X = [0.90, 3.07], Z = [-8.80, -6.06] m, hall-shower-door X = [1.05, 2.05] m와 유효 폭 목표 0.90 m를 정한다.
@evidence principles/core/common.md#declared-basis 예약 순내부 2.17 × 2.74 m가 설비 사용에 충분하다는 검증은 아직 없다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "상층 복도에서 직접 들어가는 첫 욕실"을 -X 문설주 경첩·실내 -Z 열림의 문과 네 내부 경계 실로 만든다.
@evidence principles/design/spaces.md#space-topology 앞쪽 복도, 왼쪽 주침실, 오른쪽 욕조 욕실, 뒤쪽 옷방과 공유 벽으로 인접하고 주침실에 출입문을 추가하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 왼쪽 주침실 X = [0.75, 0.90], 오른쪽 욕조 욕실 X = [3.07, 3.22], 뒤쪽 옷방 Z = [-8.95, -8.80]의 공유 벽과 앞쪽 복도 벽을 경계로 두고 실제 외벽이 없는 곳에 창을 넣지 않는다.
@evidence principles/design/spaces.md#space-verification-address hall-shower-door와 샤워문의 동시 열림, 예약 순내부 2.17 × 2.74 m 안의 세 기능과 좁은 구석 시야를 검사한다.
@evidence settings/10-house.md#shower-bathroom 상층 복도에서 직접 들어가는 첫 욕실로 두고 주침실 전용 욕실로 바꾸지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work shower-bathroom의 "상층 복도에서 직접 들어가는 첫 욕실"과 주침실 비경유 조건을 대조했고 복도 쪽 hall-shower-door와 네 내부 경계 실로 성립해 부모 수정이 없었다.
-->

`shower-bathroom`은 upper-storey의 별도 욕실이다. 마감 안쪽 X = [0.90, 3.07], Z = [-8.80, -6.06] m다. 앞쪽은 [복도](upper-hall.md#upper-hall-plan), 왼쪽은 주침실과 X = [0.75, 0.90]의 공유 벽, 오른쪽은 욕조 욕실과 X = [3.07, 3.22]의 공유 벽, 뒤쪽은 옷방과 Z = [-8.95, -8.80]의 공유 벽이다. 네 면이 내부 경계인 실이며 실제 외벽이 없는 곳에 창을 넣지 않는다.

`hall-shower-door`는 앞쪽 Z = [-6.06, -5.91]의 벽에서 X = [1.05, 2.05], Y = [3.06, 5.26] m의 거친 개구부를 소유한다. 최종 유효 폭 0.90 m를 목표로 하고 -X 문설주 경첩에서 실내 -Z로 연다. 주침실에 출입문을 추가하지 않는다.

예약 순내부 2.17 × 2.74 m 안에서 [유리 샤워부스·변기·세면장](../../settings/10-house.md#shower-bathroom)은 [기구 사용 예약](#shower-fixture-use)을 소비한다. 이 예약이 실제 설비 사용에 충분하다는 검증은 아직 없다. 카펫은 방 문턱에서 끝나며 물 사용 설비는 정지 상태다. `src/spaces/rooms/shower-bath.ts`가 소유한다. 방 문과 샤워문 동시 열림, 자기 내부의 세 기능과 좁은 구석 시야는 unverified다.

## 유리 부스와 두 위생 기구의 접근 {#shower-fixture-use}
<!--
@evidence principles/core/common.md#scope-preservation 유리 부스와 세 겹 미닫이, 부스 앞 대기, 변기·세면장과 사용, 거울, 수전과 헤드, 수건, 진입 순서를 맡는다.
@evidence principles/core/common.md#substantive-completion 부스를 방 왼쪽 안쪽 면부터 X = 2.15 m·뒤쪽부터 Z = -7.70 m까지, 유리 상단 2.10 m, 대기 X = [0.95, 1.85], Z = [-7.65, -7.05] m, 부스 앞과 세면장 사이 0.90 m 예약을 정한다.
@evidence principles/core/common.md#declared-basis 외여닫이 유리문을 실문이나 오른쪽 기구 접근을 막을 수 있어 선택하지 않았다는 근거를 남기고 방수·배수 성능을 주장하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "샤워문과 실 출입문이 기구 사용 공간을 동시에 막지 않아야"를 세 겹 미닫이와 실문 회전 밖의 부스 앞 대기로 만든다.
@evidence principles/design/spaces.md#space-topology 부스를 별도 방 id로 만들지 않고 실문에서 세면대·부스 앞을 거쳐 세면장 뒤로 돌아 변기에 닿는 순서를 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 수전/헤드 돌출은 미닫이 문 점유와 분리하고 수건은 세면장 앞 사용과 실문 회전에서 벗어나게 둔다.
@evidence principles/design/spaces.md#space-verification-address 문 두 개의 개방, 부스 진입, 세면장/변기 사용, 05의 재료 구분과 모든 구석을 전체 관찰에 둔다.
@evidence settings/10-house.md#shower-bathroom 유리 샤워부스·세면대·변기·거울·수건을 두고 샤워문과 실 출입문이 기구 사용을 동시에 막지 않게 한다.
@evidence settings/00-production.md#use-profile 실문·유리/레일·손잡이·거울/수건을 넣은 뒤 같은 사용체로 진입 순서와 문 조작 대기를 다시 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work shower-bathroom의 기구 목록·문 비충돌과 use-profile을 부스·변기·세면장 배치에 적용했고 세 겹 미닫이 부스와 실문 회전 밖의 부스 앞 대기로 성립해 부모 수정이 없었다.
-->

같은 shower-bathroom/upper-storey에서 [샤워 욕실 설정](../../settings/10-house.md#shower-bathroom)의 기구를 뒤쪽 왼편 부스, 뒤쪽 오른편 변기, 앞쪽 오른편 세면장으로 둔다. 샤워부스를 별도 방 id로 만들어 욕실의 질문을 옮기지 않는다. world X/Z m 기준 부스는 X가 방 왼쪽 안쪽 면부터 2.15 m까지, Z는 뒤쪽 안쪽 면부터 -7.70 m까지다. 유리 상단은 상층 바닥 위 2.10 m, 바닥/턱 상면은 0.02 m 이내로 예약한다. 실제 방수·배수 성능의 주장이 아니다.

부스 앞쪽 +Z 경계는 세 겹으로 포개지는 미닫이 유리로 택한다. 패널과 레일은 부스 점유 안에서 움직이고 오른쪽에 모여 왼쪽 통과 폭 0.80 m 이상을 남겨야 한다. 검은 손잡이·유리문·도기/타일의 읽힘은 유지한다. 앞쪽 대기는 X = [0.95, 1.85], Z = [-7.65, -7.05] m다. [실 출입문](#shower-bath-plan)의 90° 열린 문짝/손잡이가 이 대기에 들어오지 않아야 한다. 외여닫이 유리문은 실문 또는 오른쪽 기구 접근을 막을 수 있어 선택하지 않았다. 패널 폭·겹침·frame 뒤 실제 유효 폭은 후속 원형에서 확인한다.

변기는 X = [2.32, 2.97] m, Z는 방 뒤쪽 안쪽 면부터 -8.05 m까지, 좌면 0.43 m·최대 높이 0.82 m로 예약하고 +Z를 향한다. 앞쪽 사용은 X = [2.27, 3.02], Z = [-8.05, -7.45] m다. 세면장은 X = 2.52 m부터 방 오른쪽 안쪽 면까지, Z = [-6.80, -6.10] m, 상면 높이 0.85 m, -X 전면이다. 세면장 앞 사용은 X = [1.92, 2.52], Z = [-6.80, -6.20] m이며 거울은 같은 오른쪽 벽에서 높이 1.10–1.90 m·돌출 0.04 m 안에 둔다. 부스 앞쪽 면과 세면장 뒤쪽 끝 사이의 0.90 m 예약에 부재나 물건을 추가해 줄이지 않는다.

샤워 수전과 헤드는 부스의 뒤 벽 X = [1.00, 1.30] m 범위에 두고, 수전 높이는 상층 바닥 위 1.05 m, 헤드 높이는 2.05 m다. 벽에서 부스 안쪽으로의 최대 돌출은 수전 0.10 m·헤드 0.20 m이며 미닫이 문 점유와 분리한다. 수건은 실 앞쪽 벽 X = [2.20, 2.45] m, 높이 1.10–1.50 m, 돌출 0.08 m 이내에 두어 세면장 앞 사용과 실문 회전에서 벗어나게 한다. 수전/헤드·수건과 사용자의 실제 간섭은 부스 단면과 전신 점유로 다시 읽는다.

실문에서 세면대와 부스 앞 바닥으로 들어오고, 세면장 뒤쪽을 돌아 부스 오른쪽에서 변기에 닿는다. 변기 앞 작업은 해당 기구의 목적지이며 샤워부스를 통과해서 가지 않는다. [사용체](../../settings/00-production.md#use-profile), 실제 문·유리/레일·손잡이·거울/수건을 넣은 뒤 이 순서와 문 조작 대기를 다시 검사한다. 문 두 개의 개방, 부스 진입, 세면장/변기 사용, 05의 재료 구분과 자기 공간 안 모든 구석은 [전체 관찰](../04-observations.md#spatial-observation-derivation)이 맡는다. 실제 기구/문 순폭·통행·원형·프레임은 unverified다.
