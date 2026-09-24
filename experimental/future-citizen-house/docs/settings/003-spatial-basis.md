# 공간 기준

## 좌표와 전체 치수 {#coordinate-datum}

<!--
@evidence principles/core/common.md#declared-basis Y-up·m·전면 -Z·우측 +X는 이 제작의 좌표 선택이고 11×12m 두 층과 약 250㎡는 사용자 목표다.
@evidence principles/core/common.md#scope-preservation 좌표·시간 관례를 한곳에 두고 정확한 방 치수는 spaces의 매스와 층 owner를 소비하게 한다.
@evidence principles/core/common.md#substantive-completion 바닥 y=0과 정지 library의 시간축 부재, UI 조작 초 단위를 정해 공유 기준을 닫는다.
@evidence principles/core/settings.md#fact-status gross와 유효 면적을 혼용하지 않고 reference pixel이나 제작 치수를 실물 측량으로 읽지 않는다.
@evidence principles/core/settings.md#source-support 축과 단위는 선언한 제작 관례이며 실제 건물 측량이나 법규·구조 인증의 외부 출처를 주장하지 않는다.
@evidence principles/core/settings.md#capability-boundary 뷰어 조작 시간은 초를 사용하지만 건물 상태를 자동으로 진행하는 시간축은 납품하지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency 정확한 매스·층선·벽·방 경계는 링크한 설계 owner만 수정하며 source 실현은 아직 unverified다.
@evidence principles/core/settings.md#observable-identity 세계의 앞·뒤·우측과 1층 기준 바닥이 고정돼 서로 다른 관찰자가 집을 반대로 재구성하지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb m·오른손 Y-up과 축 방향은 제작 관례이며 두 층과 목표 규모는 사용자 요구로 분리된다. 실제 건물이나 reference 픽셀에서 이 좌표를 측량했다고 주장하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 공간과 시간의 공통 기준을 여기 두고 정확한 벽·방 경계는 공간 설계로 연결한다. 앞·뒤·좌우를 각각의 source가 따로 정할 수 있게 방치하지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 바닥 y=0, 전면 -Z, 후면 +Z, UI 초 단위와 납품 시간축 부재가 정해져 있다. 특히 전면 화면 오른쪽=-X를 밝혀 앞서 혼동했던 좌우를 downstream이 다시 발명할 필요가 없다.
@evidenceReview principles/core/settings.md#fact-status #93a284a 목표 규모, 저작한 정확 치수와 실물 측량을 구별하고 새 source의 실현은 unverified로 남긴다. gross를 유효 면적이나 실제 측량값으로 바꾸는 지위 이동을 허용하지 않는다.
@evidenceReview principles/core/settings.md#source-support #430bca9 축과 단위는 선언한 관례이고 실제 건축물의 측량·법규·구조 자료에서 온 값이 아니다. reference를 비측량 자료로 유지하므로 이미지 비율을 수치 근거로 사용할 수 없다.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c UI 조작에는 초를 쓰지만 건물 상태는 시간에 따라 자동 진행하지 않는다. 시간 단위를 정했다는 이유로 timed motion이나 자동 낮밤 전환이 추가되는 것은 아니다.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 평면의 +X 우측과 전면 카메라의 -X 화면 우측을 다른 말로 구분한다. 코어와 입면 이름은 후자를 따르므로 어느 기준의 우측인지 추측해 배치할 여지가 없다.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e 앞·뒤·기준 바닥과 화면 좌우의 관계가 고정되어 같은 집을 거울상으로 재구성할 위험을 줄인다. 현재 코어가 -X라는 명시는 좌표 관례가 실제 외피 landmark와 만나는 지점을 답한다.
-->

**상태: review 선언을 유지한 제자리 재작성, 이전 판정 무효.** 세계 단위는 m이며 오른손 Y-up 좌표다. +X는 평면 기준 우측, +Z는 후면, 전면은 -Z이며 1층 바닥은 y=0을 기준으로 한다. 정지 library이며 납품 시간축과 fps는 없다. 뷰어의 조작 시간은 초를 쓰되 건물의 상태를 자동 진행시키지 않는다. 약 11×12m 두 층과 약 250㎡라는 목표를 따른다. gross와 유효 면적을 혼용하지 않으며 reference pixel로 치수를 역산하지 않는다.

전면 바깥(-Z)에서 +Z를 보는 +Y-up 카메라의 화면 오른쪽은 -X다. 평면 우측과 관찰자 화면 우측을 같은 말로 쓰지 않는다. 외피의 “우측 불투명 코어”와 입면 좌우 이름은 reference 전면 관찰 화면을 기준으로 하며, 따라서 코어는 -X 쪽이다.

