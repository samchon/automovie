# 중소형 고대 지중해 시민 신전

이 production은 한 도시 구역이 공동으로 사용하는 약 430㎡ 규모의 단층 시민 신전 건축·인테리어 library다. 시간축 영상, 대사, 인물 연기, 외부 세계 지도는 납품 범위에 넣지 않는다. 다섯 레퍼런스는 표현을 위한 관찰 자료이고, 건물의 공간 그래프와 치수의 권위가 아니다.

## 납품 범위 {#delivery-scope}

납품물은 직사각형 단층 신전 외곽, 중앙 중정, 중정을 감싸는 연속 주랑, 후면 축의 작은 제실, 좌측 공동 봉헌실, 우측 일렬의 관리실·기록실·봉헌물 보관실, 후면 우측 서비스 마당, 중정 중앙의 낮은 원형 석조 수반과 한 줄기 물, 그리고 이 건물의 전체 내부 fit-out이다. 내부 fit-out에는 고정된 제단과 받침, 기록용 작업대·선반·궤, 봉헌물 진열대, 제한된 수량의 토기·바구니·램프·의자·벤치를 포함한다. 외부 도시나 지형, 사람, 실시간 물 시뮬레이션, 영상 shot은 범위 밖이다.

## 지배 목적 {#governing-aim}

이 library의 목적은 리뷰 거리에서 소규모 시민 건물의 공동 사용성, 중정 중심의 순환, 공공과 관리 기능의 차이, 그리고 제의 중심축을 한 번에 읽히게 하는 것이다. 장식의 양보다 진입에서 중정으로 곧장 이어지는 경로, 네 방향으로 열리는 주랑, 방별 문, 후면 제실의 축, 서비스 구역의 실용적 끝맺음을 우선한다.

## production visual grammar {#production-visual-grammar}

공통 시각 언어는 따뜻한 황토색 석회 플라스터, 하부의 어두운 적갈색 띠, 거친 밝은 석재 기단·문틀·기둥, 짙은 목재 문과 서까래, 낮은 붉은 테라코타 지붕, 무광 청회색 수면이다. 표면은 새로 칠한 완벽한 균질면이 아니라 손으로 만든 불균일한 플라스터와 사용 흔적을 가진다. 불균일성은 결정적 재료 파라미터와 제한된 규칙으로 만들며, 사진을 텍스처로 투영하지 않는다.

## production fidelity tier {#production-fidelity-tier}

표현의 목표는 결정적 blocking pass다. 실제 고대 유적의 복원, photorealism, 숨은 구조의 완전한 공학 해석, 입자 단위의 물, 고해상도 토기 문양은 약속하지 않는다. 약속하는 것은 단층 매스, 공간 containment와 opening, 반복 모듈의 간격, 내부 가구의 용도와 대략적 스케일, 그리고 주어진 레퍼런스의 재료·분위기 관계다. 표현하지 못하는 세부는 숨기지 않고 한계 또는 `unverified`로 남긴다.

## subject breakdown and production scope {#subject-breakdown-production-scope}

공간 owner는 건물 외곽, 주랑, 중정, 방, 문 void, 지붕·바닥·벽의 경계를 책임진다. model owner는 기둥, 문, 수반, 제단, 작업대, 선반, 궤, 토기, 램프, 벤치의 고정된 blocking prototype을 책임진다. material owner는 석재, 플라스터, 목재, 기와, 금속, 물, 토기의 construction·finish·response를 책임진다. instance owner는 주랑 기둥 열, 기와 반복, 문·가구·토기의 배치와 seed-bound variation을 책임진다. 지도·모션·시스템 owner는 현재 library가 외부 지도나 시간 기반 동작을 납품하지 않으므로 활성화하지 않는다.

## audience and operator access {#audience-operator-access}

library 사용자는 평면·단면·입면·중립 perspective와 컴파일된 building report로 건물을 읽는다. 보행 가능한 성인 한 명이 남쪽 현관에서 중정으로 진입해 주랑을 한 바퀴 돌아 모든 방의 문 앞에 설 수 있어야 한다. 주랑의 유효 폭은 1.50m 이상, 일반 실내 door clear width는 1.10m, 주출입구는 1.60m로 채택한다. 이 값은 법규 적합성 선언이 아니라 이 blocking library의 운용 조건이다.

## accessibility deliverable states {#accessibility-deliverable-states}

