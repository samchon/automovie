# 좌석과 작업 가구 모델

[공통 단위·주소·관찰](000-representation.md#model-address-and-scale)을 참조한다.

## 거실 직선·L자 소파 {#living-sofa}

<!--
@evidence principles/core/common.md#scope-preservation 공용부의 직선 좌석과 L자 발치를 각각 straight·chaise-right로 소유하고 작업실 안락의자는 별도 H2에 남긴다.
@evidence principles/core/common.md#substantive-completion 두 상태의 frame·seat·back·arm·pillow·leg 전수와 등판 곡선·발치 접합을 정해 단순 상자 소파로 남기지 않는다.
@evidence principles/core/common.md#declared-basis ref02의 L자 발치와 ref03의 직선 소파를 각 상태의 읽힘으로 채택하고 치수·곡선·틈은 이 H2의 @part와 @curve-linear에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 소파와 common-room의 연속 거실 영역에 세 좌석 분리와 오른쪽 발치 변종의 bounded 원형을 더한다.
@evidence principles/design/models.md#representation-contract 등 프레임·쿠션의 맞닿는 곡선과 베개의 양수 간격, 발치의 열린 하부를 서로 다른 part/face로 지정한다.
@evidence principles/design/models.md#spatial-convention 바닥 폭과 본체 깊이 중심을 원점으로 하고 +Z를 착석 앞, +X를 오른쪽으로 둬 오른쪽 chaise의 증가 Z 점유를 고정한다.
@evidence principles/design/models.md#reviewable-structure 정면·상부에서 좌석 셋과 좌판 틈, 측면·하부에서 베개 지지와 chaise 앞다리 아래 빈 바닥을 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref02의 L자 동선과 ref03의 낮은 직물 질량을 서로 다른 변종으로 표현하며 사진의 투시 비율이나 보이지 않는 내부 구조를 복제하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion straight의 0.88m 높이와 chaise-right의 1.30m 앞 점유, 공통 부품 재사용과 추가 네 부품을 @envelope·@part에 모두 대응한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 소파, common-room의 거실·식당 연속 cell, surface-decomposition의 형상·배치 분리를 시험했다. 직선·발치 변종의 좌석 점유는 같은 공용 가구 능력 안에 있고 바닥 접촉·최종 통행은 배치에서 확인하므로 새 방이나 운영 상태가 필요하지 않다.
@evidence settings/001-production.md#governing-aim 공용부 sofa를 앉는 좌석·등판·발치의 일상 가구로 만들어 거실 활동이 fit-out에서 식별되게 한다.
@evidence settings/002-household.md#household-program 가족이 함께 쓰는 공용 거실의 좌석을 straight·chaise-right 두 읽힘으로 구체화하고 주민 캐릭터를 만들지 않는다.
@evidence settings/002-household.md#ground-program 후면 공용부의 소파 역할을 독립 living-sofa 원형으로 내며 방의 다른 식탁·주방 기구는 각 H2에 남긴다.
@evidence spaces/002-spatial-graph.md#common-room 후면의 한 공용실 안에서 소파를 낮은 거실 좌석 원형으로 두고 식탁·주방을 막는 내부 칸막이는 만들지 않는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 소파의 좌석·등판·발치와 각 노출 face를 model part로 정하고 방 안의 위치와 마감 결합은 다른 owner에 남긴다.
@evidenceExclude spaces/002-spatial-graph.md#entry-common 현관과 공용실의 1.30m 열린 문 없는 개구는 spaces 소유다. sofa의 앞 점유는 이후 instances가 이 route와 대조한다.
@evidenceExclude spaces/003-surface-ownership.md#rear-common-glazing 후면 공용부와 정원을 가르는 고정창에는 별도 출입 route가 없다. 소파는 실내 점유만 내고 창을 문으로 바꾸지 않는다.
@evidenceExclude spaces/003-surface-ownership.md#right-common-glazing 서비스 외벽 후단 z=3.60..5.40m 공용실 유리는 façade owner 소유다. sofa의 낮은 등판은 그 유리 bay·shade를 정하지 않는다.
-->

등 프레임·등 쿠션·베개는 아래 `@curve-linear`의 같은 기울기 곡선을 따른다. 첫 인터페이스는 맞닿고 둘째는 해당 행이 정한 양수 간격을 두므로 베개는 등 쿠션에서 떨어진 채 좌판에만 지지된다. 긴 의자 변종은 공통 본체 부품을 같은 좌표로 재사용하고 앞쪽 연장 프레임·좌판 두 부품과 다리 둘을 추가한다.

@prose-part 연장 좌판은: chaise-seat
@inventory straight: frame, leg-0, leg-1, leg-2, leg-3, seat-0, seat-1, seat-2, back-frame, back-cushion-0, back-cushion-1, back-cushion-2, arm-left, arm-right, pillow-0, pillow-1, pillow-2
@inventory chaise-right: frame, leg-0, leg-1, leg-2, leg-3, seat-0, seat-1, seat-2, back-frame, back-cushion-0, back-cushion-1, back-cushion-2, arm-left, arm-right, pillow-0, pillow-1, pillow-2, chaise-frame, chaise-seat, chaise-front-leg-0, chaise-front-leg-1
@cap-contact straight: back-frame, frame, Y, -
@cap-contact straight: pillow-0, seat-0, Y, -
@cap-contact straight: pillow-1, seat-1, Y, -
@cap-contact straight: pillow-2, seat-2, Y, -
@cap-contact chaise-right: back-frame, frame, Y, -
@cap-contact chaise-right: pillow-0, seat-0, Y, -
@cap-contact chaise-right: pillow-1, seat-1, Y, -
@cap-contact chaise-right: pillow-2, seat-2, Y, -
@curve-linear straight: back-frame, back-cushion-0, 0.31, 0.57, -0.40, -0.08, 0.09, 0, 0.12
@curve-linear straight: back-frame, back-cushion-1, 0.31, 0.57, -0.40, -0.08, 0.09, 0, 0.12
@curve-linear straight: back-frame, back-cushion-2, 0.31, 0.57, -0.40, -0.08, 0.09, 0, 0.12
@curve-linear straight: back-cushion-0, pillow-0, 0.31, 0.57, -0.31, -0.08, 0.12, 0.002, 0.16
@curve-linear straight: back-cushion-1, pillow-1, 0.31, 0.57, -0.31, -0.08, 0.12, 0.002, 0.16
@curve-linear straight: back-cushion-2, pillow-2, 0.31, 0.57, -0.31, -0.08, 0.12, 0.002, 0.16
@curve-linear chaise-right: back-frame, back-cushion-0, 0.31, 0.57, -0.40, -0.08, 0.09, 0, 0.12
@curve-linear chaise-right: back-frame, back-cushion-1, 0.31, 0.57, -0.40, -0.08, 0.09, 0, 0.12
@curve-linear chaise-right: back-frame, back-cushion-2, 0.31, 0.57, -0.40, -0.08, 0.09, 0, 0.12
@curve-linear chaise-right: back-cushion-0, pillow-0, 0.31, 0.57, -0.31, -0.08, 0.12, 0.002, 0.16
@curve-linear chaise-right: back-cushion-1, pillow-1, 0.31, 0.57, -0.31, -0.08, 0.12, 0.002, 0.16
@curve-linear chaise-right: back-cushion-2, pillow-2, 0.31, 0.57, -0.31, -0.08, 0.12, 0.002, 0.16

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | straight | * | bounds | -1.35..1.35 | 0..0.88 | -0.48..0.48 | - |
| @part | straight | frame | box | -1.19..1.19 | 0.10..0.31 | -0.48..0.48 | leg-0,seat-0,back-frame,arm-left |
| @part | straight | leg-0 | box | -1.24..-1.18 | 0..0.10 | -0.37..-0.31 | ground,frame |
| @part | straight | leg-1 | box | -1.24..-1.18 | 0..0.10 | 0.31..0.37 | ground,frame |
| @part | straight | leg-2 | box | 1.18..1.24 | 0..0.10 | -0.37..-0.31 | ground,frame |
| @part | straight | leg-3 | box | 1.18..1.24 | 0..0.10 | 0.31..0.37 | ground,frame |
| @part | straight | seat-0 | box | -1.172..-0.407333 | 0.31..0.45 | -0.30..0.48 | frame,pillow-0 |
| @part | straight | seat-1 | box | -0.382333..0.382333 | 0.31..0.45 | -0.30..0.48 | frame,pillow-1 |
| @part | straight | seat-2 | box | 0.407333..1.172 | 0.31..0.45 | -0.30..0.48 | frame,pillow-2 |
| @part | straight | back-frame | curved | -1.19..1.19 | 0.31..0.88 | -0.48..-0.31 | frame,back-cushion-0 |
| @part | straight | back-cushion-0 | curved | -1.172..-0.407333 | 0.46..0.82 | -0.381579..-0.211053 | back-frame |
| @part | straight | back-cushion-1 | curved | -0.382333..0.382333 | 0.46..0.82 | -0.381579..-0.211053 | back-frame |
| @part | straight | back-cushion-2 | curved | 0.407333..1.172 | 0.46..0.82 | -0.381579..-0.211053 | back-frame |
| @part | straight | arm-left | box | -1.35..-1.19 | 0.10..0.64 | -0.48..0.48 | frame |
| @part | straight | arm-right | box | 1.19..1.35 | 0.10..0.64 | -0.48..0.48 | frame |
| @part | straight | pillow-0 | curved | -1.029667..-0.549667 | 0.45..0.67 | -0.238526..-0.047649 | seat-0 |
| @part | straight | pillow-1 | curved | -0.24..0.24 | 0.45..0.67 | -0.238526..-0.047649 | seat-1 |
| @part | straight | pillow-2 | curved | 0.549667..1.029667 | 0.45..0.67 | -0.238526..-0.047649 | seat-2 |
| @envelope | chaise-right | * | bounds | -1.35..1.35 | 0..0.88 | -0.48..1.30 | - |
| @part | chaise-right | frame | box | -1.19..1.19 | 0.10..0.31 | -0.48..0.48 | leg-0,seat-0,back-frame,arm-left,chaise-frame |
| @part | chaise-right | leg-0 | box | -1.24..-1.18 | 0..0.10 | -0.37..-0.31 | ground,frame |
| @part | chaise-right | leg-1 | box | -1.24..-1.18 | 0..0.10 | 0.31..0.37 | ground,frame |
| @part | chaise-right | leg-2 | box | 1.18..1.24 | 0..0.10 | -0.37..-0.31 | ground,frame |
| @part | chaise-right | leg-3 | box | 1.18..1.24 | 0..0.10 | 0.31..0.37 | ground,frame |
| @part | chaise-right | seat-0 | box | -1.172..-0.407333 | 0.31..0.45 | -0.30..0.48 | frame,pillow-0 |
| @part | chaise-right | seat-1 | box | -0.382333..0.382333 | 0.31..0.45 | -0.30..0.48 | frame,pillow-1 |
| @part | chaise-right | seat-2 | box | 0.407333..1.172 | 0.31..0.45 | -0.30..0.48 | frame,pillow-2,chaise-seat |
| @part | chaise-right | back-frame | curved | -1.19..1.19 | 0.31..0.88 | -0.48..-0.31 | frame,back-cushion-0 |
| @part | chaise-right | back-cushion-0 | curved | -1.172..-0.407333 | 0.46..0.82 | -0.381579..-0.211053 | back-frame |
| @part | chaise-right | back-cushion-1 | curved | -0.382333..0.382333 | 0.46..0.82 | -0.381579..-0.211053 | back-frame |
| @part | chaise-right | back-cushion-2 | curved | 0.407333..1.172 | 0.46..0.82 | -0.381579..-0.211053 | back-frame |
| @part | chaise-right | arm-left | box | -1.35..-1.19 | 0.10..0.64 | -0.48..0.48 | frame |
| @part | chaise-right | arm-right | box | 1.19..1.35 | 0.10..0.64 | -0.48..0.48 | frame |
| @part | chaise-right | pillow-0 | curved | -1.029667..-0.549667 | 0.45..0.67 | -0.238526..-0.047649 | seat-0 |
| @part | chaise-right | pillow-1 | curved | -0.24..0.24 | 0.45..0.67 | -0.238526..-0.047649 | seat-1 |
| @part | chaise-right | pillow-2 | curved | 0.549667..1.029667 | 0.45..0.67 | -0.238526..-0.047649 | seat-2 |
| @part | chaise-right | chaise-frame | box | 0.407333..1.172 | 0.10..0.31 | 0.48..1.30 | frame,chaise-seat,chaise-front-leg-0 |
| @part | chaise-right | chaise-seat | box | 0.407333..1.172 | 0.31..0.45 | 0.48..1.30 | seat-2,chaise-frame |
| @part | chaise-right | chaise-front-leg-0 | box | 0.439667..0.499667 | 0..0.10 | 1.17..1.23 | ground,chaise-frame |
| @part | chaise-right | chaise-front-leg-1 | box | 1.079667..1.139667 | 0..0.10 | 1.17..1.23 | ground,chaise-frame |

`living-sofa/straight`는 독립된 좌석 셋과 등받이·양팔·베개 셋을 가진다. `chaise-right`는 오른쪽 좌석의 앞에 같은 폭의 연장 프레임·좌판과 앞다리 둘을 더한다. 두 상태의 외곽과 각 부품의 폭·높이·깊이·중심은 아래 `@envelope`·`@part`가 소유한다. 원점은 바닥 외곽 폭 중심과 본체 깊이 중심이며 +Z가 착석 앞, +X가 오른쪽이다. 좌판 사이 및 팔과 좌판 사이에는 각 행의 X 경계가 정한 빈 틈을 남긴다.

등 프레임 앞면과 등 쿠션 뒤·앞면은 `@curve-linear`의 같은 기울기 층으로 만들고 접합 내부 삼각형을 노출 면으로 세지 않는다. 베개 셋도 해당 곡선을 따라가되 등 쿠션과 떨어져 있고 아래면만 좌판 상면에 접한다. 연장 프레임은 공통 좌판의 앞면에 유한 면적으로 닿고 연장 좌판은 그 위에 놓이며 발치와 프레임 아래는 비운다. 각 다리의 접지면·프레임 접합면은 해당 `@part`의 경계와 `@flat-contact`가 정한다.

안정 part는 `frame`, `leg-0..3`, `seat-0..2`, `back-frame`, `back-cushion-0..2`, `arm-left/right`, `pillow-0..2`, L자 상태의 `chaise-frame/seat/front-leg-0..1`이다. 프레임과 긴 의자 프레임은 `upper/side/underside/contact`, 다리는 `shaft/top/sole`, 좌판·등 쿠션·팔·베개·긴 의자 좌판은 `upper/side/underside/seam`, 등 프레임은 `front/back/edge`, 긴 의자 앞다리는 `shaft/top/sole`로 분리한다. 각 부품의 face는 [공통 완결 규칙](000-representation.md#model-address-and-scale)에 따라 전체를 덮는다. 등판 내부 구조와 주름은 blocking 범위 밖이고 실제 착석 하중은 `unverified`다. 정면·측면·상부·45°와 낮은 하부 관찰에서 세 좌석, 바닥 틈, L자 발치가 구별돼야 한다. ref02의 L자 소파는 `chaise-right`의 발치와 개방 동선 관계로 채택하고 ref03의 직선 소파는 `straight`의 낮은 직물 질량으로 채택한다. ref01·04·05에서 보이지 않는 소파 치수는 가져오지 않으며 ref02의 카메라 투시를 길이 비율로 복제하지 않는다.

ref02 작업실의 초록 안락의자는 이 거실 소파의 축소형으로 만들지 않고 [별도 안락의자](#accent-chair)로 설계한다. ref04의 작업실은 접이식 침대 전면·책상·계단 출입 사이의 빈 바닥이 핵심이며, 안락의자 배치가 그 통행을 침범하는지는 instances 관찰 전까지 `unverified`다.

<!-- @authored-address-state:start -->
@address-state straight: frame, leg-0, leg-1, leg-2, leg-3, seat-0, seat-1, seat-2, back-frame, back-cushion-0, back-cushion-1, back-cushion-2, arm-left, arm-right, pillow-0, pillow-1, pillow-2
@address-state chaise-right: frame, leg-0, leg-1, leg-2, leg-3, seat-0, seat-1, seat-2, back-frame, back-cushion-0, back-cushion-1, back-cushion-2, arm-left, arm-right, pillow-0, pillow-1, pillow-2, chaise-frame, chaise-seat, chaise-front-leg-0, chaise-front-leg-1
<!-- @authored-address-state:end -->

## 여섯 자리 식탁 {#dining-table}

<!--
@evidence principles/core/common.md#scope-preservation 여섯 자리 식탁의 상판과 네 발만 이 prototype으로 만들고 여섯 의자의 반복과 transform은 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion 1.80×0.92m 상판, 0.74m 상면, 네 다리의 접지와 비운 무릎 공간을 실제 @part 범위로 닫는다.
@evidence principles/core/common.md#declared-basis operative-subjects의 가족 네 자리·손님 두 자리와 common-room의 연속 식사 영역을 받아 네 발 위치·상판 두께·모서리 반경은 이 H2에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation operative-subjects의 여섯 자리와 common-room의 식사 영역에 상판 두께·지면 네 접점·열린 무릎 공간을 더한다.
@evidence principles/design/models.md#representation-contract top/upper·edge·underside와 각 leg/shaft·top·sole이 상판·다리의 닫힌 표면을 나눠 side 삼각형 중복을 막는다.
@evidence principles/design/models.md#spatial-convention 네 발 접촉의 중심을 원점으로 하고 +Z를 한 좌석 열의 접근 방향으로, 상면 y=0.74와 다리 중심 x=±0.81,z=±0.37을 정한다.
@evidence principles/design/models.md#reviewable-structure 하부에서 네 발 사이가 뚫렸는지, 상부·45°에서 0.044m 상판 두께와 둥근 수평 코너가 구별되는지 본다.
@evidence principles/design/models.md#model-observable-style-basis ref03의 목재 식탁과 좌석 간격을 낮은 차단 상판·네 발로 옮기고 보이지 않는 기계 접합이나 실물 하중은 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 공통 0.74m 식탁 기준을 실제 상판 상면으로 사용하며 leg-0..3의 점유와 빈 무릎 공간을 함께 닫는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work operative-subjects의 여섯 자리, common-room의 식사 영역, surface-decomposition의 모델 형상 소유를 시험했다. 상판과 네 발의 점유·접지는 식탁 원형 안에서 닫히며 여섯 의자의 실제 간격과 주방 접근은 배치 검사가 맡으므로 부모 cell을 고치지 않는다.
@evidence settings/002-household.md#operative-subjects 가족 네 자리와 방문자 두 자리를 설명하는 여섯 자리 식탁 규모를 상판과 네 다리의 독립 모델로 받는다.
@evidence spaces/002-spatial-graph.md#common-room 연속 공용실의 식사 영역을 여섯 자리 상판과 다리 원형으로 표현하고 kitchen 접근 route는 후속 배치가 확인하게 한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 식탁 상판·다리의 재사용 형상과 face는 models에서 닫고 여섯 의자의 배치와 마감은 별도 owner에 남긴다.
-->

@prose-part 상판은: top
@prose-part 다리 네 개는: leg-*

`dining-table`은 X 폭 1.80, Z 깊이 0.92, Y 높이 0.74m다. 원점은 네 다리 접촉의 중심, +Z가 한 좌석 열의 접근 방향이다. 0.044m 상판은 y=0.696..0.740이고 수평 코너 반경 0.025m다. 다리 네 개는 0.045m 정사각 단면, y=0..0.696이며 중심은 x=±0.81, z=±0.37이다. 상판 아래는 의자 무릎이 접근하는 빈 공간이고 다리 사이를 판으로 막지 않는다.

다음 수치 행은 바로 위 치수의 부품별 폐합 범위다. `@part`의 접촉 상대는 같은 상태의 주소이며 `ground`는 y=0 지면이다. 이 표는 상판과 네 발의 전체 부품 모집단을 이룬다.

@scalar-control top-corner-radius: 0.025

@inventory default: top, leg-0, leg-1, leg-2, leg-3

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.90..0.90 | 0..0.74 | -0.46..0.46 | - |
| @part | default | top | box | -0.90..0.90 | 0.696..0.74 | -0.46..0.46 | leg-0 |
| @part | default | leg-0 | box | -0.8325..-0.7875 | 0..0.696 | -0.3925..-0.3475 | ground,top |
| @part | default | leg-1 | box | -0.8325..-0.7875 | 0..0.696 | 0.3475..0.3925 | ground,top |
| @part | default | leg-2 | box | 0.7875..0.8325 | 0..0.696 | -0.3925..-0.3475 | ground,top |
| @part | default | leg-3 | box | 0.7875..0.8325 | 0..0.696 | 0.3475..0.3925 | ground,top |

안정 주소는 `top/upper`, `top/edge`, `top/underside`, `leg-0..3/shaft`, `leg-0..3/top`, `leg-0..3/sole`이다. 상판의 UV 장축은 X이며 네 수직 측면 전체가 `top/edge`, 아래 수평면이 `top/underside`다. 두 주소의 이음은 모서리에서만 끝나며 별도 `top/side` 삼각형을 중복 발행하지 않는다. 상판은 닫힌 두께, 다리도 각각 닫힌 부품이다. 정면·상부·45°와 하부에서 상판 두께·네 발·빈 무릎 공간을 확인한다. ref03의 여섯 자리 식탁과 좌석 간격 관계, ref02의 공용부 내 식탁 위치 역할을 채택한다. ref01·04·05는 식탁 형상을 제공하지 않으므로 다른 세부나 치수를 차용하지 않는다. 여섯 의자의 transform은 instances 소유이고 실제 식탁 하중은 `unverified`다.

<!-- @authored-address-state:start -->
@address-state default: top, leg-0, leg-1, leg-2, leg-3
<!-- @authored-address-state:end -->

## 거실 낮은 탁자 {#coffee-table}

<!--
@evidence principles/core/common.md#scope-preservation 거실 낮은 탁자는 이 H2가 top과 네 leg를 맡고 위의 그릇·쟁반 형상은 tabletop-props, 그 배치는 instances에 둔다.
@evidence principles/core/common.md#substantive-completion 상판의 0.36m 높이, Z 장축, 네 지지 다리와 상판 아래 빈 공간을 닫힌 @part로 정한다.
@evidence principles/core/common.md#declared-basis ref03 전경의 낮은 높이와 ref02 거실 위치 역할만 받고 막힌 상자형 외형은 채택하지 않는다. 네 발 구조와 0.90×1.25m 점유는 이 H2의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 low table과 common-room의 거실 사용에 열린 네 다리와 top/edge/underside 주소를 더한다.
@evidence principles/design/models.md#representation-contract 상판·네 다리를 별도 닫힌 부품으로 하고 edge 이음을 underside 접합선에서 끝내 접지 sole과 상판 윗면을 분리한다.
@evidence principles/design/models.md#spatial-convention 네 발 중심이 원점이고 긴 축이 +Z이며 다리 중심 x=±0.39,z=±0.55와 상판 y=0.32..0.36을 local m로 둔다.
@evidence principles/design/models.md#reviewable-structure 정면·상부·45°에서 낮은 상판을, 하부에서 막힌 플린스가 아니라 네 발 사이 바닥이 보이는지를 검사한다.
@evidence principles/design/models.md#model-observable-style-basis 사진의 전경 탁자에서 높이 관계만 취하고 막힌 상자 부피는 버려 거실 통행 사이에 가벼운 열린 실루엣을 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 0.90×1.25×0.36m envelope를 top과 네 leg의 합집합으로 닫고 0.04m 상판과 y=0..0.32 지지를 일치시킨다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 low table, common-room의 연속 거실 바닥, surface-decomposition의 물체 형상 소유를 시험했다. 0.90×1.25m 상판과 네 발의 접지는 국소 가구 결정이고 별도 개구·가변 상태·방 기능을 요구하지 않는다.
@evidence settings/002-household.md#ground-program 거실의 low table을 상판과 네 발이 열린 독립 원형으로 만든다.
@evidence spaces/002-spatial-graph.md#common-room 탁자 원형은 거실 영역에 쓰이고 식당·주방으로 이어지는 경로의 최종 점유는 배치에 남긴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 탁자의 top·leg face를 재사용 주소로 정의하고 공용실 위치와 finish를 소유하지 않는다.
-->

`coffee-table`은 X 폭 0.90, Z 깊이 1.25, 높이 0.36m다. 바닥의 네 발 중심이 원점이고 +Z가 긴 축이다. 상판은 두께 0.04m로 y=0.32..0.36, 모서리 반경 0.02m이며 다리 0.04×0.04m 네 개의 중심은 x=±0.39, z=±0.55, y=0..0.32다. `top/upper/edge/underside`와 `leg-0..3/shaft/top/sole`은 식탁과 별도 prototype 주소다. 상면 UV 장축은 Z, edge 이음은 underside로 이어지는 접합선에서 끝난다. 정면·상부·45°와 하부에서 낮은 높이와 상판 아래 빈 공간이 드러나야 한다. ref03 전경의 낮은 탁자와 ref02의 거실 탁자 위치 역할을 채택하지만 ref03 사진의 그릇을 탁자 메시로 합치지 않는다. ref01·04·05에는 이 탁자를 판독할 근거가 없다. 그릇·쟁반 prototype은 [식탁 소품](004-decor-and-fixtures.md#tabletop-props)이, 위 배치는 instances가 맡는다. 실제 탁자 하중은 `unverified`다.

@prose-part 다리: leg-*
@prose-part 상판: top
@inventory default: top, leg-0, leg-1, leg-2, leg-3

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.45..0.45 | 0..0.36 | -0.625..0.625 | - |
| @part | default | top | box | -0.45..0.45 | 0.32..0.36 | -0.625..0.625 | leg-0 |
| @part | default | leg-0 | box | -0.41..-0.37 | 0..0.32 | -0.57..-0.53 | ground,top |
| @part | default | leg-1 | box | -0.41..-0.37 | 0..0.32 | 0.53..0.57 | ground,top |
| @part | default | leg-2 | box | 0.37..0.41 | 0..0.32 | -0.57..-0.53 | ground,top |
| @part | default | leg-3 | box | 0.37..0.41 | 0..0.32 | 0.53..0.57 | ground,top |

ref03 전경의 막힌 상자형 낮은 탁자 외형은 현재 `coffee-table`에 그대로 채택하지 않는다. 실제 공용부의 한쪽 소파 발과 식탁 접근 사이에서 바닥이 보이는 네 다리 구조를 사용하며, 사진의 낮은 탁자 위치와 높이 관계만 채택한다. 그 차이는 공용부 최종 시각 판정에서 다시 대조할 항목이다.

<!-- @authored-address-state:start -->
@address-state default: top, leg-0, leg-1, leg-2, leg-3
<!-- @authored-address-state:end -->

## 천 씌운 식탁 의자 {#dining-chair}

<!--
@evidence principles/core/common.md#scope-preservation 식탁 의자의 목재 seat-frame·분리 천 seat-pad·굽은 뒤 다리·등판을 이 H2가 맡고 책상용 연결 셸은 desk-chair에 남긴다.
@evidence principles/core/common.md#substantive-completion @piece·@shear-z로 뒤 다리의 아래 shaft와 위 조각을 닫고 두 @flat-contact가 등판을 지지하게 하며 좌판과 등 사이 틈도 정한다.
@evidence principles/core/common.md#declared-basis ref03의 천 좌판과 목재 뒤 지지, ref02의 여섯 자리 반복을 받는다. 뒤 다리 굽힘과 접합 수치는 이 모델 H2가 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 여섯 식사 자리와 operative-subjects의 가족·방문자 구분에 분리된 좌판 패드 face와 등판 아래 틈을 가진 의자 원형을 더한다.
@evidence principles/design/models.md#representation-contract 뒤 다리의 두 조각을 한 닫힌 part로 용접하고 seat-frame·seat-pad·back의 서로 다른 face를 유지해 천과 구조 목재가 한 면을 겸하지 않는다.
@evidence principles/design/models.md#spatial-convention 바닥 좌판 기준 X/Z 중심이 원점이고 +Z가 착석 앞이며 seat-pad 상면 y=0.45와 등판 최고 y=0.84를 명시한다.
@evidence principles/design/models.md#reviewable-structure 측면에서 등 곡률과 y=0.45..0.49 빈 틈, 정면에서 천 좌판 두께와 두 뒤 다리의 독립 지지를 본다.
@evidence principles/design/models.md#model-observable-style-basis ref03의 목재 의자에 얹힌 천 좌판을 채택하고 ref04의 껍질형 작업 의자는 다른 prototype으로 구분한다.
@evidence principles/design/models.md#model-scale-layer-completion 폭 0.48·깊이 0.55·높이 0.84m와 좌면 0.45m를 공통 식탁 척도에 맞추며 다리 조각·접점·face 전부를 같은 상태에 넣는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 여섯 자리, operative-subjects의 네 가족·두 방문자, common-room의 식사 영역을 시험했다. 의자 좌면·등판·다리의 척도와 바닥 접촉은 개별 원형에 닫히고 여섯 개의 실제 간격은 배치에서 재므로 공간 치수 변경 근거가 없다.
@evidence settings/002-household.md#ground-program 식탁의 여섯 자리를 반복 배치할 수 있는 독립 의자 원형으로 받는다.
@evidence settings/002-household.md#operative-subjects 가족 네 명과 방문자 두 명이 쓰는 자리 수를 의자 반복의 근거로 받되 인물 asset은 만들지 않는다.
@evidence spaces/002-spatial-graph.md#common-room 연속 공용실의 식사 영역에 놓이는 의자 형상만 정하고 주방 통로의 최종 clear는 배치에서 검사한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 의자의 프레임·패드·다리와 노출 face를 models가 소유하고 재료 결합과 여섯 개의 transform은 넘긴다.
-->

뒷다리 하나의 아래 shaft와 위로 굽은 접합부는 같은 부품 주소의 서로 면으로 닿는 두 점유 조각이다. 위쪽 조각은 `@piece`가 정한 좌판 위 구간에 있으므로 좌판 속을 관통하지 않는다. `@piece`는 부품 전체 AABB가 아닌 실제 연결된 점유를 검사한다.

@scalar-control back-rake: 0.07

@prose-part 목재 좌판 구조는: seat-frame
@prose-part 천 좌판은: seat-pad
@prose-part 등판은: back
@prose-part 다리 단면은: leg-*
@prose-part 위 끝면: leg-*
@inventory default: seat-frame, seat-pad, back, leg-0, leg-1, leg-2, leg-3
@piece default: leg-0, -0.205..-0.175, 0..0.45, -0.29..-0.26
@piece default: leg-0, -0.205..-0.175, 0.45..0.49, -0.29..-0.135
@shear-z default: leg-0, 0.45..0.49, -0.275..-0.15, 0.015
@piece default: leg-2, 0.175..0.205, 0..0.45, -0.29..-0.26
@piece default: leg-2, 0.175..0.205, 0.45..0.49, -0.29..-0.135
@shear-z default: leg-2, 0.45..0.49, -0.275..-0.15, 0.015
@flat-contact default: seat-frame, leg-0, -Z, -0.26, -0.205..-0.175, 0.38..0.415
@flat-contact default: seat-frame, leg-2, -Z, -0.26, 0.175..0.205, 0.38..0.415
@flat-contact default: back, leg-0, -Y, 0.49, -0.205..-0.175, -0.1625..-0.1375
@flat-contact default: back, leg-2, -Y, 0.49, 0.175..0.205, -0.1625..-0.1375

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.24..0.24 | 0..0.84 | -0.29..0.26 | - |
| @part | default | seat-frame | box | -0.24..0.24 | 0.38..0.415 | -0.26..0.26 | leg-1,leg-0,seat-pad |
| @part | default | seat-pad | box | -0.22..0.22 | 0.415..0.45 | -0.24..0.24 | seat-frame |
| @part | default | back | curved | -0.23..0.23 | 0.49..0.84 | -0.237709..-0.1375 | leg-0,leg-2 |
| @part | default | leg-1 | box | -0.205..-0.175 | 0..0.38 | 0.175..0.205 | ground,seat-frame |
| @part | default | leg-3 | box | 0.175..0.205 | 0..0.38 | 0.175..0.205 | ground,seat-frame |
| @part | default | leg-0 | curved | -0.205..-0.175 | 0..0.49 | -0.29..-0.135 | ground,seat-frame,back |
| @part | default | leg-2 | curved | 0.175..0.205 | 0..0.49 | -0.29..-0.135 | ground,seat-frame,back |

`dining-chair`는 폭 0.48, 깊이 0.55, 높이 0.84m이며 바닥에서 좌판 기준 X/Z 좌표가 각각 0인 점을 원점으로 두고 +Z를 앉는 앞쪽으로 둔다. 목재 좌판 구조는 폭 0.48·깊이 0.52m, x=±0.24,z=±0.26,y=0.38..0.415이고 그 위 분리된 천 좌판은 폭 0.44·깊이 0.48m, x=±0.22,z=±0.24,y=0.415..0.45다. 등판은 폭 0.46m·두께 0.025m, y=0.49..0.84이고 중앙선 z(y)=−0.15−0.07t−0.03×4t(1−t), t=(y−0.49)/0.35로 굽힌다. 따라서 양 끝 중앙선 z=−0.15/−0.22이고 가운데가 0.03m 더 뒤로 휜다. 좌판과 등판 사이에는 높이 0.04m의 틈이 남는다. 다리 단면은 0.03×0.03m이고 x=±0.19, 앞쪽 z=+0.19의 두 다리는 y=0..0.38이다. 뒤쪽 두 다리의 아래 shaft와 위 조각은 각각 `@piece` 범위를 채운다. 위 조각은 `@shear-z`가 정한 선형 중심선과 반두께를 따라 굽히고, 그 행의 양 Y 경계에서 수평으로 잘라 닫는다. 아래 끝면은 shaft의 윗면과 같은 X/Z 사각 면으로, 위 끝면은 등판 하단과 두 `@flat-contact` 직사각형으로 맞댄다. 이 조각은 좌판 뒤 edge 바깥에 있어 목재·천 좌판을 관통하지 않는다. 각 뒤 다리는 하나의 연속 부품이며 열린 등 아래 틈의 좌우 가장자리만 지난다. `seat-frame/upper/edge/underside`, `seat-pad/upper/edge/underside`, `back/front/rear/edge`, `leg-0..3/shaft/top/sole`이 안정 주소다. 좌판 직물과 구조 목재가 한 face를 공유하지 않는다. 정면·측면·45°에서 천 좌판의 두께와 등판의 분리·곡률을 확인한다. ref03에서 목재 의자의 별도 천 좌판과 뒤 지지를 채택하고 ref02에서 여섯 자리 반복만 받는다. ref04의 껍질형 책상 의자는 [책상 의자](#desk-chair)로 구분한다. ref01·05에는 식탁 의자가 없다. 실제 착석 강도는 `unverified`다.

<!-- @authored-address-state:start -->
@address-state default: seat-frame, seat-pad, back, leg-0, leg-1, leg-2, leg-3
<!-- @authored-address-state:end -->

## 고리 발받침 섬 스툴 {#island-stool}

<!--
@evidence principles/core/common.md#scope-preservation 섬 옆의 고리 발받침 스툴 형상을 이 H2가 맡고 세 개의 반복 배치와 실제 하중은 인스턴스·검증 경계에 남긴다.
@evidence principles/core/common.md#substantive-completion 좌판·네 발·네 mitered-box 발받침의 점유와 45° 맞댐 한 접합면을 정해 겹친 AABB를 겹친 고체로 잘못 읽지 않게 한다.
@evidence principles/core/common.md#declared-basis ref03의 긴 섬 측면 스툴과 발받침 고리를 시각 근거로 쓰고 0.63m 좌면·0.23m 고리·mitre 치수는 이 H2의 값이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 island와 common-room의 주방 영역에 놓을 저작 선택인 스툴에 네 발 내부의 닫힌 발받침 고리를 더한다.
@evidence principles/design/models.md#representation-contract 45° 반평면으로 네 막대의 열린 내부 겹침을 없애고 한 유한 면에서만 만나게 하며 seat/leg/footrest face를 분리한다.
@evidence principles/design/models.md#spatial-convention 네 발 접촉 중심이 원점이고 +Z가 섬이며 좌면 y=0.585..0.63, 고리 중심 y=0.23을 local 값으로 고정한다.
@evidence principles/design/models.md#reviewable-structure 위·옆·하부 45°에서 고리 네 조각이 이어진 하나의 둘레인지, 중앙과 다리 사이가 실제로 비었는지 반증한다.
@evidence principles/design/models.md#model-observable-style-basis ref03의 가는 다리·고리 스툴을 단순 막대와 원통 좌판으로 읽고 ref02의 간단한 스툴에서는 형상 치수를 빌리지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 0.36m 좌판 지름과 0.63m 높이 안에 발·고리 최외곽이 들어가며 각 막대 끝과 다리 안쪽 면 접촉이 함께 닫힌다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 섬, common-room의 주방, household-program의 생활 가구 범위를 시험했다. 부모가 스툴 수를 정하지 않아 세 개의 반복은 배치 선택이다. 0.63m 좌면과 0.23m 고리는 독립 가구의 접지·형상 안에 있고 새 운영 상태나 방 경계를 요구하지 않는다.
@evidence settings/002-household.md#ground-program 주방 island를 스툴이 향하는 사용 면으로 받되 스툴 수나 간격은 이 프로그램에서 정해졌다고 주장하지 않는다.
@evidence settings/002-household.md#household-program 일상 가구로 주방 스툴 원형을 허용하는 생활 범위를 받는다.
@evidence spaces/002-spatial-graph.md#common-room 연속 공용실의 주방 영역을 스툴의 가능한 배치 공간으로 받되 실제 점유는 instances가 검사한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 스툴 좌판·발받침 고리·다리의 형상과 face를 models에서 소유한다.
-->

@prose-part 좌판 지름: seat
@prose-part 고리의 바깥 경계: footrest-*

`island-stool`은 좌판 지름 0.36, 상면 y=0.63, 전체 메시 점유 0.36×0.36×0.63m다. 네 발 접촉 중심이 원점이고 +Z는 섬을 향한다. 좌판은 두께 0.045m, 다리 네 개는 0.025m 사각 단면에 x/z=±0.11 중심이며 y=0..0.585다. 발받침은 y=0.23에서 중심선 x/z=±0.0975를 따르는 0.018×0.018m 사각 단면의 네 수평 막대가 끝에서 45° 맞댐으로 닫힌 사각 고리를 이룬다. X 방향 두 막대는 x=−0.0975..+0.0975에서 끝나고 Z 방향 두 막대는 z=−0.0975..+0.0975에서 끝나므로 각 끝면이 다리의 내부 X/Z 면과 높이 0.018m·가로 0.009m의 유한 면으로 닿는다. 45° 맞댐은 모서리 겹침 삼각 부피를 양쪽에서 절삭해 한 접촉면만 남긴다. 네 다리 바깥 모서리의 반지름은 sqrt(2)×0.1225m로 좌판 반지름 0.18m 안이다. 고리의 바깥 경계 x/z=±0.1065는 네 다리 외곽 ±0.1225 안에 있고 서로 이격된 장식 네 조각으로 보이지 않는다. `seat/upper/edge/underside`, `leg-0..3/shaft/top/sole`, `footrest-0..3/outer/contact`가 안정 주소다. 위·옆·아래 45°에서 고리의 연속성과 빈 중앙이 보여야 한다. ref03의 발받침 고리와 긴 섬 측면의 세 스툴 관계를 채택한다. ref02의 간단한 스툴은 배치 확인에만 쓰고, ref01·04·05에서 형상을 역산하지 않는다. 실제 하중은 `unverified`다.

발받침은 45° 맞댄 단면이므로 다음 표의 `mitered-box` AABB가 모서리에서 겹치더라도 닫힌 부피는 겹치지 않는다. 각 맞댐의 X/Z 겹침 정사각은 0.009×0.009m이고 높이 0.018m다. 그 정사각에서 모서리 접점 `(x_c,z_c)`로부터 안쪽으로 잰 거리 `u=|x−x_c|`, `v=|z−z_c|`에 대해 X 막대는 `u≥v`, Z 막대는 `v≥u`의 닫힌 반평면만 남긴다. `u=v`의 45° 유한 면 하나에서 만나고 양쪽의 열린 내부는 겹치지 않는다. 접촉은 각 막대 끝의 단면과 다리의 내측 면으로 판정한다.

@prose-part 다리 네 개는: leg-*
@prose-part 발받침은: footrest-*
@prose-part 두 막대는: footrest-*
@inventory default: seat, leg-0, leg-1, leg-2, leg-3, footrest-0, footrest-1, footrest-2, footrest-3
@joint default: footrest-0, footrest-2, miter45-xz
@joint default: footrest-0, footrest-3, miter45-xz
@joint default: footrest-1, footrest-2, miter45-xz
@joint default: footrest-1, footrest-3, miter45-xz

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.18..0.18 | 0..0.63 | -0.18..0.18 | - |
| @part | default | seat | cylinder | -0.18..0.18 | 0.585..0.63 | -0.18..0.18 | leg-0 |
| @part | default | leg-0 | box | -0.1225..-0.0975 | 0..0.585 | -0.1225..-0.0975 | ground,seat |
| @part | default | leg-1 | box | -0.1225..-0.0975 | 0..0.585 | 0.0975..0.1225 | ground,seat |
| @part | default | leg-2 | box | 0.0975..0.1225 | 0..0.585 | -0.1225..-0.0975 | ground,seat |
| @part | default | leg-3 | box | 0.0975..0.1225 | 0..0.585 | 0.0975..0.1225 | ground,seat |
| @part | default | footrest-0 | mitered-box | -0.0975..0.0975 | 0.221..0.239 | -0.1065..-0.0885 | leg-0,leg-2 |
| @part | default | footrest-1 | mitered-box | -0.0975..0.0975 | 0.221..0.239 | 0.0885..0.1065 | leg-1,leg-3 |
| @part | default | footrest-2 | mitered-box | -0.1065..-0.0885 | 0.221..0.239 | -0.0975..0.0975 | leg-0,leg-1 |
| @part | default | footrest-3 | mitered-box | 0.0885..0.1065 | 0.221..0.239 | -0.0975..0.0975 | leg-2,leg-3 |

<!-- @authored-address-state:start -->
@address-state default: seat, leg-0, leg-1, leg-2, leg-3, footrest-0, footrest-1, footrest-2, footrest-3
<!-- @authored-address-state:end -->

## 벽 연결 작업 책상과 침실 변종 {#work-desk}

<!--
@evidence principles/core/common.md#scope-preservation flex의 접힌·열린 보조판과 침실 세 폭 변종을 같은 책상 가족으로 소유하고 벽 구멍·높이 운동·방별 배치는 만들지 않는다.
@evidence principles/core/common.md#substantive-completion flex의 서랍장·두 겹 기둥·collar·hinge와 침실형의 두 앞다리·back rail을 각각 @inventory와 @part로 닫는다.
@evidence principles/core/common.md#declared-basis flex-states의 작업 변환과 ref04의 벽 책상·서랍선, ref02의 작은 침실 책상을 받되 보이는 조절 기둥과 정지 상태별 부품은 이 H2가 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 작업 책상, flex-states의 고정 책상·접이식 보조판, upper-program의 침실 책상에 힌지 축과 폭별 앞다리·서랍 구조를 더한다.
@evidence principles/design/models.md#representation-contract flex 보조판과 top의 동일 Z 보어에 핀이 면으로 닿고 접힌 손잡이는 판에 매립된다. 침실형은 기둥·collar·aux를 생성하지 않는다.
@evidence principles/design/models.md#spatial-convention 상판 폭·깊이 중심의 바닥을 원점, +Z를 앉는 자리로 두고 back-rail z=−0.30 벽 datum과 hinge x=0.70,y=0.715를 고정한다.
@evidence principles/design/models.md#reviewable-structure 접힘·열림에서 핀 관통과 숨은 손잡이 돌출을, 정면·하부에서 무릎 공간과 flex 기둥·침실 앞다리의 다른 지지를 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref04의 벽 부착 책상과 서랍선을 채택하지만 사진에 없는 지지는 설정의 조절 단서를 보이는 두 겹 기둥으로 별도 표현한다.
@evidence principles/design/models.md#model-scale-layer-completion 네 폭 키와 flex의 필수 상태가 부품 집합·AABB를 결정하며 back-rail 접촉과 앞쪽 지지가 책상마다 유한 면 경로를 이룬다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 조절식 desk, flex-states의 고정 책상·보조판, upper-program의 침실 desk, flex-workroom의 2.24m 폭을 시험했다. 힌지·기둥·앞다리는 책상 원형의 접촉과 정지 상태를 정의하고 최종 출입 clear는 배치에 남으므로 방 경계를 고치지 않는다.
@evidence settings/002-household.md#ground-program 작업실의 조절식 책상과 접이식 작업면을 벽측 책상 원형의 사용 기능으로 받는다.
@evidence settings/002-household.md#flex-states 보조 상판은 실물 부재로 구별하되 작업·손님 상태 사이 자동 운동은 만들지 않는다.
@evidence settings/002-household.md#upper-program 주침실과 작은 침실의 작은 책상 요구를 폭별 정지 원형으로 받는다.
@evidence spaces/002-spatial-graph.md#flex-workroom 작업실 clear 폭 2.24m를 책상 배치의 공간 입력으로 받고 통행 검사는 instances에 남긴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 책상 상판·힌지·기둥·서랍의 형상 주소를 models에서 소유한다.
@evidenceExclude spaces/003-surface-ownership.md#front-flex-glazing 작업실 전면 고정창의 sill·head·privacy 층은 façade owner가 정한다. 책상 원형은 방 안의 벽 접촉과 보조 상판만 낸다.
@evidenceExclude spaces/003-surface-ownership.md#left-flex-glazing 작업실 +X 측면 창은 전면 창과 직교하며 불투명 return을 남긴다. 책상은 그 두 opening을 연결하지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#wall-entry-common 현관과 공용실의 문 없는 opening을 가진 벽은 공간 경계다. 책상은 작업실 가구이며 공용 개구의 jamb를 형성하지 않는다.
-->

@prose-part flex 상판은: top
@prose-part 좌측 중심: drawer-case
@prose-part 우측 중심: telescopic-lower
@prose-part 서랍장 전면의 얕은 세 줄은: drawer-*
@prose-part 고정 back rail을: back-rail
@prose-part 기둥은: telescopic-upper
@prose-part 손잡이는: aux-pull
@prose-part flex의 back rail은: back-rail
@prose-part 보조판의 `folded` 상태는: aux-panel
@prose-part `open` 상태는 이 Z축으로 바깥쪽 90° 회전한 판: aux-panel
@prose-part 앞쪽: support-*
@prose-part 뒤쪽: back-rail
@prose-part 왼쪽 중심: drawer-one
@prose-part 한 서랍을: drawer-one

flex의 세 서랍 전면은 `@part drawer-0..2`의 Z 범위에서 서랍장 앞면에 두께를 가지고 면 부착한다. 기둥 sleeve와 collar는 각 내경을 실제 빈 점유로 절삭한다. 보조 경첩의 Z축은 `@part aux-hinge`의 Z 범위에서 끝나며 보조판 앞의 추가 0.02m는 판 자체의 돌출이다. 접힌 손잡이는 판에 매립되고 열린 상태에서는 `@part open/aux-pull`이 정한 위치로 같은 판과 함께 회전한다.

@scalar-control bed-leg-inset: 0.065
@scalar-control bed-drawer-x-offset: 0.37

@inventory folded: top, back-rail, drawer-case, drawer-0, drawer-1, drawer-2, telescopic-lower, telescopic-upper, collar, aux-panel, aux-hinge, aux-pull
@inventory open: top, back-rail, drawer-case, drawer-0, drawer-1, drawer-2, telescopic-lower, telescopic-upper, collar, aux-panel, aux-hinge, aux-pull
@inventory bed-1200: top, back-rail, support-left, support-right, drawer-one
@inventory bed-1240: top, back-rail, support-left, support-right, drawer-one
@inventory bed-1250: top, back-rail, support-left, support-right, drawer-one
@flat-contact folded: back-rail, wall, -Z, -0.30, -0.60..0.60, 0.76..0.84
@flat-contact open: back-rail, wall, -Z, -0.30, -0.60..0.60, 0.76..0.84
@flat-contact bed-1200: back-rail, wall, -Z, -0.30, -0.50..0.50, 0.75..0.81
@flat-contact bed-1240: back-rail, wall, -Z, -0.30, -0.50..0.50, 0.75..0.81
@flat-contact bed-1250: back-rail, wall, -Z, -0.30, -0.50..0.50, 0.75..0.81
@void folded: telescopic-lower, 0.591..0.629, 0.39..0.44, -0.019..0.019
@void open: telescopic-lower, 0.591..0.629, 0.39..0.44, -0.019..0.019
@void folded: collar, 0.585..0.635, 0.43..0.47, -0.025..0.025
@void open: collar, 0.585..0.635, 0.43..0.47, -0.025..0.025
@bore-z folded: top, 0.70, 0.715, 0.012, -0.10..0.30
@bore-z open: top, 0.70, 0.715, 0.012, -0.10..0.30
@bore-z folded: aux-panel, 0.70, 0.715, 0.012, -0.10..0.30
@bore-z open: aux-panel, 0.70, 0.715, 0.012, -0.10..0.30
@void folded: aux-panel, 0.707..0.725, 0.53..0.61, 0.09..0.104
@void open: aux-panel, 0.805..0.885, 0.722..0.740, 0.09..0.104

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | folded | * | bounds | -0.70..0.725 | 0..0.86 | -0.30..0.32 | - |
| @part | folded | top | hollow | -0.70..0.70 | 0.70..0.74 | -0.30..0.30 | drawer-case,telescopic-upper,back-rail,aux-hinge,aux-panel |
| @part | folded | back-rail | box | -0.70..0.70 | 0.74..0.86 | -0.30..-0.275 | top,wall |
| @part | folded | drawer-case | box | -0.70..-0.52 | 0..0.70 | -0.23..0.23 | ground,top,drawer-0 |
| @part | folded | drawer-0 | box | -0.69..-0.53 | 0.09..0.23 | 0.23..0.236 | drawer-case |
| @part | folded | drawer-1 | box | -0.69..-0.53 | 0.25..0.39 | 0.23..0.236 | drawer-case |
| @part | folded | drawer-2 | box | -0.69..-0.53 | 0.41..0.55 | 0.23..0.236 | drawer-case |
| @part | folded | telescopic-lower | hollow | 0.585..0.635 | 0..0.44 | -0.025..0.025 | ground,telescopic-upper,collar |
| @part | folded | telescopic-upper | box | 0.591..0.629 | 0.39..0.70 | -0.019..0.019 | telescopic-lower,top |
| @part | folded | collar | hollow | 0.579..0.641 | 0.43..0.47 | -0.031..0.031 | telescopic-lower |
| @part | folded | aux-panel | hollow | 0.70..0.725 | 0.415..0.715 | -0.10..0.32 | top,aux-hinge,aux-pull |
| @part | folded | aux-hinge | cylinder | 0.688..0.712 | 0.703..0.727 | -0.10..0.30 | top,aux-panel |
| @part | folded | aux-pull | box | 0.707..0.725 | 0.53..0.61 | 0.09..0.104 | aux-panel |
| @envelope | open | * | bounds | -0.70..1.00 | 0..0.86 | -0.30..0.32 | - |
| @part | open | top | hollow | -0.70..0.70 | 0.70..0.74 | -0.30..0.30 | drawer-case,telescopic-upper,back-rail,aux-hinge,aux-panel |
| @part | open | back-rail | box | -0.70..0.70 | 0.74..0.86 | -0.30..-0.275 | top,wall |
| @part | open | drawer-case | box | -0.70..-0.52 | 0..0.70 | -0.23..0.23 | ground,top,drawer-0 |
| @part | open | drawer-0 | box | -0.69..-0.53 | 0.09..0.23 | 0.23..0.236 | drawer-case |
| @part | open | drawer-1 | box | -0.69..-0.53 | 0.25..0.39 | 0.23..0.236 | drawer-case |
| @part | open | drawer-2 | box | -0.69..-0.53 | 0.41..0.55 | 0.23..0.236 | drawer-case |
| @part | open | telescopic-lower | hollow | 0.585..0.635 | 0..0.44 | -0.025..0.025 | ground,telescopic-upper,collar |
| @part | open | telescopic-upper | box | 0.591..0.629 | 0.39..0.70 | -0.019..0.019 | telescopic-lower,top |
| @part | open | collar | hollow | 0.579..0.641 | 0.43..0.47 | -0.031..0.031 | telescopic-lower |
| @part | open | aux-panel | hollow | 0.70..1.00 | 0.715..0.740 | -0.10..0.32 | top,aux-hinge,aux-pull |
| @part | open | aux-hinge | cylinder | 0.688..0.712 | 0.703..0.727 | -0.10..0.30 | top,aux-panel |
| @part | open | aux-pull | box | 0.805..0.885 | 0.722..0.740 | 0.09..0.104 | aux-panel |
| @envelope | bed-1200 | * | bounds | -0.60..0.60 | 0..0.82 | -0.30..0.30 | - |
| @part | bed-1200 | top | box | -0.60..0.60 | 0.70..0.74 | -0.30..0.30 | support-left,drawer-one,back-rail |
| @part | bed-1200 | back-rail | box | -0.60..0.60 | 0.74..0.82 | -0.30..-0.275 | top,wall |
| @part | bed-1200 | support-left | box | -0.5575..-0.5125 | 0..0.70 | 0.2175..0.2625 | ground,top |
| @part | bed-1200 | support-right | box | 0.5125..0.5575 | 0..0.70 | 0.2175..0.2625 | ground,top |
| @part | bed-1200 | drawer-one | box | -0.38..-0.08 | 0.58..0.70 | -0.23..0.23 | top |
| @envelope | bed-1240 | * | bounds | -0.62..0.62 | 0..0.82 | -0.30..0.30 | - |
| @part | bed-1240 | top | box | -0.62..0.62 | 0.70..0.74 | -0.30..0.30 | support-left,drawer-one,back-rail |
| @part | bed-1240 | back-rail | box | -0.62..0.62 | 0.74..0.82 | -0.30..-0.275 | top,wall |
| @part | bed-1240 | support-left | box | -0.5775..-0.5325 | 0..0.70 | 0.2175..0.2625 | ground,top |
| @part | bed-1240 | support-right | box | 0.5325..0.5775 | 0..0.70 | 0.2175..0.2625 | ground,top |
| @part | bed-1240 | drawer-one | box | -0.40..-0.10 | 0.58..0.70 | -0.23..0.23 | top |
| @envelope | bed-1250 | * | bounds | -0.625..0.625 | 0..0.82 | -0.30..0.30 | - |
| @part | bed-1250 | top | box | -0.625..0.625 | 0.70..0.74 | -0.30..0.30 | support-left,drawer-one,back-rail |
| @part | bed-1250 | back-rail | box | -0.625..0.625 | 0.74..0.82 | -0.30..-0.275 | top,wall |
| @part | bed-1250 | support-left | box | -0.5825..-0.5375 | 0..0.70 | 0.2175..0.2625 | ground,top |
| @part | bed-1250 | support-right | box | 0.5375..0.5825 | 0..0.70 | 0.2175..0.2625 | ground,top |
| @part | bed-1250 | drawer-one | box | -0.405..-0.105 | 0.58..0.70 | -0.23..0.23 | top |

prototype은 `work-desk/flex-1400`, `work-desk/bed-1200`, `work-desk/bed-1240`, `work-desk/bed-1250` 네 개다. 숫자는 상판 X 폭 mm이며 모두 깊이 0.60, 기본 높이 0.74m다. 원점은 바닥에서 상판 폭·깊이의 중심, +Z가 앉는 자리다. flex 상판은 두께 0.04m로 y=0.70..0.74, 좌측 중심 x=-0.61,z=0에 폭 0.18·깊이 0.46·높이 0.70m(y=0..0.70)의 서랍장을, 우측 중심 x=+0.61,z=0에 외경 0.05m의 두 겹 사각 기둥을 둔다. 서랍장 전면의 얕은 세 줄은 y=0.16, 0.32, 0.48 중심의 높이 0.14m 서랍 face이며 서랍 face 사이의 수평 틈은 0.02m다. 별도 손잡이 음각은 만들지 않는다. 벽측에는 길이 1.40m, 높이 0.12m의 고정 back rail을 상판 뒤 z=-0.30..-0.275에 두되 벽 구멍이나 방 lining을 생성하지 않는다. 조절을 읽히게 하는 기둥은 y=0..0.44의 외경 0.05m 하부 사각 sleeve와 y=0.39..0.70의 외경 0.038m 상부 사각 shaft다. 하부 sleeve는 아래 `@void`가 지정한 상단 구간에만 사각 보어를 내고 아래 구간은 속이 찬 기둥이다. 상부 shaft는 그 보어에 들어가 안쪽 벽과 보어 바닥면에 접한다. 폭 0.062m collar는 y=0.43..0.47, 내경 0.05m의 속 빈 고리로서 아래쪽에서는 하부 외벽에 접하고 위쪽에서는 상부 shaft 둘레에 0.006m 간격을 남긴다. 두 구간의 Y 경계는 `@part collar`와 `@part telescopic-lower`가 정한다. 세 닫힌 부품은 실제 부피를 공유하지 않는다. 기본 상태 하나만 표시하고 높이 이동이나 전동 성능은 주장하지 않는다. 책상 우측에 접힌 보조판은 0.30×0.42×0.025m, `aux-hinge` 경첩 축은 x=W/2=0.70, y=0.715, z=-0.10..+0.30이며 닫힌 판이 상판 오른쪽 끝에서 아래로 수직 접힌다. 손잡이는 X 0.018×Y 0.08×Z 0.014m로 접힌 판 외측의 x=0.707..0.725,y=0.53..0.61,z=0.09..0.104에 매립하고 판의 해당 면을 절삭한다. flex의 필수 `folded` 상태 전체 메시 AABB는 아래 `@envelope folded`가 정하며 숫자 1400은 상판 폭이다. flex의 back rail은 폭 1.40·깊이 0.025·높이 0.12m로 z=-0.30..-0.275, y=0.74..0.86에 놓는다. flex는 `folded`와 `open` 중 하나의 명시 상태를 반드시 받으며 상태 없는 호출을 거부한다. 보조판의 `folded` 상태는 x=0.70..0.725,y=0.415..0.715,z=-0.10..+0.32이다. 지름 0.024m의 `aux-hinge`는 Z축 x=0.70,y=0.715,z=−0.10..+0.30을 따른다. 상판과 보조판의 닫힌·열린 상태에는 아래 각 `@bore-z`가 정한 동일 Z 구간의 원통형 절삭을 낸다. 핀의 원통면은 절삭한 두 면에 닿고 어느 상태에서도 판의 닫힌 부피를 관통하지 않는다. `open` 상태는 이 Z축으로 바깥쪽 90° 회전한 판 x=0.70..1.00,y=0.715..0.740,z=-0.10..+0.32와 같은 판에 묻힌 손잡이를 내며 전체 메시 AABB는 `@envelope open`이 정한다. 닫힌 판과 열린 판을 동시에 내지 않는다. 세 침실 변종의 전체 AABB는 각 폭 W, 높이 0.82, 깊이 0.60m다. 세 침실 변종은 같은 상판 두께, 앞쪽 z=+0.24·x=±(W/2−0.065)에 y=0..0.70인 단면 0.045m 고정 다리 둘, 뒤쪽 z=-0.30..-0.275·y=0.74..0.82의 폭 W back rail과 왼쪽 중심 x=−W/2+0.37, y=0.64, z=0인 폭 0.30·깊이 0.46·높이 0.12m 한 서랍을 사용하고 telescopic·collar·aux를 생성하지 않는다.

안정 part는 `top/upper/edge/underside`, `back-rail/front/back/top/underside/edge`; 침실에만 `support-left/right/shaft/top/sole`과 `drawer-one/front/back/side-left/side-right/top/underside/edge`; flex에만 `drawer-case/front/back/side-left/side-right/top/underside`, `drawer-0..2/front/back/side-left/side-right/top/underside/edge`, `telescopic-lower/outer/inner/top/sole`, `telescopic-upper/outer/top/contact`, `collar/outer/inner/contact`, `aux-panel/front/back/edge`, `aux-hinge/outer/contact`, `aux-pull/outer/contact`다. 서랍마다 `front/back/side-left/side-right/top/underside/edge`의 일곱 face가 전면·후면·두 측면·상면·하면·노출 테두리를 중복 없이 덮는다. H2의 변종 키와 flex의 필수 `folded|open` 상태가 부품 집합·AABB를 고정한다. 정면·측면·상부·45°에서 무릎 공간과 벽 rail·서랍, flex의 기둥·접힌 판을 확인한다. ref04의 벽에 붙은 책상과 서랍선을 채택하되 사진의 숨은 지지 방식은 채택하지 않는다. settings의 조절식 단서를 보여야 하므로 ref04에 보이지 않는 기둥을 보이는 형태로 둔다. ref02의 침실 책상은 작은 고정 변종의 척도 관계로 채택하고 ref01·03·05에는 책상 세부가 없다. 실제 벽 앵커·높이 조절 작동·하중은 `unverified`다.

모든 변종의 `back-rail` 뒤 평면 z=−0.30은 벽 datum이며 `@flat-contact`의 X/Y 직사각형을 벽과 공유한다. 앞쪽 두 다리와 이 벽 접촉면이 고정 책상의 지지 경로를 이루며 실제 앵커 설계와 강도는 이 모델의 검증 대상이 아니다.

<!-- @authored-address-state:start -->
@address-state folded: top, back-rail, drawer-case, drawer-0, drawer-1, drawer-2, telescopic-lower, telescopic-upper, collar, aux-panel, aux-hinge, aux-pull
@address-state open: top, back-rail, drawer-case, drawer-0, drawer-1, drawer-2, telescopic-lower, telescopic-upper, collar, aux-panel, aux-hinge, aux-pull
@address-state bed-1200: top, back-rail, support-left, support-right, drawer-one
@address-state bed-1240: top, back-rail, support-left, support-right, drawer-one
@address-state bed-1250: top, back-rail, support-left, support-right, drawer-one
<!-- @authored-address-state:end -->

## 천 씌운 셸 책상 의자 {#desk-chair}

<!--
@evidence principles/core/common.md#scope-preservation 작업실·침실 책상 의자의 연결 셸과 천층을 이 H2가 맡고 식탁의 분리 목재 의자는 dining-chair에 남긴다.
@evidence principles/core/common.md#substantive-completion @curve-layer가 셸 뒤 곡선, 천 두께와 0.001m 간격을 정하고 두 @piece를 한 upholstery 부품으로 용접한다.
@evidence principles/core/common.md#declared-basis ref04의 초록 연결 셸과 ref02의 침실 반복을 받으며 등 곡선·천층·다리 좌표는 이 H2의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 작업실 chair와 upper-program의 침실 책상 사용에 연속 seat/back 셸·분리된 패드·네 다리를 더한다.
@evidence principles/design/models.md#representation-contract shell-seat와 shell-back을 공유 모서리에서 용접하고 upholstery의 좌판·등판 조각도 닫힌 한 부품으로 만들어 셸과 체적을 겹치지 않는다.
@evidence principles/design/models.md#spatial-convention 바닥 x=0,z=0을 원점, +Z를 착석 앞에 두고 셸 y=0.39..0.83과 네 다리 중심 x=±0.18을 명시한다.
@evidence principles/design/models.md#reviewable-structure 측면·45°에서 굽은 등과 좌면의 연속성, 천층의 두께와 다리 사이 빈 공간을 검사한다.
@evidence principles/design/models.md#model-observable-style-basis ref04의 초록 천 씌운 셸 실루엣을 곡면과 얇은 upholstery로 바꾸고 ref03 목재 식탁 의자의 직각 등과 혼합하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 0.52×0.55×0.83m 외곽과 셸·천층·네 다리의 실제 곡면 AABB를 맞춰 연결형 좌석이 빈 껍질 또는 겹친 상자로 남지 않게 한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 작업실 chair, upper-program의 침실 책상, flex-workroom의 출입 유지 조건을 시험했다. 연결 셸·패드·네 다리의 접지와 크기는 의자 원형 안에서 닫히며 착석 적합성이나 별도 상태를 주장하지 않고 통행은 배치가 재므로 부모 수정이 없다.
@evidence settings/002-household.md#ground-program 작업실의 chair를 책상과 분리된 좌석 원형으로 받는다.
@evidence settings/002-household.md#upper-program 침실의 작은 책상에 쓸 수 있는 좌석 원형을 받되 방별 수량은 배치가 정한다.
@evidence spaces/002-spatial-graph.md#flex-workroom 작업실 출입 통로를 남겨야 하는 방 조건을 받아 의자의 실제 위치는 instances에 남긴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 의자의 셸·패드·다리와 face 주소를 models에서 정한다.
-->

@axis-control default: upholstery, Z, -0.074, upholstery-to-back junction

`@curve-layer`는 t=(y−0.415)/0.415에서 등 셸의 뒤 곡선 `−0.10−0.25t+0.08t²`, 셸 두께 0.025m, 천층 두께 0.035m와 좌판 뒤 edge 간격 0.001m를 뜻한다. `upholstery`의 두 `@piece`는 실제 채운 상자가 아니라 그 곡면으로 잘린 좌판·등판 조각의 AABB다. 좌판 조각의 뒤 경계는 셸 앞면에서 0.001m 앞이고, 등판 조각은 셸 앞면부터 천층 두께만큼 앞에 있다. 두 천 조각은 아래 두 `@piece`가 공유하는 Y 접합면에서 한 부품으로 용접하고 셸과 체적을 겹치지 않는다.

@scalar-control shell-back-rake: 0.17
@scalar-control shell-back-bow: 0.02
@scalar-control seat-rear-offset: 0.026

@prose-part 좌면 셸은: shell-seat
@prose-part 천 좌면은: upholstery
@prose-part 등 셸은: shell-back
@prose-part 좌면 아래 네 다리는: leg-*
@prose-part 좌면 셸의: shell-seat
@prose-dim 등 천층은: upholstery
@inventory default: shell-seat, shell-back, upholstery, leg-0, leg-1, leg-2, leg-3
@curve-layer default: shell-back, upholstery, -0.10, -0.25, 0.08, 0.025, 0.035, 0.001
@cap-contact default: leg-0, shell-seat, Y, +
@cap-contact default: leg-1, shell-seat, Y, +
@cap-contact default: leg-2, shell-seat, Y, +
@cap-contact default: leg-3, shell-seat, Y, +
@cap-contact default: shell-back, shell-seat, Y, -
@cap-contact default: shell-seat, upholstery, Y, +
@piece default: upholstery, -0.24..0.24, 0.415..0.45, -0.094515314..0.26
@piece default: upholstery, -0.24..0.24, 0.45..0.83, -0.245..-0.060515314

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.26..0.26 | 0..0.83 | -0.27..0.28 | - |
| @part | default | shell-seat | curved | -0.26..0.26 | 0.39..0.415 | -0.10..0.28 | leg-0,shell-back,upholstery |
| @part | default | shell-back | curved | -0.26..0.26 | 0.415..0.83 | -0.27..-0.075 | shell-seat,upholstery |
| @part | default | upholstery | curved | -0.24..0.24 | 0.415..0.83 | -0.245..0.26 | shell-seat,shell-back |
| @part | default | leg-0 | cylinder | -0.1925..-0.1675 | 0..0.39 | -0.0925..-0.0675 | ground,shell-seat |
| @part | default | leg-2 | cylinder | 0.1675..0.1925 | 0..0.39 | -0.0925..-0.0675 | ground,shell-seat |
| @part | default | leg-1 | cylinder | -0.1925..-0.1675 | 0..0.39 | 0.1675..0.1925 | ground,shell-seat |
| @part | default | leg-3 | cylinder | 0.1675..0.1925 | 0..0.39 | 0.1675..0.1925 | ground,shell-seat |

`desk-chair`는 폭 0.52, 깊이 0.55, 높이 0.83m다. 바닥 y=0에서 x=0,z=0인 설계 기준점이 원점이고 +Z가 앉는 앞쪽이다. 등받이와 좌면은 외관상 한 장의 곡면 셸이다. 좌면 셸은 폭 0.52m, z=−0.10..+0.28, y=0.39..0.415이고 그 위 폭 0.48m의 천 좌면은 y=0.415..0.45에서 앞 edge z=+0.26이고 뒤 edge z_rear(y)=−0.10−0.17t−0.02×4t(1−t)+0.026m, t=(y−0.415)/0.415다. 이 뒤 edge는 등 셸 앞면보다 0.001m 앞쪽이고 천 좌면의 아래면은 `@part shell-seat`의 윗면에 면 접촉한다. 등 셸은 y=0.415..0.83에서 뒤쪽 표면 z(y)=−0.10−0.17t−0.02×4t(1−t), t=(y−0.415)/0.415로 굽고 두께 0.025m를 +Z로 낸다. 등 천층은 등 셸 앞면부터 +Z로 0.035m, 폭 0.48m이며 두 `@piece`의 공유 Y 면에서 좌판 천 조각과 겹치는 단면을 용접한다. 이음의 좌판 뒤 경계와 등판 앞 경계는 `@curve-layer`로 계산한 서로 다른 Z 위치에 남아 오목한 단을 이룬다. 두 천 부피의 공유 접합면은 제거하여 하나의 닫힌 upholstery 부품으로 만든다. 등 뒤 기울기와 실제 축별 극값은 `@curve-layer` 및 `@part shell-back`이 단독으로 정한다. 셸과 천층은 각각 닫힌 부품으로 만들고, 좌면 아래 네 다리는 중심 x=±0.18, 뒤쪽 z=−0.08·앞쪽 z=+0.18에 지름 0.025m, y=0..0.39로 둔다. 각 다리 상단은 좌면 셸의 y=0.39 아래면과 접하고 X/Z 단면은 좌면 범위 안이다. 연속 셸은 공유 모서리에서 용접하되 좌면과 등판 표면을 `shell-seat/upper/edge/underside`, `shell-back/front/rear/edge`로 나눈다. `upholstery/seat/back/edge`, `leg-0..3/shaft/top/sole`도 안정 주소다. 정면·측면·45°에서 좌면과 등판이 이어진 곡률을 확인하고 다리 사이를 막지 않는다. ref04의 초록 천 씌운 연결형 셸 의자를 채택하여 현재 `chair()`의 독립 직각 등판을 교체한다. ref02의 침실 책상 의자는 동일 prototype 반복의 근거이고 ref03의 목재 식탁 의자와 혼용하지 않는다. ref01·05에는 책상 의자를 판독할 형상이 없다. 인체 적합성은 `unverified`다.

<!-- @authored-address-state:start -->
@address-state default: shell-seat, shell-back, upholstery, leg-0, leg-1, leg-2, leg-3
<!-- @authored-address-state:end -->

## 책상 화면과 키보드 {#work-equipment}

<!--
@evidence principles/core/common.md#scope-preservation 책상 화면과 키보드만 model 부품으로 만들고 화면 UI·문자·전원, 책상 상판 형상은 이 H2의 납품에서 제외한다.
@evidence principles/core/common.md#substantive-completion 화면의 받침·shaft·housing·bezel·screen과 키보드의 body·12×4 key cap을 점유·절삭·@grid로 정한다.
@evidence principles/core/common.md#declared-basis ref04의 책상 위 작업 도구를 외관 근거로 삼고 장치 치수·키 pitch·bezel recess는 이 모델 H2가 선택한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 작업실 책상과 upper-program의 침실 책상에 놓을 선택 물체로 화면 받침과 키 배열의 독립 원형을 더한다.
@evidence principles/design/models.md#representation-contract bezel 중앙을 관통 절삭하고 뒤 housing에 screen을 물리며 48개 cap은 각 닫힌 부품으로 body 상면에 닿게 한다.
@evidence principles/design/models.md#spatial-convention 받침 또는 키보드 아래면 중심을 원점으로, +Z를 사용자 쪽으로 두고 cap id=12r+c의 행 우선 좌표를 정한다.
@evidence principles/design/models.md#reviewable-structure 정면에서 화면의 recessed face와 stand, 상부·45°에서 12열×4행의 독립 cap 및 body 접지를 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref04의 간결한 작업 장치를 평판 화면·낮은 키 배열로 읽고 앱 화면이나 글자를 사진에서 추정해 넣지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion display envelope 0.50×0.42×0.12m와 keyboard 0.35×0.015×0.12m에 모든 support와 @grid key를 포함한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program과 upper-program의 desk, household-program의 생활 흔적, surface-decomposition의 소품 형상을 시험했다. 화면·키보드는 책상 위에 놓는 저작 소품이며 작동 전자 기능·새 개구·상태를 요구하지 않아 부모 프로그램을 고치지 않는다.
@evidence settings/002-household.md#ground-program 작업실 desk를 화면과 키보드가 놓일 수 있는 작업면으로 받는다.
@evidence settings/002-household.md#upper-program 침실의 작은 desk를 같은 원형의 가능한 배치 대상으로 받는다.
@evidence settings/002-household.md#household-program 생활 흔적을 물체로 표현하는 범위 안에서 화면과 키보드를 저작 소품으로 선택한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 화면 받침·bezel·키 배열의 형상 주소를 models가 정하고 전자 작동과 방별 배치는 약속하지 않는다.
-->

@prose-part 화면 하단은: housing
@prose-part 낮은 key cap은: keys-*
@prose-dim key cap은: keys-*

`work-display`의 전체 화면판은 폭 0.50, 높이 0.30, 깊이 0.025m이고 놓이는 받침 아래면 중심이 원점, +Z가 사용자 쪽이다. 화면 하단은 y=0.12, 중앙 stand shaft는 높이 0.106m·0.04×0.04m로 y=0.014..0.12, 받침은 0.18×0.12×0.014m다. housing 뒤판은 x=±0.25,y=0.12..0.42,z=−0.0125..0.006이고 display-bezel은 같은 x/y 외곽에서 z=0.006..0.0125의 0.0065m 전면 띠다. bezel 안쪽은 x=±0.238,y=0.132..0.408을 관통 절삭한다. screen은 같은 안쪽 폭·높이에서 z=0.006..0.009에 놓여 housing에 닿고 bezel보다 0.0035m 물린다. `display-bezel/front/back/edge`, `screen/front/back/edge`, `housing/front/back/edge`, `stand-shaft/outer/top/sole`, `stand-base/upper/edge/sole`로 나눈다. `work-keyboard`는 폭 0.35, 깊이 0.12, 높이 0.015m이며 아래면 중심이 원점, +Z가 사용자 쪽이다. 본체는 y=0..0.012, 12열×4행의 낮은 key cap은 각각 X 폭 0.018m·Z 깊이 0.013m·Y 높이 0.003m로 y=0.012..0.015에 놓는다. cap 중심은 열 c=0..11에서 x=(c−5.5)×0.025m, 행 r=0..3에서 z=(r−1.5)×0.023m이고 key id는 12r+c다. 이 가로·세로 pitch를 명시하고 `keyboard-body/top/edge/underside`, `keys-0..47/top/edge/underside` 주소를 갖는다. 두 물체는 desk 상판을 생성하거나 material을 빌리지 않는다. 정면·측면·45°에서 stand의 접지와 독립 키 배열을 확인한다. ref04의 책상 위 작업 도구를 채택하지만 화면 UI나 글자는 만들지 않는다. ref02의 책상은 추가 배치의 근거이고 ref01·03·05는 장치 모델의 형상을 지정하지 않는다. 출력·전원은 `unverified`다.

`@grid`는 키 48개의 부품 행을 위의 12열×4행 수식에서 전개한다. 수동으로 48행을 복제하지 않으며 각 키의 X/Z 점유와 body 상면 접촉을 개별 검사한다. `support`는 책상 상면에 놓이는 y=0 접촉이다.

@scalar-control display-screen-recess: 0.0035
@scalar-control key-column-midindex: 5.5
@scalar-control key-row-midindex: 1.5

@prose-part housing 뒤판은: housing
@prose-part display-bezel은: display-bezel
@prose-part bezel 안쪽은: display-bezel
@prose-part screen은: screen
@prose-part stand shaft는: stand-shaft
@inventory display: stand-base, stand-shaft, housing, display-bezel, screen
@inventory keyboard: keyboard-body, keys-0..47
@void display: display-bezel, -0.238..0.238, 0.132..0.408, 0.006..0.0125
@grid keyboard: keys, 12, 4, 0.025, 0.023, 0.018, 0.013, 0.012..0.015, keyboard-body

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | display | * | bounds | -0.25..0.25 | 0..0.42 | -0.06..0.06 | - |
| @part | display | stand-base | box | -0.09..0.09 | 0..0.014 | -0.06..0.06 | support,stand-shaft |
| @part | display | stand-shaft | box | -0.02..0.02 | 0.014..0.12 | -0.02..0.02 | stand-base,housing |
| @part | display | housing | box | -0.25..0.25 | 0.12..0.42 | -0.0125..0.006 | stand-shaft,display-bezel,screen |
| @part | display | display-bezel | hollow | -0.25..0.25 | 0.12..0.42 | 0.006..0.0125 | housing,screen |
| @part | display | screen | box | -0.238..0.238 | 0.132..0.408 | 0.006..0.009 | housing,display-bezel |
| @envelope | keyboard | * | bounds | -0.175..0.175 | 0..0.015 | -0.06..0.06 | - |
| @part | keyboard | keyboard-body | box | -0.175..0.175 | 0..0.012 | -0.06..0.06 | support,keys-0 |

<!-- @authored-address-state:start -->
@address-state display: stand-base, stand-shaft, housing, display-bezel, screen
@address-state keyboard: keyboard-body, keys-0, keys-1, keys-2, keys-3, keys-4, keys-5, keys-6, keys-7, keys-8, keys-9, keys-10, keys-11, keys-12, keys-13, keys-14, keys-15, keys-16, keys-17, keys-18, keys-19, keys-20, keys-21, keys-22, keys-23, keys-24, keys-25, keys-26, keys-27, keys-28, keys-29, keys-30, keys-31, keys-32, keys-33, keys-34, keys-35, keys-36, keys-37, keys-38, keys-39, keys-40, keys-41, keys-42, keys-43, keys-44, keys-45, keys-46, keys-47
<!-- @authored-address-state:end -->

## 작업실 안락의자 {#accent-chair}

<!--
@evidence principles/core/common.md#scope-preservation 작업실 창가의 낮은 독립 안락의자만 소유하고 거실 소파 축소나 접이식 책상 앞 의자에 합치지 않는다.
@evidence principles/core/common.md#substantive-completion frame·seat·back·back-cushion·양팔·네 다리를 닫힌 직육면체와 유한 접합면으로 정해 외형과 지지 경로를 닫는다.
@evidence principles/core/common.md#declared-basis ref02의 창가 독립 좌석과 낮은 팔걸이를 받으며 0.86×0.82×0.70m envelope와 부품 접합은 이 H2의 모델 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 작업실 chair와 flex-workroom의 전면 방에 ref02에서 선택한 낮은 안락의자의 등 쿠션·팔걸이 접합을 더한다.
@evidence principles/design/models.md#representation-contract frame/outer·underside, seat/upper·side·underside, back/front·back·edge와 각 다리 sole이 닫힌 부품의 서로 다른 면을 나눈다.
@evidence principles/design/models.md#spatial-convention 바닥 중심을 원점으로, +Z를 앉는 앞쪽으로 하고 네 다리 y=0..0.12와 등판 최고 y=0.82를 @part에 둔다.
@evidence principles/design/models.md#reviewable-structure 정면·측면·45°에서 낮은 팔걸이, 등 쿠션과 좌판의 접점, 네 개별 접지 발이 보이는지 검사한다.
@evidence principles/design/models.md#model-observable-style-basis ref02의 초록 낮은 안락의자를 단순 직육면체 질량과 열린 다리로 읽고 ref04의 책상 셸 의자와 구별한다.
@evidence principles/design/models.md#model-scale-layer-completion 0.86m 폭의 양팔 외곽과 0.82m 등 높이 안에 좌석·쿠션·다리 열 부품을 전부 대응해 숨은 지지를 발명하지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 작업실 chair와 flex-workroom의 2.24m clear 폭·출입을 시험했다. ref02의 낮은 안락의자는 추가 좌석 형상 선택이며 바닥 접촉과 쿠션 지지는 원형 안에 닫힌다. 출입 clear는 배치에서 검증하므로 새 방 크기나 상태를 요구하지 않는다.
@evidence settings/002-household.md#ground-program 전면 작업실의 chair 기능에 낮은 독립 좌석 원형을 제안하되 의자 수를 프로그램의 의무로 돌리지 않는다.
@evidence spaces/002-spatial-graph.md#flex-workroom 2.24m clear 폭과 현관 직결 출입을 안락의자 배치의 경계로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 안락의자의 팔걸이·쿠션·다리 형상과 face를 models가 정한다.
-->

ref02의 작업실 창가에 놓인 낮은 독립 안락의자를 `accent-chair/default`로 둔다. 바닥 중심이 원점이고 +Z가 앉는 사람의 앞이다. 아래 행의 닫힌 직육면체가 부품의 실제 점유다. 넷의 다리는 좌우·앞뒤 두 위치씩이며, 프레임 위에 좌판, 뒤 가장자리 위에 등판이 선다. 등 쿠션은 등판 앞면과, 좌판은 양팔의 안쪽 면과 각각 유한 면으로 접촉한다. 등 쿠션의 아래면과 좌판의 윗면은 같은 Y 평면에서 만난다. 모서리를 임의로 둥글리는 자유도나 숨은 내부 부재는 없다. 실제 인체 하중은 `unverified`이고 방 안의 통행 폭은 instances가 측정한다.

@inventory default: frame, leg-0, leg-1, leg-2, leg-3, seat, back, back-cushion, arm-left, arm-right

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.43..0.43 | 0..0.82 | -0.35..0.35 | - |
| @part | default | frame | box | -0.37..0.37 | 0.12..0.28 | -0.35..0.35 | leg-0,leg-1,leg-2,leg-3,seat,back,arm-left,arm-right |
| @part | default | leg-0 | box | -0.37..-0.32 | 0..0.12 | -0.35..-0.30 | ground,frame |
| @part | default | leg-1 | box | -0.37..-0.32 | 0..0.12 | 0.30..0.35 | ground,frame |
| @part | default | leg-2 | box | 0.32..0.37 | 0..0.12 | -0.35..-0.30 | ground,frame |
| @part | default | leg-3 | box | 0.32..0.37 | 0..0.12 | 0.30..0.35 | ground,frame |
| @part | default | seat | box | -0.32..0.32 | 0.28..0.44 | -0.27..0.35 | frame,back-cushion,arm-left,arm-right |
| @part | default | back | box | -0.32..0.32 | 0.28..0.82 | -0.35..-0.27 | frame,back-cushion,arm-left,arm-right |
| @part | default | back-cushion | box | -0.30..0.30 | 0.44..0.75 | -0.27..-0.17 | back,seat |
| @part | default | arm-left | box | -0.43..-0.32 | 0.28..0.62 | -0.35..0.35 | frame,back,seat |
| @part | default | arm-right | box | 0.32..0.43 | 0.28..0.62 | -0.35..0.35 | frame,back,seat |

안정 면 주소는 `frame/outer/underside`, `leg-0..3/shaft/top/sole`, `seat/upper/side/underside`, `back/front/back/edge`, `back-cushion/front/side/back`, `arm-left/right/top/inner/outer`다. ref02의 낮은 팔걸이와 창가 독립 좌석 역할을 채택한다. ref04의 접이식 작업면 앞 의자와는 다른 물체다. 정면·측면·45°에서 등판·좌판·양팔과 네 접지를 확인한다.

@address-state default: frame, leg-0, leg-1, leg-2, leg-3, seat, back, back-cushion, arm-left, arm-right
