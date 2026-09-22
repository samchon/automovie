# 습식 마감과 도장 가구

## 바닥과 벽 타일 {#wet-tile}

`wet-tile`은 powder-utility, upper-bathroom, upper-service의 floor-boards와 tile lining이다. floor owner의 .45m pitch, 잘린 타일, 실제 틈과 room lining을 유지한다. 색 #6f746f, roughness=.65, `tile-grain` 512²·.45×.45m, 2..6mm 입자의 선형 평균 .98·범위 .95..1.00이다. 기존 tile 판의 두께는 geometry 값 그대로이고 새 줄눈망이나 벽돌 무늬는 그리지 않는다.

바닥 X/Z, 벽 수평/수직의 metric UV를 사용한다. 세면기 bowl의 기존 tile색에는 이 마감을 쓰지 않는다. [습식 방 검사](007-observation.md#reference-material-samples)에서 도기·금속·목재와 구분하고 문턱의 oak/tile 경계 및 물체 아래 남은 바닥 면을 확인한다. 방수층·배수 경사·마찰 성능은 이 재료 설정의 인증 범위 밖이다.

## 조리대 석재 {#worktop-stone}

`worktop-stone`은 kitchen-island counter와 kitchen-wall-bank worktop의 기존 판 면이다. 현재 판 두께와 sink/hob의 기하 관계를 유지한다. 연마된 밝은 합성 석재의 근사로 색 #dad7ce, roughness=.30, `worktop-grain` 512²·.50×.50m, 1..3mm 입자, 선형 평균 .985·범위 .96..1.00을 쓴다. 금속성·투과·clearcoat는 없다.

top X/Z와 실제 edge 면에 같은 크기의 등방성 입자를 배정하며 검은 marble vein이나 구운 광택 줄은 없다. [ref03 조리대 검사](007-observation.md#reference-material-samples)에서 초록 cabinet·식탁·싱크와 다르게 읽히고 top/edge의 색이 연결되어야 한다. 실제 식품 접촉·내열 성능은 unverified다.

## 위생 도기 {#sanitary-ceramic}

`sanitary-ceramic`은 basin rim/bowl, toilet pedestal/bowl/cistern, 욕조/샤워 트레이의 실제 면이다. 이름이 white/tile이던 용도도 방 owner가 이 역할로 명시한다. texture 없음, 색 #e7e6df, roughness=.19, metallic=0, clearcoat=.12다. 명목 .5mm 유약은 기존 기하 안에 포함되며 벽 타일이나 침구에 적용하지 않는다.

곡면은 현재 mesh 그대로 반사하고 부재 두께/배관은 방 owner에 남긴다. [습식 방 근접 검사](007-observation.md#reference-material-samples)에서 도기가 직물처럼 보이지 않는지, basin 내부가 바닥 tile과 같은 재료인지 확인한다. 기기의 단순한 형상이나 실제 배관 작동은 이 glossy 마감으로 해결했다고 하지 않는다.

## 변기 좌판 수지 {#sanitary-seat}

`sanitary-seat`는 toilet의 기존 `*-seat` 면만 받는 흰 성형 수지 마감이다. 방 owner의 타원형 좌판과 두께를 유지하며 도기 유약이나 직물 피복을 선언하지 않는다. 색 #e7e6df, roughness=.30, metallic=0, clearcoat=0, texture 없음이다. 기존 linen이라는 색 이름을 실제 직물로 해석하지 않는다. 면 방향은 현재 mesh 법선을 따르고 광택의 차이만 도기 bowl과 구분한다.

[습식 방 근접 검사](007-observation.md#reference-material-samples)에서 seat/bowl 경계를 함께 본다. 좌판에 직물 격자가 생기거나 도기와 겹치는 이중 표면이 생기면 실패다. 실제 수지 조성·내구·하중 성능은 unverified다.

## 도장 수납 가구 {#painted-joinery}

`joinery-green`은 kitchen base/island와 같은 녹색 cabinet 판에 색 #626b59·roughness=.44를 배정한다. `joinery-light`는 kitchen-overhead 및 flex murphy closed-panel의 plaster색 판에 #c9c3b7·roughness=.48을 쓴다. 명목 .1mm 도막, texture 없음, metallic=0이다. 실제 문짝 분할·문손잡이·틈·작동은 방 owner의 현재 형상 그대로다.

green sofa/plant leaf, plaster wall/ceiling에 확장하지 않는다. 판 두께와 local face를 그대로 쓰므로 texture 방향 문제는 없고 반사 방향은 실제 법선으로 결정한다. [ref03·04 검사](007-observation.md#reference-material-samples)에서 cabinet은 무광 벽보다 약간 매끈하며 worktop·직물과 구분되어야 한다. 새로운 문 접합/서랍 형상은 후속 fit-out 설계의 영역이다.

## 나머지 표면의 보존 {#retained-surfaces}

v-076의 식재·토양·대지 포장 및 equipment screen/hob/keyboard, 작은 소품과 glow는 각 현재 owner의 geometry와 material 값을 유지한다. 나무4·관목48그룹·풀23그룹의 이동이나 추가는 없다. 식재의 oak 줄기에 furniture grain을, 소파의 green에 cabinet paint를, appliance white에 도기를 자동 배정하지 않는다. 신규 finish가 지정되지 않은 기존 역할은 `retained/<현재 material id>`로 명시하며 알 수 없는 이름을 이 역할에 몰아넣지 않는다.

검증은 [완전 바인딩 census](007-observation.md#binding-census)의 보존 목록 및 [reference 전경 검사](007-observation.md#reference-material-samples)다. source 값을 복사한 표를 새 소유자로 만들지 않고 기존 material 및 owner 주소를 출력에서 추적한다. 대지·나무의 낮은 형상 밀도, 기기 화면의 단색, 조명 기구의 단순함은 보존된 한계이며 이번 재료 PASS만으로 전체 제작 완료를 주장하지 않는다.