대체 자막·음성해설·대화형 접근성 제품은 시간 기반 audiovisual 납품이 아니므로 적용하지 않는다. 대신 공간의 접근성에 해당하는 치수·문턱·루트는 building report와 명명된 neutral observation으로 노출한다. 실제 관할 법규 인증, 휠체어 회전·경사 성능, 화재 피난 인증은 이 prototype의 납품 약속에서 제외하고 필요한 측정이 없으면 `unverified`로 기록한다.

## coordinate and unit convention {#coordinate-unit-convention}

모든 값은 metre 단위의 오른손 좌표계다. X는 서쪽에서 동쪽으로, Y는 바닥에서 위로, Z는 남쪽 현관에서 북쪽 후면으로 증가한다. 외곽 building footprint는 X=-12.00..12.00, Z=-9.00..9.00으로 두며, 바닥 기준은 Y=0.00이다. 외벽 중심선을 기준으로 한 gross footprint는 24.00m × 18.00m = 432.00㎡로, 약 430㎡ 목표 범위 안에 둔다. 서비스 마당은 건물 북동쪽에 붙는 외부 service zone으로, 본체 gross footprint에 합산하지 않는다.

## delivery review condition {#delivery-review-condition}

검토는 현재 source를 compile한 동일 revision에서 한다. 숫자·id·위치·binding·치수는 compiled topology에서 읽고, 구조 질문은 building report와 offline engine query로, 표현 질문은 현재 neutral perspective로 답한다. 대표 beauty view 하나로 전체 건물을 승인하지 않는다. 사용자 brief가 요구한 외부·개구부·방별 관찰 집합과 다섯 레퍼런스 질문이 모두 현재 source에 대해 비어 있어야 author 미완료 목록을 닫을 수 있으며, 최종 판정은 별도 읽기 전용 reviewer가 낸다.

## settings coverage map {#settings-coverage-map}

현재 settings가 직접 닫는 축은 library shape, 납품 범위, governing aim, visual grammar, fidelity ceiling, subject inventory, access profile, coordinate/unit convention, reference boundary, stage policy, review condition이다. 실제 공간 graph와 표면 소유권은 `docs/spaces`가, prototype geometry는 `docs/models`가, construction과 response는 `docs/materials`가, 반복 배치와 variation은 `docs/instances`가 닫는다. 외부 연구가 필요한 역사적 단정은 만들지 않았으므로 `docs/research`는 활성화하지 않는다.

## operative subject inventory {#operative-subject-inventory}

이 production에서 결과를 독립적으로 바꿀 수 있는 operative subject는 temple envelope, courtyard, colonnaded loop, sanctuary, communal votive room, administration room, records room, votive storage room, service yard, fountain basin and stream, column population, roof-tile population, door population, altar and plinth, records furniture, storage furniture, votive display, ceramic and basket population, lamps, benches, and the neutral observation population이다. 각 subject는 아래 design branch의 안정된 owner를 가지며, 아직 source가 없는 항목은 완료된 것으로 간주하지 않는다.

## design-dependent subject conditions {#design-dependent-subject-conditions}

공간 조건은 성인 보행자의 1.50m 주랑 통과와 1.10m 일반 door clear width, 문턱 0.08m 이하, 실내 clear height 3.60m 이상을 기준으로 한다. 반복 기둥은 통행선 밖에 서고, 가구와 봉헌물은 각 방의 중심 통행 영역을 막지 않는다. 분수는 중정의 중심을 점유하되 주랑과 방 threshold를 막지 않고, 물줄기는 낮은 수직 accent로만 표현한다. fit-out은 문·벽·바닥·천장을 숨길 정도로 밀집시키지 않으며, storage와 service의 내용은 public loop에서 읽히되 service yard를 순환 loop로 바꾸지 않는다.

## reference interpretation boundary {#reference-interpretation-boundary}

다섯 파일은 순서대로 외관, 절개 조감, 분수 중정, 제실, 기록·서비스 구역의 추가 질문으로만 사용한다. 외관 이미지는 따뜻한 stucco·기단·테라코타·낮은 지붕과 도시 스케일을, 절개 이미지는 방-주랑-중정의 관계와 내부 가구 밀도를, 분수 이미지는 기둥·목재 처마·석재 포장과 낮은 수반을, 제실 이미지는 축과 제단·창의 관계를, 기록·서비스 이미지는 문턱·목재 선반·궤·토기의 사용 밀도를 묻는다. 어떤 이미지도 실제 치수나 숨은 방을 추가하지 않는다.

