# 가구·설비 개체의 배치 기준

## 방 예약 구역에서 도출하는 구성원과 식별자 {#reservation-derived-membership}
<!--
@evidence obligations/core/common.md#purpose-fit 00은 예약에서 개체를 만드는 규칙·변환·충전 검사를, 01–03은 실제 방의 개별 배치를, 04는 창과 출입문 충전을 맡는다. 이 분할이 없으면 같은 방의 개체 id와 원형·위치의 소유자가 정해지지 않는다.
@evidence obligations/core/common.md#layer-boundary 다섯 배치 문서는 이미 models가 정한 형상과 materials의 면 응답을 바꾸지 않고 공간 예약에서 id·원점·회전·구성원만 정한다. 문짝 형상은 04의 배치 값으로 새로 만들지 않는다.
@evidence obligations/core/common.md#production-language 구성원·원점·천장 접점과 검토 조건은 한국어로 적고 예약 id·모델 표면 id·좌표 단위는 source와 같은 정확한 기술 식별자로 유지한다.
@evidence obligations/core/common.md#proportionate-development 개구부는 04의 서로 다른 창·문 규칙, 실내 고정 조명은 별도 25개 구성원 규칙, 가구·설비는 01–03의 방별 독립 배치로 나누었다. 주방과 침실·욕실의 개별 작동/사용 점유를 통로·수납의 공통 변환 뒤에 숨기지 않는다.
@evidence principles/core/common.md#scope-preservation 방 예약과 가구·설비 구성원의 대응의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion furniture·fixture·storage·covering 예약마다 id가 같은 개체 하나를 만든다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 rooms 예약 레코드와 reservation-fill 계약이다. 그 위에서 이 H2가 방 예약과 가구·설비 구성원의 대응의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 rooms 예약 레코드와 reservation-fill 계약이고, 이 H2는 furniture·fixture·storage·covering 예약마다 id가 같은 개체 하나를 만든다.
@evidence principles/design/instances.md#instance-prototype-boundary 방 예약은 이미 검토한 models 원형에만 결합한다. 예약 id에서 새 형상이나 임의 표면을 만들지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 방 예약과 가구·설비 구성원의 대응의 id와 위치는 본문의 한 입력 규칙에서 산출한다. furniture·fixture·storage·covering 예약마다 id가 같은 개체 하나를 만든다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 예약 id 중 미충전 하나 또는 예약 없는 개체 하나이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work rooms 예약 레코드와 reservation-fill 계약을 실제 방 예약과 가구·설비 구성원의 대응와 예약 id 중 미충전 하나 또는 예약 없는 개체 하나에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence obligations/design/instances.md#instance-prototype-membership furniture·fixture·storage·covering 예약 id마다 하나의 개체를 만들고 pantry L 선반의 두 예약 합집합만 이름으로 예외 처리한다.
@evidence obligations/design/instances.md#addressable-instance-decisions 방마다 독립 배치 H2를 두고 이 H2는 전체 집합의 생성 규칙만 소유한다.
@evidence contracts/reservation-fill.md#reservation-fill 예약 id와 배치 id의 일대일 비교를 전체 방 집합의 기본 membership 규칙으로 둔다.
@evidence spaces/rooms/common.md#common-room-plan 방 설계의 기준을 reservation-derived-membership의 방 예약과 가구·설비 구성원의 대응에 소비한다.
@evidenceExclude settings/00-production.md#accessibility `accessibility`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidence settings/00-production.md#coverage-map `coverage-map`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence settings/00-production.md#delivery-scope `delivery-scope`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence settings/00-production.md#governing-aim `governing-aim`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence settings/00-production.md#operative-subjects `operative-subjects`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidenceExclude settings/00-production.md#operator-access `operator-access`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude settings/00-production.md#working-language `working-language`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
-->

