# 세탁·머드룸의 양쪽 문

## 서비스 통로와 차고 사이 {#laundry-plan}
<!--
@evidence principles/core/common.md#scope-preservation laundry-mudroom의 경계, 마주 보는 두 실문, 차고 쪽 한 단, 양쪽 대기, 작업/횡단 구분과 바닥 인계를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 네 변 경계, service-laundry-door·laundry-garage-door, 차고 쪽 0.15 m 한 단, 양쪽 대기, #laundry-equipment-use·#laundry-through-route로 가른 작업/횡단, 한 단 바닥 인계가 모두 적혀 누락이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 X = [3.22, 5.50], Z = [-4.55, -2.05] m, 두 문 개구부 Z = [-4.40, -3.35] m와 유효 폭 목표 0.95 m, 차고 하부 대기 X = [5.75, 6.80]·머드룸 상부 대기 X = [4.45, 5.50]을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 마감 안쪽 X = [3.22, 5.50]·Z = [-4.55, -2.05], 두 개구부 Z = [-4.40, -3.35]·Y = [0, 2.20]과 유효 폭 0.95 m, 두 대기 Z = [-4.43, -3.38]이 정해져 다음 층이 문·대기 위치를 새로 정할 필요가 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 차고 쪽 0.15 m 단차는 ground-threshold-datums, 높은 문턱의 지지는 ground-threshold-junctions에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 차고 쪽 0.15 m 단차를 ground-threshold-datums, 높은 문턱 지지와 상면/챌면 배정을 ground-threshold-junctions 링크에서 받고 서·동 변은 service-access-plan·attached-garage-extent로 근거를 둠을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "우측 띠와 차고 사이의 완충실"을 서쪽 칸막이와 동쪽 공유 벽의 두 문이 마주 보고 -Z 문설주에서 머드룸 안으로 열리는 배치로 만든다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정의 '우측 띠와 차고 사이의 완충실'에 대해 서쪽 칸막이와 동쪽 공유 벽에서 Z = [-4.40, -3.35]로 마주 보고 -Z 문설주에서 방 안으로 열리는 두 문이라는 공간층 결정이 더해짐을 대조했다.
@evidence principles/design/spaces.md#space-topology 서비스 접근과 차고를 잇는 두 실문을 같은 connector로 합치지 않고 이 방을 차고에 가는 유일한 내부 경로로 둔다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 서쪽 service-access-plan·동쪽 차고 공유 벽·앞 파우더룸·뒤 Z = [-4.70, -4.55] 팬트리 칸막이 인접과 두 실문을 별도 connector로 둔 연결, 집과 차고 사이 유일한 내부 경로 관계를 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 두 opening id를 src/spaces/rooms/laundry.ts와 공유 벽 owner가 소비하고 높은 문턱의 상면/노출 챌면은 ground-threshold-junctions가 이 방 owner에게 배정한 것으로 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 두 opening id를 laundry.ts와 공유 벽 owner가 같은 id로 소비하고 높은 문턱 상면/노출 챌면은 ground-threshold-junctions 배정으로 받으며 차고 하부 대기를 디딤판으로 덮지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 차고 하부 대기 X = [5.75, 6.80]과 머드룸 상부 대기 X = [4.45, 5.50]을 깎는 문틀·90° 문짝의 순폭, 문턱 단면, 양방향 바구니 이동을 반증 관찰로 둔다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 차고 쪽 X = [5.75, 6.80]과 머드룸 쪽 X = [4.45, 5.50] 대기를 깎는 문틀·90° 문짝의 순폭, 문턱 단면, 양방향 바구니 이동, 작업·횡단 간섭을 반증 관찰로 들고 unverified로 둠을 확인했다.
@evidence settings/10-house.md#laundry-mudroom 서비스 띠와 차고 사이 완충실에 세탁 설비와 신발/외투 기능을 함께 둔다.
@evidenceReview settings/10-house.md#laundry-mudroom #7f11a68 설정 laundry-mudroom의 완충실·세탁 설비·신발 벤치/외투 걸이 조건을 서비스 칸막이와 차고 공유 벽 사이 실제 방과 #laundry-equipment-use 소비 문장에 대조해 성립함을 확인했다.
@evidence settings/10-house.md#service-band 차고 출입문이 머드룸과 직접 맞닿게 공유 벽에 laundry-garage-door를 둔다.
@evidenceReview settings/10-house.md#service-band #d262882 설정 service-band의 '차고 출입문은 머드룸과 직접 맞닿는다'를 동쪽 본채/차고 공유 벽의 laundry-garage-door와 서쪽 칸막이의 service-laundry-door에 대조해 팬트리·파우더룸을 거치지 않음을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work laundry-mudroom의 완충실·차고 직접 연결과 garage의 머드룸 관찰 경로를 대조했고 마주 보는 두 문으로 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 laundry-mudroom의 완충실 조건과 garage의 머드룸 경유 관찰을 Z = [-4.40, -3.35]에서 마주 보는 두 문과 0.15 m 한 단으로 이어지는 양쪽 대기에 대조해 부모 수정 없이 성립함을 확인했다.
-->

