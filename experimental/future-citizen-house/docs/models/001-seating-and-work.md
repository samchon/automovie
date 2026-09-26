# 좌석과 작업 가구 모델

[공통 단위·주소·관찰](000-representation.md#model-address-and-scale)을 참조한다.

## 거실 직선·L자 소파 {#living-sofa}

등 프레임·등 쿠션·베개는 아래 `@curve-linear`의 같은 기울기 곡선을 따른다. 첫 인터페이스의 gap은 0이고 둘째의 gap은 0.002m여서 베개는 등 쿠션에서 떨어진 채 좌판에만 지지된다. 긴 의자 변종은 공통 본체 부품을 같은 좌표로 재사용하고 앞쪽 연장 프레임·좌판 두 부품과 다리 둘을 추가한다.

@scalar-control seat-seam: 0.025
@scalar-control arm-seat-clearance: 0.018
@scalar-control pillow-front-base: 0.19
@scalar-control pillow-z-min-rounded: 0.2386
@scalar-control pillow-z-max-rounded: 0.0476
@scalar-control chaise-front-leg-offset: 0.32

@prose-part 프레임은: frame
@prose-part 양팔은: arm-*
@prose-part 좌판 세 개의: seat-*
@prose-part 등 쿠션의: back-cushion-*
@prose-dim 등받이는: back-frame
@prose-part 각 베개 뒷면은: pillow-*
@prose-part 베개 셋은: pillow-*
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

`living-sofa/straight`는 폭 2.70, 높이 0.88, 깊이 0.96m의 세 좌석이다. `living-sofa/chaise-right`는 오른쪽 좌석 앞에 길이 0.82m의 연장 쿠션을 더하여 전체 깊이 1.78m로 만든다. 원점은 바닥의 외곽 폭 중심과 본체 깊이 중심, +Z가 착석 앞이고 +X가 오른쪽이다. 본체는 x=±1.35, z=±0.48이다. 네 노출 다리는 단면 0.06×0.06m, 중심 x=±1.21,z=±0.34, y=0..0.10이다. 프레임은 x=±1.19,z=±0.48,y=0.10..0.31이고 양팔은 x=±(1.19..1.35), z=±0.48, y=0.10..0.64다. 좌판 세 개의 각 폭은 (2.70−2×0.16−2×0.025−2×0.018)/3m, 중심 x=−0.789666..,0,+0.789666.., z=−0.30..+0.48, y=0.31..0.45다. 두 좌판 사이 0.025m, 팔과 좌판 사이 0.018m 빈 틈을 남긴다. 등받이는 y=0.31..0.88에서 두께 0.09m이고 뒷면은 하단 z=−0.40, 상단 z=−0.48이고 앞면은 각 높이에서 0.09m 앞쪽이므로 위로 갈수록 0.08m 기울며, 폭 0.764666..m의 등 쿠션 셋은 각 좌판 중심 x에 y=0.46..0.82, 깊이 0.12m로 독립한다. 각 등 쿠션의 뒷면은 등 프레임 앞면 z(y)=−0.31−0.08(y−0.31)/0.57에 접하고 앞면은 그 값에서 +0.12m이며, 접합 내부 삼각형은 노출 면으로 세지 않는다. 베개 셋은 같은 x 중심, 폭 0.48·높이 0.22·깊이 0.16m로 y=0.45..0.67에 놓인다. 각 베개 뒷면은 등 쿠션 앞면 z(y)=−0.19−0.08(y−0.31)/0.57보다 0.002m 앞쪽에 평행하고 앞면은 그 값에서 +0.16m이며, 아래면 y=0.45가 좌판 상면과 면 접촉한다. 따라서 베개 Z 점유를 바깥으로 반올림한 선언 범위는 −0.2386..−0.0476m이고 등 쿠션과 부피가 겹치지 않는다. 긴 의자 변종의 연장 프레임과 좌판은 오른쪽 좌판과 같은 x 폭·중심으로 z=0.48..1.30, y=0.10..0.31과 y=0.31..0.45를 각각 차지한다. 앞다리 둘은 중심 x=0.789666..±0.32,z=1.20, 단면 0.06×0.06m,y=0..0.10이다. 접합선은 z=0.48에만 있고 발치·프레임 아래는 빈다.

안정 part는 `frame`, `leg-0..3`, `seat-0..2`, `back-frame`, `back-cushion-0..2`, `arm-left/right`, `pillow-0..2`, L자 상태의 `chaise-frame/seat/front-leg-0..1`이다. 프레임과 긴 의자 프레임은 `upper/side/underside/contact`, 다리는 `shaft/top/sole`, 좌판·등 쿠션·팔·베개·긴 의자 좌판은 `upper/side/underside/seam`, 등 프레임은 `front/back/edge`, 긴 의자 앞다리는 `shaft/top/sole`로 분리한다. 각 부품의 face는 [공통 완결 규칙](000-representation.md#model-address-and-scale)에 따라 전체를 덮는다. 등판 내부 구조와 주름은 blocking 범위 밖이고 실제 착석 하중은 `unverified`다. 정면·측면·상부·45°와 낮은 하부 관찰에서 세 좌석, 바닥 틈, L자 발치가 구별돼야 한다. ref02의 L자 소파는 `chaise-right`의 발치와 개방 동선 관계로 채택하고 ref03의 직선 소파는 `straight`의 낮은 직물 질량으로 채택한다. ref01·04·05에서 보이지 않는 소파 치수는 가져오지 않으며 ref02의 카메라 투시를 길이 비율로 복제하지 않는다.

ref02 작업실의 초록 안락의자는 이 거실 소파의 축소형으로 만들지 않고 [별도 안락의자](#accent-chair)로 설계한다. ref04의 작업실은 접이식 침대 전면·책상·계단 출입 사이의 빈 바닥이 핵심이며, 안락의자 배치가 그 통행을 침범하는지는 instances 관찰 전까지 `unverified`다.

<!-- @authored-address-state:start -->
@address-state straight: frame, leg-0, leg-1, leg-2, leg-3, seat-0, seat-1, seat-2, back-frame, back-cushion-0, back-cushion-1, back-cushion-2, arm-left, arm-right, pillow-0, pillow-1, pillow-2
@address-state chaise-right: frame, leg-0, leg-1, leg-2, leg-3, seat-0, seat-1, seat-2, back-frame, back-cushion-0, back-cushion-1, back-cushion-2, arm-left, arm-right, pillow-0, pillow-1, pillow-2, chaise-frame, chaise-seat, chaise-front-leg-0, chaise-front-leg-1
<!-- @authored-address-state:end -->

## 여섯 자리 식탁 {#dining-table}

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

뒷다리 하나의 아래 shaft와 위로 굽은 접합부는 같은 부품 주소의 서로 면으로 닿는 두 점유 조각이다. 위쪽 조각은 좌판 위 y=0.45..0.49에 있으므로 좌판 속을 관통하지 않는다. `@piece`는 부품 전체 AABB가 아닌 실제 연결된 점유를 검사한다.

@scalar-control back-rake: 0.07

@prose-part 목재 좌판 구조는: seat-frame
@prose-part 천 좌판은: seat-pad
@prose-part 등판은: back
@prose-part 뒤쪽 두 다리는: leg-*
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

`dining-chair`는 폭 0.48, 깊이 0.55, 높이 0.84m이며 바닥에서 좌판 기준 X/Z 좌표가 각각 0인 점을 원점으로 두고 +Z를 앉는 앞쪽으로 둔다. 목재 좌판 구조는 폭 0.48·깊이 0.52m, x=±0.24,z=±0.26,y=0.38..0.415이고 그 위 분리된 천 좌판은 폭 0.44·깊이 0.48m, x=±0.22,z=±0.24,y=0.415..0.45다. 등판은 폭 0.46m·두께 0.025m, y=0.49..0.84이고 중앙선 z(y)=−0.15−0.07t−0.03×4t(1−t), t=(y−0.49)/0.35로 굽힌다. 따라서 양 끝 중앙선 z=−0.15/−0.22이고 가운데가 0.03m 더 뒤로 휜다. 좌판과 등판 사이에는 높이 0.04m의 틈이 남는다. 다리 단면은 0.03×0.03m이고 x=±0.19, 앞쪽 z=+0.19의 두 다리는 y=0..0.38이다. 뒤쪽 두 다리는 y=0..0.45에서 중심 z=−0.275로 좌판 뒤 edge z=−0.26에 외측 면으로 닿고, y=0.45..0.49의 위 조각은 `@shear-z`의 선형 중심선 z(y)=−0.275+0.125(y−0.45)/0.04를 따르는 X 폭 0.03m·세계 Z 방향 반두께 0.015m의 닫힌 사각 단면이다. y=0.45와 y=0.49에서 수평 평면으로 끝단을 절단한다. 따라서 위 조각의 Z 범위는 −0.29..−0.135이고 y=0.45의 아래 끝면은 z=−0.29..−0.26에서 아래 shaft와 0.03×0.03m로 닿는다. 이 끝면은 좌판 뒤 edge z=−0.26보다 뒤에 있으므로 좌판·천 좌판을 관통하지 않는다. y=0.49의 위 끝면 z=−0.165..−0.135는 등판 하단 z=−0.1625..−0.1375와 X 폭 0.03m·Z 겹침 0.025m의 면으로 닿으며 등판 부피를 관통하지 않는다. 각 뒤 다리는 하나의 연속 부품이며 0.04m 열린 등 아래 틈의 좌우 가장자리만 지난다. `seat-frame/upper/edge/underside`, `seat-pad/upper/edge/underside`, `back/front/rear/edge`, `leg-0..3/shaft/top/sole`이 안정 주소다. 좌판 직물과 구조 목재가 한 face를 공유하지 않는다. 정면·측면·45°에서 천 좌판의 두께와 등판의 분리·곡률을 확인한다. ref03에서 목재 의자의 별도 천 좌판과 뒤 지지를 채택하고 ref02에서 여섯 자리 반복만 받는다. ref04의 껍질형 책상 의자는 [책상 의자](#desk-chair)로 구분한다. ref01·05에는 식탁 의자가 없다. 실제 착석 강도는 `unverified`다.

<!-- @authored-address-state:start -->
@address-state default: seat-frame, seat-pad, back, leg-0, leg-1, leg-2, leg-3
<!-- @authored-address-state:end -->

## 고리 발받침 섬 스툴 {#island-stool}

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

flex의 세 서랍 전면은 서랍장 전면 z=0.23에 두께 0.006m로 면 부착한다. 기둥 sleeve와 collar는 각 내경을 실제 빈 점유로 절삭한다. 보조 경첩의 Z축은 상판 범위에 맞춰 z=−0.10..+0.30m에서 끝나며 보조판 앞의 추가 0.02m는 판 자체의 돌출이다. 접힌 손잡이는 판에 매립되고 열린 상태에서는 같은 판 회전으로 x=0.805..0.885,y=0.722..0.740에 옮겨진다.

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
@void folded: top, 0.688..0.70, 0.703..0.727, -0.10..0.30
@void open: top, 0.688..0.70, 0.703..0.727, -0.10..0.30
@void folded: aux-panel, 0.70..0.712, 0.703..0.715, -0.10..0.30
@void open: aux-panel, 0.70..0.712, 0.715..0.727, -0.10..0.30
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

prototype은 `work-desk/flex-1400`, `work-desk/bed-1200`, `work-desk/bed-1240`, `work-desk/bed-1250` 네 개다. 숫자는 상판 X 폭 mm이며 모두 깊이 0.60, 기본 높이 0.74m다. 원점은 바닥에서 상판 폭·깊이의 중심, +Z가 앉는 자리다. flex 상판은 두께 0.04m로 y=0.70..0.74, 좌측 중심 x=-0.61,z=0에 폭 0.18·깊이 0.46·높이 0.70m(y=0..0.70)의 서랍장을, 우측 중심 x=+0.61,z=0에 외경 0.05m의 두 겹 사각 기둥을 둔다. 서랍장 전면의 얕은 세 줄은 y=0.16, 0.32, 0.48 중심의 높이 0.14m 서랍 face이며 서랍 face 사이의 수평 틈은 0.02m이고 손잡이 음각의 깊이만 0.01m다. 벽측에는 길이 1.40m, 높이 0.12m의 고정 back rail을 상판 뒤 z=-0.30..-0.275에 두되 벽 구멍이나 방 lining을 생성하지 않는다. 조절을 읽히게 하는 기둥은 y=0..0.44의 외경 0.05m 하부 사각 sleeve와 y=0.39..0.70의 외경 0.038m 상부 사각 shaft다. 하부 sleeve는 벽 두께 0.006m이고 내경 0.038m의 속 빈 통이며 상부 shaft는 그 보어에 들어가 y=0.39..0.44에서 벽면에만 접한다. 폭 0.062m collar는 y=0.43..0.47, 내경 0.05m의 속 빈 고리로서 y=0.43..0.44에서는 하부 외벽에 접하고 y=0.44..0.47에서는 상부 shaft 둘레에 0.006m 간격을 남긴다. 세 닫힌 부품은 실제 부피를 공유하지 않는다. 기본 상태 하나만 표시하고 높이 이동이나 전동 성능은 주장하지 않는다. 책상 우측에 접힌 보조판은 0.30×0.42×0.025m, `aux-hinge` 경첩 축은 x=W/2=0.70, y=0.715, z=-0.10..+0.30이며 닫힌 판이 상판 아래에 수직으로 붙는다. 손잡이는 X 0.018×Y 0.08×Z 0.014m로 접힌 판 외측의 x=0.707..0.725,y=0.53..0.61,z=0.09..0.104에 매립하고 판의 해당 면을 절삭한다. flex의 필수 `folded` 상태 전체 메시 AABB는 x=−0.70..+0.725,y=0..0.86,z=−0.30..+0.32m이며 숫자 1400은 상판 폭이다. flex의 back rail은 폭 1.40·깊이 0.025·높이 0.12m로 z=-0.30..-0.275, y=0.74..0.86에 놓는다. flex는 `folded`와 `open` 중 하나의 명시 상태를 반드시 받으며 상태 없는 호출을 거부한다. 보조판의 `folded` 상태는 x=0.70..0.725,y=0.415..0.715,z=-0.10..+0.32이다. 지름 0.024m의 `aux-hinge`는 Z축 x=0.70,y=0.715,z=−0.10..+0.30을 따른다. 상판에는 이 축의 x=0.688..0.70,y=0.703..0.727 점유를, 보조판에는 접힌 상태 x=0.70..0.712,y=0.703..0.715 및 열린 상태 x=0.70..0.712,y=0.715..0.727의 점유를 같은 Z 구간에서 각각 원통형으로 절삭한다. 핀의 원통면은 절삭한 두 면에 닿고 어느 상태에서도 판의 닫힌 부피를 관통하지 않는다. `open` 상태는 이 Z축으로 바깥쪽 90° 회전한 판 x=0.70..1.00,y=0.715..0.740,z=-0.10..+0.32와 같은 판에 묻힌 손잡이를 내며 전체 메시 AABB는 x=−0.70..+1.00,y=0..0.86,z=−0.30..+0.32m다. 닫힌 판과 열린 판을 동시에 내지 않는다. 세 침실 변종의 전체 AABB는 각 폭 W, 높이 0.82, 깊이 0.60m다. 세 침실 변종은 같은 상판 두께, 앞쪽 z=+0.24·x=±(W/2−0.065)에 y=0..0.70인 단면 0.045m 고정 다리 둘, 뒤쪽 z=-0.30..-0.275·y=0.74..0.82의 폭 W back rail과 왼쪽 중심 x=−W/2+0.37, y=0.64, z=0인 폭 0.30·깊이 0.46·높이 0.12m 한 서랍을 사용하고 telescopic·collar·aux를 생성하지 않는다.

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

@axis-control default: upholstery, Z, -0.074, upholstery-to-back junction
@axis-control default: upholstery, Z, -0.04, upholstery throat

`@curve-layer`는 t=(y−0.415)/0.415에서 등 셸의 뒤 곡선 `−0.10−0.25t+0.08t²`, 셸 두께 0.025m, 천층 두께 0.035m와 좌판 뒤 edge 간격 0.001m를 뜻한다. `upholstery`의 두 `@piece`는 실제 채운 상자가 아니라 그 곡면으로 잘린 좌판·등판 조각의 AABB다. 좌판 조각의 뒤 경계는 셸 앞면에서 0.001m 앞이고, 등판 조각은 셸 앞면부터 천층 두께만큼 앞에 있다. 두 천 조각은 y=0.45의 접합면에서 한 부품으로 용접하고 셸과 체적을 겹치지 않는다.

@scalar-control shell-back-rake: 0.17
@scalar-control shell-back-bow: 0.02
@scalar-control seat-rear-offset: 0.026

@prose-part 좌면 셸은: shell-seat
@prose-part 천 좌면은: upholstery
@prose-part 등 셸은: shell-back
@prose-part 좌면 아래 네 다리는: leg-*
@prose-part 좌면 셸의: shell-seat
@prose-dim 앞쪽 천층은: upholstery
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

`desk-chair`는 폭 0.52, 깊이 0.55, 높이 0.83m다. 네 다리 중심의 X/Z 대칭축이 바닥 y=0 평면과 만나는 점이 원점이고 +Z가 앉는 앞쪽이다. 등받이와 좌면은 외관상 한 장의 곡면 셸이다. 좌면 셸은 폭 0.52m, z=−0.10..+0.28, y=0.39..0.415이고 그 위 폭 0.48m의 천 좌면은 y=0.415..0.45에서 앞 edge z=+0.26이고 뒤 edge z_rear(y)=−0.10−0.17t−0.02×4t(1−t)+0.026m, t=(y−0.415)/0.415다. 이 뒤 edge는 등 셸 앞면보다 0.001m 앞쪽이고 천 좌면의 아래면은 y=0.415에서 셸 좌면 위에 면 접촉한다. 등 셸은 y=0.415..0.83에서 뒤쪽 표면 z(y)=−0.10−0.17t−0.02×4t(1−t), t=(y−0.415)/0.415로 굽고 두께 0.025m를 +Z로 낸다. 앞쪽 천층은 그 표면에서 +Z로 다시 0.035m, 폭 0.48m이며 y=0.415의 좌면 천 뒤 edge z=−0.074와 등 천 하단 앞면 z=−0.04를 잇는 0.035m 두께의 굽은 목 부분을 포함한다. 두 천 부피의 공유 접합면은 제거하여 하나의 닫힌 upholstery 부품으로 만든다. 등 뒤 기울기는 하단 z=−0.10에서 상단 z=−0.27로 0.17m다. 셸과 천층은 각각 닫힌 부품으로 만들고, 좌면 아래 네 다리는 중심 x=±0.18, 뒤쪽 z=−0.08·앞쪽 z=+0.18에 지름 0.025m, y=0..0.39로 둔다. 각 다리 상단은 좌면 셸의 y=0.39 아래면과 접하고 X/Z 단면은 좌면 범위 안이다. 연속 셸은 공유 모서리에서 용접하되 좌면과 등판 표면을 `shell-seat/upper/edge/underside`, `shell-back/front/rear/edge`로 나눈다. `upholstery/seat/back/edge`, `leg-0..3/shaft/top/sole`도 안정 주소다. 정면·측면·45°에서 좌면과 등판이 이어진 곡률을 확인하고 다리 사이를 막지 않는다. ref04의 초록 천 씌운 연결형 셸 의자를 채택하여 현재 `chair()`의 독립 직각 등판을 교체한다. ref02의 침실 책상 의자는 동일 prototype 반복의 근거이고 ref03의 목재 식탁 의자와 혼용하지 않는다. ref01·05에는 책상 의자를 판독할 형상이 없다. 인체 적합성은 `unverified`다.

<!-- @authored-address-state:start -->
@address-state default: shell-seat, shell-back, upholstery, leg-0, leg-1, leg-2, leg-3
<!-- @authored-address-state:end -->

## 책상 화면과 키보드 {#work-equipment}

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