정확한 매스·층선·벽 두께·방 경계는 [공간 설계의 매스와 층](../spaces/002-spatial-graph.md#mass-and-storeys)이 소유한다. 각 수치는 제작 결정이며 실제 건축물의 측량이나 법규·구조 인증이 아니다. 기존 source가 새 치수를 실현하는지는 unverified다.

## 1층 공간 그래프 {#ground-graph}

<!--
@evidence principles/core/common.md#declared-basis 현관 직결 계단·작업실·공용부와 우측 불투명 코어는 사용자 고정 공간 그래프다.
@evidence principles/core/common.md#scope-preservation 현관에서 세 기능으로 직접 연결되는 관계와 모든 room의 storey 귀속을 보존한다.
@evidence principles/core/common.md#substantive-completion 분할·문은 ground-partition, 층간 route·바닥 구멍은 single-stair가 소유하도록 설계 소비 경계를 지정한다.
@evidence principles/core/settings.md#fact-status from/to 이름이나 바닥 선은 통행의 관찰 결과가 아니며 실제 벽 구멍·참·바닥이 필요하다고 구분한다.
@evidence principles/core/settings.md#source-support 고정 연결은 브리프의 직접 조건이고 실제 통행 안전이나 허가된 평면이라는 외부 인증을 붙이지 않는다.
@evidence principles/core/settings.md#capability-boundary 현관이 통행을 연결해야 하며 논리 id만으로 벽을 통과하는 능력을 부여하지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency 무소유 접근 틈을 쓰지 않고 요구 room이 한 storey에 속한 실제 연결을 구현해야 한다.
@evidence principles/core/settings.md#observable-identity 현관에서 전면 작업실과 뒤의 연속 living/dining/kitchen, 중앙 단일 계단이 읽히는 1층 관계를 고정한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 사용자 직접 지시로 현관과 계단·공용부·작업실의 직접 연결, 우측 서비스 코어를 채택했다. 이 관계를 reference의 픽셀 비례에서 얻은 평면처럼 제시하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 현관에서 요구 기능으로 직접 닿는 관계와 required room의 storey 귀속을 모두 남긴다. 이름만 등록한 방이나 무소유 접근 틈으로 납품 연결을 대신할 수 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 구획·문 위치와 계단 route·slab opening을 각각의 설계 owner에 배정한다. 실제 통행을 무엇이 제공해야 하는지 정한 뒤 상세 치수만 설계가 결정하게 둔다.
@evidenceReview principles/core/settings.md#fact-status #93a284a from/to id와 바닥 선은 통행 관찰이 아니라고 구분한다. 논리 연결이 존재한다는 자료를 실물 벽의 개구가 확인됐다는 사실로 읽을 수 없다.
@evidenceReview principles/core/settings.md#source-support #430bca9 고정 연결은 사용자 계약에 의존하며 실제 허가 평면이나 통행 안전의 외부 인증을 주장하지 않는다. 그래프를 채택했다는 사실만으로 그런 성능 근거가 생기지 않는다.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c 현관은 실제 문과 벽 구멍을 통해 통행을 연결해야 한다. 논리상 목적지가 있다는 이유만으로 벽을 통과하는 능력을 환경에 부여하지 않는다.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 모든 required room은 한 storey에 귀속되고 무소유 틈을 통로로 쓸 수 없다. 연결 좌표가 방 경계 사이 빈 영역에만 놓이는 경우 이 규칙에서 실패한다.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e 현관에서 전면 작업실, 뒤의 연속 living·dining·kitchen과 단일 계단이 직접 이어지는 공간 관계가 명시된다. 소품만 비슷하고 방 사이 연결이 다른 집은 같은 설명을 충족하지 않는다.
-->

**권한: 사용자 직접 지시.** 현관은 단일 꺾임계단, 후면의 연속 거실·식당·주방, 전면 가변 작업실에 직접 연결된다. 욕실·수납·설비는 우측 불투명 코어에 모은다. 실제 벽과 문 구멍, 계단의 참과 바닥이 이 연결을 제공해야 하며 from/to 이름이나 바닥 위 선만으로 통행을 주장하지 않는다.

[1층 분할](../spaces/002-spatial-graph.md#ground-partition)이 구획과 문 위치를, [단일 계단](../spaces/002-spatial-graph.md#single-stair)이 층간 route와 필수 slab opening을 소유한다. required room은 하나의 storey에 속하며 무소유 접근 틈을 사용하지 않는다.

## 2층 공간 그래프 {#upper-graph}

<!--
@evidence principles/core/common.md#declared-basis 짧은 일자 복도에서 요구 방에 직접 닿는 관계는 브리프이고 upper-service 채택은 확정한 생활 프로그램을 따른다.
@evidence principles/core/common.md#scope-preservation 주침실·두 작은 침실·욕실·수납·설비실을 하나의 복도에 남기고 분기·단절을 금지한다.
@evidence principles/core/common.md#substantive-completion 계단 구멍은 단일 계단의 일부로 허용하고 참조 세부가 고정 그래프와 충돌하면 coordinator에게 올리는 조건을 정한다.
@evidence principles/core/settings.md#fact-status 필수 계단 구멍을 금지된 복층 거실 보이드와 동일하다고 해석한 이전 주장을 유지하지 않는다.
@evidence principles/core/settings.md#source-support 상층 연결과 금지 구조는 사용자 계약에 근거하며 reference를 치수 도면이나 법적 허용의 근거로 쓰지 않는다.
@evidence principles/core/settings.md#capability-boundary 계단과 그 난간은 층간 연결을 제공하되 두 번째 계단이나 별도 거실 보이드를 추가할 수 없다.
@evidence principles/core/settings.md#constraint-sufficiency 참조를 구현하려면 사용자 그래프를 바꿔야 하는 경우 해당 저작을 멈추고 coordinator 결정으로만 바꾼다.
@evidence principles/core/settings.md#observable-identity 계단참에서 시작하는 하나의 짧고 곧은 복도와 직접 면한 방문들이 상층 사적 구역의 형태다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 한 일자 복도의 직접 연결은 사용자 고정 그래프이고 upper-service는 이미 채택한 상층 프로그램을 소비한다. 서비스실의 추가가 또 다른 복도를 만들 권한으로 해석되지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 주침실·두 작은 침실·욕실·수납·설비실을 모두 같은 corridor에서 접근하게 남겼다. 침실 일부를 다른 방을 지나도록 옮겨도 연결이 유지됐다고 할 수 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 필요한 계단 구멍을 허용하면서 분기·두 번째 계단·거실 보이드는 금지한다. reference 세부와 그래프가 충돌할 때의 결정 권한까지 있어 다음 층의 핵심 판단이 비지 않는다.
@evidenceReview principles/core/settings.md#fact-status #93a284a 단일 계단의 필수 구멍은 허용 부분으로, 별도 복층 거실 보이드는 금지 형태로 구분된다. 두 종류를 같은 것으로 취급해 정상 층간 연결도 금지하는 해석은 현재 본문과 맞지 않는다.
@evidenceReview principles/core/settings.md#source-support #430bca9 직접 문 연결과 금지 구조는 사용자 계약을 근거로 한다. reference가 치수 도면이거나 법적 허가를 입증한다는 외부 권위를 이 그래프에 붙이지 않았다.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c 층간 연결은 한 계단과 필요한 개구·난간으로 제공한다. 그 연결 기능을 이유로 두 번째 계단이나 독립 거실 보이드를 추가할 수 없다.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 참조 세부를 구현하려면 고정 그래프를 바꿔야 하는 경우 affected authorship을 멈추고 coordinator에게 올리도록 정한다. 저작자의 미적 판단만으로 이 예외를 승인할 권한은 없다.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e 계단참에서 시작하는 하나의 짧고 곧은 복도와 그 복도에 직접 면한 방문들이 상층 정체다. 분기된 복도나 연결이 끊긴 방은 치수가 비슷해도 같은 관계를 재현하지 못한다.
-->

**권한: 사용자 직접 지시.** 계단참에서 시작하는 짧은 일자 복도 하나가 주침실, 작은 침실 둘, 욕실과 수납에 실제 문으로 직접 연결된다. 설비·세탁실 upper-service도 같은 복도에서 직접 접근한다. 분기 복도, 두 번째 계단, 단절된 방, 별도 복층 거실 보이드는 만들지 않는다.

[2층 분할](../spaces/002-spatial-graph.md#upper-partition)이 방·복도·문 위치를 소유한다. 필수 계단 구멍과 그 난간은 허용된 단일 계단의 일부다. reference의 모든 세부를 동시에 구현하려면 이 사용자 그래프를 바꿔야 하는 경우에는 affected authorship을 멈추고 coordinator의 결정을 받는다.

## 외피와 개구부 {#envelope-and-privacy}

<!--
@evidence principles/core/common.md#declared-basis 커튼월 위치와 opaque core는 브리프이고 목재문·계단 유리·평지붕·PV의 landmark 관계는 제공 이미지의 해석이다.
@evidence principles/core/common.md#scope-preservation 전면 계단·후면 대부분·상층 전면의 유리, 우측 코어, 실제 창호 부재와 외부 차양을 외피 범위에 모두 남긴다.
@evidence principles/core/common.md#substantive-completion 목재문과 계단 유리의 화면 관계, floor/transom·room/jamb 일치, 실물 frame·reveal·sill·하드웨어와 평지붕 캐노피를 결정한다.
@evidence principles/core/settings.md#fact-status 좌표 +X와 전면 화면 좌우를 구분하고 박공·굴뚝은 reference에서 확인되지 않은 항목으로 추가하지 않는다.
@evidence principles/core/settings.md#source-support 외피의 근거는 첨부 PNG의 관찰 관계이며 사진 픽셀에서 치수나 실제 구조 안전을 역산하지 않는다.
@evidence principles/core/settings.md#capability-boundary 이 H2는 고정 외피의 관계와 부재를 정하며 유리의 상태 능력을 새로 정의하지 않는다. 변할 tint·shade와 고정 층은 privacy-states가 소유한다.
@evidence principles/core/settings.md#constraint-sufficiency 커튼월을 바닥선·방 경계에 맞추고 본채 cantilever를 만들지 않으며 정확한 반복 범위는 공간 설계의 입면 인터페이스에서 받는다.
@evidence principles/core/settings.md#observable-identity 전면 원근 화면의 목재문-계단유리 관계, 어두운 frame·밝은 석재 계열 벽·얇은 PV 캐노피가 같은 집의 외형을 고정한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb curtainwall·opaque core는 브리프에서, 문과 계단 유리·PV의 landmark 관계는 제공 이미지의 해석에서 온다. 화면 관계를 외부 구조 측량으로 격상하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 전면 계단실·후면 대부분·상층 전면의 유리와 서비스 코어, 실물 창호 부재를 함께 남겼다. 프라이버시 상태는 별도 owner로 연결해 고정 외피의 선언에서 사라지지 않게 한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 목재문이 계단 유리의 화면 왼쪽, 코어가 화면 오른쪽 -X라는 관계와 floor/transom·room/jamb 일치를 결정한다. 남은 치수와 반복 범위는 지정한 입면 인터페이스의 설계 역할이다.
@evidenceReview principles/core/settings.md#fact-status #93a284a +X 평면 우측을 화면 우측으로 오인하지 않으며 박공·굴뚝을 reference에서 확인한 부재처럼 추가하지 않는다. 이 해석은 현재 GPU 화면을 관찰한 합격 판정과도 다른 제작 기준이다.
@evidenceReview principles/core/settings.md#source-support #430bca9 다섯 PNG는 부재와 landmark 관계의 근거이며 픽셀에서 치수나 안전 성능을 역산하는 자료가 아니다. 밝은 벽·frame·PV를 보았다는 관찰을 실물 구조 인증으로 확장하지 않는다.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c 이 본문은 고정 외피의 관계와 실제 부재를 정하고 변할 tint·shade는 privacy-states로 넘긴다. 창호를 소유한다는 이유로 고정 반투명 층의 변경 권한까지 가져오지 않는다.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 bay가 층선과 방 경계를 따르고 지지된 캐노피가 본채 cantilever로 바뀌지 않아야 한다. 외관이 더 비슷해진다는 이유로 slab이나 방 경계를 가로질러 유리를 놓는 선택은 허용되지 않는다.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e 목재문-계단 유리의 좌우 관계, 어두운 frame·밝은 석재 계열 벽·얇고 지지된 PV가 같은 집의 외형을 이룬다. 이 관계는 표면 색만 비슷한 거울상 배치와 구별된다.
-->

**권한: 사용자 브리프와 다섯 reference의 형태 해석.** 전면 계단실, 후면 대부분, 상층 전면 일부가 curtainwall이고 우측 service core는 불투명하다. 전면 원근 관찰 화면에서 목재 출입문이 계단실 유리의 왼쪽에 읽히게 한다. 이것은 좌표 +X를 화면 오른쪽으로 간주하라는 뜻이 아니다. 작업실은 +X 쪽 전면에 두며 현관에서 직접 문으로 이어진다. reference의 우측 불투명 코어는 전면 화면 오른쪽인 -X 쪽을 뜻한다. floor/transom과 room/jamb 경계를 맞춘다. 실제 mullion·transom·head·sill·reveal·door leaf·frame·하드웨어가 리뷰 거리에서 읽혀야 한다. 경계의 치수와 반복 범위는 [입면 인터페이스](../spaces/002-spatial-graph.md#envelope-interface)를 소비한다.

평지붕 위에 얇은 태양광 캐노피를 두고 그 지지와 연결을 보여 준다. 본채의 캔틸레버를 만들지 않는다. 밝은 석재 계열 불투명 면, 어두운 금속 frame, 연속된 목재 floor와 cabinetry가 공통 재료 언어다. 박공이나 굴뚝은 제공 reference의 관찰 결과가 아니므로 추가하지 않는다.

유리의 초기값·상태별 tint/shade와 고정 반투명 층은 [프라이버시 상태](#privacy-states)가 소유한다.

## 프라이버시 상태 {#privacy-states}

<!--
@evidence principles/core/common.md#declared-basis 많은 유리와 주거 프라이버시를 함께 해결하라는 브리프를 공간별 세 정지 광학 상태로 구체화한 제작 선택이다.
@evidence principles/core/common.md#scope-preservation 공용·계단·작업실·침실·욕실의 프라이버시를 모두 남기며 tint 하나로 고정 반투명 층과 실제 shade를 대체하지 않는다.
@evidence principles/core/common.md#substantive-completion 낮 초기값, 사적 상태의 60%/100% shade, 야간 shade의 100%와 고정 층·광원의 불변 조건을 정한다.
@evidence principles/core/settings.md#fact-status 세 상태는 저작한 광학 표현이고 실제 밤 기상·전기변색·방범·에너지 성능의 입증이 아니다.
@evidence principles/core/settings.md#source-support 상태별 shade 비율은 제작 입력이며 실물 전기변색 제품이나 시험 성적의 성능 수치를 인용한 것이 아니다.
@evidence principles/core/settings.md#capability-boundary 유리 tint와 roller shade의 내려온 면적은 바뀌지만 욕실의 고정 반투명 층·외부 차양·비교 광원·노출은 바뀌지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency 낮에도 작업실·침실의 하부 시선대와 욕실은 반투명이며 사적 상태의 공용부·계단만 shade 60%, 사적 방은100%로 구분한다.
@evidence principles/core/settings.md#observable-identity 밝고 투명한 공용 유리, 사적 방의 반투명 하부, 실제 내려온 shade 면적과 고정 욕실 유리가 각 상태에서 구별돼야 한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 많은 유리와 사생활의 양립은 사용자 요구이며 낮·사적·야간 shade의 세 정지 상태는 저작한 해법이다. 그 상태 이름이나 비율을 실물 제품에서 읽은 값처럼 쓰지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 공용부·계단·작업실·침실·욕실 각각의 대상과 차양을 남겼다. tint만 바꾸고 고정 반투명층이나 실제 내려오는 shade를 누락하는 축소는 허용되지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 낮 초기값, 사적 상태의 60%와 100%, 야간의 100% 및 고정 광원을 정했다. 프라이버시를 좋게 하라는 이름만 두고 방별 적용과 상태 차이를 source가 발명하게 하지 않는다.
@evidenceReview principles/core/settings.md#fact-status #93a284a 상태와 shade 비율은 저작한 광학 표현이며 실제 밤·방범·에너지 성능은 미검증이다. 어두운 유리 화면을 실물 전기변색 장치의 시험 결과로 읽을 수 없다.
@evidenceReview principles/core/settings.md#source-support #430bca9 60%와 100%는 창 clear height에 대한 제작 입력이다. 특정 제품의 시험성적에서 가져온 수치가 아니므로 외부 성능 정밀도를 가장하지 않는다.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c 변경 가능한 tint와 roller shade의 면적을 고정 반투명층·외부 차양과 구분한다. 욕실 층과 기본 광원·노출은 상태를 바꿔도 유지되므로 사적 모드가 모든 속성을 바꾸는 포괄 권한이 아니다.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 사적 모드의 공용부·계단은 60%, 작업실·침실은 100%로 나뉘고 욕실은 계속 반투명이다. 같은 투명도 한 값으로 모든 방을 처리하는 구현은 이 조건들을 동시에 충족하지 못한다.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e 밝은 공용 유리, 사적 방의 반투명 하부, 내려온 shade 면적과 욕실의 불변 유리가 상태를 구별한다. 이름만 낮·밤으로 바꾼 동일 형상은 이 관찰 차이를 제공하지 않는다.
-->

**근거: 사용자 프라이버시 요구를 정지 광학 상태로 해석한 제작 선택이다.** 기본 상태는 낮이다. 후면 공용부와 전면 계단 유리는 밝고 투명하며 roller shade는 올려 둔다. 전면 작업실과 상층 침실의 하부 시선대는 반투명이고 위쪽 tint 유리는 그보다 밝게 보인다. 욕실은 모든 상태에서 전체 privacy glazing을 반투명으로 유지한다. 외부 차양은 세 상태 모두 같은 위치다.

사적 상태에서는 공용부와 계단 유리를 어둡게 tint하고 shade를 창 clear height의 60%까지 내린다. 작업실·침실은 shade를 100% 내린다. 야간 shade 상태에서는 모든 거주 구역의 shade를 100% 내리고 문·계단실의 필요한 채광 영역도 투명한 실내 노출로 남기지 않는다. 욕실의 고정 반투명 층은 그대로다. 두 변경 상태를 비교할 때 기본 광원과 노출은 바꾸지 않으며 실제 밤을 재현했다고 주장하지 않는다.

유리 tint, 고정 반투명 층, roller shade의 실제 내려온 면적은 서로 다른 속성이다. 모두를 투명도 한 값으로 대신하지 않는다. 재료의 정규화 광학 입력과 shade geometry는 이 상태 의미를 실현하는 설계가 소유한다. source는 각 façade의 room 소유에서 적용 대상을 읽고 상태를 일괄 적용한다. 실제 전기변색 장치·에너지·방범 성능은 unverified다.

## 표면 소유 선언 {#surface-decomposition}

<!--
@evidence principles/core/common.md#declared-basis 완결 시각 표면 하나를 한 저작자가 소유하라는 사용자 지시를 채택한다.
@evidence principles/core/common.md#scope-preservation 네 전체 입면·지붕·층·계단·개별 방·대지를 독립 완결 표면으로 보존해 같은 면을 나눠 칠하지 않는다.
@evidence principles/core/common.md#substantive-completion 이 H2가 구체 표면별 저작자와 source 모듈 배정을 소유하고 기존 한 source 파일의 이름만 바꾸는 완료를 거부한다.
@evidence principles/core/settings.md#fact-status 이 배정은 기존 방 source의 임시 물체 메시와 최종 models·instances·systems owner를 구분하며 새 경계의 독립 승인은 아직 없다.
@evidence principles/core/settings.md#source-support 표면별 소유는 사용자 저작 절차이며 자동으로 geometry 품질을 보장한다는 외부 성능 주장으로 쓰지 않는다.
@evidence principles/core/settings.md#capability-boundary 표면 owner의 편집 권한은 제작 책임이며 건물 부재의 동작 능력이 아니다. 배정된 저작자는 유리·가구의 상태 제약을 해당 설정에서 받아야 한다.
@evidence principles/core/settings.md#constraint-sufficiency 문자열 그룹만 선언한 채 분해 완료라고 하지 않고 실제 모듈 구현과 독립 판정을 요구한다.
@evidence principles/core/settings.md#observable-identity 표면의 단독 저작자 배정은 작업 책임이고 새로운 입면이나 방의 감각 정체가 아니다. 네 입면·방의 실제 형태는 링크한 공간 설계와 이 파일의 외피 owner가 정한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 완결된 시각 표면을 한 저작자에게 맡기는 기준은 사용자 지시로 밝히고, main author와 구현 source 배정은 현재 제작의 선택으로 제시한다. 방과 입면의 경계는 링크한 1단계 그래프를 소비하므로 파일 배정표가 별도의 평면 결정 권한을 갖지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 전면의 계단 유리와 작업실 유리를 다른 저작자에게 잘라 맡기지 않으며, 두 child room과 각 core room도 각각의 완결 실내로 남긴다. 연속 바닥·천장, 계단, roof/canopy와 대지까지 배정되어 방 내부만 나누고 외부나 수평 마감을 무소유로 남기는 축소가 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 입면·층·방의 완결 건축 면과 물체 prototype·방별 instance·조명 과정·재료 결합을 구분하고, 기존 방 source의 중복 메시를 퇴역시킬 책임과 시점을 정했다. 현재 임시 소비를 최종 소유권으로 승인하지 않는다.
@evidenceReview principles/core/settings.md#fact-status #93a284a 기존 방 source가 물체 메시를 실제로 생성하는 현재 상태와 models·instances 이관 뒤의 목표 상태를 구별한다. 새 소유권 경계와 이관의 독립 판정은 아직 이루어지지 않았으므로 source 경로가 표에 있다는 이유로 검증 완료를 주장하지 않는다.
@evidenceReview principles/core/settings.md#source-support #430bca9 단독 표면 소유는 이 제작에 채택한 저작 절차이며 외부 시험이나 성능 자료에서 얻은 품질 보증으로 제시되지 않는다. 배정 뒤에도 실제 구현과 독립 판정을 요구하므로 분해 방식 자체가 geometry의 정확성을 입증한다는 근거 없는 효과 주장을 하지 않는다.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c 여기서 정하는 것은 누가 어느 표면을 생성하고 수정하는지에 관한 제작 책임이다. 이 권한은 유리의 tint나 가변 가구의 상태를 새로 허용하지 않으며, 입면과 room 담당자가 소비할 프라이버시·작업실 상태의 기존 설정을 대체하지 않는다.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 room의 내측 벽 마감과 storey의 연속 바닥·천장을 구분하고, 물체의 형상·배치·재료를 다른 owner에 둔다. 공유 문짝의 양면 binding과 seam 변경의 재검증, 임시 방 물체 메시의 원자적 퇴역까지 지정해 같은 노출 면을 중복 생성할 경계를 비워 두지 않았다.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e 표의 main author와 source 경로는 집의 감각적 정체를 새로 정의하는 값이 아니다. 전면 화면 기준 좌우를 기존 canon대로 유지하면서 실제 방·입면 형태는 공간 그래프와 외피 owner를 소비하게 하므로, 모듈 이름을 지정했다는 이유로 같은 집으로 보인다는 판정을 대신하지 않는다.
-->

**권한: 사용자 직접 지시.** 완결된 시각 표면은 한 명의 저작자에게 귀속한다. 아래 배정이 네 전체 입면, roof/canopy, 두 층, 단일 계단, 개별 room, site의 단독 owner와 구현 모듈 배정을 소유한다. 이전 source의 한 파일과 문자열 그룹을 그대로 유지한 채 분해가 끝났다고 주장하지 않는다. 이 H2의 물체 소유권과 이관 수정은 독립 재판정 전이다.

**상태: 기존 건축 표면 source는 구현됐고 물체 소유권 이관은 미완료다.** [1단계 그래프](../spaces/002-spatial-graph.md)를 소비한다. 현재 저작자는 main author 한 명이고 독립 reviewer는 쓰기 권한이 없다. 향후 fan-out을 하더라도 아래 완결 표면 하나는 한 명에게 통째로 배정하며 다른 작성자가 그 표면의 부재나 마감을 덧칠하지 않는다. 파일명이나 임시 메시 존재를 이관 완료로 세지 않는다.

입면은 전면·후면·좌측·우측을 각각 하나의 전체로 소유한다. 좌측·우측 이름은 reference의 전면 관찰 화면 기준이며 좌측은 +X, 우측 서비스 코어는 -X다. front stair/flex처럼 같은 입면을 분할하지 않는다. 방은 각 방의 바닥·천장을 제외한 내측 벽 finish만 room owner가 맡고, 두 child room이나 세 core room을 한 표면 owner 이름으로 합치지 않는다. 벽에 고정된 niche의 건축적 구멍과 lining은 방 owner가 맡지만 그 안의 선반·기기는 물체다. 벤치·선반·책상·의자·침대·수납장·주방 및 위생 기구·실내 화분과 식물·소품·등기구의 재사용 가능한 형상과 노출 part/face 주소는 models가 맡는다. 그 prototype의 방별 membership·transform·반복과 가변 상태별 물체 배치는 instances가 맡고, 광원의 발광·조도·상태 과정은 systems가 맡는다. materials는 재사용 가능한 재료 응답과 part/face 결합 규칙을 맡고 각 표면의 생성 owner가 그 면의 finish id를 지정한다. 내부 구조 벽의 몸체와 내벽 접합부는 topology 입력을 소비하는 층 owner가 만들고 외벽 몸체와 외부 모서리는 해당 입면 owner가 만들며, 입면의 외측/room의 내측 finish는 서로 다른 실제 면이다. 연속 바닥과 실내 천장의 최종 노출 면은 해당 storey owner가 geometry와 finish id 지정을 함께 소유한다. room owner는 그 면을 생성하거나 마감하지 않는다. roof owner의 하부는 실외 처마 부분만 노출되며 실내 천장의 최종 노출 면은 upper owner다. 구조 slab의 몸체 하부는 실내 ceiling finish 뒤의 숨은 구조면이며 시각 마감으로 중복 생성하지 않는다. 동일한 면을 두 번 생성하지 않는다.

| 완결 표면 | 단독 저작자 | 구현 source 배정 | 포함 범위 |
| --- | --- | --- | --- |
| 전면 전체 | main author | src/house/envelope/front.ts | 두 층 창호·현관문 외측·계단 유리·spandrel·jamb·shade |
| 후면 전체 | main author | src/house/envelope/rear.ts | 공용부·주침실 유리·bath closure·모든 frame과 shade |
| 좌측 전체 | main author | src/house/envelope/left.ts | 불투명 return·설계된 opening·이음·roof 접합 |
| 우측 전체 | main author | src/house/envelope/right.ts | service wall·privacy opening·panel joint |
| 지붕·캐노피의 상하 전체 | main author | src/house/envelope/roof.ts | roof 구조·상면·실외에 노출된 처마 하부·edge·지지·PV·반복 slat |
| 1층 구조와 연속 바닥/천장 | main author | src/house/storeys/ground.ts | datum·벽체 몸체·공유 opening void·floor/ceiling 경계 |
| 2층 구조와 연속 바닥/천장 | main author | src/house/storeys/upper.ts | slab과 계단 구멍·벽체 몸체·opening void·층선 |
| 한 개의 꺾임계단 | main author | src/house/circulation/stair.ts | 두 flight·참·tread·riser·stringer·guard·handrail·slab-hole 입력 |
| 현관 | main author | src/house/rooms/entry.ts | 내측 벽면·충전 niche의 건축 구멍과 lining·문 내측 |
| 가변 작업실 | main author | src/house/rooms/flex.ts | 내측 벽면·미닫이문 내측 |
| 연속 공용부 | main author | src/house/rooms/common.ts | 하나의 living/dining/kitchen 방 경계와 내측 벽면 |
| 1층 powder/utility | main author | src/house/rooms/powder.ts | 방 내측 벽면 |
| 1층 수납 | main author | src/house/rooms/storage-ground.ts | 방 내측 벽면 |
| 주침실 | main author | src/house/rooms/primary.ts | 방 내측 벽면 |
| 작은 침실 1 | main author | src/house/rooms/child-one.ts | L자 방 전체 내측 벽면 |
| 작은 침실 2 | main author | src/house/rooms/child-two.ts | 방 전체 내측 벽면 |
| 상층 복도 | main author | src/house/rooms/corridor.ts | 일자 통로의 내측 벽면·방문 내측 경계 |
| 상층 욕실 | main author | src/house/rooms/bathroom.ts | 방 내측 벽면 |
| 상층 수납 | main author | src/house/rooms/storage-upper.ts | 방 내측 벽면 |
| 상층 설비 | main author | src/house/rooms/service-upper.ts | 점검 영역의 건축적 경계와 내측 벽면 |
| 대지·조경 전체 | main author | src/house/site/garden.ts | 지면·보도·현관 외부 계단·식재·접지 |

공유 portal owner는 문 구멍의 위치·clear 치수·host wall·from/to 공간·상태를 한 번만 선언한다. 입면과 방이 같은 문짝 geometry를 각각 복제하지 않는다. 주체 생성 owner가 양면 material binding을 소유하고 상대 owner는 자기 면의 요구를 입력으로 넘긴다. seam 변경은 이웃 표면의 재검증을 일으키며 소유권을 분할하지 않는다.

**이관 중 상태와 퇴역 책임.** 현재 `src/house/rooms/*.ts`가 `src/house/rooms/interior.ts`의 `cabinet()`·`bed()`·책상·의자·위생 기구·소품·`lights()`를 호출하여 메시를 생성하는 것은 이전 구현의 임시 소비 경로다. 현재 viewer와 컴파일된 관찰 집합을 유지하기 위해 `instanceSources`가 독립 판정으로 `review`에 이를 때까지 그 메시를 남기되 이 경로에 새 물체 형상이나 part 주소를 저작하지 않는다. main author가 `modelSources`에서 prototype과 표면 주소를, `systemSources`에서 조명 과정을, `instanceSources`에서 방별 배치와 반복을 구현·판정받는다. `instanceSources: review` 직후 main author가 원자적으로 방 source의 물체 호출 및 `interior.ts`의 중복 생성 함수를 제거하고 조립 경로를 새 source 소비자로 교체한다. 교체 전후 같은 방에 두 메시가 동시에 나타나지 않도록 컴파일된 topology를 대조한다. `spaceSources`는 소유 방향상 `src/models`나 `src/instances`를 import하거나 물체 prototype을 생성하지 않는다. 이관 전 방 source의 물체 메시와 마감 문자열은 승인된 영구 소유권이 아니며, 현재 시각·재료 판정은 그 한계 아래 `unverified`다.

**조립과 관찰 도구의 책임.**

`src/spaces/citizen-house.ts`는 위 입력을 조합해 하나의 IAutoMovieBuiltEnvironment를 반환하는 작은 등록 owner로 바꾼다. graph, room bounds, portal, stair, 각 완결 표면은 별도의 cohesive module로 구현한다. 공통 primitive helper는 단위 geometry 생성만 맡고 방 배치나 입면을 결정하지 않는다. source당 500 physical line 경계를 유지하며 줄 압축으로 피하지 않는다.

viewer의 server·메시 upload·조명·camera controls·검사 overlay·관찰집합 derivation은 각각 도구 책임으로 분리한다. 뷰어가 source의 새 geometry나 room bounds를 발명하지 않는다. 관찰집합은 성공적으로 컴파일한 현재 topology에서 생성하며 독립 observer는 그 분모를 축소할 수 없다. 이 도구 배정은 특정 view를 미리 성공 처리하거나 누락된 opening을 감추는 수단이 아니다.
