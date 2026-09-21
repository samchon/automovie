# 관찰과 뷰어 사용 조건

## 관찰 장치와 프레임 {#review-apparatus}

<!--
@evidence principles/core/common.md#declared-basis 1600×1000·deviceScaleFactor=1·FOV 50°와 카메라 위치 규칙은 재현을 위해 채택한 제작 검사 조건이다.
@evidence principles/core/common.md#scope-preservation 모든 topology 관찰을 유지하고 작은 방·L자 모서리의 실패를 유리한 대체 위치로 지우지 않는다.
@evidence principles/core/common.md#substantive-completion 장치·frame·눈높이·threshold·모서리·내부 중심·외부 거리 도출·실패 기록을 정해 관찰자가 조건을 발명하지 않는다.
@evidence principles/core/settings.md#fact-status 카메라 눈높이는 인체 인증값이 아니며 HTTP 200·canvas 수·DOM 장치명은 실제 GPU 관찰이 아니다.
@evidence principles/core/settings.md#source-support channel chromium과 실제 RENDERER 요구는 사용자 지시이고 수치 카메라 조건은 가상 검사 입력으로 한정한다.
@evidence principles/core/settings.md#capability-boundary 카메라의 시야·raster·GPU 정보는 관찰 장치의 조건이며 주택이나 주민의 생산세계 능력이 아니다. 이 H2의 검사용 절개는 벽이 실제로 사라질 수 있다는 능력을 추가하지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency 작은 공간에서 0.25m 안쪽 조건을 만족하지 못하면 원래 id를 실패로 남기고 대체 view는 추가 질문으로만 둔다.
@evidence principles/core/settings.md#observable-identity 이 H2는 카메라·raster·GPU 관찰 장치를 정하며 관찰되는 집의 형태를 바꾸지 않는다. 장치가 확인할 실제 정체는 003의 외피와 002의 생활 프로그램에서 온다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 1600×1000 CSS pixel, DPR 1과 FOV 50°는 재현을 위한 저작 조건으로 명시된다. 실제 사용자 신체나 GPU의 성능에서 이 카메라 값을 도출했다고 주장하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 전체 topology 분모를 유지하고 작은 방이나 L자 경계의 실패도 원래 id로 남긴다. 잘 보이는 대체 위치를 골라 실패 관찰을 없애는 축소는 허용하지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 raster·렌즈·눈높이·threshold·모서리·내부 중심과 외부 거리의 도출 방식을 정했다. 관찰자가 각 방을 유리하게 보이도록 조건을 임의 발명해야 하는 개요가 아니다.
@evidenceReview principles/core/settings.md#fact-status #93a284a HTTP 200, canvas 수와 DOM 장치명은 실제 GPU 확인으로 인정하지 않는다. 카메라 높이 역시 가상 관찰 조건이며 인체 접근성 인증값으로 지위를 바꿀 수 없다.
@evidenceReview principles/core/settings.md#source-support #430bca9 chromium과 RENDERER는 사용자 지정 경로를 따르고 수치 카메라는 제작 입력으로 제한한다. 이 입력에 실제 인체 표준이나 장치 성능 자료의 외부 권위를 붙이지 않았다.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c 카메라와 절개는 관찰 도구이며 집이 실제로 벽을 제거하거나 방을 변형하는 능력이 아니다. 하부를 검사하기 위해 숨긴 면을 생산세계의 허용 상태로 읽지 않는 적용 판단이 맞다.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 0.25m 안쪽 조건을 만족하지 못하면 실패 id와 이유를 남기며 대체 view는 추가 질문이다. room 밖 중심점도 그대로 쓰지 않고 포함 판정과 선택 근거를 요구한다.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e 렌즈와 raster는 관찰되는 집을 구성하는 외형 canon이 아니다. 해당 장치가 기존 외피와 방 프로그램의 자기 동일성을 확인한다는 현재 관계는 장치 묘사를 건물 묘사의 대체물로 삼지 않는다.
-->

**근거: 이번 production의 재현 가능한 검사를 위한 저작 결정이다.** 실제 3D WebGL 뷰어에서 1600×1000 CSS pixel, deviceScaleFactor=1, 원근 카메라 수직 FOV 50°를 기본으로 한다. 외부와 방 안 모두 같은 재료·빛을 사용하며 컷마다 노출을 바꾸지 않는다. 외관의 완결 형상과 각 실내의 자기 동일성을 판정하며 미세 표면 촬영이나 실물 시공 인증으로 확대하지 않는다.

