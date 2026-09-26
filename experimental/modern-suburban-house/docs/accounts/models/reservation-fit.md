# 모델 층의 예약 맞춤 산술

## 개구부와 가구 원형의 전수 예약 대조 {#model-reservation-fit}
<!--
@evidence contracts/reservation-fit.md#reservation-fit 모델 문서의 모든 H2를 순서대로 한 번씩 대조한다. 아래 표의 계산은 문서 설계 수치만 재계산한 결과이며 source 메시와 후속 instances 배치 충돌은 확인했다고 주장하지 않는다.
-->

[원문 계약](../../contracts/reservation-fit.md#reservation-fit)에 따라 모델 H2를 빠짐없이 아래에 열거한다. 계산의 등호와 부등호는 링크된 H2의 본문 수치 및 그 H2가 인용한 예약으로 재현할 수 있다. `규칙`·`면 계약`·`표현 범위`·`검증 절차` H2는 새 점유를 만들지 않으므로 같은 원형의 부피를 다시 세지 않았다. `unverified`는 source 또는 instances가 아직 없어 실제 메시 충돌을 잴 수 없는 항목이다.

| 모델 H2 | 예약 산술 또는 새 점유가 없는 이유 |
|---|---|
| [model-local-frame](../../models/00-model-frame.md#model-local-frame) | 규칙 H2; 외곽을 만들지 않고 개구부별 transform을 spaces에서 받는다. |
| [model-furniture-local-frame](../../models/00-model-frame.md#model-furniture-local-frame) | 규칙 H2; 원점과 축만 정하며 가구 점유는 각 원형 행에서 검사한다. |
| [model-reference-scale](../../models/00-model-frame.md#model-reference-scale) | 규칙 H2; 사람 폭 0.60 m와 문 유효폭 0.80 m 기준을 선언한다. |
| [model-representation-ceiling](../../models/00-model-frame.md#model-representation-ceiling) | 규칙 H2; 별도 부재의 표현 범위이며 점유 상자는 없다. |
| [model-surface-partition-naming](../../models/00-model-frame.md#model-surface-partition-naming) | 규칙 H2; 면 id 계약이며 물리 점유는 없다. |
| [model-representation-completion](../../models/00-model-frame.md#model-representation-completion) | 검증 절차 H2; source 메시 검사는 modelSources 개설 전 unverified. |
| [model-review-set](../../models/00-model-frame.md#model-review-set) | 검증 절차 H2; 1536×1024·FOV 45°는 카메라 조건이다. |
| [window-local-frame](../../models/01-windows.md#window-local-frame) | 12개 창의 외곽은 각 거친 개구부와 같고 깊이 0.14 = 0.18−0.04 m다. |
| [window-member-sizes](../../models/01-windows.md#window-member-sizes) | 최소 0.78 m 계단창 유효 유리폭 0.78−0.12−0.10 = 0.56 m ≥ 0.30 m. |
| [window-muntin-grid](../../models/01-windows.md#window-muntin-grid) | 각 투명 sash 2×2; 살대 깊이 0.01 m는 유리를 관통하지 않는다. |
| [double-hung-window](../../models/01-windows.md#double-hung-window) | upper/lower 두 sash의 깊이 간격 0.02 m ≤ 0.14 m frame 깊이. |
| [fixed-window](../../models/01-windows.md#fixed-window) | 계단 1칸·차고 2칸의 sash는 거친 창 외곽 안; 가동 점유 없음. |
| [awning-window](../../models/01-windows.md#awning-window) | 0.63 sin(π/8) = 0.2411 m 바깥 회전 돌출 ≤ right.md#tub-right-window의 0.25 m 예약; 여유 0.0089 m, 기준 닫힘 0. |
| [window-sill-trim](../../models/01-windows.md#window-sill-trim) | 창대 -0.18→-0.31 = 0.13 m, 실내 마감 -0.25 기준 돌출 0.06 m; 길이 W+2×0.07 m가 문선 두 발을 받는다. 구조 날씨 면에서 trim 0.035−siding butt 0.030 = 0.005 m 앞섬. |
| [window-surface-partitions](../../models/01-windows.md#window-surface-partitions) | 면 계약 H2; window-local-frame과 window-sill-trim 점유를 재사용하고 새 부재 없음. |
| [window-fidelity](../../models/01-windows.md#window-fidelity) | 표현 범위 H2; 새 점유 없음, 캡처 판정 unverified. |
| [front-entry-door](../../models/02-exterior-doors.md#front-entry-door) | 유효폭 1.00−2×0.03−0.04 = 0.90 m; 문턱 +0.02 뒤 문짝 하단 +0.03, 상단 2.17, 높이 2.14 m. 개구부 밖 trim·casing은 Y=0 바닥에서 시작해 폭 안 문턱판과 겹치지 않고 구조 날씨 면 기준 trim 0.035 m는 siding 0.030 m보다 앞선다. |
| [garage-sectional-door](../../models/02-exterior-doors.md#garage-sectional-door) | 유효폭 5.00−2×0.10 = 4.80 m; 문짝 높이 2.00−(−0.15) = 2.15 m; 상부 가이드 2.15–2.50 m. |
| [garden-door-pair](../../models/02-exterior-doors.md#garden-door-pair) | 주 문 1.20−0.03−0.04 = 1.13 m, 손잡이 뒤 1.07 ≥ 0.95 m; 회전 1.17 ≤ 1.80 m; 문짝 하단 +0.03. 개구부 밖 trim·casing Y=0은 테라스·공용부 바닥에 닿고 문턱판은 개구부 안 Y=0.02다. |
| [side-yard-gate](../../models/02-exterior-doors.md#side-yard-gate) | 판 폭 8×0.14+7×0.008+2×0.002 = 1.18 m; 순폭 1.20−0.04−0.05 = 1.11 ≥ 1.05 m. |
| [exterior-door-surfaces](../../models/02-exterior-doors.md#exterior-door-surfaces) | 면 계약 H2; 문턱은 spaces, 문짝은 위 네 원형이 맡아 점유 중복 0으로 설계됨. |
| [exterior-door-fidelity](../../models/02-exterior-doors.md#exterior-door-fidelity) | 표현 범위 H2; 추가 스프링·모터 점유 없음, 레일 실제 충돌은 unverified. |
| [interior-door-members](../../models/03-interior-doors.md#interior-door-members) | 11개 문의 순폭은 거친 폭−2×0.03−0.04 = 거친 폭−0.10 m; 문짝 높이 2.20−0.03−0.01 = 2.16 m. 팬트리 문은 문설주 0.03+문짝 0.04+파인 손잡이 0 = 0.07 ≤ 부모 작동 예약 0.08 m다. 옷방문 열린 손잡이는 종전 0.055에서 0.030 m로 줄여 부모 Z≥−0.20 m를 지키고, 세탁실 두 문은 파인 손잡이로 횡단 띠 Z≤−3.42 m를 비운다. 세탁실–차고 문선 세로 판은 X=[5.485,5.50]·Z=[−3.35,−3.28]·Y=[0,2.20] m, 머리 판은 같은 X/Z·Y=[2.20,2.27] m다. |
| [interior-door-hinges](../../models/03-interior-doors.md#interior-door-hinges) | [문선·기준 열림 생산자](../../../src/measurements/casing-space-scan.cjs)는 source 개구부 11개와 이 H2의 표 11행을 결합해 π/2 열림 문짝 외곽 11개를 계산한다. source 방 윤곽 11/11 포함, 같은 방 route 교차 0, 가구·설비·수납 예약 교차 0(`npm run check`, door-casing 과제). 문짝·손잡이의 중간 회전 sweep와 아직 없는 실제 model mesh는 unverified다. |
| [interior-door-surfaces](../../models/03-interior-doors.md#interior-door-surfaces) | 면 계약 H2; jamb-a/b/core는 한 개구부 챌면을 분할하고 추가 점유 없음. |
| [interior-door-fidelity](../../models/03-interior-doors.md#interior-door-fidelity) | 표현 범위 H2; 차고 단차는 laundry의 바닥 datum, 모델 문턱 0개. |
| [stair-balusters](../../models/04-stair-members.md#stair-balusters) | 난간살 0.02 ≤ 0.075 m 예약; n=ceil((L−0.10)/0.12), 빈 간격 (L−0.02n)/(n+1) ≤ 0.10 m는 각 입력 L에서 재계산한다. |
| [stair-bottom-member](../../models/04-stair-members.md#stair-bottom-member) | 복도 빈 아래 높이 0.05 ≤ 0.10 m; flight는 디딤에 직접 닿는다. |
| [stair-side-skirt](../../models/04-stair-members.md#stair-side-skirt) | 아래 판은 연결판의 Z=−3.395 면에서, 위 판은 X=−0.635 면에서 접해 0.015×0.015 m 연결판과 체적 교집합 0이다. 위 판의 `Xc=−0.65+(2.75−1.46)×0.28/0.17=1.474705882` m에서 상단 Y=2.75 m로 끝나 reviewed `stair-opening-edge-front`의 Y≥2.75 m 부피와 교집합 0이다. 0.015 m 외측 판은 계단 안쪽 난간 0.075 m 예약을 쓰지 않는다. 방 쪽 실제 순폭은 unverified다. |
| [stair-member-surfaces](../../models/04-stair-members.md#stair-member-surfaces) | 면 계약 H2; baluster·bottom-rail만 models, 기둥·손잡이는 spaces. |
| [stair-member-fidelity](../../models/04-stair-members.md#stair-member-fidelity) | 표현 범위 H2; 새 점유 없음, 하중·법규 검증은 unverified. |
| [coat-closet-doors](../../models/05-closet-fittings.md#coat-closet-doors) | 두 트랙 깊이 [0.07,0.10]·[0.11,0.14] ⊂ [0,0.15] m; 문 폭 0.50×2−겹침 0.05 = 거친 폭 0.95 m. 세 문선 판은 개구부 바깥 Z 폭과 Y≥2.15 m의 머리띠만 쓰고 통로 끝 X=2.035 < 2.07 m다. |
| [coat-closet-rod-shelf](../../models/05-closet-fittings.md#coat-closet-rod-shelf) | 봉 몸통 뒤면+0.325 ≤ 0.65 m, 선반 깊이 0.65 m; 계단 아래면에선 절단한다. |
| [linen-closet-fittings](../../models/05-closet-fittings.md#linen-closet-fittings) | 문 폭 2×0.525−0.05 = 1.00 m; 선반 0.55 m·문과 간격 0.05 m, 선반 5단. 문선은 개구부 X 바깥과 상단 Y≥2.20 m에만 두어 문·레일과 부피 교집합 0이다. |
| [closet-fitting-surfaces](../../models/05-closet-fittings.md#closet-fitting-surfaces) | 면 계약 H2; 수납 개구부 2개는 위 원형만 채우고 spaces는 void만 둔다. |
| [closet-fitting-fidelity](../../models/05-closet-fittings.md#closet-fitting-fidelity) | 표현 범위 H2; 수건·용기 형상은 18·12 H2에서 따로 센다. |
| [wall-baseboard](../../models/06-interior-trim.md#wall-baseboard) | 높이 0.10 m·돌출 0.015 m; 1.05−2×0.015 = 1.02 ≥ 0.90 m. 실제 문선·계단·타일 벽에서 종단하고 벽 앞 옷장·주방 하부장 뒤에서는 이어 간다. 가구 뒤 또는 옆 접촉면의 Y=[0,0.10]·깊이 0.015 m 빈 띠와의 부피 교집합은 각 해당 행에서 따로 센다. |
| [kitchen-base-run](../../models/10-kitchen-dining.md#kitchen-base-run) | 깊이 0.60+0.02+0.02 = 0.64 ≤ 0.65 m, 상판 0.91 m; 길이 3.35→6칸, 1.30→2칸, 0.30→1칸. `plinth` 뒤 Z=[0,0.015]와 직교 벽 옆 X 끝 0.015 m·Y≤0.10 m를 비워 걸레받이와 체적 교집합 0이다. 앞면 Z=0.62−0.07=0.55 m. |
| [kitchen-wall-cabinet](../../models/10-kitchen-dining.md#kitchen-wall-cabinet) | 깊이 0.31+0.02+0.02 = 0.35 m; 아래 1.45, 위 2.35 m로 높이 0.90 m. |
| [kitchen-refrigerator](../../models/10-kitchen-dining.md#kitchen-refrigerator) | 폭 2×0.47+0.005+2×0.0025 = 0.95 m; 깊이 0.72+0.05+0.03 = 0.80; 문 0.50 ≤ 작동 0.55 m. 뒤 하단 0.015×0.10 m만 파내므로 전면·문 피벗과 예약 외곽은 불변이다. |
| [kitchen-range](../../models/10-kitchen-dining.md#kitchen-range) | 오븐 열림 0.52+파인 손잡이 0 = 0.52 ≤ 작동 예약 0.55 m; 닫힌 깊이 0.65 m ≤ 외곽 예약 0.65 m. 조리면 0.91 m, 4화구. 뒤 하단 0.015×0.10 m 홈은 전면 작동치를 바꾸지 않는다. |
| [kitchen-microwave](../../models/10-kitchen-dining.md#kitchen-microwave) | 전면 0.58+0.22 = 폭 0.80 m; 아래 1.45·위 1.85로 높이 0.40 m. |
| [kitchen-island](../../models/10-kitchen-dining.md#kitchen-island) | 2.25×1.05×0.91 m; 몸통 0.71+전면 0.02+손잡이 0.02+좌석 무릎 0.30 = 1.05 m로 외곽 예약과 같다. 싱크 0.50×0.50 m는 상판과 그 아래 몸통 Y=[0.71,0.88] m에서 모두 빠져 볼 외면과 몸통의 교집합 0이다. |
| [kitchen-dishwasher](../../models/10-kitchen-dining.md#kitchen-dishwasher) | 문 열림 0.60 = 작동 예약 0.60 m, 돌출 손잡이 0; 위끝 0.88 = 섬 상판 아랫면. |
| [kitchen-island-stool](../../models/10-kitchen-dining.md#kitchen-island-stool) | 좌면 0.64 m, 섬 0.91와 차 0.27 m; 폭 0.44 ≤ 좌석 사용폭 0.65 m. |
| [dining-table](../../models/10-kitchen-dining.md#dining-table) | 1.70×0.90×0.75 m; 긴변 좌석 사람 X폭 0.60과 모서리 다리는 접하기만 함; 무릎 아래 0.635 m. |
| [dining-chair](../../models/10-kitchen-dining.md#dining-chair) | 0.45×0.50×0.85 m; 좌면 0.45와 상판 0.75 차 0.30 m; 살대 4×0.035+5×0.048 = 0.38 m. |
| [fabric-sofa](../../models/11-living.md#fabric-sofa) | 2.10−2×0.15 = 1.80 m; 쿠션 3×0.596+2×0.006 = 1.800 m; 좌면 0.43 m. 두 배치의 뒤 발 Z≥0.015 m, 받침 아래 Y≤0.10 m의 Z≥0.015 m라 걸레받이와 겹침 0, 앞 외곽 0.95 m 불변. |
| [low-table](../../models/11-living.md#low-table) | 거실 1.30×0.50 m, 가족실 1.10×0.55 m; 상면 둘 다 0.42 m. |
| [reading-armchair](../../models/11-living.md#reading-armchair) | 0.85×0.85×0.90 m 외곽; 팔걸이 빼고 좌석 0.85−2×0.12 = 0.61 m. |
| [dark-bookcase](../../models/11-living.md#dark-bookcase) | 폭 1.00−2×0.02 = 0.96 m; 책 묶음 0.745–0.755 m로 내부의 77.6–78.6%. 뒤판 시작 Y=0.10, 옆판·plinth 뒤 하단 Z≥0.015 m여서 벽 걸레받이와 겹침 0, 외곽 깊이 0.35 m 불변. |
| [floor-covering](../../models/11-living.md#floor-covering) | 거실 2.35×2.00×0.008 m, 가족실 1.70×1.55×0.008 m(X=[3.00,4.55], Z=[-8.55,-6.85], 오른쪽 통로 5.50−4.55=0.95 m), 현관 0.90×0.65×0.006; 침대 변형은 bed L/W+0.30 m. |
| [fireplace-insert-mantel](../../models/11-living.md#fireplace-insert-mantel) | 화구 void 1.04×0.64×0.55 m에 0.025 m 판; 선반 1.60×0.55×0.10 m가 벽돌 상단 Y 1.30에 닿는다. |
| [laundry-machine](../../models/12-service-rooms.md#laundry-machine) | 깊이 0.72+문·손잡이 0.03 = 0.75 m; 회전 돌출 0.45+0.03 = 0.48 ≤ 0.50 m. 두 기기 뒤 하단 0.015×0.10 m 홈, 건조기 앞벽 쪽 옆 하단 0.015×0.10 m 홈으로 걸레받이 체적 교집합 0이다. 세탁기 차고 문선 쪽은 X=[5.485,5.50]·Z=[−3.35,−3.28]·Y=[0.10,0.88] m를 비워 문선과 교집합 0; 두 0.65 m 폭과 앞 작동 한계는 불변. |
| [laundry-folding-top](../../models/12-service-rooms.md#laundry-folding-top) | 상판 위 0.94−기기 위 0.88 = 두께 0.06 m; 앞 다리·옆판 0. X=[5.485,5.50]·Z=[−3.35,−3.28]·Y=[0.88,0.94] m 문선 체적을 빼고 `top`·`cleat` 끝면으로 닫아 교집합 0. |
| [laundry-upper-storage](../../models/12-service-rooms.md#laundry-upper-storage) | 깊이 0.28+문 0.02 = 0.30 m; 상판 위 0.94→장 아래 1.50의 작업 틈 0.56 m. X=[5.485,5.50]·Z=[−3.35,−3.28]·Y=[1.50,2.27] m 문선 세로·머리 판 합집합을 몸통·문에서 빼므로 예약 안 외곽을 유지하고 문선과 교집합 0이다. |
| [mudroom-bench](../../models/12-service-rooms.md#mudroom-bench) | 0.80×0.40×0.45 m; 신발 선반 상면 0.10, 좌면까지 0.35 m. 뒤 하단 0.015×0.10 m와 앞벽 쪽 국소 −X 옆판·선반의 0.015×0.10 m를 각각 비워 두 걸레받이 run과 교집합 0, 앞 0.40 m 외곽 불변. |
| [mudroom-coat-hooks](../../models/12-service-rooms.md#mudroom-coat-hooks) | 두 외투 폭구간 [-0.40,-0.10]·[0.10,0.40], 간격 0.20 m; 벤치 위 하단 1.10−0.45 = 0.65 m. |
| [pantry-l-shelf](../../models/12-service-rooms.md#pantry-l-shelf) | 뒤 깊이 0.25·옆 깊이 0.30 m, 코너는 합집합 1판×5단; 상면 0.20+0.40k (k=0…4). 각 판과 받침에서 문선과 겹치는 X=[3.22,3.235]·Z=[−5.82,−5.80] m를 빼고 남은 판은 부모 선반 예약 안이다. |
| [pantry-containers](../../models/12-service-rooms.md#pantry-containers) | 용기 0.12×0.12×0.20, 상자 0.18×0.18×0.25, 바구니 0.30×0.20×0.15 m; 모두 높이 ≤0.30 m. |
| [garage-shelving](../../models/12-service-rooms.md#garage-shelving) | 1.70×0.60×2.05 m; 상자 깊이 0.35 ≤ 0.60, 상자 위 0.28 < 다음 선반 간격 0.40 m. 뒤 기둥의 Z=[−6.45,−6.435]·Y=[−0.15,−0.05] m를 빼 차고 걸레받이와 교집합 0이다. |
| [garage-workbench](../../models/12-service-rooms.md#garage-workbench) | 상면은 차고 바닥 위 0.90 m; 서랍 인출 0.45+오목 손잡이 돌출 0 = 작동 예약 0.45 m. 뒤 다리 Z 최후면 −6.430 m는 걸레받이 앞면 −6.435 m보다 0.005 m 앞에서 멈춘다. |
| [garage-tool-board](../../models/12-service-rooms.md#garage-tool-board) | 1.20×1.00×0.15 m; 공구 최대 전면 돌출 0.13+판 0.02 = 0.15 m. |
| [headboard-bed](../../models/13-bedrooms.md#headboard-bed) | 주침실 L 2.15·W 1.60·H 0.60·B 1.00 m; 작은 방 둘 L 2.15·W 1.15·H 0.55·B 0.95. |
| [nightstand-lamp](../../models/13-bedrooms.md#nightstand-lamp) | 주침실 S 0.50·T 0.55·U 1.10 m, 작은 방 S 0.45·T 0.50·U 1.05; 갓 지름 0.25 < S. |
| [low-dresser](../../models/13-bedrooms.md#low-dresser) | 1.40×0.50×0.80 m; 서랍 최대 0.40 = 예약 0.40 m, 홈 손잡이 돌출 0. 뒤판 시작 Y=0.10 m·뒤 발 Z≥0.015 m여서 걸레받이와 겹침 0, 서랍 작동 한계 불변. |
| [child-desk](../../models/13-bedrooms.md#child-desk) | L 1.20 또는 1.15, 깊이 0.60·상면 0.75 m; 소품 최고 0.18 m가 뒤쪽 0.25 m 안. 두 뒤 발 Z≥0.015 m, 뒤 상부는 Y>0.10 m라 걸레받이와 겹침 0, 의자 사용면 불변. |
| [desk-chair](../../models/13-bedrooms.md#desk-chair) | 0.45×0.48×0.82 m 원형은 0.75×0.75 m 사용 예약보다 각 방향 작다. |
| [sliding-closet](../../models/13-bedrooms.md#sliding-closet) | 1.50×0.60×2.20 m; 문 2×0.76−0.02 = 1.50 m, 양 문 이동 0.72 m는 몸통 안. 벽 앞 상자 뒤 하단 Z=[0,0.015]·Y=[0,0.10] m 홈으로 연속 걸레받이와 교집합 0. 뒤판은 Z=[0,0.02], 옆판·바닥판·상판은 Z=[0.02,0.49] m이며 수평판 X=[−0.73,0.73] m는 양옆 0.02 m 판 사이만 채우므로 몸통 다섯 판은 공통 부피가 없다. 몸통 앞끝 Z=0.49 < 뒤 레일 시작 0.50 m라 문·레일과 부피 교집합 0이다. 문선은 Z=[0.57,0.60] m에 있어 문짝 Z≤0.57 m와 부피를 공유하지 않는다. |
| [primary-window-curtains](../../models/13-bedrooms.md#primary-window-curtains) | 여덟 창 W=2.40/1.60/2.80/1.20/2.00/1.70/2.10/2.10 m에 봉 W+0.20, 모인 두 폭 2×0.18; 돌출 0.083+0.020+0.003 = 0.106 ≤ 0.12 m; 봉·천 최고점은 개구부 위 0.10+0.0125+0.006 = 0.1185 ≤ 두 예약의 상한 0.12 m. |
| [wardrobe-hanging](../../models/13-bedrooms.md#wardrobe-hanging) | 36벌 두께 합 1.44 m ≤ 두 옆판 사이 실제 봉 4.22−2.13 = 2.09 m; 좌우 남음 (2.09−1.44)/2 = 0.325 m. 판의 뒤 하단 0.015×0.10 m 홈으로 뒤벽 걸레받이와 교집합 0. |
| [wardrobe-shelves](../../models/13-bedrooms.md#wardrobe-shelves) | 두 더미+용기+간격 2×0.28+0.30+2×0.02 = 0.90 ≤ 안쪽 선반 길이 5.47−4.43 = 1.04 m, 양끝 0.07 m. 옆판 뒤 하단 0.015×0.10 m 홈으로 걸레받이와 교집합 0. |
| [shared-toilet](../../models/14-bathrooms.md#shared-toilet) | 폭 0.50 ≤ 최소 예약 0.65 m, 양옆 0.075 m; 좌면 0.43·최고 0.82 m. |
| [vanity-basin](../../models/14-bathrooms.md#vanity-basin) | W 0.60/0.70/0.85, D 0.45/0.55/0.55 m; 0.70=2×0.32+3×0.02, 0.85=2×0.395+3×0.02. |
| [wall-mirror](../../models/14-bathrooms.md#wall-mirror) | 돌출 0.04 m, 아래 1.10−세면 상면 0.85 = 0.25 m; 폭은 각 세면장 W. |
| [towel-bar](../../models/14-bathrooms.md#towel-bar) | 벽 앞면 0.04+봉반지름 0.01+수건 0.03 = 0.08 m; 폭은 각 방 0.25/0.50/0.75. |
| [sliding-shower-booth](../../models/14-bathrooms.md#sliding-shower-booth) | 앞면 3×0.43−2×0.02 = 1.25 m, 열린 순폭 1.25−0.43−0.02 = 0.80 m. |
| [bathtub](../../models/14-bathrooms.md#bathtub) | 외곽 0.80×1.80×0.55 m; 가장자리 0.06, 바닥 위 내부 최저 0.15 m. |
| [tub-curtain-rail](../../models/14-bathrooms.md#tub-curtain-rail) | 레일 길이 1.80 m = reviewed 욕조 예약 Z=[−8.70,−6.90] m의 길이; 뒤쪽 0.10 m 벽 간격에는 부재가 없다. 커튼 펼침 1.80 m·걷힘 0.25 m, 법선 ±0.02 ⊂ 예약 폭 0.10 m. |
| [bath-floor-mats](../../models/14-bathrooms.md#bath-floor-mats) | 샤워 매트 0.65×0.45 ⊂ 0.90×0.60 m; 욕조 매트 0.80×0.45 ⊂ 1.05×1.55 m. |
| [shower-niche-bottles](../../models/14-bathrooms.md#shower-niche-bottles) | 벽감 0.40 m 길이에 세 병 0.06+0.07+0.055+2×0.025 = 0.235 m; 양끝 여유 0.0825 m, 깊이 0.08 m. |
| [terrace-table](../../models/15-outdoor.md#terrace-table) | 상판 폭 6×0.125+5×0.01 = 0.80 m; 긴변 좌석 구간 [-0.65,-0.05]·[0.05,0.65], 다리 X 구간 [-0.70,-0.65]·[0.65,0.70]이라 무릎 폭과 내부 겹침 0. 상면 0.74 m. |
| [terrace-chair](../../models/15-outdoor.md#terrace-chair) | 좌판 깊이 4×0.13+3×0.01 = 0.55 m; 꺼낸 뒤끝 0.40+0.30+0.55 = 1.25 ≤ 1.35 m. |
| [lap-siding-board](../../models/15-outdoor.md#lap-siding-board) | 판 높이 0.18−겹침 0.03 = 노출 0.15 m; 길이 L은 입면과 개구부 절단에서 받는다. |
| [exterior-corner-trim](../../models/15-outdoor.md#exterior-corner-trim) | 외벽 두 날씨 면의 교선에서 각 날개 폭 0.075 m·바깥 돌출/두께 0.035 m; siding butt 최대 0.030 m보다 0.005 m 앞선다. 사이딩 절단 끝은 trim의 안쪽 면에 맞대며 구조 벽을 침범하지 않는다. 시작·끝 높이는 노출 외벽과 처마/박공 경계에서 받는다. 실제 모서리별 충돌은 modelSources·instances 뒤 검사. |
| [asphalt-shingle-strip](../../models/15-outdoor.md#asphalt-shingle-strip) | 줄 길이 3×0.330+2×0.005 = 1.00 m; 높이 0.30−겹침 0.16 = 노출 0.14 m. 골짜기 양쪽 절단 물림 0.05 m씩으로 중앙 노출 금속 폭 0.10 m, 금속 각 면 폭 0.10 m 중 바깥 0.05 m씩은 지붕널 아래다. 굴뚝 금속은 지붕 위 0.12 m·벽돌 위 0.08 m로 공유 접면에 닿는다. |
| [eave-gutter-downspout](../../models/15-outdoor.md#eave-gutter-downspout) | 홈통 단면 0.12×0.08 m; 선홈통 0.08×0.06 m·벽 이격 0.02; 길이는 처마·지표 입력에서 계산, 실제 충돌은 unverified. |
| [site-tree-prototypes](../../models/16-planting.md#site-tree-prototypes) | 성목 H 8.00·R 3.00 m, 뒤 나무 H 6.00·R 2.00; 배치 충돌은 instances 개설 후 검사. |
| [site-shrub-prototype](../../models/16-planting.md#site-shrub-prototype) | 반지름 0.27+0.18 = 0.45 m, 지름 0.90·높이 0.80; 배치 충돌은 instances 검사. |
| [flush-ceiling-fixture](../../models/17-light-fixtures.md#flush-ceiling-fixture) | 일반 D 0.24·차고 D 0.40 m, 천장 아래 최대 0.05 m; 방별 수는 systems 입력. |
| [pendant-fixtures](../../models/17-light-fixtures.md#pendant-fixtures) | 섬 갓 지름 0.28·내림 0.80 m, 식탁 갓 0.48·내림 1.20; 아래면은 상판 위 각각 1.04/0.80 m. |
| [vanity-wall-fixture](../../models/17-light-fixtures.md#vanity-wall-fixture) | 벽 돌출 0.08 ≤ systems 상한 0.10 m, 확산봉 길이 0.31 = 0.36−2×0.025 m. |
| [porch-wall-sconce](../../models/17-light-fixtures.md#porch-wall-sconce) | 앞 돌출 0.015+0.015+0.14=0.17 m, 갓 높이 0.20 m; 포치 유효 깊이 1.80 m에서 벽등 앞 잔여 1.63 m이고 문은 실내로 열려 회전과 분리. |
| [porch-mat-planter](../../models/18-house-props.md#porch-mat-planter) | 발판 0.60×0.40×0.008 m, 화분 높이 ≤0.72 m; 포치 보행폭과 충돌은 instance 배치 뒤 검사. |
| [kitchen-food-utensils](../../models/18-house-props.md#kitchen-food-utensils) | 도마 0.35×0.25 m, 도구 5개 높이 ≤0.38, 식탁 그릇 지름 0.28·과일 5개. |
| [linen-folded-towels](../../models/18-house-props.md#linen-folded-towels) | 선반마다 3×0.28+2×0.02 = 0.88 ≤ 린넨장 선반 1.20 m; 양끝 0.16 m씩 남고 앞 여유 0.55−0.05−0.32 = 0.18 m; 5×3×2 = 30장. |
| [living-tabletop-props](../../models/19-room-accents.md#living-tabletop-props) | 책 0.22×0.16, 쟁반 0.24×0.18, 꽃병 높이 0.12+줄기 0.12+꽃 지름 0.04 = 0.28 m. |
| [wall-art-indoor-plant](../../models/19-room-accents.md#wall-art-indoor-plant) | 액자 0.50×0.35 또는 0.60×0.40·깊이 0.025 m, 작은 식물 높이 0.17+0.22+0.16−0.03 = 0.52 m. |
| [sofa-throws](../../models/19-room-accents.md#sofa-throws) | 쿠션 둘 0.42×0.42×0.10, 담요 0.65×0.45×0.025 m; 소파 외곽 2.10×0.95 m 안의 host 배치 필요. |

문서 산술을 실제 메시 점유로 재검사하는 일은 modelSources·instanceSources의 산출물이 생긴 뒤 수행한다. 이 표만으로 렌더나 배치 간섭을 통과했다고 주장하지 않는다.
