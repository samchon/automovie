# 위생기구와 생활 설비 모델

[모델 단위·표면 규칙](000-representation.md#model-address-and-scale)을 참조한다.

## 세면대·수전·거울 {#basin}

@axis-control 800: tap-spout, Y, 1.104, support-to-tube seam
@axis-control 1000: tap-spout, Y, 1.104, support-to-tube seam

부품 표에서 `support@0.80`은 별도 [vanity 외함](../models/002-storage-and-sleep.md#cabinet-and-shelf)의 상단 접촉면이며 이 prototype 내부에 외함 판을 중복 생성하지 않는다. bowl의 안쪽과 rim의 개구는 서로 다른 경계이고, bowl 바깥쪽 입술이 rim 아랫면에 면으로 닿는다. 거울은 벽에 독립 부착한다. drain은 bowl 바닥의 지름 0.045m 열린 구멍 면 주소다.

@scalar-control excluded-basin-default: 0.65
@scalar-control vanity-depth: 0.48
@scalar-control mirror-width-deduction: 0.08
@scalar-control mirror-glass-recess: 0.004
@scalar-control mirror-glass-width-deduction: 0.036

@prose-part 수전 기둥은: tap-body
@prose-part 거울은: mirror-*
@prose-part bowl은: bowl
@inventory 800: rim, bowl, tap-body, tap-spout, mirror-frame, mirror-glass
@inventory 1000: rim, bowl, tap-body, tap-spout, mirror-frame, mirror-glass
@support 800: cabinet-and-shelf, vanity/800x800x480/closed, top, 0, 0, 0
@support 1000: cabinet-and-shelf, vanity/1000x800x480/closed, top, 0, 0, 0
@void 800: rim, -0.272..0.272, 0.80..0.85, -0.125..0.175
@void 1000: rim, -0.34..0.34, 0.80..0.85, -0.125..0.175
@void 800: bowl, -0.25..0.25, 0.725..0.80, -0.10..0.15
@void 1000: bowl, -0.318..0.318, 0.725..0.80, -0.10..0.15
@bore 800: bowl, 0.0225, 0.71..0.725
@bore 1000: bowl, 0.0225, 0.71..0.725
@flat-contact 800: tap-spout, tap-body, -Y, 1.10, 0.152..0.168, -0.17..-0.16
@flat-contact 1000: tap-spout, tap-body, -Y, 1.10, 0.152..0.168, -0.17..-0.16
@void 800: mirror-frame, -0.342..0.342, 1.188..1.852, -0.27..-0.252
@void 1000: mirror-frame, -0.442..0.442, 1.188..1.852, -0.27..-0.252

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 800 | * | bounds | -0.4..0.4 | 0.71..1.87 | -0.27..0.25 | - |
| @part | 800 | rim | hollow | -0.4..0.4 | 0.80..0.85 | -0.25..0.25 | support@0.80,bowl,tap-body |
| @part | 800 | bowl | hollow | -0.29..0.29 | 0.71..0.80 | -0.14..0.19 | rim |
| @part | 800 | tap-body | cylinder | 0.146..0.174 | 0.85..1.10 | -0.184..-0.156 | rim,tap-spout |
| @part | 800 | tap-spout | curved | 0.149..0.171 | 1.10..1.122 | -0.17..-0.04 | tap-body |
| @part | 800 | mirror-frame | hollow | -0.36..0.36 | 1.17..1.87 | -0.27..-0.252 | wall,mirror-glass |
| @part | 800 | mirror-glass | box | -0.342..0.342 | 1.188..1.852 | -0.27..-0.256 | mirror-frame |
| @envelope | 1000 | * | bounds | -0.5..0.5 | 0.71..1.87 | -0.27..0.25 | - |
| @part | 1000 | rim | hollow | -0.5..0.5 | 0.80..0.85 | -0.25..0.25 | support@0.80,bowl,tap-body |
| @part | 1000 | bowl | hollow | -0.358..0.358 | 0.71..0.80 | -0.14..0.19 | rim |
| @part | 1000 | tap-body | cylinder | 0.146..0.174 | 0.85..1.10 | -0.184..-0.156 | rim,tap-spout |
| @part | 1000 | tap-spout | curved | 0.149..0.171 | 1.10..1.122 | -0.17..-0.04 | tap-body |
| @part | 1000 | mirror-frame | hollow | -0.46..0.46 | 1.17..1.87 | -0.27..-0.252 | wall,mirror-glass |
| @part | 1000 | mirror-glass | box | -0.442..0.442 | 1.188..1.852 | -0.27..-0.256 | mirror-frame |

실제 `powder.ts` 호출을 받는 `basin/800`은 폭 0.80m이고 상층의 `basin/1000`은 폭 1.00m다. 0.65m 함수 기본값은 현재 호출의 값이 아니므로 채택하지 않는다. 두 변종 모두 바닥 하부장 중심이 원점, +Z가 사용자 쪽이고 basin 본체 깊이 0.50m, 뒤 벽거울까지 합친 전체 깊이 0.52m, rim 상단 y=0.85m다. [vanity 수납 외함](002-storage-and-sleep.md#cabinet-and-shelf)은 폭 W, 높이 0.80, 깊이 0.48m의 독립 부품 주소로 조합한다. rim은 y=0.80..0.85의 두께 0.05m이고 안쪽 개구는 폭 0.68W×깊이 0.30m, 중심 z=0.025다. bowl은 rim에서 y=0.71까지 0.14m 내려가는 닫힌 외벽·내벽·바닥을 가진다. 지름 0.045m 배수구는 bowl 바닥 중앙에서 열린 물길의 시각 단서지만 실제 관로는 없다. 수전 기둥은 0.028m 지름, y=0.85..1.10, x=0.16, z=-0.17이다. spout는 외경 0.022m, 중심 y=1.111, z=-0.17..-0.04의 0.13m 길이다. spout의 뒤쪽 z=-0.17..-0.16에는 x=0.152..0.168, y=1.10..1.104의 평평한 일체형 받침을 만들고 관의 아래쪽 원호를 y=1.104에서 절단해 받침 상면과 잇는다. 이 받침의 y=1.10 아래면은 기둥 상면 원판 안쪽의 0.016×0.010m 직사각형 유한 면으로 닿는다. 거울은 폭 W−0.08, 높이 0.70, 두께 0.018m, 하단 y=1.17이며 basin 뒤쪽 z=−0.27..−0.252에 별도 벽부착 물체로 선다. 둘레 프레임 폭은 0.018m이고 유리 앞면은 프레임 앞면보다 0.004m 물려 z=−0.256이며 유리의 폭·높이는 각각 바깥 폭−0.036m와 0.664m다. 벽 안으로 들어가는 형상은 없다.

주소는 `rim/upper/edge/underside`, `bowl/inner/outer/bottom/rim/drain-inner/drain-edge`, `tap-body/outer/contact`, `tap-spout/outer/end`, `mirror-glass/front/back/edge`, `mirror-frame/front/back/edge`이며 vanity의 각 판 주소는 cabinet 쪽에서 유지한다. 내부와 외부 normal이 반대이고 bowl의 rim은 두 벽을 잇는 닫힌 두께다. 정면·상부·45°에서 실제 음각과 mirror/frame·tap을 확인한다. ref02의 1층/2층 위생기구 위치 역할을 채택하고 ref03·04·05의 거실/작업/복도 유리를 욕실 거울로 복제하지 않는다. ref01에는 basin 세부가 없다. 거울 광학 응답·급배수·실제 사용성은 `unverified`다.

<!-- @authored-address-state:start -->
@address-state 800: rim, bowl, tap-body, tap-spout, mirror-frame, mirror-glass
@address-state 1000: rim, bowl, tap-body, tap-spout, mirror-frame, mirror-glass
<!-- @authored-address-state:end -->

## 변기 {#toilet}

@axis-control lid-open: bowl, Y, 0.29, interior floor
@axis-control lid-open: seat, Z, -0.125, rear ring edge

`toilet`은 바닥 점유 0.42×0.72m, seat 상단 0.465m, cistern 상단 0.82m, 버튼을 포함한 최고점 0.828m다. 바닥 접촉 중심이 원점, +Z가 앉는 앞이다. pedestal은 x폭 0.31, z깊이 0.47, y=0..0.27; bowl 외곽은 0.41×0.59m, y=0.27..0.43이며 아래면이 pedestal 상면에 닿는다. bowl의 상단 안쪽 구멍은 0.27×0.40m 타원과 깊이 0.14m의 음각(바닥 y=0.29)이다. seat는 x=±0.21,z=−0.21..+0.36,y=0.43..0.465의 두께 0.035m 고리로 bowl 상면에 닿고, lid는 뒤쪽 힌지 x=0,y=0.465,z=−0.20에서 위로 선 검사 상태 하나로 두며 폭 0.35, 높이 0.34, 두께 0.018m이고 y=0.465..0.805, z=−0.20..−0.182다. 이는 bowl을 보이게 하는 열린 상태이며 닫힘 상태를 동시에 내지 않는다. cistern은 0.40×0.145×0.39m로 z=−0.36..−0.215, y=0.43..0.82이며 bowl 뒤쪽 상면과 y=0.43에서 닿는다. seat 뒤 edge z=−0.21과 cistern 앞면 사이에는 0.005m의 열린 틈이 있고 seat는 bowl 고리의 유한 면으로 지지된다. flush 버튼은 0.05×0.035×0.008m로 중심 x=0,y=0.824,z=−0.285로 아래면 y=0.82가 cistern 상면에 면 접촉한다. `pedestal/outer/sole`, `bowl/inner/outer/rim`, `seat/upper/edge/underside`, `lid/front/back/edge`, `cistern/front/back/side/top/sole`, `flush/outer/contact`가 안정 주소다. bowl 내부는 바닥으로 이어지는 닫힌 곡면이며 상단 개구와 중앙 빈 공간만 열린 공간이다. 상부·정면·측면에서 bowl 구멍, seat와 tank 경계가 읽혀야 한다. ref02의 두 화장실 도기 형상을 채택하지만 사진의 화면 면적에서 폭을 추정하지 않는다. ref01·03·04·05에는 변기 판별 세부가 없고 수세 성능은 `unverified`다.

타원형 bowl 구멍의 X 반축은 0.135m, Z 반축은 0.20m이고 중심은 (x=0,z=0)이다. seat의 타원형 구멍은 같은 반축을 가지되 외곽 좌표에 맞춰 중심 (x=0,z=+0.075)로 옮긴다. 두 열린 영역의 교집합이 bowl 내부를 드러내며 seat 뒤쪽 z=−0.21..−0.125m의 고리 상면에 lid 하단 z=−0.20..−0.182m가 유한 면으로 닿는다. `@ellipse`의 마지막 두 값은 호스트 외곽 타원의 X/Z 중심이고, bowl의 안쪽 면은 바닥 y=0.29에서 닫히고, seat는 `@ellipse`가 정한 X/Z 타원 개구가 두께 전체를 관통하는 고리다. seat의 열린 개구에는 바닥 원판을 만들지 않는다.

@ellipse lid-open: bowl, 0.135, 0.20, 0.205, 0.295, 0, 0
@ellipse lid-open: seat, 0.135, 0.20, 0.21, 0.285, 0, 0.075
@scalar-control bowl-cavity-depth: 0.14
@prose-gap lid-open: seat, cistern, Z, 열린 틈

@inventory lid-open: pedestal, bowl, seat, lid, cistern, flush
@cap-contact lid-open: bowl, pedestal, Y, -
@cap-contact lid-open: bowl, seat, Y, +
@cap-contact lid-open: bowl, cistern, Y, +
@cap-contact lid-open: lid, seat, Y, -

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | lid-open | * | bounds | -0.21..0.21 | 0..0.828 | -0.36..0.36 | - |
| @part | lid-open | pedestal | box | -0.155..0.155 | 0..0.27 | -0.235..0.235 | ground,bowl |
| @part | lid-open | bowl | hollow | -0.205..0.205 | 0.27..0.43 | -0.295..0.295 | pedestal,seat,cistern |
| @part | lid-open | seat | hollow | -0.21..0.21 | 0.43..0.465 | -0.21..0.36 | bowl,lid |
| @part | lid-open | lid | box | -0.175..0.175 | 0.465..0.805 | -0.20..-0.182 | seat |
| @part | lid-open | cistern | box | -0.20..0.20 | 0.43..0.82 | -0.36..-0.215 | bowl,flush |
| @part | lid-open | flush | box | -0.025..0.025 | 0.82..0.828 | -0.3025..-0.2675 | cistern |

<!-- @authored-address-state:start -->
@address-state lid-open: pedestal, bowl, seat, lid, cistern, flush
<!-- @authored-address-state:end -->

## 고정 스크린 샤워 {#shower}

`shower`는 X 폭 2.05, Z 깊이 1.45, Y 높이 2.25m다. tray 바닥 중심이 원점, +Z가 출입 쪽이다. tray는 y=0..0.07m의 두께와 안쪽으로 0.015m 내려간 중앙면, 0.045m 폭의 둘레 curb를 가진다. drain 중심은 tray 바닥 상면의 (0,0.055,0)이고 지름 0.12m다. 출입 전면에서 유리 screen은 x=−1.025..+0.075의 길이 1.10m, z=+0.713..+0.725의 두께 0.012m, y=0.07..2.225다. +X 쪽 x=+0.075..+1.025의 0.95m는 문 없는 열린 출입구다. screen rail은 같은 길이의 닫힌 사각 단면 상부 부재로 z=+0.700..+0.725, y=2.225..2.25이며 screen의 윗면과 0.012m 깊이의 유한 면으로 닿는다. riser는 x=−0.85,z=−0.705,y=0.40..2.20의 지름 0.025m이며 벽에 붙은 세 bracket의 원형 보어가 지지한다. 고정 bracket은 y=0.55,1.45,2.10에 각각 중심 x=−0.85,z=−0.705, 바깥 반지름 0.020m, 안쪽 반지름 0.0125m, y=중심±0.015m인 세 닫힌 고리다. 각 고리와 한 부품으로 합친 뒤쪽 고정 패드는 x=−0.87..−0.83, z=−0.725..−0.7175, y=고리의 전체 높이이며 z=−0.725 평면 전체가 방 벽면에 유한 면적으로 닿는다. 패드는 보어의 뒤쪽 z>−0.7175를 침범하지 않고 고리의 외벽과 닫힌 합집합을 이루며 안쪽 원통면이 riser 외면과 맞는다. `head`는 riser 축을 중심으로 반지름 0.0125m인 수직 원통 목을 y=2.20..2.215에 두고, 같은 반지름의 수평 24각 관을 중심 (x=−0.85,y=2.2125), z=−0.705..−0.515에 이어 닫힌 합집합으로 만든다. 분사판은 중심 (x=−0.85,z=−0.515), X 반경 0.15m·Z 반경 0.03m인 24각 타원 판이며 y=2.215..2.225를 채운다. 관과 판은 z=−0.545..−0.5025에서 부피를 공유해 한 부품을 이루고, 목의 y=2.20 원판 전체는 riser의 y=2.20 상면 원판 전체와 면 접촉한다. 분사판 아래 노출 면은 `head/face`, 목과 관 외면은 `head/edge`다. 이 부품은 외피 벽을 생성하지 않고, 실제 벽면과의 world 접합은 instances가 검증한다.

주소는 `tray/floor/curb/outside/underside/drain-inner/drain-edge`, `screen/front/back/edge/top`, `screen-rail/outer/contact`, `riser/outer/contact`, `riser-bracket-0..2/front/back/edge/contact`, `head/face/back/edge`다. 두께 있는 유리의 앞뒤·잘린 edge는 별도 face이며 tray의 물이 빠지는 경사라는 외관과 실제 방수 능력을 구별한다. 위·출입구·측면 관찰에서 0.95m 열린 부분과 음각 배수구가 보여야 한다. ref02의 뒤쪽 샤워와 투명 경계를 채택한다. ref01·03·04·05의 커튼월을 욕실 screen 상세로 차용하지 않는다. 물 흐름·방수는 `unverified`다.

tray의 중앙은 x=−0.980..+0.980,z=−0.680..+0.680에서 y=0.055..0.070을 절삭하여 0.045m curb를 만든다. drain은 중심 x/z=0, 반지름 0.060m로 tray 바닥 y=0..0.055를 뚫는 빈 구멍의 `tray/drain-inner`·`tray/drain-edge` 면 주소다. bracket의 고리는 `@radial-at`에 적은 공통 중심과 반지름으로 닫히며 임의의 C자 단면을 코드에서 고르지 않는다. `ground`는 tray y=0, `wall`은 후면 z=−0.725의 외부 접합 평면이며 각 bracket 패드의 접촉 넓이는 0.04×0.03m다.

@scalar-control tray-curb-width: 0.045
@scalar-control drain-diameter: 0.12
@scalar-control open-entry-width: 0.95
@axis-control default: head, Y, 2.215, neck top and spray-plate underside
@axis-control default: head, Z, -0.515, spray-plate center and pipe end
@axis-control default: head, Z, -0.545, spray-plate rear
@axis-control default: head, Z, -0.5025, pipe front

@prose-part screen rail은: screen-rail
@prose-part riser는: riser
@prose-part tray의 중앙은: tray
@inventory default: tray, screen, screen-rail, riser, riser-bracket-0, riser-bracket-1, riser-bracket-2, head
@cap-contact default: head, riser, Y, -
@flat-contact default: head, riser, -Y, 2.20, -0.858..-0.842, -0.713..-0.697
@void default: tray, -0.98..0.98, 0.055..0.07, -0.68..0.68
@bore default: tray, 0.06, 0..0.055
@radial-at default: riser, -0.85, -0.705, 0, 0.0125
@radial-at default: riser-bracket-0, -0.85, -0.705, 0.0125, 0.02
@radial-at default: riser-bracket-1, -0.85, -0.705, 0.0125, 0.02
@radial-at default: riser-bracket-2, -0.85, -0.705, 0.0125, 0.02
@flat-contact default: riser-bracket-0, wall, -Z, -0.725, -0.87..-0.83, 0.535..0.565
@flat-contact default: riser-bracket-1, wall, -Z, -0.725, -0.87..-0.83, 1.435..1.465
@flat-contact default: riser-bracket-2, wall, -Z, -0.725, -0.87..-0.83, 2.085..2.115

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -1.025..1.025 | 0..2.25 | -0.725..0.725 | - |
| @part | default | tray | hollow | -1.025..1.025 | 0..0.07 | -0.725..0.725 | ground,screen |
| @part | default | screen | box | -1.025..0.075 | 0.07..2.225 | 0.713..0.725 | tray,screen-rail |
| @part | default | screen-rail | box | -1.025..0.075 | 2.225..2.25 | 0.7..0.725 | screen |
| @part | default | riser | cylinder | -0.8625..-0.8375 | 0.4..2.2 | -0.7175..-0.6925 | riser-bracket-0,head |
| @part | default | riser-bracket-0 | hollow | -0.87..-0.83 | 0.535..0.565 | -0.725..-0.685 | wall,riser |
| @part | default | riser-bracket-1 | hollow | -0.87..-0.83 | 1.435..1.465 | -0.725..-0.685 | wall,riser |
| @part | default | riser-bracket-2 | hollow | -0.87..-0.83 | 2.085..2.115 | -0.725..-0.685 | wall,riser |
| @part | default | head | curved | -1..-0.7 | 2.2..2.225 | -0.7175..-0.485 | riser |

<!-- @authored-address-state:start -->
@address-state default: tray, screen, screen-rail, riser, riser-bracket-0, riser-bracket-1, riser-bracket-2, head
<!-- @authored-address-state:end -->

## 욕조 {#bathtub}

@axis-control default: floor, Z, 0.50, drain center
@axis-control default: floor, Y, 0.185, drain low point
@axis-control default: shell, Y, 0.43, overflow center

`bathtub`은 바닥 점유 1.62×0.76m, rim 높이 0.58m, 내부 바닥판의 아래면 y=0.12m다. 바닥 접촉 중심이 원점이고 +Z가 긴 축이며 어느 방 벽에 붙일지는 instances가 정한다. 외함은 0.045m 두께의 끝벽과 0.04m 두께의 긴 측벽, 상단 폭 0.055m의 rim을 가지며 네 외벽이 y=0..0.58에서 바닥에 닿는다. 내부 바닥판 아래 y=0..0.12는 외벽 안에서 비운다. 외함의 내벽 간 치수는 길이 1.53×폭 0.68m, rim 안쪽의 실제 위쪽 개구는 1.51×0.65m, 중심 (x=0,z=0)의 안쪽 바닥은 식에 따라 y≈0.191m이며, 내부 경계에서 y≤0.20m이고 +Z 끝벽 중앙에서는 식에 따라 y≈0.188m다. 배수구 중심은 (x=0,z=+0.50)이고 지름은 0.05m다. 욕조 바닥의 아래면은 y=0.12, 안쪽 면은 배수구에서 y=0.185이고 둘 사이에 닫힌 두께를 둔다. 바닥은 내부 x=±0.34,z=±0.765에서 y=0.20을 상한으로 두고 r=min(1,sqrt((x/0.34)^2+((z−0.50)/1.265)^2))에 따라 y=0.185+0.015r로 배수구 중심까지 내려간다. overflow는 발치 반대쪽 내벽 z=−0.765의 x=0,y=0.43에 지름 0.04m의 관통 음각으로 둔다. `shell/outer/inner/end/underside/overflow-inner/overflow-edge`, `rim/upper/inner/outer/underside`, `floor/inner/underside/drain-inner/drain-edge`가 안정 주소다. 두께 있는 rim에서 외·내벽이 연결되며 물이 담길 빈 공간을 위에서 확인할 수 있다. 상부·측면·45°에서 개구와 길이 방향 벽이 샤워 tray와 구별돼야 한다. ref02 욕실의 낮은 욕조를 채택해 누락된 생활 기능을 복구한다. ref01·03·04·05는 욕조 세부를 주지 않으므로 그 이미지의 다른 유리 면을 욕조 외함으로 읽지 않는다. 욕조와 샤워의 같은 방 안 배치·통행은 instances의 별도 검증이며 실제 급배수와 하중은 `unverified`다.

네 외벽의 독립 부품 `shell`은 y=0..0.525이고 `rim`은 y=0.525..0.58에서 맞대므로 두 부품의 합이 위의 y=0..0.58 외벽이다. shell 내부는 x=±0.34,z=±0.765를 바닥부터 위까지 비우고, 그 안에 y=0.12..0.20의 곡면 floor를 측면에 맞댄다. rim의 안쪽 개구는 x=±0.325,z=±0.755다. `floor/drain-inner`·`floor/drain-edge`는 floor에서, `shell/overflow-inner`·`shell/overflow-edge`는 shell의 −Z 끝벽에서 잘라 낸 구멍의 면 주소이며 별도 고체 부품이 아니다. 다음 표의 `@void`는 두 직사각형 내부 공백을 재고, 원형 drain·overflow는 위 식과 중심·지름으로 결정한다.

@scalar-control end-wall-thickness: 0.045
@scalar-control basin-center-height-rounded: 0.191
@scalar-control basin-boundary-height: 0.20
@scalar-control basin-foot-height-rounded: 0.188
@scalar-control drain-diameter: 0.05
@scalar-control drain-slope-rise: 0.015

@inventory default: shell, floor, rim
@void default: shell, -0.34..0.34, 0..0.525, -0.765..0.765
@cavity-contact default: shell, floor, X
@void default: rim, -0.325..0.325, 0.525..0.58, -0.755..0.755

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.38..0.38 | 0..0.58 | -0.81..0.81 | - |
| @part | default | shell | hollow | -0.38..0.38 | 0..0.525 | -0.81..0.81 | ground,floor,rim |
| @part | default | floor | curved | -0.34..0.34 | 0.12..0.2 | -0.765..0.765 | shell |
| @part | default | rim | hollow | -0.38..0.38 | 0.525..0.58 | -0.81..0.81 | shell |

<!-- @authored-address-state:start -->
@address-state default: shell, floor, rim
<!-- @authored-address-state:end -->

## 주방 섬·싱크 {#kitchen-island}

@axis-control default: tap-spout, X, -0.13, spout endpoint
@axis-control default: tap-spout, Z, 0.709, spout outlet plane
@axis-control default: tap-spout, Y, 1.273, support-to-tube seam

섬 하부장은 별도 cabinet prototype이다. 이 부품 표의 `support@0.87`은 그 상단 접촉면이다. sink 안쪽에는 0.02m 바닥을 남기며 바깥 lip이 counter 절삭보다 각 변에서 0.02m 넓어 아래면에 닿는다. 배수구는 sink 바닥의 면 주소로 둔다.

@scalar-control cabinet-half-length: 1.325
@scalar-control end-overhang: 0.085
@scalar-control sink-drain-diameter: 0.045
@scalar-control island-spout-bend-radius: 0.02
@scalar-control island-spout-inner-radius: 0.006

@prose-part 상판은: counter
@prose-part sink 개구는: counter
@prose-part tap 기둥은: tap-body
@inventory default: counter, sink, tap-body, tap-spout
@support default: cabinet-and-shelf, island-base/880x870x2650/closed, top, -0.04, 0, 0
@void default: counter, -0.36..0.12, 0.87..0.93, 0.47..0.83
@void default: sink, -0.34..0.10, 0.77..0.87, 0.49..0.81
@bore default: sink, 0.0225, 0.75..0.77
@flat-contact default: tap-spout, tap-body, -Y, 1.269, -0.387..-0.373, 0.893..0.907

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.6..0.6 | 0.75..1.291 | -1.41..1.41 | - |
| @part | default | counter | hollow | -0.6..0.6 | 0.87..0.93 | -1.41..1.41 | support@0.87,sink,tap-body |
| @part | default | sink | hollow | -0.38..0.14 | 0.75..0.87 | 0.45..0.85 | counter |
| @part | default | tap-body | cylinder | -0.391..-0.369 | 0.93..1.269 | 0.889..0.911 | counter,tap-spout |
| @part | default | tap-spout | curved | -0.391..-0.119 | 1.269..1.291 | 0.709..0.911 | tap-body |

`kitchen-island`의 X 폭 1.20, Z 길이 2.82, 상면 y=0.93m다. 바닥 원점은 상판 중심이고 +X가 스툴이 붙는 긴 면, +Z가 길이의 뒤쪽이다. `cabinet/island-base/880x870x2650/closed`는 중심 x=-0.04m, z=0이고, X 점유 -0.48..+0.40·Z 점유 ±1.325m다. 상판은 X ±0.60·Z ±1.41m, 두께 0.06m로 y=0.87..0.93이다. 따라서 +X 스툴 쪽 overhang은 0.20m, -X 쪽은 0.12m이며 양 끝은 0.085m다. +X 긴 변에는 문을 두지 않고 서비스 문 다섯 장은 -X 긴 변에만 둔다. 상판 sink 개구는 X 폭 0.48, Z 길이 0.36m, 중심 (x=-0.12,z=+0.65)이며 bowl은 y=0.93에서 0.18m 아래로 내려간다. tap 기둥은 x=−0.38,z=+0.90,y=0.93..1.269이다. 지름 0.022m spout는 중심 높이 y=1.28에서 (x=−0.38,z=+0.90)부터 출구 X보다 0.02m 뒤의 X 접선점까지 수평으로 뻗는다. 중심선은 X/Z 평면에서 반지름 0.02m의 90° 원호를 여섯 구간으로 돌아 출구 X에서 시작 Z보다 0.02m 앞의 Z 접선점에 이르고, 이어 z=+0.709의 출구 평면까지 −Z 방향으로 간다. 관은 24각 외반지름 0.011m, 안반지름 0.006m의 속 빈 단면을 이 중심선을 따라 일정하게 쓸며 굽힘 내벽의 자체 관통을 허용하지 않는다. 끝은 z=+0.709에서 안팎 반지름을 가진 평평한 환형 출구 face이고 관의 열린 안쪽은 tap-body와 만나는 쪽에서 불투명 봉인한다. spout의 뒤쪽 x=−0.387..−0.373,z=0.893..0.907에는 y=1.269..1.273의 평평한 일체형 받침이 있고 관 아래 원호는 y=1.273에서 끝나 받침 상면과 잇는다. 받침의 y=1.269 아래면은 기둥 상면 원판 안쪽의 0.014×0.014m 유한 면으로 닿는다. outlet 중심 (−0.13,+0.709)은 sink 개구 x=−0.36..+0.12,z=+0.47..+0.83 안에 있다. 별도 평판 `sink-basin`으로 구멍을 막지 않는다.

안정 주소는 `counter/upper/edge/underside`, `sink/rim/inner/outer/bottom/drain-inner/drain-edge`, `tap-body/outer/contact`, `tap-spout/outer/end`이며 base의 panel·door·edge 주소는 cabinet H2가 낸다. 배수 개구는 sink 바닥 두께 0.02m를 중심 (x=−0.12,z=+0.65)에서 지름 0.045m로 관통 절삭한 면이며 독립 고체 part가 아니다. 상부·+X 식사 쪽·-X 서비스 쪽·45°에서 긴 측면의 문 유무, 0.20m overhang, bowl 깊이와 스툴 접근을 확인한다. ref03의 긴 섬·싱크·세 스툴 관계를 채택하고 ref02의 조감으로 kitchen과 식탁의 한 공간 관계를 확인한다. ref01·04·05의 다른 유리나 책상을 조리대 세부로 차용하지 않는다. 실제 급배수와 앉는 무릎 안전은 `unverified`다.

<!-- @authored-address-state:start -->
@address-state default: counter, sink, tap-body, tap-spout
<!-- @authored-address-state:end -->

## 벽 조리대·쿡탑·오븐 {#cooking-appliances}

벽 조리대의 쿡탑 절삭은 상단 0.012m에만 있고 아래쪽 0.043m가 flush 쿡탑의 받침면이다. 네 zone의 지름은 0.22m로 두 중심 피치 0.24m보다 작게 정하여 독립 원판 사이 0.02m를 남긴다. 오븐의 가로 handle은 0.36m여서 x=±0.22 knob와 체적이 겹치지 않는다. cabinet의 가전 bay는 별도 owner이고, `support@0.15`가 oven-sill의 상단이다.

@scalar-control cooktop-support-depth: 0.043
@scalar-control zone-center-pitch: 0.24
@scalar-control zone-clearance: 0.02
@scalar-control oven-bay-width: 0.64

@inventory wall-worktop: top
@support wall-worktop: cabinet-and-shelf, kitchen-base/2900x870x620/closed, top, 0, 0, 0
@void wall-worktop: top, -0.325..0.325, 0.913..0.925, -0.25..0.25
@inventory cooktop: body, rim, zone-0, zone-1, zone-2, zone-3
@support cooktop: cooking-appliances, wall-worktop, top, 0, 0, 0
@void cooktop: rim, -0.31..0.31, 0.925..0.927, -0.235..0.235
@radial-at cooktop: zone-0, -0.17, -0.12, 0, 0.11
@radial-at cooktop: zone-1, 0.17, -0.12, 0, 0.11
@radial-at cooktop: zone-2, -0.17, 0.12, 0, 0.11
@radial-at cooktop: zone-3, 0.17, 0.12, 0, 0.11
@inventory oven: body, front-frame, window, controls, knob-0, knob-1, handle
@support oven: cabinet-and-shelf, kitchen-base/2900x870x620/closed, oven-sill, 0, 0, 0
@void oven: front-frame, -0.245..0.245, 0.26..0.70, 0.292..0.31

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | wall-worktop | * | bounds | -1.5..1.5 | 0.87..0.925 | -0.335..0.335 | - |
| @part | wall-worktop | top | hollow | -1.5..1.5 | 0.87..0.925 | -0.335..0.335 | support@0.87 |
| @envelope | cooktop | * | bounds | -0.325..0.325 | 0.913..0.927 | -0.25..0.25 | - |
| @part | cooktop | body | box | -0.325..0.325 | 0.913..0.925 | -0.25..0.25 | support@0.913,rim,zone-0 |
| @part | cooktop | rim | hollow | -0.325..0.325 | 0.925..0.927 | -0.25..0.25 | body |
| @part | cooktop | zone-0 | cylinder | -0.28..-0.06 | 0.925..0.927 | -0.23..-0.01 | body |
| @part | cooktop | zone-1 | cylinder | 0.06..0.28 | 0.925..0.927 | -0.23..-0.01 | body |
| @part | cooktop | zone-2 | cylinder | -0.28..-0.06 | 0.925..0.927 | 0.01..0.23 | body |
| @part | cooktop | zone-3 | cylinder | 0.06..0.28 | 0.925..0.927 | 0.01..0.23 | body |
| @envelope | oven | * | bounds | -0.30..0.30 | 0.15..0.74 | -0.248..0.338 | - |
| @part | oven | body | box | -0.30..0.30 | 0.15..0.74 | -0.248..0.292 | support@0.15,front-frame |
| @part | oven | front-frame | hollow | -0.30..0.30 | 0.15..0.74 | 0.292..0.31 | body,window,controls |
| @part | oven | window | box | -0.245..0.245 | 0.26..0.62 | 0.302..0.306 | front-frame,controls |
| @part | oven | controls | box | -0.245..0.245 | 0.62..0.70 | 0.302..0.31 | front-frame,window,knob-0,handle |
| @part | oven | knob-0 | cylinder | -0.2375..-0.2025 | 0.6725..0.7075 | 0.31..0.328 | controls |
| @part | oven | knob-1 | cylinder | 0.2025..0.2375 | 0.6725..0.7075 | 0.31..0.328 | controls |
| @part | oven | handle | box | -0.18..0.18 | 0.6675..0.6925 | 0.31..0.338 | controls |

벽 조리대는 `wall-worktop`(X 폭 3.00, Z 깊이 0.67, 상면 y=0.925m), `cooktop`(0.65×0.50×0.014m), `oven`(폭 0.60×손잡이 포함 깊이 0.586×높이 0.59m)의 세 prototype이다. 바닥에서 조리대 폭 중심이 원점, +Z가 사용자가 서는 앞이다. `cabinet/kitchen-base/2900x870x620/closed`의 외함 위에 두께 0.055m 상판을 y=0.87..0.925로 둔다. 상판 중앙 x=0,z=0에는 0.65×0.50m 개구를 실제로 절삭한다. 두께 0.012m cooktop 본체는 y=0.913..0.925로 그 구멍에 flush로 들어가고 가장자리 rim만 y=0.925..0.927로 0.002m 올라오며 겹친 상판 면은 남지 않는다. 네 원형 zone은 지름 0.22m, 중심 x=±0.17,z=±0.12다. oven은 cabinet 중앙 폭 0.64m 개방 bay에 x=0,y=0.15..0.74,z=+0.022에 넣어 전면 z=+0.31을 cabinet 앞과 맞추고 양옆 0.02m clear를 남긴다. oven 전면 유리·테두리·손잡이는 door 전면으로 읽히지만 cabinet drawer face가 그 앞에 나타나지 않는다. 세 prototype의 공통 국소 원점은 바닥의 벽 조리대 폭·깊이 중심이며 oven도 이 좌표를 그대로 쓴다. 따라서 oven 몸체 아래면 중심은 국소 (0,0.15,+0.022)에 있고 다음 z·y는 이미 이 공통 국소 좌표다. 오븐 몸체 깊이는 0.54m이며 assembly 좌표의 몸체는 z=−0.248..+0.292에서 끝나 프레임 뒤의 중복 부피를 만들지 않는다. 전면 프레임은 x=±0.30,y=0.15..0.74,z=0.292..0.31의 한 폐합 링이며 내부 개구는 x=±0.245,y=0.26..0.70이다. 좌우 띠 폭은 0.055m, 아래 띠 높이는 0.11m, 위 띠 높이는 0.04m다. 유리창은 x=±0.245,y=0.26..0.62,z=0.302..0.306으로 링의 좌우·아래 edge에 면 접촉하고 앞면이 프레임보다 0.004m 물린다. 상부 조절판은 x=±0.245,y=0.62..0.70,z=0.302..0.31로 유리 상단의 z=0.302..0.306 단면과 링 좌우·위 edge에 면 접촉하며, 이를 위한 개구 안에서 링 부피와 겹치지 않는다. 둥근 knob 둘은 지름 0.035m, 중심 x=±0.22,y=0.69,z=0.31..0.328이다. 오븐 손잡이는 0.36×0.025×0.028m로 중심 y=0.68, z=0.324이고 바깥 끝 z=0.338이다. 프레임은 cabinet 전면 z=0.31에 맞추고 손잡이만 앞으로 돌출한다.

주소는 `top/upper/edge/underside`(wall-worktop), `body/top/edge/underside`, `rim/upper/edge/underside`, `zone-0..3/upper/edge`(cooktop), `body/front/back/side-left/side-right/top/sole`, `front-frame/front/back/edge`, `window/front/back/edge`, `handle/outer/contact`, `controls/front/edge`, `knob-0..1/outer/contact`(oven)다. 정면·상부·45°에서 네 zone, oven 빈 bay, 서랍과 가전의 분리를 확인한다. ref03의 초록 서랍 하부장·밝은 상판·검은 매립 조리면을 채택한다. ref02는 공용부 위치 근거이며 ref01·04·05에서는 조리대 치수를 읽지 않는다. 가열·후드 환기 성능은 `unverified`다.

<!-- @authored-address-state:start -->
@address-state wall-worktop: top
@address-state cooktop: body, rim, zone-0, zone-1, zone-2, zone-3
@address-state oven: body, front-frame, window, controls, knob-0, knob-1, handle
<!-- @authored-address-state:end -->

## 두 문 냉장고 {#refrigerator}

@axis-control default: body, Y, 1.05, door seam

`refrigerator`는 X 폭 0.90, 높이 2.65, 손잡이 포함 Z 깊이 0.785m다. 바닥 중심 원점, +Z가 문 앞이다. body는 x=±0.45,y=0.08..2.65,z=−0.38..+0.29, 상·하 문은 z=+0.29..+0.38의 두께 0.09m이고 하부 문 y=0.08..1.047, 상부 문 y=1.053..2.65라 y=1.05에 0.006m seam이 보인다. 손잡이는 문마다 0.022×0.28×0.025m로 x=+0.37, z=+0.38..+0.405, 중심 높이 y=1.65와 0.57이다. toe는 x=±0.45,y=0..0.08,z=−0.38..+0.33으로 문 앞면 z=+0.38보다 0.05m 물린다. `body/front/side-left/side-right/back/top/sole`, `door-upper/lower/front/back/edge`, `handle-upper/lower/outer/contact`, `toe/front/back/top/underside/side`가 안정 주소다. 내부는 구현하지 않으며 일반 tall pantry와 전면 분할로 구별한다. 정면·측면·45°에서 두 문과 깊이를 확인한다. ref03 주방 벽장의 기기 위치와 ref02의 tall unit을 채택하되 사진의 문틀 폭을 복제하지 않는다. ref01·04·05에는 냉장고 상세가 없다. 냉각은 `unverified`다.

@scalar-control door-seam: 0.006
@scalar-control toe-front-recess: 0.05

@prose-part 손잡이는: handle-*
@inventory default: body, door-lower, door-upper, handle-lower, handle-upper, toe

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.45..0.45 | 0..2.65 | -0.38..0.405 | - |
| @part | default | body | box | -0.45..0.45 | 0.08..2.65 | -0.38..0.29 | toe,door-lower,door-upper |
| @part | default | door-lower | box | -0.45..0.45 | 0.08..1.047 | 0.29..0.38 | body,handle-lower |
| @part | default | door-upper | box | -0.45..0.45 | 1.053..2.65 | 0.29..0.38 | body,handle-upper |
| @part | default | handle-lower | box | 0.359..0.381 | 0.43..0.71 | 0.38..0.405 | door-lower |
| @part | default | handle-upper | box | 0.359..0.381 | 1.51..1.79 | 0.38..0.405 | door-upper |
| @part | default | toe | box | -0.45..0.45 | 0..0.08 | -0.38..0.33 | ground,body |

<!-- @authored-address-state:start -->
@address-state default: body, door-lower, door-upper, handle-lower, handle-upper, toe
<!-- @authored-address-state:end -->

## 세탁기와 건조기 {#laundry-appliances}

원형 드럼은 Z축을 바라보는 동심원으로 잰다. `@radial-z`는 중심 (x=0,y=0.38), 안팎 반경의 실제 원판 또는 고리를 뜻하며 사각 AABB 내부를 모두 고체로 세지 않는다. 기존 하나였던 `door-hinge` 주소는 서로 면으로 잇는 `hinge-barrel`·`hinge-tongue`로 나눈다. tongue만 고리의 직사각 recess에 들어가고 나머지 고리는 원형이다.

@scalar-control excluded-stacked-height: 1.68

@prose-part 전면 드럼 문은: drum-rim
@prose-part drum 중심은: drum-inner
@inventory washer: body, drum-inner, drum-rim, window, controls-panel, controls-dial, controls-button-0, controls-button-1, hinge-barrel, hinge-tongue
@inventory dryer: body, drum-inner, drum-rim, window, controls-panel, controls-dial, controls-button-0, controls-button-1, controls-button-2, hinge-barrel, hinge-tongue
@cap-contact washer: body, drum-rim, Z, +
@cap-contact washer: body, controls-panel, Z, +
@cap-contact washer: body, hinge-barrel, Z, +
@cap-contact washer: hinge-barrel, hinge-tongue, X, +
@cap-contact dryer: body, drum-rim, Z, +
@cap-contact dryer: body, controls-panel, Z, +
@cap-contact dryer: body, hinge-barrel, Z, +
@cap-contact dryer: hinge-barrel, hinge-tongue, X, +
@radial-z washer: drum-inner, 0, 0.38, 0, 0.19
@radial-z washer: drum-rim, 0, 0.38, 0.175, 0.23
@radial-z washer: window, 0, 0.38, 0, 0.175
@radial-z dryer: drum-inner, 0, 0.38, 0, 0.19
@radial-z dryer: drum-rim, 0, 0.38, 0.175, 0.23
@radial-z dryer: window, 0, 0.38, 0, 0.175
@bore-z washer: body, 0, 0.38, 0.19, 0.246..0.30
@bore-z dryer: body, 0, 0.38, 0.19, 0.246..0.30
@void washer: drum-rim, -0.23..-0.21, 0.35..0.41, 0.305..0.315
@void dryer: drum-rim, -0.23..-0.21, 0.35..0.41, 0.305..0.315
@cavity-contact washer: drum-rim, hinge-tongue, X
@cavity-contact dryer: drum-rim, hinge-tongue, X

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | washer | * | bounds | -0.33..0.33 | 0..0.84 | -0.33..0.33 | - |
| @part | washer | body | hollow | -0.33..0.33 | 0..0.84 | -0.33..0.30 | ground,drum-inner,drum-rim,controls-panel,hinge-barrel |
| @part | washer | drum-inner | curved | -0.19..0.19 | 0.19..0.57 | 0.246..0.26 | body |
| @part | washer | drum-rim | hollow | -0.23..0.23 | 0.15..0.61 | 0.30..0.33 | body,window,hinge-tongue |
| @part | washer | window | curved | -0.175..0.175 | 0.205..0.555 | 0.326..0.33 | drum-rim |
| @part | washer | controls-panel | box | -0.025..0.225 | 0.7125..0.7675 | 0.30..0.314 | body,controls-dial,controls-button-0 |
| @part | washer | controls-dial | cylinder | -0.0025..0.0325 | 0.7225..0.7575 | 0.314..0.329 | controls-panel |
| @part | washer | controls-button-0 | cylinder | 0.113..0.127 | 0.733..0.747 | 0.314..0.329 | controls-panel |
| @part | washer | controls-button-1 | cylinder | 0.163..0.177 | 0.733..0.747 | 0.314..0.329 | controls-panel |
| @part | washer | hinge-barrel | curved | -0.25..-0.23 | 0.34..0.42 | 0.30..0.32 | body,hinge-tongue |
| @part | washer | hinge-tongue | box | -0.23..-0.21 | 0.35..0.41 | 0.305..0.315 | hinge-barrel,drum-rim |
| @envelope | dryer | * | bounds | -0.33..0.33 | 0..0.84 | -0.33..0.33 | - |
| @part | dryer | body | hollow | -0.33..0.33 | 0..0.84 | -0.33..0.30 | ground,drum-inner,drum-rim,controls-panel,hinge-barrel |
| @part | dryer | drum-inner | curved | -0.19..0.19 | 0.19..0.57 | 0.246..0.26 | body |
| @part | dryer | drum-rim | hollow | -0.23..0.23 | 0.15..0.61 | 0.30..0.33 | body,window,hinge-tongue |
| @part | dryer | window | curved | -0.175..0.175 | 0.205..0.555 | 0.326..0.33 | drum-rim |
| @part | dryer | controls-panel | box | -0.025..0.225 | 0.7125..0.7675 | 0.30..0.314 | body,controls-dial,controls-button-0 |
| @part | dryer | controls-dial | cylinder | 0.1725..0.2075 | 0.7225..0.7575 | 0.314..0.329 | controls-panel |
| @part | dryer | controls-button-0 | cylinder | 0.008..0.022 | 0.733..0.747 | 0.314..0.329 | controls-panel |
| @part | dryer | controls-button-1 | cylinder | 0.063..0.077 | 0.733..0.747 | 0.314..0.329 | controls-panel |
| @part | dryer | controls-button-2 | cylinder | 0.113..0.127 | 0.733..0.747 | 0.314..0.329 | controls-panel |
| @part | dryer | hinge-barrel | curved | -0.25..-0.23 | 0.34..0.42 | 0.30..0.32 | body,hinge-tongue |
| @part | dryer | hinge-tongue | box | -0.23..-0.21 | 0.35..0.41 | 0.305..0.315 | hinge-barrel,drum-rim |

`laundry-washer`와 `laundry-dryer`는 각각 폭·깊이 0.66, 높이 0.84m다. 각 장치의 바닥 중심이 원점, +Z가 전면이다. 본체는 z=-0.33..+0.30, 전면 드럼 문은 z=+0.30..+0.33이다. drum 중심은 x=0,y=0.38이고 rim 외경 0.46, 투명 창 외경 0.35m다. 창은 z=0.326..0.330, 유리 뒤 z=0.246..0.30의 몸체 보어와 z=0.30..0.326의 rim 개구에는 중심 (x=0,y=0.38)·반지름 0.19m의 원형 보어를 몸체에 뚫는다. 두 열린 구간의 합계 깊이는 0.08m이며 그 앞에 바깥 반지름 0.23m의 rim으로 개구 둘레를 덮는다. 몸체 앞면에 네모난 개구 모서리를 남기지 않는다. 문 힌지는 y=0.34..0.42의 `hinge-barrel`과 y=0.35..0.41의 `hinge-tongue` 두 닫힌 부품이다. 바깥 D형 barrel은 x=−0.25..−0.23,z=0.30..0.32에 있고 XZ 단면은 x=−0.25..−0.23,z=0.30..0.31의 직사각형과 중심 (x=−0.24,z=0.31), 반지름 0.01의 +Z 반원 합집합이다. 뒤쪽 평면 z=0.30에서 몸체 전면과 0.02×0.08m 면으로 접한다. 별도 부품인 직사각 tongue는 x=−0.23..−0.21,y=0.35..0.41,z=0.305..0.315이며 드럼 rim의 이 점유만 원래 닫힌 부피에서 절삭한 recess에 들어가 유한 면으로 접한다. barrel과 tongue는 x=−0.23, y=0.35..0.41, z=0.305..0.31의 0.06×0.005m 직사각형 면으로 이어지고 몸체·rim의 남은 고체를 관통하지 않는다. 두 부품은 고정 도어의 조립 이음이며 열림 검사 상태나 작동 궤적을 주장하지 않는다. controls 판은 0.25×0.055×0.014m로 중심 x=+0.10,y=0.74,z=0.307이다. washer는 x=0.015 다이얼 하나와 x=0.12,0.17 버튼 둘, dryer는 x=0.19 다이얼 하나와 x=0.015,0.07,0.12 버튼 셋을 고정 형상으로 둔다. 각 다이얼은 지름 0.035, 버튼은 지름 0.014m이며 모두 판 앞 z=0.314..0.329에 머문다. `body/front/side-left/side-right/back/top/sole/drum-bore-inner/drum-bore-back`, `drum-inner/inner/outer/edge`, `drum-rim/front/back/inner/outer`, `window/front/back/edge`, `controls-panel/front/back/edge`, `controls-dial/outer/contact`, washer의 `controls-button-0..1/outer/contact` 또는 dryer의 `controls-button-0..2/outer/contact`, `hinge-barrel/outer/contact`, `hinge-tongue/outer/contact`가 안정 주소다. 위아래 적층 transform은 instances가 정하고 모델 내부에 1.68m 탑을 미리 만들지 않는다. 정면·측면·45°에서 두 controls 배열과 창 깊이를 확인한다. ref02 우측 서비스 코어의 세탁기 목적지 관계를 채택한다. ref01·03·04·05에서는 세탁기 형상을 특정할 자료가 없으며 세척·건조·진동은 `unverified`다.

<!-- @authored-address-state:start -->
@address-state washer: body, drum-inner, drum-rim, window, controls-panel, controls-dial, controls-button-0, controls-button-1, hinge-barrel, hinge-tongue
@address-state dryer: body, drum-inner, drum-rim, window, controls-panel, controls-dial, controls-button-0, controls-button-1, controls-button-2, hinge-barrel, hinge-tongue
<!-- @authored-address-state:end -->