가구·설비 개체의 구성원은 [방 설계](../spaces/rooms/common.md#common-room-plan)가 남긴 `kind`가 furniture·fixture·storage·covering인 예약 구역 하나마다 정확히 한 개체다. 개체 id는 예약 id를 그대로 쓰고(예: `common-dining-table`), 의자·스툴처럼 use 구역에 서는 개체는 use 구역 id에서 `-use`를 뗀 이름을 쓴다(예: `common-island-stool-1`). 구성원 목록은 src/spaces/rooms/*.ts의 `reservations` 레코드와 이 H2의 규칙에서만 도출하며 문서에 별도의 좌표 표를 두지 않는다. 방 문서가 예약을 추가·삭제하면 개체도 같은 이름으로 생기거나 사라지고, 예약 없는 가구는 만들지 않는다. route·swing 구역과 사람만 쓰는 use 구역은 개체를 받지 않는다. 여러 예약을 한 모델의 부재가 채우는 경우는 해당 방 H2가 예약 id와 원형을 모두 이름으로 선언하고 예약→개체 관계를 다대일로 기록한다. 이 예외는 팬트리 L형 선반, 주방 섬의 싱크, 샤워부스의 수전·헤드, 차고문의 레일에만 적용한다. 원형(prototype)의 형상은 models branch가 소유하며 각 방 H2가 구성원마다 그 models H2를 링크한다. 이 대응의 계약은 [방 예약과 개체의 일대일 대응](../contracts/reservation-fill.md#reservation-fill)이다. source owner는 src/instances/ 아래 배치 모듈이고, 관찰은 모든 예약 id가 한 개체를 가지는지와 예약 없는 개체가 없는지를 대조한다.

## 월드 변환과 방향 규칙 {#placement-transform-rule}
<!--
@evidence principles/core/common.md#scope-preservation 가구의 world p·yaw·scale 규칙의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 원형 원점 유형에 따라 예약 중심 또는 벽쪽 변을 p로 쓰고 scale 1을 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 좌표 settings와 모델 local +Z·원점이다. 그 위에서 이 H2가 가구의 world p·yaw·scale 규칙의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 좌표 settings와 모델 local +Z·원점이고, 이 H2는 원형 원점 유형에 따라 예약 중심 또는 벽쪽 변을 p로 쓰고 scale 1을 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary 원형의 local 원점과 +Z 앞면을 받은 뒤 예약에서 강체 변환만 계산한다. 크기 차이는 models 선언 매개변수로 제한한다.
@evidence principles/design/instances.md#instance-derivation-authority 가구의 world p·yaw·scale 규칙의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 원형 원점 유형에 따라 예약 중심 또는 벽쪽 변을 p로 쓰고 scale 1을 둔다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 벽걸이 하나의 Y 오차 또는 반대쪽 use 방향이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 좌표 settings와 모델 local +Z·원점을 실제 가구의 world p·yaw·scale 규칙와 벽걸이 하나의 Y 오차 또는 반대쪽 use 방향에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence obligations/design/instances.md#instance-identity-transform local 원점 유형에 따라 예약 중심·벽쪽 변을 world p로 삼고 yaw를 네 방향의 rad 값으로 고정한다.
@evidence settings/00-production.md#coordinate-units 설정의 좌표의 기준을 placement-transform-rule의 가구의 world p·yaw·scale 규칙에 소비한다.
@evidence models/00-model-frame.md#model-furniture-local-frame `model-furniture-local-frame`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidence models/00-model-frame.md#model-reference-scale `model-reference-scale`의 원형 원점·외곽·구성원 규칙을 이 H2의 host 선정과 배치·간섭 검사에 사용한다.
@evidence settings/10-house.md#house-scale `house-scale`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidence spaces/01-storeys.md#ground-threshold-datums `ground-threshold-datums`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
@evidence spaces/01-storeys.md#storey-datums `storey-datums`의 좌표·치수·통로·관찰 기준을 이 H2의 개체 위치와 접점 검사에 적용한다.
-->

방 안 가구·설비 개체의 부모 frame은 [설정의 좌표](../settings/00-production.md#coordinate-units)인 오른손 Y-up 월드이며 단위는 m·rad다. 원형의 local +Z는 사용자가 다가오는 앞면이며 local 원점의 위치는 각 models H2가 선언한다(평면 중심, 벽에 닿는 뒤 변의 바닥 중심, 벽걸이 하단의 가로 중심 등). 개체의 위치는 그 선언된 원점이 예약 구역에서 대응하는 점이다: 평면 중심 원점은 구역 x·z 중점, 뒤 변 원점은 앞면 반대쪽 구역 변의 중점, 벽걸이 원점은 벽 쪽 구역 변의 중점이며 Y는 예약 y 범위의 하한(바닥 개체는 1층 0.00 m 또는 2층 3.06 m)이다. 방 개체의 회전은 Y축 yaw 하나뿐이며 앞면이 +Z면 0, +X면 π/2, -X면 -π/2, -Z면 π다. 앞면 방향은 예약 옆에 붙은 use·swing 구역이 있는 쪽으로 정하고, 해당 구역이 없는 개체는 각 H2가 방향을 명시한다. scale은 항상 1이며 크기 차이는 모델이 선언한 매개변수 또는 별도 원형으로 해결한다. 지붕 경사면의 shingle만 [roof-face basis](03-exterior-repetition.md#shingle-course-law)의 pitch 회전을 추가한다. 같은 입력은 순회 순서와 무관하게 같은 변환을 낸다.

## 변이·seed 없음 {#no-member-variation}
<!--
@evidence principles/core/common.md#scope-preservation 모든 가구·설비의 무작위 변이 금지의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion seed·jitter 없이 원형 매개변수와 p·yaw만 구성원 사이에 다르게 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 모델의 선언 매개변수와 기본 닫힘 상태이다. 그 위에서 이 H2가 모든 가구·설비의 무작위 변이 금지의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 모델의 선언 매개변수와 기본 닫힘 상태이고, 이 H2는 seed·jitter 없이 원형 매개변수와 p·yaw만 구성원 사이에 다르게 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary 같은 원형은 선언 매개변수 외에 메시·재질을 구성원별로 갈라 만들지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 모든 구성원의 seed가 없고 jitter·색 override도 없다. 동일 예약과 모델 매개변수가 동일 변환·형상을 낸다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 같은 원형 두 구성원에 선언되지 않은 색·크기 차이이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 모델의 선언 매개변수와 기본 닫힘 상태을 실제 모든 가구·설비의 무작위 변이 금지와 같은 원형 두 구성원에 선언되지 않은 색·크기 차이에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence obligations/design/instances.md#instance-variation-tiers seed·jitter·거리별 원형 교체가 없고 모델이 선언한 W·D·L 매개변수만 구성원별로 다르게 한다.
@evidenceExclude materials/00-material-frame.md#material-binding-rule `material-binding-rule`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/00-material-frame.md#material-color-space `material-color-space`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/00-material-frame.md#material-response-conventions `material-response-conventions`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/00-material-frame.md#material-review-set `material-review-set`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/00-material-frame.md#material-texture-response `material-texture-response`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#brick-red-brown `brick-red-brown`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#fence-wood `fence-wood`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#front-door-wood `front-door-wood`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#garage-door-charcoal `garage-door-charcoal`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#glass-clear `glass-clear`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#glass-obscure `glass-obscure`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#paving-concrete `paving-concrete`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#porch-floor `porch-floor`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#trim-white `trim-white`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/01-exterior.md#window-frame-charcoal `window-frame-charcoal`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#bath-floor-tile `bath-floor-tile`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#bath-wall-tile `bath-wall-tile`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#beige-carpet `beige-carpet`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#black-coated-metal `black-coated-metal`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#garage-concrete `garage-concrete`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#handrail-wood `handrail-wood`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#interior-ceiling `interior-ceiling`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#interior-trim-white `interior-trim-white`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#interior-wall-paint `interior-wall-paint`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#laundry-floor `laundry-floor`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#oak-floor `oak-floor`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#stair-tread-wood `stair-tread-wood`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/02-interior-shell.md#tile-grout `tile-grout`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#black-glass-panel `black-glass-panel`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#blue-grey-bedding `blue-grey-bedding`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#dark-bookcase-wood `dark-bookcase-wood`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#firebox-black `firebox-black`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#food-art-finishes `food-art-finishes`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#furniture-wood `furniture-wood`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#greige-cabinet `greige-cabinet`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#grey-beige-upholstery `grey-beige-upholstery`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#light-countertop `light-countertop`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#light-fixture-surfaces `light-fixture-surfaces`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#minor-prop-partitions `minor-prop-partitions`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#mirror `mirror`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#muted-rug `muted-rug`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#olive-bedding `olive-bedding`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#planting-bark-foliage `planting-bark-foliage`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#primary-bedding `primary-bedding`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#stainless-steel `stainless-steel`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#towel-curtain-textile `towel-curtain-textile`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
@evidenceExclude materials/03-furnishings.md#white-enamel `white-enamel`의 색·질감·광학 응답은 materials가 원형의 표면에 결속한다. 이 배치는 완성 원형의 위치와 방향만 정하므로 그 재질 선택을 다시 쓰지 않는다.
-->

이 production의 가구·설비 개체는 무작위 변이, 위치 jitter, 회전 흔들림, 재질 변이를 쓰지 않으며 seed도 없다. 같은 원형의 구성원은 변환과, models 원형이 매개변수로 선언한 값(예: 세면장 W·D, 거울 W, siding 판 길이 L)만 다르며 그 값은 models H2가 구역마다 정한 값을 그대로 받는다. 선언되지 않은 형상 차이는 새 원형으로 models에 돌려보낸다. 문 열림, 서랍 열림, 의자 당김 같은 상태는 모든 구성원이 원형의 기본 닫힘·집어넣지 않은 상태 하나로 둔다. 가족 흔적이나 소품 배열을 개체마다 달리하려면 별도 원형을 models에 먼저 둔다. LOD 계층은 한 단계이며 거리에 따라 원형을 바꾸지 않는다. 관찰은 같은 원형 구성원 사이에 변환과 선언된 매개변수 외의 차이가 없는지 확인한다.

## 예약 안 적합과 통로 보존 {#placement-fit-validity}
<!--
@evidence principles/core/common.md#scope-preservation 예약 경계와 route·use·swing의 비침범의 구성원, 배치 경계, 검토 사례를 이 H2에 모아 해당 집합이 다른 방이나 원형 뒤에 숨지 않게 한다.
@evidence principles/core/common.md#substantive-completion 개체 경계 상자를 자기 예약에 가두고 covering 두께 안의 중첩만 예외로 둔다. 원형을 구현하는 source가 배치 값을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 근거 입력은 방 예약과 원형 외곽 치수이다. 그 위에서 이 H2가 예약 경계와 route·use·swing의 비침범의 배치 선택을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 것은 방 예약과 원형 외곽 치수이고, 이 H2는 개체 경계 상자를 자기 예약에 가두고 covering 두께 안의 중첩만 예외로 둔다.
@evidence principles/design/instances.md#instance-prototype-boundary 원형을 예약에 맞추려고 scale로 줄이지 않고 예약 또는 models의 원형 외곽을 원래 owner에서 고친다.
@evidence principles/design/instances.md#instance-derivation-authority 예약 경계와 route·use·swing의 비침범의 id와 위치는 본문의 한 입력 규칙에서 산출한다. 개체 경계 상자를 자기 예약에 가두고 covering 두께 안의 중첩만 예외로 둔다 순회 순서를 생성 입력으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 반증 표본은 여유가 가장 작은 구성원과 통로의 접촉이다. 이 표본을 본문에 지정한 census·평면·viewer 검토에서 확인한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 방 예약과 원형 외곽 치수을 실제 예약 경계와 route·use·swing의 비침범와 여유가 가장 작은 구성원과 통로의 접촉에 대조했다. 이 집합 때문에 상위 치수·원점·예약을 바꿀 필요는 없다.
@evidence obligations/design/instances.md#instance-placement-review 자기 예약 경계 상자와 route·use·swing을 대조하고 가장 작은 여유의 개체를 평면에서 판정한다.
@evidence contracts/reservation-fill.md#reservation-fill 예약 안 경계 상자와 이웃 route·use·swing의 비겹침을 배치 승인 조건으로 둔다.
@evidenceExclude models/00-model-frame.md#model-representation-ceiling `model-representation-ceiling`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/00-model-frame.md#model-representation-completion `model-representation-completion`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/00-model-frame.md#model-review-set `model-review-set`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude models/00-model-frame.md#model-surface-partition-naming `model-surface-partition-naming`의 부재 형상·표면 분할은 models 원형 안에서 완성된다. 이 배치는 원형 전체를 한 구성원으로 놓으며 내부 부재를 별도 개체로 복제하지 않는다.
@evidenceExclude settings/20-verification.md#completion-boundary `completion-boundary`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidence settings/20-verification.md#data-authority `data-authority`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidenceExclude settings/20-verification.md#execution-boundary `execution-boundary`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidence settings/20-verification.md#fidelity `fidelity`의 집 범위·방 역할·관찰 조건을 이 H2의 구성원 선택과 배치 검사에 적용한다.
@evidenceExclude settings/20-verification.md#implementation-boundary `implementation-boundary`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude settings/20-verification.md#lifecycle-boundary `lifecycle-boundary`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude settings/20-verification.md#lighting-state `lighting-state`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude settings/20-verification.md#reference-authority `reference-authority`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude settings/20-verification.md#renderer-boundary `renderer-boundary`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude settings/20-verification.md#role-boundary `role-boundary`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude settings/20-verification.md#submission-boundary `submission-boundary`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude settings/20-verification.md#validation-boundary `validation-boundary`은 운영·렌더·제출 또는 계단 구조의 결정이다. 이 H2는 예약에 원형을 놓는 일만 맡으며 그 설정 값을 다시 정하지 않는다.
@evidenceExclude spaces/07-boundary-assembly.md#exterior-boundary-junctions `exterior-boundary-junctions`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/07-boundary-assembly.md#interior-boundary-junctions `interior-boundary-junctions`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/07-boundary-assembly.md#interior-boundary-ownership `interior-boundary-ownership`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-edge-junctions `interstorey-edge-junctions`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-floor-boundary `interstorey-floor-boundary`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/09-ceiling-assembly.md#ceiling-roof-clearance `ceiling-roof-clearance`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/09-ceiling-assembly.md#garage-ceiling-closure `garage-ceiling-closure`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/09-ceiling-assembly.md#upper-ceiling-closure `upper-ceiling-closure`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/10-ground-floor.md#garage-ground-floor-base `garage-ground-floor-base`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/10-ground-floor.md#ground-support-handoff `ground-support-handoff`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/10-ground-floor.md#ground-threshold-junctions `ground-threshold-junctions`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
@evidenceExclude spaces/10-ground-floor.md#main-ground-floor-base `main-ground-floor-base`의 구조·지지·마감 조립은 spaces가 완성한다. 이 배치는 공간의 완성 면을 복제하지 않고 주어진 접점과 예약에 원형을 놓는다.
-->

각 개체의 월드 경계 상자는 자기 예약 구역의 x·z·y 범위 안에 있어야 하며 다른 예약의 route·use·swing 구역과 겹치면 안 된다. 원형 치수가 구역보다 크면 배치 쪽에서 줄이지 않고 models 원형이나 방 예약을 먼저 고친다. covering 예약(거실 러그 0.008 m, 현관 매트 0.006 m) 위에 선 가구는 그 두께 안의 겹침만 허용한다. 개체는 바닥이나 벽 호스트에 접하되 파고들지 않는다. 최악 경우는 구역 여유가 가장 작은 개체(각 방 H2가 이름을 댄다)이며, 관찰은 src/instances/ 배치 결과의 경계 상자와 src/spaces/rooms/*.ts 예약을 비교하는 결정론적 검사와 평면 관찰 프레임에서 한다.

## 고정 조명 기구의 구성원과 결속 {#lighting-fixture-members}
<!--
@evidence principles/core/common.md#scope-preservation 이 H2는 조명 기구 형상의 id·위치·방향을 맡는다. 광원 강도·색·켜짐은 systems, 기구 형상은 models가 소유한다.
@evidence principles/core/common.md#substantive-completion 평판 천장등 18개·매단 등 3개·세면 벽등 3개·포치 벽등 1개를 해당 systems H2의 공간 좌표와 천장·벽 접점에 결속한다.
@evidence principles/core/common.md#declared-basis systems의 광원 위치와 spaces의 천장·벽 면, models의 기구 원점을 입력으로 받아 실제 보이는 기구의 강체 변환을 결정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation systems가 정한 빛 좌표에서 기구의 천장 접점 또는 벽 접점을 별도 산출하고 꺼진 포치에도 형상을 남긴다.
@evidence principles/design/instances.md#instance-prototype-boundary 평판형·매단 등·세면등·포치 벽등 네 원형만 참조하고 갓·전구 면이나 광원 레코드를 재생성하지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 기구 id는 해당 systems의 light id에서 접두사만 fixture로 바꾼다. 낮빛 두 광원은 기구가 아니며 집합에서 제외한다.
@evidence principles/design/instances.md#instance-verification-address 차고문 레일과 차고 천장등, 포치 문과 꺼진 벽등, 식탁·섬과 매단 등의 접촉·중복을 반증 표본으로 본다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work systems의 광원 중심과 spaces의 천장·벽 접점을 별도 기구 원점으로 변환하며 상위 조명 값이나 공간 면을 변경할 이유가 없다.
@evidence models/17-light-fixtures.md#flush-ceiling-fixture 평판형 원형의 천장 접점과 아래쪽 돌출 0.05 m를 18개 방·차고 위치에 적용한다.
@evidence models/17-light-fixtures.md#pendant-fixtures 두 매단 등 원형의 천장 접점과 길이를 섬·식탁에 각각 결속한다.
@evidence models/17-light-fixtures.md#vanity-wall-fixture 거울 위 벽등의 벽 접점과 0.08 m 돌출을 세 위생실에 적용한다.
@evidence models/17-light-fixtures.md#porch-wall-sconce 포치 벽등의 벽 접점과 0.17 m 돌출을 현관문 왼쪽에 적용한다.
@evidence obligations/design/instances.md#instance-prototype-membership 조명 원형별 구성원 수와 id를 systems의 유한 집합에서 산출한다.
@evidence obligations/design/instances.md#instance-identity-transform 천장 또는 벽 접점에 원형 원점을 맞추고 scale 1을 유지한다.
@evidence obligations/design/instances.md#instance-placement-review 기구와 문·레일·가구 사용 구역의 간섭을 실측한 뒤 관찰한다.
-->

실내 기구는 [조명 위치 선언](../systems/02-interior-fixtures.md)의 일곱 H2를 유일한 위치 입력으로 받는다. 평판 [천장등 원형](../models/17-light-fixtures.md#flush-ceiling-fixture)은 1층 여덟, 계단참·상층 복도 셋, 침실·옷방 넷, 위층 욕실 둘, 차고 하나로 총 18개다. 각 id는 대응하는 `light:<space-id>:<role>`에서 `light:`를 `fixture:`로 바꾸고 X·Z는 systems 값, Y는 그 공간의 완성 천장 접점(1층 2.75 m, 2층 5.66 m, 차고 2.55 m)이다. 단, 계단참은 2층 천장 접점이다. 기구의 아래쪽 0.05 m 돌출이 광원 중심에 닿는지 검사한다.

[섬·식탁 매단 등](../systems/02-interior-fixtures.md#interior-common-pendants)은 서로 다른 [매단 등 원형](../models/17-light-fixtures.md#pendant-fixtures)의 세 구성원이다. 천장 접점은 공용부 천장 Y=2.75 m이며 X·Z는 광원 선언에서 받고 줄기 아래끝과 섬·식탁 상면 사이 여유는 그 systems H2 값에 맞춘다. [세 위생실 벽등](../systems/02-interior-fixtures.md#interior-baths)은 [거울 위 벽등 원형](../models/17-light-fixtures.md#vanity-wall-fixture)을 각각 거울 위 벽 접점에 놓고 X·Z·Y는 systems 값과 원형의 벽 깊이 기준을 맞춘다. [포치 벽등](../systems/03-exterior-fixtures.md#exterior-porch-sconce)은 `fixture:front-porch:door-sconce` 한 개로 벽 접점 (0.15,1.80,0) m에 둔다. 낮 기준에 광원 레코드가 없어도 [벽등 원형](../models/17-light-fixtures.md#porch-wall-sconce)의 형상은 남는다. 협탁등 네 개는 [침실 배치](../systems/02-interior-fixtures.md#interior-bedrooms)의 협탁 host와 [협탁등 원형](../models/13-bedrooms.md#nightstand-lamp)을 사용하며 별도 바닥 예약을 만들지 않는다. 낮빛 directional 광원 네 개는 기구 몸체가 없다.