GPU 관찰은 사용자 지정 Playwright channel chromium에서 수행하고, WebGL 컨텍스트가 반환한 실제 RENDERER와 캡처한 URL·관찰 id·source 기준을 함께 기록한다. 기본 헤드리스 채널, DOM에 적힌 장치 이름, HTTP 200, canvas 개수만으로 GPU 실현을 인정하지 않는다. WebGL 컨텍스트나 실제 GPU 정보를 얻지 못하면 해당 관찰은 unverified다. source compile 실패·빈 캔버스·error banner·가려진 건물은 완료 프레임이 아니다.

검사의 분모는 [관찰과 종료](001-production.md#delivery-review-condition)가 소유한다. 설정은 대표 카메라 몇 개를 선택해 그 분모를 줄이지 않는다. 방의 눈높이는 해당 finished floor에서 1.60m, threshold 관찰은 해당 문 안쪽 0.25m를 기본으로 한다. 안쪽 모서리 관찰은 맞닿는 두 벽에서 각각 0.25m 떨어진 눈높이 점에서 방 안을 향한다. 이 값은 가상 검사 카메라 조건이며 거주자의 키나 인체 접근성 인증값이 아니다. 작은 공간이나 L자 경계에서 조건을 만족하지 못하면 그 id와 이유를 실패로 남기고 대체 위치는 추가 관찰로만 둔다.

중심 4방위의 시작점은 실제 room 안이어야 한다. 공간이 비볼록하여 평면 중심이 밖에 나오면 engine의 포함 판정으로 확인한 내부 중심을 사용하고 선택 근거를 기록한다. 외부 관찰은 topology의 노출 면 법선과 bounds에서 해당 면을 프레임에 넣는 거리를 파생한다. setting은 대지 전체, 입면은 해당 면 전체, 모서리는 접하는 두 면, 지붕과 하부는 각각 가림 없는 검사 위치를 가진다. 절개가 필요한 하부나 방 경계 관찰은 검사 모드로 명시하며 전달용 외관으로 세지 않는다. 위치·수·id의 최종 값은 source 사본이 아닌 현재 컴파일 산출물에서 읽는다.

## 사용자가 조작하는 범위 {#operator-access}

<!--
@evidence principles/core/common.md#declared-basis 한국어 library 운영자에게 허용할 camera·관찰·프라이버시·작업실 상태 선택을 제작 계약으로 정한다.
@evidence principles/core/common.md#scope-preservation 외부 궤도와 방 내부 관찰, 초기화·id 선택·두 작업실 상태를 빠뜨리지 않고 검사 도구를 기본 장면과 구분한다.
@evidence principles/core/common.md#substantive-completion 상태 변경의 producer 입력·정지 형상·패널 기록·검사 결과 재개와 source 치수 편집 금지를 결정한다.
@evidence principles/core/settings.md#fact-status 외피 숨김으로 생긴 시야는 clear glass의 성능이 아니며 조명 변경 frame을 기존 재료 증거로 쓰지 않는다.
@evidence principles/core/settings.md#source-support 공개 조작은 이 제작의 선택이며 현재 viewer가 이미 이를 구현했다거나 외부 UI 표준 인증을 받았다고 주장하지 않는다.
@evidence principles/core/settings.md#capability-boundary 사용자는 허용된 관찰과 정지 상태를 선택할 수 있지만 공간 그래프·source 치수나 중간 변형 애니메이션은 조작하지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency 라벨·절개·외피 숨김은 검사 모드에서만 켜고 기본 off로 두며 유리 상태는 채택한 세 종류로 제한한다.
@evidence principles/core/settings.md#observable-identity 운영자의 camera와 상태 선택은 접근 계약이며 별도의 시각 subject를 추가하지 않는다. 선택해 보이는 유리와 작업실의 실제 상태 형태는 003과 002의 해당 canon을 소비한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 한국어 library 사용자를 위한 관찰·상태 선택을 제작의 조작 계약으로 정한다. 현재 viewer에 그 기능이 이미 구현되어 있다는 관찰 사실을 근거로 삼지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 외부 궤도와 실내 원근, 초기화·id 선택, 두 침대 상태와 세 프라이버시 상태를 모두 접근 범위에 남겼다. 기본 화면과 검사 모드를 나눈다고 방 내부 관찰이 빠지지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 상태를 producer 입력으로 만들고 패널·관찰 기준에 기록하며 이전 결과를 그대로 유지하지 않도록 정한다. 버튼 이름만 두고 선택이 어떤 결과와 증거에 영향을 줄지 미정으로 남기지 않는다.
@evidenceReview principles/core/settings.md#fact-status #93a284a 외피를 숨긴 시야를 clear glass 성능으로 보고하지 않으며 조명이 달라진 frame을 이전 재료 증거로 쓰지 않는다. 조작으로 만든 검사 상태와 관찰하려는 속성의 사실 지위를 구분한다.
@evidenceReview principles/core/settings.md#source-support #430bca9 허용 조작은 이 제작이 채택한 인터페이스 계약이고 구현 완료나 UI 표준 인증을 주장하지 않는다. 명명된 선택 요소의 요구를 외부 사용성 시험 결과로 바꾸지 않았다.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c 사용자는 정해진 침대·유리의 정지 상태를 선택할 수 있지만 source 치수·공간 그래프·중간 변형을 조작하지 못한다. 관찰 권한이 설계 편집이나 자율 동작 제어로 넓어지지 않는다.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 숨김·절개·라벨·overlay는 검사 모드에서만 켜며 현재 room과 id는 건물을 가리지 않는 정보 패널에 남긴다. room 밖에서 본 화면을 방 내부 관찰로 기록할 수 없도록 적용 조건을 둔다.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e 운영자 제어는 새로운 시각 subject를 추가하지 않고 이미 정의된 유리와 침대 형태를 선택한다. 따라서 접근 방법을 설명한 이 H2에서 별도 가구나 외피 모습을 발명하지 않은 것이 맞다.
-->

**근거: 시민 주택 library를 평가할 한국어 사용자의 조작 계약이다.** 외부 궤도 회전·이동·확대, 방 안 원근 관찰, camera 초기화, 컴파일된 공간 및 관찰 id 선택을 제공한다. 외피 숨김·층 절개·라벨·관찰 오버레이는 검사 모드에서만 가능하고 기본은 모두 꺼짐이다. 선택한 공간 밖 카메라가 방 내부를 답한 것으로 기록되지 않도록 현재 room과 관찰 id를 화면 밖의 정보 패널에 표시한다.

가변 작업실은 기본 작업 상태와 추가 손님 수면 상태를 이름 있는 선택 요소로 전환한다. 두 상태 모두 같은 컴파일 producer의 명시 입력으로 정지 형상을 만들며 중간 변형 애니메이션은 제공하지 않는다. 상태를 바꾸면 이전 검사의 결과를 유지하지 않고 현재 선택을 정보 패널과 관찰 기준에 기록한다.

장면의 유리 상태는 [프라이버시](003-spatial-basis.md#privacy-states)의 낮·사적·야간 상태만 선택한다. 상태를 바꾸면 광학 표현과 shade 위치가 함께 바뀌고 그 상태를 관찰 기준에 기록한다. 벽을 숨겨 얻은 시야를 clear glass의 성능으로 보고하거나, 조명을 바꾼 프레임을 이전 재료의 읽힘으로 보고하지 않는다. 사용자는 source 치수나 공간 그래프를 뷰어에서 임의 편집하지 않는다.

## 접근성 납품의 분류 {#accessibility-products}

<!--
@evidence principles/core/common.md#declared-basis 시간축·주민·음성 없는 한국어 library라는 납품 형태에서 접근성 제품을 분류한다.
@evidence principles/core/common.md#scope-preservation 한국어 설명·텍스트 id·이름 있는 controls·focus·키보드 대안을 필수로 남기고 색과 pointer만에 의존하지 않는다.
@evidence principles/core/common.md#substantive-completion 필수 대안의 실현 owner와 자막·전사·오디오 설명의 의도적 부재, 비시각 사용자의 남는 한계를 함께 결정한다.
@evidence principles/core/settings.md#fact-status 텍스트 topology는 시각 자기 동일성의 동등한 비시각 인증이 아니고 실물 접근성은 미검증이다.
@evidence principles/core/settings.md#source-support 제품 분류는 이 납품의 결정이며 WCAG나 무장애 주택 인증을 통과했다는 외부 사실을 붙이지 않는다.
@evidence principles/core/settings.md#capability-boundary 키보드 대안과 음성 트랙의 분류는 납품 제품과 접근 경로의 조건이다. 이 H2가 집·주민의 상태 능력을 추가하지 않으며 실제 유리·침대의 허용 상태는 privacy-states와 flex-states가 소유한다.
@evidence principles/core/settings.md#constraint-sufficiency 불필요한 자막의 부재를 이유로 한국어 문서·focus·키보드 대안까지 빼거나 실제 문·계단 연결 의무를 줄이지 않는다.
@evidence principles/core/settings.md#observable-identity 텍스트·focus·키보드 대안의 분류는 접근성 납품이며 건물의 감각 정체를 새로 정의하지 않는다. 텍스트 topology가 001#delivery-fidelity의 시각 판정을 대신하지 않는 경계를 유지한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 음성·주민 캐릭터·시간축이 없는 한국어 library의 형태를 접근성 분류의 근거로 삼는다. 무조건 모든 매체 제품을 요구하거나 아무 대안도 필요 없다고 가정하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 문서·텍스트 id·이름 있는 controls·focus·키보드 선택과 카메라 대안을 필수로 남겼다. 자막이 없다는 결정을 pointer나 색에만 의존해도 된다는 범위 축소로 쓰지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 필수 제품의 viewer·README owner와 자막·전사·오디오 설명의 의도적 부재를 함께 정했다. 남는 비시각 사용자의 한계까지 명시해 접근성이라는 이름만 붙인 목록과 다르다.
@evidenceReview principles/core/settings.md#fact-status #93a284a 텍스트 topology가 건물의 시각적 자기 동일성을 대체 인증하지 않으며 실물 무장애·설비 조작은 미검증이라고 밝힌다. 대안을 제공하는 일과 동등한 시각 판정을 제공한 결과를 구분한다.
@evidenceReview principles/core/settings.md#source-support #430bca9 이 분류는 납품 선택이며 WCAG나 주택 무장애 인증을 받았다는 주장은 없다. 키보드 대안의 요구를 외부 인증 결과로 포장하지 않는다.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c 키보드 대안과 음성 트랙의 분류는 납품 접근 경로의 결정이다. 유리·침대의 실제 허용 상태를 해당 canon에 남긴 현재 적용은 사용자 인터페이스를 건물·주민의 새로운 생산세계 능력으로 취급하지 않는다.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 색만으로 상태를 구분하지 않고 글자와 focus를 제공하며 pointer drag만으로 접근을 제한하지 않는다. 실물 접근성 인증의 부재도 실제 문·계단 연결 의무를 줄이지 못한다.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e 텍스트와 focus의 접근성 분류는 집의 형태를 새로 정의하는 내용이 아니다. 현재 적용은 topology 설명을 실제 건물의 시각 정체와 동등한 증거로 취급하지 않는 경계를 정확히 유지한다.
-->

**근거: 시간축·주민 캐릭터·음성 트랙이 없는 한국어 library라는 납품 형태다.** 한국어 설명, 텍스트로 읽을 수 있는 공간/관찰 id 목록, 이름 있는 조작 요소, 보이는 키보드 focus, 키보드로 선택·초기화·회전·이동·확대하는 대안은 필수이며 viewer와 README가 실현한다. pointer drag만으로 장면 접근을 제한하지 않는다. 색만으로 검사 상태를 구분하지 않고 글자로 현재 공간·모드·유리 상태를 표시한다.

자막·음성 전사·오디오 설명 트랙은 의도적으로 없다. 납품에 대사·시간축·소리가 없기 때문이며, 시각 판정을 비시각 사용자에게 동등하게 제공했다고 주장하지 않는다. 텍스트 topology와 설계 설명은 제공하지만 건물의 시각적 자기 동일성을 대체 인증하지 않는다. 물리적 무장애 주택 인증과 실제 설비 조작의 접근성은 미검증이다. 이 경계는 문·계단을 실제로 연결해야 한다는 고정 그래프 의무를 없애지 않는다.
