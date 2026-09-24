# 수납과 침대 모델

이 파일은 [가구 프로그램](../settings/002-household.md#ground-program)과 [상층 프로그램](../settings/002-household.md#upper-program), [작업실 상태](../settings/002-household.md#flex-states)를 형상으로 분해한다. 모든 국소 좌표는 m, +Y 위이며 바닥형 가구의 원점은 바닥 접촉 중심이다. 벽에 거는 수납은 실제 고정면을 별도 part로 드러내고 배치 높이는 instances가 소유한다. 재료 이름으로 part를 합치지 않는다.

중립 배경·0.50m 눈금·카메라 축·key light는 [모델 관찰 조건](001-seating-and-work.md)을 따른다. 아래의 변종은 같은 조건에서 형태와 점유를 비교한다.

이 모델 population의 판·다리·쿠션·손잡이는 모두 고정 부품이다. 수납 문을 열어 안쪽을 검사할 때는 문을 부착 경첩 축에서 90° 회전한 별도 정지 변종을 생성하지만 사용자에게 쓰기 가능한 관절이나 중간 동작을 제공하지 않는다. 수납 침대의 두 정지 형상도 같은 외함·경첩 기준을 공유하는 선택된 상태이며 움직이는 순간을 주장하지 않는다.

prototype id는 `cabinet/<형상형>/<폭-mm>x<높이-mm>x<깊이-mm>/<문상태>`, `entry-bench`, `fixed-bed/<폭-mm>`, `murphy-bed`다. 형상형은 `open-shelf`, `two-door`, `single-door`, `base`, `wall`, `tall`, `vanity`, `nightstand`, `media`, `bench-base`, `service` 중 측판·문·받침 분할에 맞는 값을 고르고 방 이름은 넣지 않는다. 문상태는 `closed` 또는 `open`이다. 치수 토큰은 m 입력에 1000을 곱해 정수로 검사한다. `murphy-bed`는 두 선택 상태에 동일 id를 유지하고 현재 build 입력이 part 가시성을 결정한다.

## 수납장과 선반 {#cabinet-and-shelf}

공통 수납 규칙은 폭 0.50~2.90m, 높이 0.44~2.65m, 깊이 0.25~0.76m의 명시 매개변수를 받는다. 주방 하부장·상부장, 현관 신발장, 침실 옷장, 미디어장, 책장과 서비스 수납은 기능과 치수가 다른 변종으로 등록한다. 양측 측판, 상·하판, 뒤판, 사용 가능한 속공간, 0.30~0.38m 간격의 선반, 열고 닫힌 문 변종, 손잡이와 하부 받침을 갖는다. 현 `cabinet()`의 뒤판 한 장과 선반은 실제 문 틈·문틀·얕은 toe recess 없이 방 기능을 충분히 읽히게 하지 못한다. 선반의 책·수건·바구니는 별도 object와 배치 population이다.

원점은 가구 바닥 중심, +Z가 문 또는 개방 선반이 향하는 앞면이다. 내부 공간은 열린 선반에서는 정면으로, 문 달린 장에서는 문틈과 필요 시 검사 모드의 열린 문으로 읽는다. 안정 주소는 `back-exterior/interior`, `side-left/right-outer/inner`, `top-upper/underside`, `bottom-upper/underside`, `shelf-0..n-upper/edge/underside`, `door-left/right-front/back/edge`, `handle-left/right`, `toe`다. 특히 `back` 판의 앞·뒤를 같은 불명확한 재료 주소로 놓지 않는다. 판들은 닫힌 개별 부품으로 정상 normal·UV를 가지며 선반 사이 공간은 의도된 빈 곳이다. 정면·측면·45°·열린 선반 안쪽에서 문 틈·후판·선반 및 깊이를 검증한다.

## 현관 앉는 벤치 {#entry-bench}

신발장 위 벤치는 폭 1.15m, 깊이 0.48m, 전체 앉는 높이 0.52m다. 원점은 바닥 중심이고 +Z가 현관 안쪽을 향한다. [수납장](#cabinet-and-shelf)의 0.44m 하부 외함에 두께 0.08m 방석을 얹되 문 seam과 손잡이를 방석으로 가리지 않는다. 방석은 `cushion-top/side/underside`, 외함은 수납장의 안정 주소를 유지한다. 정면·측면·45°에서 신발 수납의 문과 앉는 면을 함께 확인한다. 실제 착석 하중과 문 간섭은 `unverified`다.

## 고정 침대와 침구 {#fixed-bed}

주침실 침대는 매트리스 폭 1.80m, 작은 침실 두 개는 1.00m이며 공통 길이는 2.02m다. 프레임·머리판까지 포함한 최외곽은 각 폭보다 0.08m 넓고 길이 2.18m, 높이 1.01m다. 원점은 바닥 접촉 중심, +Z가 발치이고 머리판은 −Z다. 폭을 받는 침대 prototype은 바닥에서 0.08m 뜬 네 발·낮은 프레임·매트리스, 분리된 침구·머리판·베개를 가지며 이불의 발치와 매트리스 가장자리가 화면에서 구별된다. 주침실은 베개 두 개, 작은 침대는 하나다. 현재 얇은 이불 box와 pillow ellipsoid는 봉제 덩어리의 간격 및 접힌 끝을 가진 닫힌 메시로 바꾼다.

`frame-side-left/right`, `frame-head/foot`, `leg-0..3`, `mattress-top/side`, `duvet-top/edge/underside`, `headboard-front/back/edge`, `pillow-0..1-top/edge/underside`가 안정 표면 주소다. 침구와 프레임을 같은 `white`·`oak` 문자열로 연결하지 않는다. 상부·발치·측면과 45° 관찰에서 침대 폭 변종, 머리판, 바닥 틈, 베개 수를 대조한다. 실제 누웠을 때의 인체 간격과 침구 변형은 `unverified`다.

## 작업실 수납 침대 {#murphy-bed}

작업실 가구는 폭 1.30m, 깊이 0.46m, 높이 2.36m의 고정 외함과 폭 1.10m 손님 매트리스를 같은 prototype 정체성 아래 둔다. 손님 상태의 수평 프레임은 외함 전면에서 최대 2.18m 돌출하고 폭은 1.30m 안에 든다. 외함 원점은 바닥 접촉 중심, +Z가 방 안을 향한다. 작업 상태에는 세로 닫힘 패널·손잡이·외함 깊이와 경첩 축이 보이고, 손님 상태에는 수평 침대 프레임·매트리스·바닥에 닿는 두 지지 다리가 보인다. 두 정지 형상은 같은 외함·힌지 주소를 공유하고 상태별 가시 part만 바뀐다. 실제 회전 중간 경로, 하중과 잠금 안전성은 주장하지 않는다.

공유 주소 `case-back`, `case-side-left/right`, `case-top`, `hinge-left/right`와 작업 주소 `closed-panel-front/back/edge`, `pull`, 손님 주소 `bed-frame`, `mattress`, `support-left/right`를 둔다. 닫힘 패널과 펼친 침대가 동시에 나타나지 않아야 한다. 작업실 문을 향한 45°와 측면의 두 상태를 같은 중립 카메라에서 비교하고 외함의 위치·점유가 바뀌지 않는지 검사한다. [작업실 clear cell](../spaces/002-spatial-graph.md#flex-workroom)에서 출입 원통의 실제 성립은 instance 단계가 따로 계측한다.
