# 소품과 등기구 모델

[공통 주소와 중립 관찰](000-representation.md#model-address-and-scale)을 참조한다.

## 낮은·높은 실내 화분 {#potted-plant}

`potted-plant/<높이-mm>`의 허용 높이는 0.18, 0.28, 0.60, 0.80, 1.10m다. 화분 바닥 중심이 원점, +Y가 위, +Z는 관찰을 위한 앞이다. 각 H에서 화분 높이는 0.34H, 외경은 0.38H, 흙 표면은 0.30H, 줄기는 흙에서 0.84H까지, 수관의 외경 상한은 0.60H다. pot 벽 두께는 max(0.006,0.018H)m이고 열린 윗면의 inner wall과 바깥 wall은 둥근 rim에서 연결된다. 줄기 지름은 0.028H이고 가지 다섯은 y=(0.48+0.09i)H에서 시작해 방위 72i°, 길이 0.18H로 뻗는다(i=0..4). 각 끝에 길이 0.16H, 폭 0.055H의 닫힌 잎 세 개를 위쪽 Y축에 대해 −25°,0°,+25°로 놓아 총 15개가 된다. 맨 위 가지(i=4)의 중앙 잎 끝은 y=H라 선언 높이와 실제 AABB가 같다. 같은 H에서 반복 순서와 변종 외형은 고정이다.

`pot/outer/inner/rim/sole`, `soil/upper/edge/underside`, `stem/outer/contact`, `branch-0..4/outer/contact`, `leaf-0..14/front/back/edge`가 안정 주소다. 잎은 앞·뒤가 각각 winding과 normal을 가진 닫힌 얇은 부피이고 UV가 각 면의 길이 축을 따른다. 45°·상부·방 거리 view에서 pot 개구, 연결된 가지와 잎 사이 빈 공간이 드러나야 한다. ref03 조리대 작은 화분, ref04 책장 식물은 0.18/0.28m 변종으로 채택하고 ref02의 바닥 화분은 0.60..1.10m 변종으로 채택한다. ref01의 외부 수목·생울타리는 spaces의 대지 owner이므로 이 prototype으로 옮기지 않는다. ref05 창 밖 식물도 이 실내 화분의 배치 증거로 쓰지 않는다. 실제 종의 특정과 성장·바람 응답은 이 형상에서 `unverified`다.

## 개별 책 {#books}

`book/<높이-mm>x<두께-mm>x<깊이-mm>`는 높이 0.18..0.30, 두께(X) 0.02..0.05, 깊이(Z) 0.12..0.20m의 세 값을 모두 ID에 넣는다. 선반 접촉 중심이 원점, +Z가 책등이 보이는 앞이다. 표지 두 장은 두께 0.004m로 각각 x=−T/2..−T/2+0.004와 x=T/2−0.004..T/2, y=0..H,z=−D/2..+D/2다. 종이 블록은 x=−T/2+0.004..T/2−0.004, y=0.004..H−0.004,z=−D/2..D/2−0.006이며 책등은 양 표지의 +Z 끝을 잇는 반경 0.004m 둥근 판이다. `cover-left/right/outer/inner/top/bottom/fore-edge/spine-edge`, `spine/outer/inner/top/bottom`, `pages/front/left/right/top/bottom/back`의 실제 면을 분리한다. 각각 닫힌 부피이며 표지 접합선은 책등의 안쪽에서 끝난다. 정면·상부·45°에서 책등과 개별 폭이 읽혀야 한다. ref04 벽 책장과 ref02 작은 침실 책상·선반의 개별 책을 채택하되 ref03의 장식 그릇을 책으로 바꾸지 않는다. ref01·05에는 책 치수 근거가 없다. 책의 수·회전은 instances가, 제목·인쇄는 미정 설정이 정하기 전까지 `unverified`다.

## 접힌 수건 {#folded-towels}

`folded-towel/<높이-mm>`의 허용 전체 높이는 0.08, 0.12, 0.16m이고 폭 0.38, 접힌 깊이 0.60m다. 선반 접촉 중심 원점, +Z가 접힌 앞이다. 세 겹의 부피는 각각 높이 h=(H−0.008)/3이고 앞쪽 모서리 반경 0.02m다. 아래에서 위로 `layer-0`은 y=0..h, `layer-1`은 y=h+0.004..2h+0.004, `layer-2`는 y=2h+0.008..H에 놓는다. 두 0.004m 음영 틈의 뒤쪽 z=−0.30..−0.27에는 `fold-0`이 y=h..h+0.004로, 앞쪽 z=+0.27..+0.30에는 `fold-1`이 y=2h+0.004..2h+0.008로 놓여 아래·위 겹의 대면적 접촉면에 각각 닿는다. 각 fold의 X 폭은 0.38m이며 세 겹과 두 접힘은 한 연속 접촉 그래프를 만든다. `layer-0..2/upper/fold-front/fold-back/fold-side/underside`와 `fold-0..1/front/back/top/sole/side`가 각 부품의 전 표면을 덮고 layer 번호는 아래에서 위로 증가한다. 정면·측면·45°에서 겹수가 읽혀야 한다. ref02 욕실·linen 수납의 쌓인 수건을 채택한다. ref01·03·04·05에는 접힌 수건을 판독할 근거가 없다. 섬유 유연성과 실제 습기 응답은 `unverified`다.

다음 세 상태는 높이 토큰 80·120·160mm를 각각 전개한다. `h=(H−0.008)/3`의 무한소수 경계는 표에서 0.0000001m 이내로 바깥 반올림했고, 실제 접촉면은 같은 원래 식을 공유한다.

@inventory 80: layer-0, layer-1, layer-2, fold-0, fold-1
@inventory 120: layer-0, layer-1, layer-2, fold-0, fold-1
@inventory 160: layer-0, layer-1, layer-2, fold-0, fold-1

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 80 | * | bounds | -0.19..0.19 | 0..0.08 | -0.30..0.30 | - |
| @part | 80 | layer-0 | box | -0.19..0.19 | 0..0.024 | -0.30..0.30 | ground,fold-0 |
| @part | 80 | layer-1 | box | -0.19..0.19 | 0.028..0.052 | -0.30..0.30 | fold-0,fold-1 |
| @part | 80 | layer-2 | box | -0.19..0.19 | 0.056..0.08 | -0.30..0.30 | fold-1 |
| @part | 80 | fold-0 | box | -0.19..0.19 | 0.024..0.028 | -0.30..-0.27 | layer-0,layer-1 |
| @part | 80 | fold-1 | box | -0.19..0.19 | 0.052..0.056 | 0.27..0.30 | layer-1,layer-2 |
| @envelope | 120 | * | bounds | -0.19..0.19 | 0..0.12 | -0.30..0.30 | - |
| @part | 120 | layer-0 | box | -0.19..0.19 | 0..0.0373334 | -0.30..0.30 | ground,fold-0 |
| @part | 120 | layer-1 | box | -0.19..0.19 | 0.0413333..0.0786667 | -0.30..0.30 | fold-0,fold-1 |
| @part | 120 | layer-2 | box | -0.19..0.19 | 0.0826666..0.12 | -0.30..0.30 | fold-1 |
| @part | 120 | fold-0 | box | -0.19..0.19 | 0.0373333..0.0413334 | -0.30..-0.27 | layer-0,layer-1 |
| @part | 120 | fold-1 | box | -0.19..0.19 | 0.0786666..0.0826667 | 0.27..0.30 | layer-1,layer-2 |
| @envelope | 160 | * | bounds | -0.19..0.19 | 0..0.16 | -0.30..0.30 | - |
| @part | 160 | layer-0 | box | -0.19..0.19 | 0..0.0506667 | -0.30..0.30 | ground,fold-0 |
| @part | 160 | layer-1 | box | -0.19..0.19 | 0.0546666..0.1053334 | -0.30..0.30 | fold-0,fold-1 |
| @part | 160 | layer-2 | box | -0.19..0.19 | 0.1093333..0.16 | -0.30..0.30 | fold-1 |
| @part | 160 | fold-0 | box | -0.19..0.19 | 0.0506666..0.0546667 | -0.30..-0.27 | layer-0,layer-1 |
| @part | 160 | fold-1 | box | -0.19..0.19 | 0.1053333..0.1093334 | 0.27..0.30 | layer-1,layer-2 |

## 손잡이 있는 빈 바구니 {#storage-basket}

`storage-basket`은 폭 0.40, 깊이 0.65, 높이 0.28m다. 선반 접촉 중심 원점, +Z가 꺼내는 앞이다. 바닥 두께 0.012m, 네 벽 두께 0.010m, 상단 rim 폭 0.018m이며 내부는 열린 빈 공간이다. 양쪽 손잡이는 x=±0.195m 측벽의 z=−0.06..+0.06,y=0.208..0.243m인 0.12×0.035m 관통 구멍을 감싼 두께 0.012m 띠다. 보강 띠는 벽의 안쪽 x=±(0.188..0.200)에 매립되어 전체 폭을 늘리지 않는다. 그 바깥 경계는 z=±0.072,y=0.196..0.255m이며 위 rim과 0.007m 떨어진다. `wall/outer/inner/edge`, `rim/upper/edge/underside`, `bottom/upper/edge/underside`, `handle-left/right/outer/inner/cut-edge/contact`가 안정 주소다. 상부·정면·45°에서 내부와 구멍 둘을 확인한다. ref02의 1층 수납과 상층 linen의 바구니 역할을 채택하고 ref04의 책을 바구니 안 내용물로 자동 생성하지 않는다. ref01·03·05는 바구니 형상 근거가 없다. 내용물·개수는 instances가 결정하고 손잡이 하중은 `unverified`다.

## 현관 충전 물체 {#entry-charger}

`entry-charger`는 폭 0.07, 깊이 0.12, 높이 0.015m다. [벽걸이 선반](002-storage-and-sleep.md#entry-charging-shelf)에 닿는 아래면 중심이 원점, +Z가 조작면이다. 본체 위쪽 x=±0.026,z=±0.0375,y=0.013..0.015m를 절삭해 0.052×0.075×0.002m 인터페이스를 flush로 끼운다. 앞쪽 edge z=+0.05..+0.06,x=±0.006,y=0.0045..0.0105m에는 폭 0.012·높이 0.006·깊이 0.010m 단자 구멍을 실제로 절삭한다. `body/front/back/top/edge/sole`, `interface/front/back/edge`, `port/inner/edge`가 안정 주소다. 정면·상부·측면과 현관 리뷰 거리 관찰에서 과장된 두꺼운 판으로 보이지 않는지 확인한다. ref02의 현관 충전 기능을 settings의 평벽 선반에 연결한다. ref01·03·04·05의 창·작업 기기를 충전기 형상으로 삼지 않는다. 실제 충전 과정은 systems 결정 전까지 `unverified`다.

## 거실·침실 러그 {#rugs}

`living-rug`는 폭 2.80, 깊이 3.65, 높이 0.016m, `bedroom-rug/1600x2200`은 폭 1.60, 깊이 2.20, 높이 0.012m다. 바닥 접촉 중심이 원점, +Z가 긴 축이다. base 높이는 living 0.013m·bedroom 0.009m, pile 높이는 두 변종 모두 0.003m다. 상면 pile 부피와 0.025m 폭의 직조 둘레 띠를 별도 주소 `pile/upper/edge/underside`, `bound-edge/upper/inner/outer/underside`, `base/upper/edge/contact`로 나누고 바닥판에 녹이지 않는다. 상면 UV는 장축 Z를 따른다. 위·낮은 측면·실내 거리 view에서 둘레와 소파 발 또는 침대 곁의 접촉이 보여야 한다. ref02 침실 러그와 거실 러그, ref03 소파 앞 직물 경계를 채택한다. ref01·04·05에는 러그 상세가 없어 문턱 재료를 직물로 치환하지 않는다. 실제 pile 섬유 개별 형상과 미끄럼은 `unverified`다.

`round-rug/1200`은 ref02의 작은 침실에서 보이는 원형 러그를 채택한 지름 1.20m·높이 0.012m 변종이다. 접지 중심이 원점이고 장식 회전은 둘레가 균등하므로 +Z가 방 입구를 향한다. y=0..0.009의 닫힌 원판 base, y=0.009..0.012의 pile, 바깥 반경 0.60m에서 안쪽으로 0.025m 폭의 bound-edge를 갖는다. 원형 둘레는 [공통 곡면 분할](000-representation.md#model-uv-and-topology)의 24구간을 사용하고 `pile/upper/edge/underside`, `bound-edge/upper/inner/outer/underside`, `base/upper/edge/contact`를 직사각 변종과 같이 낸다. 실제 작은 침실의 문 호와 침대 발 사이 통행을 침범하는지는 instances의 배치 검증 전까지 `unverified`다.

## 벽 액자 {#wall-art}

`wall-art/600x420`은 폭 0.60, 높이 0.42, 전체 깊이 0.035m다. 벽 접합 뒷면 중심이 원점, +Z가 보는 앞이다. 폭 0.025m 프레임 띠, z=0..0.012의 뒤판, z=0.012..0.013의 중앙 이미지 수신용 빈 종이 면, z=0.013..0.021의 0.008m 매트, z=0.031..0.035의 0.004m 전면 cover를 가진다. z=0.021..0.031은 0.010m 빈 공기층이고 프레임은 외곽에서 z=0.012..0.035를 연결한다. `frame/front/edge/back`, `mat/front/back/edge`, `artwork/front/back/edge`, `cover/front/back/edge`, `back/outer/contact`가 안정 주소다. 실제 그림 내용·색은 model이 결정하지 않고 materials의 결합 전까지 중립 면이다. 정면·측면·45°와 침실 거리에서 사진 billboard가 아닌 실제 두께·frame이 보여야 한다. ref02 작은 침실 벽의 액자 한 점을 채택한다. ref01·03·04·05의 창 너머 장면을 액자 이미지로 붙이지 않는다. 특정 가족 사진·직업 단서는 설정에 없으므로 표현하지 않으며 실제 그림 내용은 `unverified`다.

## 빈 그릇·쟁반·컵 {#tabletop-props}

`decor-bowl`은 외경 0.22, 높이 0.07m, 벽 두께 0.008m이고 아래면 중심 원점, +Y 위다. 상단 개구 내경 0.204m, 안쪽 바닥 y=0.014이며 `shell/outer/inner/rim/sole`로 나눈다. `decor-tray`는 전체 폭 0.36·깊이 0.24·높이 0.032m이며 y=0..0.018m의 타원형 바닥과 y=0.018..0.032m의 높이 0.014m·두께 0.006m 둘레 턱을 가진 낮은 판이고 `base/upper/underside/edge`, `rim/inner/outer/top/underside`이다. `decor-cup`은 몸체 외경 0.085, 높이 0.095, 벽 두께 0.006m의 빈 원통과 외경 0.04m 손잡이를 가진다. 손잡이는 YZ 평면의 외경 0.04m인 닫힌 고리로 튜브 지름 0.006m, 중심 y=0.050,z=+0.0625에 둔다. 고리의 뒤쪽 끝 z=+0.0425는 몸체 외벽에 닿고 앞쪽 끝은 z=+0.0825다. 한 handle 부품 안의 위·아래 접합 pad는 각각 y=0.034..0.042와 0.063..0.071, x=±0.006m이며 뒷면은 컵의 반지름 0.0425m인 원통 바깥면을 따라 굽는다. 두 pad는 몸체 외벽의 유한 곡면에 접하고 빈 내벽 반지름 0.0365m 안으로 들어가지 않는다. pad의 앞면은 고리 몸체에 연속 접합한다. 바닥 접촉 중심 기준 전체 AABB는 x=±0.0425,y=0..0.095,z=−0.0425..+0.0825m다. 주소는 `body/outer/inner/rim/sole`, `handle/outer/inner/contact`다. 세 물체는 모두 놓이는 아래면 중심이 원점이고 +Z는 손잡이가 향한 앞이다. 위·측면·45°와 식탁 거리에서 빈 내부와 서로 다른 높이가 읽혀야 한다. ref03 낮은 탁자의 그릇과 조리대의 작은 소품, ref02 식탁의 그릇을 채택한다. ref01·04·05의 식사 장면은 없으므로 음식·브랜드·문구는 만들지 않는다. 각 소품의 개수와 놓이는 상판은 instances가 맡고 식품 접촉 성능은 `unverified`다.

## 거실 화면 {#living-display}

`living-display`는 폭 1.43, 높이 0.80, 깊이 0.045m다. 벽 mount 접합면 중심이 원점, +Z가 시청자 쪽이다. mount는 폭 0.18·높이 0.12·깊이 0.018m로 z=0..0.018, housing은 폭 1.43·높이 0.80·깊이 0.027m로 z=0.018..0.045다. bezel은 바깥 가장자리에서 폭 0.018m를 차지하며 중앙 screen을 위한 전면 개구를 실제로 절삭한다. screen은 z=0.039..0.042m의 두께 0.003m 판이고 bezel 전면 z=0.042..0.045보다 뒤로 물린다. `screen/front/back/edge`, `bezel/front/back/edge`, `housing/front/back/edge`, `mount/outer/contact`가 안정 주소다. 정면·측면·45°에서 bezel와 벽 이격을 확인한다. ref02와 ref03 거실의 미디어 장치를 채택하며 ref01·04·05의 유리 벽을 화면으로 오인하지 않는다. 영상 내용과 전력 상태는 이 형상에서 `unverified`다.

## 천장 매입등 {#recessed-light}

`recessed-light`는 외경 0.12, 전체 깊이 0.04m다. 천장 접합면 중심이 원점이고 +Y가 천장 안쪽이므로 보이는 trim은 외경 0.12m·내경 0.095m의 닫힌 고리로 y=−0.025..0이고, 별도 천장 구멍을 요구하지 않는 얕은 housing의 몸체는 외경 0.085m, y=−0.040..−0.025다. housing과 한 부품인 상단 flange는 외경 0.10m,y=−0.028..−0.025이며 trim 아래면의 반지름 0.0475..0.05m 환형 접촉면에 닿는다. 이는 천장면 아래에서 마감되는 0.04m 표면 부착 다운라이트이며 천장 안으로 매립된 부품이라고 주장하지 않는다. 확산면 지름 0.095m·두께 0.003m는 y=−0.015..−0.012에 후퇴하고 그 바깥 원통면은 trim의 내벽에 유한 면으로 닿는다. `housing/outer/inner/contact`, `trim/front/edge/contact`, `diffuser/front/back/edge`가 안정 주소다. diffuser의 발광 과정은 system emitter와 별도 대응하고 housing은 emissive가 아니다. 아래·45°와 실내 거리에서 trim 깊이를 확인한다. ref03·04·05의 작은 천장 점등을 채택하고 ref01의 실내 빛점을 특정 fixture의 형상 근거로 쓰지 않는다. ref02는 두 층 반복 위치의 검사 자료다. 실제 광량은 systems 소유이며 이 모델 H2의 결과로는 `unverified`다.

## 가는 원통 식탁 펜던트 {#dining-pendant}

`dining-pendant`는 천장 cord 고정점이 원점, +Y가 천장 안쪽, 아래가 식탁으로 향한다. 전체 하향 길이 1.00m 중 cord는 y=0..-0.62에 지름 0.006m, 가는 원통 shade는 y=-0.62..-1.00에 지름 0.045m, 하단 diffuser는 지름 0.038m·두께 0.003m로 y=-0.989..-0.986에 후퇴한다. 천장 canopy는 지름 0.08, 높이 0.018m로 천장면 아래 y=−0.018..0에 닿는다. cord가 지나는 중앙 지름 0.006m 구멍을 절삭하고 그 edge에서 cord에 접하므로 천장 안쪽으로 들어가지 않는다. `cord/outer/end`, `canopy/outer/contact`, `shade/outer/inner/edge`, `diffuser/front/back/edge`가 안정 주소다. 원통 내부는 diffuser까지 열린 음영 공간이며 원판형 0.38m shade를 남기지 않는다. 정면·측면·45°와 ref03 식탁 거리에서 가는 세로선으로 보여야 한다. ref03의 원통 펜던트를 채택하고 ref02는 식탁 위 매달린 위치 관계만 채택한다. ref01·04·05에는 펜던트 형상 증거가 없다. 발광은 system emitter가 소유하고 모델 형상만으로 광량은 `unverified`다.

## 바닥 독서등·구형 협탁등·작업등 {#portable-lamps}

`portable-lamp/reading`의 전체 점유는 폭·깊이 0.25, 높이 1.24m이고 바닥 받침 지름 0.25m로, 지름 0.018m stem이 y=0.025..1.10, 0.20m 지름의 원통 shade가 y=1.03..1.24다. `portable-lamp/bedside-globe`의 전체 점유는 폭·깊이 0.22, 높이 0.29m이며 상판 받침 지름 0.12·높이 0.015m, 짧은 stem 높이 0.055m, 구형 diffuser 지름 0.22m, 총 높이 0.29m다. `portable-lamp/desk-task`의 전체 점유는 x=±0.065,y=0..0.42,z=−0.065..+0.14m이며 받침 지름 0.13m, 총 높이 0.42m다. 이 변종은 0.015m 지름의 고정 두 구간 stem이 y=0.02..0.25와 y=0.25..0.36, 길이 0.14m 헤드가 +Z 방향으로 뻗어 아래쪽 diffuser 지름 0.09m를 드러낸다. 세 변종 모두 받침 아래면 중심이 원점, +Z가 빛을 향하는 방향이다. `base/upper/edge/sole`은 공통 주소다. reading은 y=0.025..1.10의 `stem-lower/outer/top/contact`, `shade/outer/inner/edge`, 아래쪽 y=1.03..1.034의 `diffuser/front/back/edge`를 낸다. shade의 외경은 0.20m, 벽 두께는 0.005m이고 내부 mounting bridge는 y=1.10..1.12에서 stem 상면에 닿도록 shade와 한 부품으로 연결한다. diffuser는 외경 0.19m·중앙 통과 구멍 지름 0.020m인 얇은 환형 판으로 그 외곽이 shade 내벽에 닿는다. 지름 0.018m stem은 0.001m 반경 여유를 두고 diffuser 구멍을 통과하므로 발광판을 관통하지 않는다. bedside-globe는 y=0.015..0.070의 `stem-short/outer/top/contact`와 중심 y=0.18인 `globe/outer/inner`만 내며 globe 외면이 확산면이다. desk-task는 `stem-lower/outer/top/contact`, `stem-upper/outer/top/contact`, y=0.36..0.42·z=0..0.14의 `task-head/outer/inner/edge`, 헤드 아래 중심 z=+0.09,y=0.36..0.364의 `diffuser/front/back/edge`를 낸다. 변종에 없는 stem·shade·globe·head·diffuser의 주소를 빈 부품으로 만들지 않는다. reading·desk-task의 diffuser와 bedside-globe의 globe 외면은 각각 별도 system emitter가 필요하다. 정면·측면·45°에서 바닥형/탁상형의 크기 차이, 구체와 두 구간 작업등을 판별한다. ref03의 거실 독서등, ref04의 구형 탁상등과 작업등을 각각 채택하고 ref02 협탁의 낮은 조명을 크기 관계로 받는다. ref01·05의 외피 빛 반사를 램프 형상으로 가져오지 않는다. 전기 안전·조도는 `unverified`다.
