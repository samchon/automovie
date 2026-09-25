# 위생기구와 생활 설비 모델

[모델 단위·표면 규칙](000-representation.md#model-address-and-scale)을 참조한다.

## 세면대·수전·거울 {#basin}

실제 `powder.ts` 호출을 받는 `basin/800`은 폭 0.80m이고 상층의 `basin/1000`은 폭 1.00m다. 0.65m 함수 기본값은 현재 호출의 값이 아니므로 채택하지 않는다. 두 변종 모두 바닥 하부장 중심이 원점, +Z가 사용자 쪽이고 basin 본체 깊이 0.50m, 뒤 벽거울까지 합친 전체 깊이 0.52m, rim 상단 y=0.85m다. [vanity 수납 외함](002-storage-and-sleep.md#cabinet-and-shelf)은 폭 W, 높이 0.80, 깊이 0.48m의 독립 부품 주소로 조합한다. rim은 y=0.80..0.85의 두께 0.05m이고 안쪽 개구는 폭 0.68W×깊이 0.30m, 중심 z=0.025다. bowl은 rim에서 y=0.71까지 0.14m 내려가는 닫힌 외벽·내벽·바닥을 가진다. 지름 0.045m 배수구는 bowl 바닥 중앙에서 열린 물길의 시각 단서지만 실제 관로는 없다. 수전 기둥은 0.028m 지름, y=0.85..1.11, x=0.16, z=-0.17; spout는 y=1.10, z=-0.17..-0.04의 0.13m 길이다. 거울은 폭 W−0.08, 높이 0.70, 두께 0.018m, 하단 y=1.17이며 basin 뒤쪽 z=−0.27..−0.252에 별도 벽부착 물체로 선다. 둘레 프레임 폭은 0.018m이고 유리 앞면은 프레임 앞면보다 0.004m 물려 z=−0.256이며 유리의 폭·높이는 각각 바깥 폭−0.036m와 0.664m다. 벽 안으로 들어가는 형상은 없다.

주소는 `rim/upper/edge/underside`, `bowl/inner/outer/bottom/rim`, `drain/inner/edge`, `tap-body/outer/contact`, `tap-spout/outer/end`, `mirror-glass/front/back/edge`, `mirror-frame/front/back/edge`이며 vanity의 각 판 주소는 cabinet 쪽에서 유지한다. 내부와 외부 normal이 반대이고 bowl의 rim은 두 벽을 잇는 닫힌 두께다. 정면·상부·45°에서 실제 음각과 mirror/frame·tap을 확인한다. ref02의 1층/2층 위생기구 위치 역할을 채택하고 ref03·04·05의 거실/작업/복도 유리를 욕실 거울로 복제하지 않는다. ref01에는 basin 세부가 없다. 거울 광학 응답·급배수·실제 사용성은 `unverified`다.

## 변기 {#toilet}

`toilet`은 바닥 점유 0.42×0.72m, seat 상단 0.465m, cistern 상단 0.82m다. 바닥 접촉 중심이 원점, +Z가 앉는 앞이다. pedestal은 x폭 0.31, z깊이 0.47, y=0..0.40; bowl 외곽은 0.41×0.59m, 상단 y=0.43이며 안쪽 구멍은 0.27×0.40m 타원과 깊이 0.19m의 음각이다. seat는 두께 0.035m의 고리로 y=0.43..0.465, lid는 뒤쪽 힌지 x=0,y=0.465,z=−0.20에서 위로 선 검사 상태 하나로 두며 폭 0.35, 높이 0.34, 두께 0.018m이고 y=0.465..0.805, z=−0.20..−0.182다. 이는 bowl을 보이게 하는 열린 상태이며 닫힘 상태를 동시에 내지 않는다. cistern은 0.40×0.15×0.36m로 z=−0.36..−0.21, y=0.46..0.82, flush 버튼은 0.05×0.035×0.008m로 중심 x=0,y=0.82,z=−0.285다. `pedestal/outer/sole`, `bowl/inner/outer/rim`, `seat/upper/edge/underside`, `lid/front/back/edge`, `cistern/front/back/side/top/sole`, `flush/outer/contact`가 안정 주소다. bowl 내부는 바닥으로 이어지는 닫힌 곡면이며 상단 개구와 중앙 빈 공간만 열린 공간이다. 상부·정면·측면에서 bowl 구멍, seat와 tank 경계가 읽혀야 한다. ref02의 두 화장실 도기 형상을 채택하지만 사진의 화면 면적에서 폭을 추정하지 않는다. ref01·03·04·05에는 변기 판별 세부가 없고 수세 성능은 `unverified`다.

## 고정 스크린 샤워 {#shower}

`shower`는 X 폭 2.05, Z 깊이 1.45, Y 높이 2.25m다. tray 바닥 중심이 원점, +Z가 출입 쪽이다. tray는 y=0..0.07m의 두께와 안쪽으로 0.015m 내려간 중앙면, 0.045m 폭의 둘레 curb를 가진다. drain 중심은 (0,0.052,0)이고 지름 0.12m다. 출입 전면 z=+0.725에서 유리 screen은 x=-1.025..+0.075의 길이 1.10m, 두께 0.012m, y=0.07..2.225; +X 쪽 x=+0.075..+1.025의 0.95m는 문 없는 열린 출입구다. screen rail은 같은 유리 상단에서 y=2.225..2.25, 지름 0.025m다. riser는 x=-0.85, z=+0.10, y=0.40..2.20의 지름 0.025m이고 head는 x=-0.85, y=2.18, z=+0.10..+0.32, 0.30m 폭이다.

주소는 `tray/floor/curb/outside/underside`, `drain/inner/edge`, `screen/front/back/edge/top`, `screen-rail/outer/contact`, `riser/outer/contact`, `head/face/back/edge`다. 두께 있는 유리의 앞뒤·잘린 edge는 별도 face이며 tray의 물이 빠지는 경사라는 외관과 실제 방수 능력을 구별한다. 위·출입구·측면 관찰에서 0.95m 열린 부분과 음각 배수구가 보여야 한다. ref02의 뒤쪽 샤워와 투명 경계를 채택한다. ref01·03·04·05의 커튼월을 욕실 screen 상세로 차용하지 않는다. 물 흐름·방수는 `unverified`다.

## 욕조 {#bathtub}

`bathtub`은 바닥 점유 1.62×0.76m, rim 높이 0.58m, 최저 바닥 y=0.12m다. 바닥 접촉 중심이 원점이고 +Z가 긴 축이며 어느 방 벽에 붙일지는 instances가 정한다. 외함은 0.045m 두께의 끝벽과 0.04m 두께의 긴 측벽, 상단 폭 0.055m의 rim을 가지며 내벽 간 치수는 길이 1.53×폭 0.68m, rim 안쪽의 실제 위쪽 개구는 1.51×0.65m, 중앙 바닥은 y=0.20m다. 배수구 중심은 (x=0,z=+0.50)이고 지름은 0.05m다. 욕조 바닥의 아래면은 y=0.12, 안쪽 면은 배수구에서 y=0.185이고 둘 사이에 닫힌 두께를 둔다. 바닥은 내부 x=±0.34,z=±0.765에서 y=0.20을 상한으로 두고 r=min(1,sqrt((x/0.34)^2+((z−0.50)/1.265)^2))에 따라 y=0.185+0.015r로 배수구 중심까지 내려간다. overflow는 발치 반대쪽 내벽 z=−0.765의 x=0,y=0.43에 지름 0.04m의 관통 음각으로 둔다. `shell/outer/inner/end/rim/underside`, `floor/inner/underside`, `drain/inner/edge`, `overflow/inner/edge`가 안정 주소다. 두께 있는 rim에서 외·내벽이 연결되며 물이 담길 빈 공간을 위에서 확인할 수 있다. 상부·측면·45°에서 개구와 길이 방향 벽이 샤워 tray와 구별돼야 한다. ref02 욕실의 낮은 욕조를 채택해 누락된 생활 기능을 복구한다. ref01·03·04·05는 욕조 세부를 주지 않으므로 그 이미지의 다른 유리 면을 욕조 외함으로 읽지 않는다. 욕조와 샤워의 같은 방 안 배치·통행은 instances의 별도 검증이며 실제 급배수와 하중은 `unverified`다.

## 주방 섬·싱크 {#kitchen-island}

`kitchen-island`의 X 폭 1.20, Z 길이 2.82, 상면 y=0.93m다. 바닥 원점은 상판 중심이고 +X가 스툴이 붙는 긴 면, +Z가 길이의 뒤쪽이다. `cabinet/island-base/880x870x2650/closed`는 중심 x=-0.04m, z=0이고, X 점유 -0.48..+0.40·Z 점유 ±1.325m다. 상판은 X ±0.60·Z ±1.41m, 두께 0.06m로 y=0.87..0.93이다. 따라서 +X 스툴 쪽 overhang은 0.20m, -X 쪽은 0.12m이며 양 끝은 0.085m다. +X 긴 변에는 문을 두지 않고 서비스 문 다섯 장은 -X 긴 변에만 둔다. 상판 sink 개구는 X 폭 0.48, Z 길이 0.36m, 중심 (x=-0.12,z=+0.65)이며 bowl은 y=0.93에서 0.18m 아래로 내려간다. tap 기둥은 x=-0.38, z=+0.90, y=0.93..1.28, spout는 x=-0.38..-0.13, y=1.28이다. 별도 평판 `sink-basin`으로 구멍을 막지 않는다.

안정 주소는 `counter/upper/edge/underside`, `sink/rim/inner/outer/bottom/drain`, `tap-body/outer/contact`, `tap-spout/outer/end`이며 base의 panel·door·edge 주소는 cabinet H2가 낸다. 상부·+X 식사 쪽·-X 서비스 쪽·45°에서 긴 측면의 문 유무, 0.20m overhang, bowl 깊이와 스툴 접근을 확인한다. ref03의 긴 섬·싱크·세 스툴 관계를 채택하고 ref02의 조감으로 kitchen과 식탁의 한 공간 관계를 확인한다. ref01·04·05의 다른 유리나 책상을 조리대 세부로 차용하지 않는다. 실제 급배수와 앉는 무릎 안전은 `unverified`다.

## 벽 조리대·쿡탑·오븐 {#cooking-appliances}

벽 조리대는 `wall-worktop`(X 폭 3.00, Z 깊이 0.67, 상면 y=0.925m), `cooktop`(0.65×0.50×0.014m), `oven`(폭 0.60×손잡이 포함 깊이 0.586×높이 0.59m)의 세 prototype이다. 바닥에서 조리대 폭 중심이 원점, +Z가 사용자가 서는 앞이다. `cabinet/kitchen-base/2900x870x620/closed`의 외함 위에 두께 0.055m 상판을 y=0.87..0.925로 둔다. 상판 중앙 x=0,z=0에는 0.65×0.50m 개구를 실제로 절삭한다. 두께 0.012m cooktop 본체는 y=0.913..0.925로 그 구멍에 flush로 들어가고 가장자리 rim만 y=0.925..0.927로 0.002m 올라오며 겹친 상판 면은 남지 않는다. 네 원형 zone은 지름 0.13m, 중심 x=±0.17,z=±0.12다. oven은 cabinet 중앙 폭 0.64m 개방 bay에 x=0,y=0.15..0.74,z=+0.022에 넣어 전면 z=+0.31을 cabinet 앞과 맞추고 양옆 0.02m clear를 남긴다. oven 전면 유리·테두리·손잡이는 door 전면으로 읽히지만 cabinet drawer face가 그 앞에 나타나지 않는다. 오븐 자체의 원점은 몸체 아래면 중심이며 다음 z·y는 위 조리대에 결합한 뒤의 assembly 좌표다. 오븐 몸체 깊이는 0.54m이며 assembly 좌표의 몸체는 z=−0.248..+0.292에서 끝나 프레임 뒤의 중복 부피를 만들지 않는다. 전면 프레임은 x=±0.30,y=0.15..0.74,z=0.292..0.31의 폭 0.035m 둘레다. 유리창은 x=±0.245,y=0.26..0.62,z=0.302..0.306이며 앞면이 프레임보다 0.004m 물린다. 상부 조절판은 x=±0.27,y=0.64..0.72,z=0.306..0.31, 둥근 knob 둘은 지름 0.035m, 중심 x=±0.22,y=0.69,z=0.31..0.328이다. 오븐 손잡이는 0.40×0.025×0.028m로 중심 y=0.68, z=0.324이고 바깥 끝 z=0.338이다. 프레임은 cabinet 전면 z=0.31에 맞추고 손잡이만 앞으로 돌출한다.

주소는 `worktop/upper/edge/underside`, `cooktop/top/edge/underside`, `zone-0..3/upper/edge`, `oven-body/front/back/side-left/side-right/top/sole`, `oven-front-frame/front/back/edge`, `oven-window/front/back/edge`, `oven-handle/outer/contact`, `oven-controls/front/edge`, `oven-knob-0..1/outer/contact`다. 정면·상부·45°에서 네 zone, oven 빈 bay, 서랍과 가전의 분리를 확인한다. ref03의 초록 서랍 하부장·밝은 상판·검은 매립 조리면을 채택한다. ref02는 공용부 위치 근거이며 ref01·04·05에서는 조리대 치수를 읽지 않는다. 가열·후드 환기 성능은 `unverified`다.

## 두 문 냉장고 {#refrigerator}

`refrigerator`는 X 폭 0.90, 높이 2.65, 손잡이 포함 Z 깊이 0.785m다. 바닥 중심 원점, +Z가 문 앞이다. body는 z=-0.38..+0.29, 상·하 문은 z=+0.29..+0.38의 두께 0.09m이고 하부 문 y=0.08..1.047, 상부 문 y=1.053..2.65라 y=1.05에 0.006m seam이 보인다. 손잡이는 문마다 0.022×0.28×0.025m로 x=+0.37, z=+0.38..+0.405, 중심 높이 y=1.65와 0.57이다. toe는 y=0..0.08, 앞면에서 0.05m 물린다. `body/front/side-left/side-right/back/top/sole`, `door-upper/lower/front/back/edge`, `handle-upper/lower/outer/contact`, `toe/front/back/top/underside/side`가 안정 주소다. 내부는 구현하지 않으며 일반 tall pantry와 전면 분할로 구별한다. 정면·측면·45°에서 두 문과 깊이를 확인한다. ref03 주방 벽장의 기기 위치와 ref02의 tall unit을 채택하되 사진의 문틀 폭을 복제하지 않는다. ref01·04·05에는 냉장고 상세가 없다. 냉각은 `unverified`다.

## 세탁기와 건조기 {#laundry-appliances}

`laundry-washer`와 `laundry-dryer`는 각각 폭·깊이 0.66, 높이 0.84m다. 각 장치의 바닥 중심이 원점, +Z가 전면이다. 본체는 z=-0.33..+0.30, 전면 드럼 문은 z=+0.30..+0.33이다. drum 중심은 x=0,y=0.38이고 rim 외경 0.46, 투명 창 외경 0.35m다. 창은 z=0.326..0.330, 유리 뒤 z=0.246..0.326의 0.08m 내부 깊이를 그늘진 곡면으로 남긴다. 문 힌지는 x=−0.245,y=0.38,z=0.315, 지름 0.02·높이 0.08m다. controls 판은 0.25×0.055×0.014m로 중심 x=+0.10,y=0.74,z=0.307이다. washer는 x=0.015 다이얼 하나와 x=0.12,0.17 버튼 둘, dryer는 x=0.19 다이얼 하나와 x=0.015,0.07,0.12 버튼 셋을 고정 형상으로 둔다. 각 다이얼은 지름 0.035, 버튼은 지름 0.014m이며 모두 판 앞 z=0.314..0.329에 머문다. `body/front/side-left/side-right/back/top/sole`, `drum/rim/window-front/window-back/window-edge/inner`, `controls-panel/front/back/edge`, `controls-dial/outer/contact`, washer의 `controls-button-0..1/outer/contact` 또는 dryer의 `controls-button-0..2/outer/contact`, `door-hinge/outer/contact`가 안정 주소다. 위아래 적층 transform은 instances가 정하고 모델 내부에 1.68m 탑을 미리 만들지 않는다. 정면·측면·45°에서 두 controls 배열과 창 깊이를 확인한다. ref02 우측 서비스 코어의 세탁기 목적지 관계를 채택한다. ref01·03·04·05에서는 세탁기 형상을 특정할 자료가 없으며 세척·건조·진동은 `unverified`다.
