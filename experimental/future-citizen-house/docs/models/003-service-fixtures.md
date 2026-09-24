# 위생기구와 생활 설비 모델

이 파일의 대상은 [1층 powder](../settings/002-household.md#ground-program), [2층 욕실과 설비실](../settings/002-household.md#upper-program)의 식별 가능한 고정·가동 물체다. 치수는 m 단위의 저작 치수이며 실제 급배수·전기·방수·제품 인증을 뜻하지 않는다. 방 경계와 샤워 위치는 spaces, 부착과 배치는 instances, 물·전기·빛의 과정은 systems, 광학 표면은 materials가 소유한다.

중립 배경·0.50m 눈금·카메라 축·key light는 [모델 관찰 조건](001-seating-and-work.md)을 따른다. 위생기구의 개구와 가전의 전면은 그 조건의 상부·정면 view에서 확인한다.

prototype id는 `basin/<폭-mm>`, `toilet`, `shower`, `kitchen-island`, `wall-worktop`, `cooktop`, `oven`, `refrigerator`, `laundry-washer`, `laundry-dryer`다. `<폭-mm>`는 m 입력을 mm 정수로 검사한다. 한 기구가 다른 모델의 수납 외함을 소비해도 그 외함의 prototype id와 part 주소를 다시 생성하지 않는다.

## 세면대와 수전 {#basin}

세면대는 폭 0.65m의 powder형과 1.00m 욕실형을 가지며 상단 0.85m, 깊이 0.50m다. 국소 원점은 하부장 바닥 중심, +Z가 사용하는 앞쪽이다. [수납장](002-storage-and-sleep.md#cabinet-and-shelf)의 외함 변종 위에 실제 안쪽으로 내려간 세면기 bowl·배수구·뒤쪽 수전, 판으로 읽히는 거울을 별도 object로 놓는다. 단순 수평 rim 위에 얇은 타원을 붙이는 현재 형상은 물을 담는 음각 공간이 없으므로 재설계한다. 그릇은 의도된 상부 개방과 닫힌 두께 있는 나머지 벽을 가진다.

주소는 `basin-rim-top/edge/underside`, `basin-bowl-inner/outer`, `drain`, `tap-body/spout`, `mirror-front/back/frame`이며 하부장은 수납 모델의 part 주소를 유지한다. bowl 안쪽 normal과 외측 normal을 따로 검사하고 UV 이음은 배수구 아래에서 끊는다. 정면·45°·상부에서 bowl의 깊이, 수전과 배수 위치, 거울의 테두리를 확인한다. 물 공급과 실제 인체 사용성은 `unverified`다.

## 변기 {#toilet}

변기는 바닥 점유 0.42×0.72m, 앉는 높이 0.43m, 물탱크 최고 0.82m로 두 방에 같은 prototype을 둔다. 원점은 바닥 접촉 중심, +Z가 앉는 앞쪽이다. 받침·도기 bowl의 안쪽 비어 있는 부분·링 seat·뚜껑·후면 탱크·flush 조작부가 각기 형태를 가진다. 기존 타원 세 장이 겹친 형태 대신 위에서 봤을 때 bowl 개구가 실제로 뚫려 있어야 한다. seat와 뚜껑은 고정된 닫힘 상태로 두고 개폐 애니메이션은 납품하지 않는다.

`pedestal-outer`, `bowl-inner/outer/rim`, `seat-upper/underside`, `lid-front/back`, `cistern-front/back/edge`, `flush`가 안정 주소다. 도기 안쪽은 배출구 쪽으로 수렴하는 닫힌 곡면이고 상단 개구만 의도된 열린 경계다. 상부·정면·측면 중립 view에서 개구, seat, 탱크가 따로 읽히는지 확인한다. 수세 기능과 설비 연결은 형상 검사의 결과가 아니다.

## 욕실 샤워 {#shower}

상층 욕실 샤워는 바닥 점유 2.05×1.45m, 투명 고정 screen 높이 2.20m다. 원점은 tray 바닥 중심, +Z가 들어가는 쪽이다. tray의 얕은 경사·테두리·배수구, 수직 riser·헤드, 두께 있는 고정 유리 screen과 상단 rail을 구성한다. screen의 출입 쪽은 실제 열린 통로이고 닫힌 전면 판을 추가하지 않는다. 현재 평평한 tray box와 12mm 유리 판을 재검토해 바닥과 screen의 각 표면 및 배수 음영을 읽히게 한다.

`tray-floor/curb/outside`, `drain`, `screen-front/back/edge`, `screen-rail`, `riser`, `head-face/back`이 안정 주소다. screen 양면은 다른 광학 응답을 받을 수 있으므로 하나의 무주소 판으로 합치지 않는다. 위·출입구·측면 중립 관찰에서 배수 경사, 유리 경계와 열린 출입을 대조한다. 방수와 배수 성능은 `unverified`다.

## 주방 아일랜드·싱크 {#kitchen-island}

섬은 1.02×2.82m 상판, 높이 0.93m이며 하부장 형상은 [수납장](002-storage-and-sleep.md#cabinet-and-shelf)의 0.88×0.87×2.65m 변종을 재사용한다. 원점은 바닥 중심, +Z는 식사 쪽이다. 상판 속 0.48×0.36m bowl은 실제 음각 깊이를 가진 개구이고 바깥 rim, 배수구, 수전 기둥과 굽은 spout가 따로 보인다. 지금의 평평한 `sink` 판 위에 더 작은 `sink-basin` 판을 겹치는 형상은 물을 담는 공간으로 읽히지 않는다. 조리대는 `counter-top/edge/underside`, 싱크는 `sink-rim/inner/outer/drain`, 수전은 `tap-body/spout`의 안정 주소를 가진다. 상부·식사 쪽·45° view에서 bowl의 비어 있는 공간과 스툴 쪽 상판 돌출을 확인한다. 실제 급배수는 `unverified`다.

## 조리 면과 오븐 {#cooking-appliances}

벽 쪽 3.00×0.67m 상판은 [수납장](002-storage-and-sleep.md#cabinet-and-shelf)의 하부장 변종 위에 놓고 국소 원점은 바닥 중심, +Z는 조리자가 서는 앞이다. 0.65×0.50m induction cooktop은 얇은 유리판, 네 원형 zone, 측면 edge를 가지며 하부 oven은 앞 유리·문틀·손잡이·조작부를 가진다. `worktop-top/edge/underside`, `cooktop-top/edge`, `zone-0..3`, `oven-body/front/window/handle/controls`가 안정 주소다. 조리 면은 상판 위로 뜨지 않고 oven은 하부장 문과 겹치지 않아야 한다. 정면·상부·45°에서 cooktop 네 zone과 oven 깊이를 대조한다. 가열과 환기는 `unverified`다.

## 냉장고 {#refrigerator}

주방 tall 냉장고는 폭 0.90m, 높이 2.65m, 깊이 0.76m의 바닥형 장치다. 원점은 바닥 중심, +Z가 문 앞쪽이다. 상·하 문 seam과 각각의 손잡이, 하부 toe, 두께 있는 문과 측면의 독립 부품을 둔다. `body-front/side/back/top`, `door-upper/lower-front/back/edge`, `handle-upper/lower`, `toe`를 안정 주소로 둔다. 같은 크기의 pantry cabinet과 전면 분할·손잡이 형상으로 구별되며 실제 내부는 모델링하지 않는다. 정면·측면·45°에서 두 문과 깊이를 확인하고 냉각 능력은 `unverified`다.

## 세탁기와 건조기 {#laundry-appliances}

세탁실의 두 장치는 각각 0.66×0.66×0.84m이며 동일한 바닥 접촉 중심 원점과 +Z 앞 방향을 갖는다. 세탁기·건조기는 본체 형상을 공유하지만 drum 창 안쪽 깊이와 controls 배열이 다른 변종이다. 각 `body-front/side/back/top`, `drum-rim/window/inner`, `controls`, `door-hinge`가 안정 주소다. 원형 drum door·투명 창·가장자리와 전면 controls가 몸통과 구별되어야 하며 두 장치를 위아래로 놓는 위치는 instances가 소유한다. 정면·측면·45°에서 창의 실제 프레임 깊이와 서로 다른 controls를 확인한다. 세척·건조·진동·설비 연결은 `unverified`다.