`laundry-mudroom`은 ground-storey의 실제 방이다. 마감 안쪽 X = [3.22, 5.50], Z = [-4.55, -2.05] m다. 서쪽은 [서비스 칸막이](service.md#service-access-plan), 동쪽은 [본채/차고 공유 벽](../00-building.md#attached-garage-extent), 앞은 파우더룸 칸막이, 뒤는 Z = [-4.70, -4.55]의 팬트리 칸막이다. [세탁 설비와 완충 기능](../../settings/10-house.md#laundry-mudroom)을 같은 방에서 수행한다.

`service-laundry-door`와 `laundry-garage-door`는 각각 서쪽 칸막이와 동쪽 공유 벽에서 거친 개구부 Z = [-4.40, -3.35], Y = [0, 2.20] m를 소유한다. 두 문 모두 최종 유효 폭 0.95 m를 목표로 하고 -Z 문설주에서 머드룸 안으로 열린다. 개구부가 마주 보며 열린 문짝은 뒤쪽 가장자리로 향한다. 두 문을 같은 connector로 합치지 않는다. 차고 쪽 0.15 m 단차는 [기존 문턱 datum](../01-storeys.md#ground-threshold-datums)을 받는다.

기기·접는 상판·상부 수납과 벤치/걸이는 [세탁 작업 예약](#laundry-equipment-use)을 소비한다. 앞쪽 작업과 뒤쪽 두 실문 사이의 [횡단 경로](#laundry-through-route)를 구별하며 기기를 열어 놓았다는 이유로 [차고 내부 관찰도 거치는](../../settings/10-house.md#garage) 집과 차고 사이의 유일한 내부 경로가 끊기지 않게 한다.

차고 쪽 하부 대기 X = [5.75, 6.80]·Z = [-4.43, -3.38]와 머드룸 상부 대기 X = [4.45, 5.50]·Z = [-4.43, -3.38] m를 예약한다. 문틀과 90° 열린 문짝이 이 영역을 깎는 양도 실제 순폭에 포함한다. `src/spaces/rooms/laundry.ts`와 공유 벽 owner가 같은 두 opening id를 소비한다. 문턱 단면·양방향 바구니 이동·세탁 작업과 횡단의 간섭은 unverified다.

[한 단의 바닥 인계](../10-ground-floor.md#ground-threshold-junctions)는 높은 문턱을 공유 벽의 차고 쪽 면까지 본채 바탕으로 받치고, 그 상면/노출 챌면을 이 방 owner에게 배정한다. 기존 차고 하부 대기를 높은 디딤판으로 덮지 않으며 차고 바닥과 같은 끝선에서 만난다.

## 나란한 두 기기와 신발 벤치의 사용 {#laundry-equipment-use}
<!--
@evidence principles/core/common.md#scope-preservation 두 세탁 기기의 점유와 원형 문 작동, 바구니 작업, 접는 상판, 상부 수납, 신발 벤치와 걸이, 폐기한 벤치 방향의 기록을 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 두 기기 점유와 원형 문 -X 작동, 기기 앞 바구니 작업, 0.94 m 접는 상판, 상부 수납, 신발 벤치·걸이, 폐기한 앞벽 방향 벤치의 기록이 각각 적혀 설비 범위의 누락이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 기기 최대 폭 0.65 m·깊이 0.75 m·높이 0.88 m, Z 중심을 뒤쪽 끝에서 반 폭 물린 곳부터 0.65 m 간격으로 두 개 산출, 원형 문 -X 최대 0.50 m, 상판 0.94 m, 벤치 좌면 0.45 m를 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 기기 점유 X = 4.75 m부터·Z = -3.35 m부터, 기기 0.65 × 0.75 × 0.88 m, 0.65 m 간격 Z 중심, 문 -X 0.50 m, 상판 0.94 m, 상부 수납 1.50–2.30 m, 벤치 X = 3.62 m까지가 정해져 있음을 확인했다.
@evidence principles/core/common.md#declared-basis 기기 값은 특정 제품 규격이 아니며 앞벽 방향 벤치를 열린 기기 작업과 겹칠 수 있어 폐기했다는 근거를 남긴다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 기기 값이 특정 제품 규격이 아니라 몸체·원형 문·호스 여유를 담는 예약이라 밝히고 앞벽 방향 벤치가 열린 기기 앞 작업과 겹칠 수 있어 왼쪽 벽 방향으로 바꾼 근거를 남긴 것을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "나란한 앞문식 세탁기·건조기, 상부장/선반, 접는 상판, 신발 벤치와 외투 걸이"를 오른쪽 기기 벽과 왼쪽 벽 벤치의 배치로 만든다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정의 세탁기·건조기·상부장·접는 상판·신발 벤치·외투 걸이 목록에 대해 뒤쪽 세탁기·앞쪽 건조기 순서의 오른쪽 기기 벽과 +X를 향한 왼쪽 벽 벤치라는 배치 결정이 더해짐을 대조했다.
@evidence principles/design/spaces.md#space-topology 모든 설비를 laundry-mudroom 안에 두고 별도 방이나 문을 추가하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 기기·상판·상부 수납·벤치·걸이를 모두 같은 laundry-mudroom/ground-storey 안에 두고 별도 방이나 문을 추가하지 않아 방 그래프가 plan H2의 두 실문만으로 유지됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 벤치를 왼쪽 벽 방향으로 바꾸면서 실 외곽·문·층 datum은 유지했고 실제 경첩·문 지름·손잡이가 이 공간 예약을 넘으면 기기 원형과 배치로 돌아와 수정한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 벤치 방향을 바꾸면서 실 외곽·문·층 datum은 #laundry-plan 값을 유지하고 기기 점유 끝을 '방의 오른쪽 안쪽 면'으로 참조하며 초과 부재는 원형·배치로 되돌리는 규칙을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 두 기기 수·몸체/작동 범위·접는 상판·벤치/외투 점유와 작업/횡단 분리를 관찰 집합에서 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 두 기기 수·몸체/작동 범위·접는 상판·벤치/외투 실제 점유, 작업·횡단 분리, 작은 방 내부 읽힘을 spatial-observation-derivation 관찰 집합에 넘기고 unverified로 둔 것을 확인했다.
@evidence settings/10-house.md#laundry-mudroom 두 기기의 실제 깊이와 원형 도어, 세탁기 앞 바구니 작업 공간을 공간 예약으로 둔다.
@evidenceReview settings/10-house.md#laundry-mudroom #7f11a68 설정의 실제 깊이·원형 도어·세탁기 앞 바구니 작업을 깊이 0.75 m 기기 점유, 자기 폭 안 -X 0.50 m 원형 문 예약, 세탁기 앞 Z = [-3.35, -2.60] 작업 예약에 대조해 성립함을 확인했다.
@evidence settings/00-production.md#use-profile 열린 문 앞 바구니 작업에 사람 깊이를 X, 바구니 포함 폭을 Z로 적용한다.
@evidenceReview settings/00-production.md#use-profile #6ef5afe 기기 앞 작업 X = [3.80, 4.25]의 0.45 m를 점유체 깊이 0.45 m에, 세탁기·건조기 앞 Z 구간 각 0.75 m를 바구니 포함 폭 0.75 m에 대조하고 겹친 면적을 동시 작업으로 합산하지 않음을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work laundry-mudroom의 설비 목록·바구니 작업 공간과 use-profile의 0.75 m 폭을 오른쪽 기기 벽과 왼쪽 벤치로 나눈 방에 적용했고 벤치 방향 수정은 이 H2 안에서 해결돼 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 laundry-mudroom 설비 목록과 use-profile 0.75 m 폭을 적용해 기기 점유 Z = -3.35 m부터의 앞쪽 작업과 벤치를 뒤쪽 횡단에 넘기지 않고 벤치 방향 변경을 H2 안에서 해결해 부모 수정이 없음을 확인했다.
-->

같은 laundry-mudroom/ground-storey 안에서 오른쪽 기기 벽과 왼쪽 신발 벤치를 배정한다. 별도 방이나 문을 추가하지 않는다. 기기의 닫힌 점유 띠는 X = 4.75 m부터 [방의 오른쪽 안쪽 면](#laundry-plan)까지, Z = -3.35 m부터 앞쪽 안쪽 면까지다. 각 기기는 최대 폭 0.65 m·깊이 0.75 m·높이 0.88 m이며 뒤쪽 세탁기, 앞쪽 건조기 순서다. Z 중심은 뒤쪽 끝에서 반 폭만큼 물린 지점부터 0.65 m 간격으로 두 개를 산출한다. 이 값은 특정 제품 규격이 아니며 몸체·닫힌 원형 문·손잡이·뒤쪽 호스 연결 여유까지 이 점유 안에 담는다.

두 기기의 전면은 -X다. 각 원형 문의 작동 예약은 전면에서 -X로 최대 0.50 m, Z는 자기 기기 폭 내부에 한정한다. 열린 문 앞 바구니를 든 사람의 작업은 X = [3.80, 4.25] m, 세탁기 앞 Z = [-3.35, -2.60] m와 건조기 앞 Z = [-2.80, -2.05] m로 예약한다. [사용체](../../settings/00-production.md#use-profile)의 깊이를 X, 바구니 포함 폭을 Z에 적용한다. 두 기기의 작업 바닥은 한 사람이 순서대로 쓰며 일부 겹치는 면적을 동시 독립 작업으로 합산하지 않는다. 실제 경첩·문 지름·손잡이가 이 공간을 넘으면 기기 원형과 배치로 돌아와 수정한다. 뒤쪽 횡단 띠에 바구니를 내려놓지 않는다. 기기 앞 작업과 뒤쪽에서 다른 사람이 바구니를 운반하는 상태를 함께 관찰한다.

접는 상판은 두 기기 띠와 같은 평면의 상면 높이 0.94 m로 예약한다. 높이는 방의 완성 바닥 기준이고 지지 부재가 기기 원형 문을 가리지 않아야 한다. 상부 수납은 X = 5.20 m부터 오른쪽 안쪽 면까지, Z는 같은 두 기기 띠, 하단 높이 1.50 m·상단 2.30 m다. 아래 문짝/기기 사용을 방해하는 돌출은 허용하지 않는다. 세탁·전기·배기 성능이나 제품 설치 인증을 주장하지 않는다.

신발 벤치는 왼쪽 안쪽 면부터 X = 3.62 m까지, Z = -2.85 m부터 앞쪽 안쪽 면까지, 좌면 높이 0.45 m로 예약하고 +X를 향한다. 벤치 위 걸이와 걸린 외투의 최대 돌출은 같은 X 깊이 안이며 높이 1.10–1.85 m에 둔다. 신발을 신거나 벗는 점유는 벤치 전면부터 X = 4.25 m까지, Z는 벤치 폭 안이다. 이 바닥은 기기 앞 작업 점유와 일부 공유하므로 신발 착용과 바로 앞 기기 작업은 교대로 사용한다. 두 작업을 동시에 가능한 독립 면적으로 합산하지 않는다. 외투/신발의 수와 형상은 후속 원형·배치가 결정하되 걸린 옷을 뒤쪽 통로로 넘기지 않는다.

이전 앞벽 방향의 벤치 예약은 열린 기기 앞 작업과 몸체가 겹칠 수 있어 폐기하고 왼쪽 벽 방향으로 바꿨다. 실 외곽·문·층 datum은 유지했다. 공간 입력은 models/instances가 소비하고 방의 완결 면은 `src/spaces/rooms/laundry.ts`가 맡는다. 두 기기 수·몸체/작동 범위·접는 상판·벤치/외투의 실제 점유, 작업과 횡단 분리, 작은 방의 내부 읽힘은 [관찰 집합](../04-observations.md#spatial-observation-derivation)에서 검사하며 현재 unverified다.

## 기기를 열어도 남기는 차고 횡단 {#laundry-through-route}
<!--
@evidence principles/core/common.md#scope-preservation 두 출입문 사이의 횡단 띠, 문 회전과 통과의 구분, 한 단 내려가기, 차고 경로로의 연결을 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 두 출입문 사이 Z = [-4.32, -3.42] 횡단 띠, 문 회전 부채꼴과 통과 예약의 구분, 머드룸 상부 대기에서 한 단 내려가기, garage-use-routes로의 연결이 각각 적혀 누락이 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 방의 왼쪽 안쪽 면부터 오른쪽 안쪽 면까지 Z = [-4.32, -3.42] m를 사용 점유가 침범하지 않는 횡단 예약으로 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 횡단 띠를 방 왼쪽 안쪽 면부터 오른쪽 안쪽 면까지, Z = [-4.32, -3.42]로 정하고 90° 연 두 문 뒤에도 남을 폭을 요구해 다음 층이 통과 위치를 새로 정할 필요가 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 문 유효폭 목표는 laundry-plan, 작업 구역은 laundry-equipment-use, 한 단의 높이는 문턱 datum에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 문 유효폭 목표는 #laundry-plan, 작업 구역은 #laundry-equipment-use, 0.90 m는 use-profile, 한 단 높이는 ground-threshold-datums 링크에서 받아 각 값의 근거를 지목할 수 있음을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "세탁기 앞 바구니 작업 공간과 차고에서 집으로 들어오는 경로가 겹쳐 막히지 않게"를 앞쪽 작업 구역과 뒤쪽 횡단 띠의 분리로 만든다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정의 '바구니 작업 공간과 차고에서 들어오는 경로가 겹쳐 막히지 않게'에 대해 기기 점유 Z = -3.35 m 앞쪽 작업 구역과 Z = [-4.32, -3.42] 뒤쪽 횡단 띠의 분리 결정이 더해짐을 대조했다.
@evidence principles/design/spaces.md#space-topology 머드룸 상부 대기에서 차고 하부 대기로 내려가 garage-use-routes로 이어지는 연결을 정한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 두 출입문과 양쪽 대기를 잇는 같은 방 안의 띠가 머드룸 상부 대기에서 한 단 내려 차고 하부 대기로, 다시 garage-use-routes로 이어지고 하부 대기를 보관 면적에 넣지 않는 연결을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 두 문을 90° 연 기준에서 문틀·문짝 두께·손잡이 뒤에도 laundry-plan의 문 유효폭 목표와 0.90 m 띠가 남게 하고 두 사용을 다른 색 표시로 대신하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 두 문을 90° 연 기준에서 문틀·문짝 두께·손잡이 뒤에도 #laundry-plan의 0.95 m 목표와 0.90 m 띠가 남도록 두 owner 값을 참조만 하고 색 표시로 충돌을 대신하지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 두 문을 열고 바구니를 든 사람의 양방향 통과 평면/문턱 단면, 기기별 문 개방과 작업자를 더한 상태를 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 두 문을 열고 바구니를 든 사람의 양방향 통과 평면/문턱 단면, 기기별 문 개방과 작업자를 더한 상태, 문 조작 시 대기 위치를 반증 관찰로 들고 충돌·도달성을 unverified로 둠을 확인했다.
@evidence settings/00-production.md#use-profile 횡단 띠에 0.90 m 폭을 요구하고 문 회전 중과 통과 중을 동시 통행으로 주장하지 않는다.
@evidenceReview settings/00-production.md#use-profile #6ef5afe 횡단 띠 Z = [-4.32, -3.42]의 0.90 m를 use-profile 연속 통로 하한 0.90 m에 대조하고 문 회전 부채꼴과 반대편 문 조작 순간을 동시 통행으로 세지 않는 규칙을 확인했다.
@evidence settings/10-house.md#laundry-mudroom 세탁 작업을 앞쪽 작업 구역에 두고 차고에서 집으로 들어오는 경로를 Z = [-4.32, -3.42] m 뒤쪽 횡단 띠로 분리한다.
@evidenceReview settings/10-house.md#laundry-mudroom #7f11a68 설정의 작업/경로 비충돌 조건을 열린 세탁기/건조기·작업자는 앞쪽 작업 구역, 바구니 운반자는 뒤쪽 Z = [-4.32, -3.42] 띠를 지나는 분리에 대조해 성립함을 확인했다.
@evidence obligations/design/spaces.md#space-access-circulation 머드룸 상부 대기에서 차고 하부 대기로 이어지는 두 출입문 사이에 열린 기기와 기기 앞 작업자가 침범하지 않는 Z = [-4.32, -3.42] m 횡단 띠를 배정한다.
@evidenceReview obligations/design/spaces.md#space-access-circulation #76c5e04 머드룸 상부 대기→한 단→차고 하부 대기로 이어지는 두 출입문 사이 경로를 열린 기기·기기 앞 작업자가 침범하지 않는 0.90 m 띠와 바구니 든 사용체 프로필에 대조해 배정을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work laundry-mudroom의 작업/경로 비충돌과 use-profile의 0.90 m 통로를 두 문 사이에 적용했고 0.90 m 폭의 뒤쪽 띠가 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 laundry-mudroom의 작업/경로 비충돌과 use-profile 0.90 m를 대조해 기기 점유 Z = -3.35 m 뒤에 남는 Z = [-4.32, -3.42] 띠가 두 문 사이에 성립하여 부모 수정이 필요 없음을 확인했다.
-->

이 경로는 [두 출입문과 양쪽 대기](#laundry-plan)를 잇는 같은 방 안의 바닥 띠다. X는 방의 왼쪽 안쪽 면부터 오른쪽 안쪽 면까지, Z = [-4.32, -3.42] m를 사용 점유가 침범하지 않는 횡단 예약으로 둔다. 실 출입문 두 개를 각각 90° 연 기준에서 문틀·문짝 두께·손잡이 뒤에도 이 띠의 [연속 통로 폭 목표](../../settings/00-production.md#use-profile)인 0.90 m 폭과 [문 유효폭 목표](#laundry-plan)가 남아야 한다. [세탁기 앞 바구니 작업과 차고에서 집으로 들어오는 경로가 겹쳐 막히지 않게](../../settings/10-house.md#laundry-mudroom) 열린 세탁기/건조기·기기 앞 작업자는 [앞쪽 작업 구역](#laundry-equipment-use)에 있고 바구니 운반자는 이 뒤쪽 띠를 지난다. 두 사용을 단순히 다른 색으로 표시하고 실제 충돌을 무시하지 않는다.

실문이 회전하는 동안의 부채꼴은 통과 예약과 다르다. 문을 조작한 다음 통과하고, 반대편 사람이 문을 여닫는 순간까지 동시 통행이라고 주장하지 않는다. 머드룸의 상부 대기에서 차고의 하부 대기로 내려갈 때는 [기존 한 단의 높이](../01-storeys.md#ground-threshold-datums)와 문턱 경계를 소비한다. 하부 대기는 [차고 내부 경로](garage-interior.md#garage-use-routes)에 이어지며 물건 보관 면적에 넣지 않는다. 두 문을 열고 바구니를 든 사람이 양방향으로 통과하는 평면/문턱 단면, 기기별 문 개방과 작업자를 더한 상태, 문 조작 시 대기 위치를 검사한다. 현재는 설계 입력이며 실제 충돌·회전·도달성은 unverified다.
