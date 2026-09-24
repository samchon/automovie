# 재료 공통 틀

## 색 공간과 선형 변환 {#material-color-space}
<!--
@evidence principles/core/common.md#declared-basis 색 공간 H2는 hex가 저작 결정이고 선형값은 IEC 61966-2-1 식의 파생값이며 색 관계의 근거가 visual-grammar이고 원본 사진 픽셀 샘플이 아니라고 적는다.
@evidence principles/core/common.md#scope-preservation 색 공간 규칙은 재료 hex와 선형값의 관계만 정하고 노출·white balance는 lighting-state에 남긴다.
@evidence principles/core/common.md#substantive-completion 변환식의 두 구간(0.04045 이하 c/12.92, 초과 ((c+0.055)/1.055)^2.4)과 소수점 셋째 자리 기록, hex 우선 규칙을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation visual-grammar는 색 관계를 형용사로만 정했고 이 H2는 hex 저작·선형 파생·재계산 대조라는 수치 규약을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 색 공간 H2는 외관 수치의 표기 규약이며 각 재료 H2의 구성 문장과 분리된 외관 값의 형식을 정한다.
@evidence principles/design/materials.md#material-binding-interface 렌더러에 넘기는 base color가 선형값이라는 입력 규약을 정해 host owner와 source가 색 공간을 추측하지 않게 한다.
@evidence principles/design/materials.md#material-verification-address hex→선형 재계산 일치와 중성 조명 판에서 siding·trim·천장 흰 계열의 구별을 반증 견본으로 둔다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work settings 20-verification의 visual-grammar·reference-authority·lighting-state를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 색 맵과 hex fallback을 같은 sRGB→선형 규칙으로 해석해 텍스처가 기준색의 색 공간을 바꾸지 않는다.
@evidence obligations/core/common.md#production-language 이 파일과 재료 H2 46개는 한국어 본문으로 쓰였고 hex·선형 값 표기는 언어와 무관한 수치다.
@evidence obligations/core/common.md#purpose-fit 재료 값이 사진 복제가 아니라 visual-grammar 색 관계를 실제 3D blocking pass에서 읽히게 하는 목적에 맞춰졌다고 밝힌다.
@evidence obligations/design/materials.md#addressable-material-decisions 색 공간·표면 결·응답·결합·리뷰를 틀 H2 다섯 개로, 재료를 H2 41개로 나눠 각 결정을 따로 교체할 수 있게 했다.
@evidence settings/00-production.md#governing-aim 지배 목표가 요구한 재료의 읽힘을 이 색 공간 H2가 visual-grammar 색 관계를 hex·선형 상수로 고정하는 방식으로 받고, 41개 재료 H2가 같은 규약을 쓴다.
@evidence settings/20-verification.md#lighting-state 색 공간과 선형 변환이 '빛과 기준 상태'(settings/20-verification.md#lighting-state)를 링크로 소비해 규칙 값과 결합 면의 근거로 삼았다.
@evidence settings/20-verification.md#reference-authority 색 공간과 선형 변환이 '레퍼런스 권위'(settings/20-verification.md#reference-authority)를 링크로 소비해 규칙 값과 결합 면의 근거로 삼았다.
@evidence settings/20-verification.md#visual-grammar 색 공간과 선형 변환이 '공통 재료와 외피 인상'(settings/20-verification.md#visual-grammar)를 링크로 소비해 규칙 값과 결합 면의 근거로 삼았다.
@evidenceExclude settings/00-production.md#accessibility '접근성 전달 상태'는 "이 library의 필수 대체 접근은 한국어 문서, 이름 있는 키보드 조작, 카메라 복귀 및 관찰 선택, 색만으로 상태를 구분하지 않는 검사 결과다"를 정한다. 이는 production 운영·범위 결정이며 재료 hex·roughness·결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/00-production.md#coordinate-units '좌표와 단위'는 "제작 선택은 오른손 Y-up, 길이 m, 각도 rad, 면적 ㎡, 시간이 필요할 때 s다"를 정한다. 이는 production 운영·범위 결정이며 재료 hex·roughness·결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/00-production.md#coverage-map '설정 소유 지도'는 "현재 설정의 명시적 canon은 이 파일의 전달·사용·좌표·언어·접근성과 사용 가정, 10-house.md의 규모·매스·각 방과 조경 정체성, 20-verification.md의 레퍼런스…"를 정한다. 이는 production 운영·범위 결정이며 재료 hex·roughness·결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/00-production.md#delivery-scope '전달물'는 "사용자 브리프를 권위로 삼아 현대 미국 교외의 평범한 중산층 가족용 2층 단독주택 한 채, 전체 실내, 우측 붙박이 2대 차고와 주택을 읽는 데 필요한 대지를 결정론적 library로 저작한다"를 정한다. 이는 production 운영·범위 결정이며 재료 hex·roughness·결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/00-production.md#operative-subjects '작동 주체와 자원'는 "주택과 각 공간은 10-house.md의 해당 H2가 소유한다"를 정한다. 이는 production 운영·범위 결정이며 재료 hex·roughness·결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/00-production.md#operator-access '조작자와 접근'는 "저작 결정으로 조작자는 마우스와 키보드를 사용하는 데스크톱 검토자다"를 정한다. 이는 production 운영·범위 결정이며 재료 hex·roughness·결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/00-production.md#use-profile '사용과 통행 가정'는 "구조·생활 가능성을 검토하기 위한 저작 가정은 성인 둘과 자녀 둘이 쓰는 집이며 특수 의료장비나 상주 보조인의 동선을 요구하지 않는다"를 정한다. 이는 production 운영·범위 결정이며 재료 hex·roughness·결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/10-house.md#common-room '후면 공용부'는 "주방·식당·가족실은 본채 1층 후면의 하나의 연속 공간이다"를 정한다. 이는 매스·동선·치수 결정이며 재료 색과 응답을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/10-house.md#house-scale '규모'는 "사용자가 정한 약 246㎡는 측량값이 아닌 규모 목표다"를 정한다. 이는 매스·동선·치수 결정이며 재료 색과 응답을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/10-house.md#main-mass '본채 매스와 지붕'는 "사용자 그래프와 외관 레퍼런스 01의 관계를 채택한다"를 정한다. 이는 매스·동선·치수 결정이며 재료 색과 응답을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/10-house.md#service-band '우측 서비스 동선'는 "사용자 고정 그래프에 따라 본채 1층 우측 서비스 띠에 팬트리·파우더룸·세탁 겸 머드룸을 놓고 차고와 직접 연결한다"를 정한다. 이는 매스·동선·치수 결정이며 재료 색과 응답을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/20-verification.md#completion-boundary '완료와 기록'는 "../contracts/observation-denominator.md#dual-completion의 양쪽 목록과 독립 판정을 적용한다"를 정한다. 이는 저작·실행·검증·제출 절차의 경계이며 재료 상수와 결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/20-verification.md#data-authority '측정과 프레임의 책임'는 "사용자 지시에 따라 수·id·위치·binding·치수는 컴파일된 산출물에서 읽는다"를 정한다. 이는 저작·실행·검증·제출 절차의 경계이며 재료 상수와 결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/20-verification.md#execution-boundary '실행과 모듈 경계'는 "사용자 지시로 @automovie/engine의 CommonJS 경계를 유지한다"를 정한다. 이는 저작·실행·검증·제출 절차의 경계이며 재료 상수와 결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/20-verification.md#implementation-boundary '편집과 의존성 경계'는 "사용자가 허용한 편집 범위는 이 production의 저작 파일이다"를 정한다. 이는 저작·실행·검증·제출 절차의 경계이며 재료 상수와 결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/20-verification.md#observation-allocation '관찰 배분'는 "settings 전체 관찰 의무의 원문은 ../contracts/observation-denominator.md#compiled-denominator다"를 정한다. 이는 저작·실행·검증·제출 절차의 경계이며 재료 상수와 결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/20-verification.md#role-boundary '저작·계측·판정 권한'는 "사용자가 정한 역할에 따라 저작자는 이 production의 소스·자기 fan-out·수리를 소유하고, 관찰자는 계측하며, 독립 read-only reviewer가 단계 전이를 판정한다"를 정한다. 이는 저작·실행·검증·제출 절차의 경계이며 재료 상수와 결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/20-verification.md#submission-boundary '커밋과 푸시'는 "사용자의 현재 지시에 따라 저작자가 최소 매 turn 끝과 단계 폐쇄/뷰어 구현 때 커밋·푸시한다"를 정한다. 이는 저작·실행·검증·제출 절차의 경계이며 재료 상수와 결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/20-verification.md#validation-boundary '정규 검증 명령'는 "사용자가 지정한 검증 명령은 이 production 디렉터리에서 README가 소유하는 npm run lint 그대로다"를 정한다. 이는 저작·실행·검증·제출 절차의 경계이며 재료 상수와 결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude settings/20-verification.md#viewer-handoff '뷰어 실행 인계'는 "사용자와 조정자의 지시에 따라 뷰어를 구현했으면 시작 명령, 실행 디렉터리, 포트, 열어야 할 경로를 보고한다"를 정한다. 이는 저작·실행·검증·제출 절차의 경계이며 재료 상수와 결합 면을 정하지 않으므로 materials가 이 H2에 빚진 값이 없다.
@evidenceExclude spaces/00-building.md#attached-garage-extent '붙박이 빈 차고의 접면'는 "빈 차고는 본채 오른쪽에 하나의 단층 볼륨으로 붙는다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/00-building.md#main-building-extent '본채 외곽과 면적'는 "이 spaces의 외곽 선택은 규모와 좌표를 따른다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/01-storeys.md#ground-threshold-datums '포치와 차고의 지면 연결'는 "포치 바닥은 현관의 1층 완성 바닥과 같은 Y = 0 m다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/01-storeys.md#storey-datums '두 storey와 완성 바닥'는 "좌표 기준을 받아 ground-storey의 완성 바닥은 Y = 0 m, upper-storey는 Y = 3.06 m로 정한다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/02-stair.md#stair-clearance '난간과 통행의 순폭 예약'는 "경로의 1.15 m 폭 안에서 양쪽 손잡이·난간의 수평 점유를 각각 0.075 m 이내로 예약한다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/02-stair.md#stair-connector-handoff '하나의 연결에 속하는 두 flight와 중간참'는 "단일 꺾임계단을 실현한 계단 공간과 단별 치수는 유지한다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/02-stair.md#stair-floor-opening '계단 구멍과 전면 창의 경계'는 "위 경로와 하부 대기 면적에 한정하여, 층판 구멍은 X = [-1.80, -0.65]·Z = [-4.56, -0.25]의 세로 부분과 X = [-0.65, 1.87]·Z = [-4.56,…"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/04-observations.md#engine-render-handoff '공간 산출물에서 실제 렌더로 넘기는 경계'는 "설치된 공개 엔진의 lowerBuiltEnvironment는 환경을 검증하고 실제 model을 가진 element만 세계 변환의 set으로 내리며 원래 built environment도 보존한다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/04-observations.md#spatial-observation-derivation '공간 산출물에서 파생할 검사'는 "관찰 배분을 받아 전체 관찰 분모를 이 spaces 층에 그대로 적용한다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/05-route-network.md#room-route-network '문으로 답하는 두 층 동선'는 "아래 이름은 이 spaces 문서가 소스로 넘길 식별자다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/06-openings.md#external-opening-interface '거친 개구부와 충전 부재의 경계'는 "외부 개구부는 방 연결과 지붕 높이를 소비한다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/07-boundary-assembly.md#exterior-boundary-junctions '외벽 모서리와 지붕 단차의 단일 몸체'는 "이 접합은 본채 외벽과 차고 외벽/공유 벽의 예약 안에서 만나는 외부 경계를 잇는다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/07-boundary-assembly.md#interior-boundary-ownership '방 사이의 한 벽체와 두 안쪽 면'는 "이 설계는 두 storey 안에서 기존 방 사이의 칸막이를 한 번만 생성하기 위한 공간 인계다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/08-floor-assembly.md#interstorey-edge-junctions '외벽과 계단 가장자리에서 닫히는 층간 단면'는 "층간 구조는 본채 내부에서 외벽의 동일 안쪽 면에 닿는다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/09-ceiling-assembly.md#ceiling-roof-clearance '낮은 지붕과 천장 바탕의 접합 여유'는 "천장은 본채 실내 평면과 차고 실내 평면 각각의 안쪽 면까지이고, 지붕은 자기 외곽과 교차 경계를 갖는다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/09-ceiling-assembly.md#garage-ceiling-closure '차고문 이동 구역 위의 천장'는 "차고는 자기 바닥/천장 datum을 갖는 ground-storey 부속 공간이다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/10-ground-floor.md#garage-ground-floor-base '낮은 차고의 독립 바닥'는 "차고의 바탕은 차고 안쪽 외곽을 받으며 자기 완성 바닥에서 아래로 0.15 m를 예약한다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/10-ground-floor.md#ground-support-handoff '바닥 아래 지지와 지도 지표의 인계'는 "이 건물은 위 본채/차고 바탕 아래를 연속해서 받치는 채움과 가장자리 지지로 계획한다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/10-ground-floor.md#ground-threshold-junctions '외벽 두께 안에서 이어지는 네 출입 경계'는 "본채와 차고의 실내 바닥은 평면에서 벽 안쪽에 끝나지만, 출입 개구부 아래에는 벽 두께를 지나는 지지 바탕이 필요하다"를 정한다. 이 공간 H2는 geometry·datum·접합·관찰 파생을 정하고 materials는 결합 면을 spaces 03 owner 표로만 받으므로 이 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/front.md#bedroom-three-front-window '오른쪽 자녀실의 정면 창'는 "bedroom-three-front-window는 전면 벽의 X = [2.65, 4.75], Y = [3.91, 5.31] m 개구부로 upper-storey의 bedroom-three에 속한다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/front.md#bedroom-two-front-window '왼쪽 자녀실의 정면 창'는 "bedroom-two-front-window는 전면 벽의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 개구부로 upper-storey의 bedroom-two에 속한다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/front.md#front-entry-filling '목재 현관문의 외부 충전'는 "front-door의 void·순폭 목표·경첩/열림은 현관 owner 그대로다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/front.md#front-roof-closures '박공 삼각 벽과 포치 위의 외벽'는 "전면 전체 입면 owner는 src/spaces/envelope/front.ts다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/front.md#garage-front-opening '닫힌 차고문과 상부 이동 예약'는 "garage-front-door는 차고의 전면 벽 Z = [-0.55, -0.30] m에 X = [6.10, 11.10], Y = [-0.15, 2.15] m의 거친 개구부로 택한다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/front.md#living-front-window '포치 아래 거실 묶음창'는 "living-front-window는 전면 벽의 X = [-5.10, -2.30], Y = [0.70, 2.30] m 개구부로 ground-storey의 living-room에 속한다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/front.md#stair-front-window '층간 계단실의 작은 창'는 "stair-front-window는 전면 벽의 X = [-1.62, -0.84], Y = [4.11, 5.21] m 개구부다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/left.md#left-roof-closure '주 지붕 끝의 왼쪽 삼각 벽'는 "src/spaces/envelope/left.ts가 왼쪽 완결 입면을 소유한다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/left.md#living-left-window '거실 벽난로 뒤쪽의 창'는 "living-left-window는 왼쪽 벽의 Z = [-5.50, -4.30], Y = [0.75, 2.30] m 개구부로 ground-storey의 living-room에 속하는 방과 외벽이…"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/left.md#primary-left-window '주침실 본체의 측면 창'는 "primary-left-window는 왼쪽 벽의 Z = [-8.90, -7.30], Y = [3.91, 5.31] m 개구부로 upper-storey의 primary-bedroom에 속한다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/rear.md#family-rear-window '가족실의 후면 묶음창'는 "family-rear-window는 후벽의 X = [2.75, 4.75], Y = [0.75, 2.30] m 개구부다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/rear.md#garden-door '공용부에서 정원으로 나가는 문'는 "garden-door는 후벽의 X = [-1.20, 1.20], Y = [0, 2.25] m 개구부로 ground-storey의 kitchen-dining-family와 외부 대기를 잇는다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/rear.md#kitchen-rear-window '주방 조리대 위의 후면 창'는 "kitchen-rear-window는 후벽의 X = [-4.50, -3.30], Y = [1.15, 2.30] m 개구부로 ground-storey의 kitchen-dining-family에 속한다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/rear.md#primary-rear-window '주침실의 후면 묶음창'는 "primary-rear-window는 후벽의 X = [-3.85, -1.45], Y = [3.91, 5.31] m 개구부다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/rear.md#rear-roof-closures '두 본채 지붕과 차고 아래의 후면'는 "src/spaces/envelope/rear.ts가 본채와 차고의 후면 완결 입면을 소유한다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/right.md#family-right-window '가족실의 오른쪽 창'는 "family-right-window는 본채 오른쪽 벽의 Z = [-9.95, -8.25], Y = [0.75, 2.30] m 개구부로 ground-storey의…"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/right.md#garage-right-window '차고의 측면 채광창'는 "garage-right-window는 차고 오른쪽 벽의 Z = [-5.85, -4.25], Y = [1.40, 2.20] m 개구부로 ground-storey의 garage에 속한다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/envelope/right.md#right-roof-closures '본채 단차와 차고 위의 벽'는 "오른쪽 노출 입면의 owner는 src/spaces/envelope/right.ts다"를 정한다. 이 입면 H2는 void 좌표·박공 닫힘 같은 형상을 정하고 materials는 그 면을 spaces 03 owner 표와 models 창·문 파티션으로 받으므로 이 좌표 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/00-junctions.md#roof-mass-allocation '본채 위의 세 박공과 낮은 차고'는 "본채와 차고 외곽, 두 층 천장을 유지하며 설정의 지붕군을 배치한다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/00-junctions.md#roof-profile-datums '날씨를 받는 면과 아래면'는 "여기서 높이 함수는 지붕 최상부 날씨 면의 Y를 뜻한다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/00-junctions.md#roof-shared-edges '전면 박공의 골짜기와 단차'는 "전면 박공은 주 지붕 앞쪽에 합류한다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/00-junctions.md#roof-wall-head-junctions '지붕에 닿는 외벽 두께 전체의 상단'는 "본채와 차고의 외벽은 각각 본채와 차고의 기존 외곽과 안쪽 면 사이를 점유하고 자기 지붕 아래에서 닫힌다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/front-gable-left.md#front-gable-left-roof '전면 왼쪽의 박공 지붕'는 "roof.front-gable.left는 박공 중심보다 -X 쪽의 면이다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/front-gable-right.md#front-gable-right-roof '계단 창 쪽으로 내려가는 박공'는 "roof.front-gable.right는 정면 왼쪽의 전방 박공 가운데 박공 중심보다 +X 쪽의 면이며 src/spaces/roof/front-gable-right.ts가 소유한다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/garage-back.md#garage-back-roof '차고 후벽과 본채 접합'는 "roof.garage.back과 아래면은 src/spaces/roof/garage-back.ts가 소유한다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/garage-front.md#garage-front-roof '패널문 위의 경사면'는 "roof.garage.front는 차고 지붕 영역의 앞 절반이다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/main-back.md#main-back-roof '뒤쪽 처마까지 이어지는 주 지붕'는 "roof.main.back과 아래면은 src/spaces/roof/main-back.ts가 소유한다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/main-front.md#main-front-roof '전면 박공과 굴뚝을 받는 면'는 "roof.main.front의 owner는 src/spaces/roof/main-front.ts다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/right-back.md#right-back-roof '후면까지 닫히는 오른쪽 지붕'는 "roof.right.back과 아래면은 src/spaces/roof/right-back.ts의 완결 면이다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/roof/right-front.md#right-front-roof '높은 지붕 아래에 붙는 앞 면'는 "roof.right.front는 본채 오른쪽 영역의 앞 절반이다"를 정한다. 이 지붕 H2는 경사면·교차의 높이와 윤곽을 정하고 materials의 shingle·trim은 spaces 03 owner 표의 경사면 owner에 결합하므로 이 윤곽 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/bedroom-three.md#bedroom-three-furniture-use '청회색 침실의 꺾인 경계 안 배치'는 "같은 bedroom-three/upper-storey에서 왼쪽 부분에 잠자리, 전면 중앙에 책상, 오른쪽 벽에 옷장을 배치한다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/bedroom-three.md#bedroom-three-plan '도착면에서 들어오는 청회색 침실'는 "bedroom-three는 upper-storey의 전면 오른쪽 방이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/bedroom-two.md#bedroom-two-furniture-use '올리브 침실의 잠자리·공부·옷 수납'는 "같은 bedroom-two/upper-storey에서 침대는 뒤쪽 왼편, 책상은 왼쪽 벽의 전면 창 가까이, 옷장은 오른쪽 벽에 둔다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/bedroom-two.md#bedroom-two-plan '올리브 침실의 자기 경계'는 "bedroom-two는 upper-storey의 전면 왼쪽 방이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/common.md#common-clear-routes '가구 작업 영역을 돌아가는 공용 동선'는 "같은 kitchen-dining-family 내부의 경로이며 벽/문/새 복도를 추가하지 않는다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/common.md#common-dining-reservation '여섯 식사 좌석과 정원문 대기'는 "식사 구역은 같은 공용부 중앙에 두고 정원문 앞을 비운다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/common.md#common-family-reservation '오른쪽 가족실의 좌석과 창 접근'는 "가족실은 같은 공용부의 오른쪽이며 설정이 요구한 소파와 낮은 테이블을 둔다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/common.md#common-island-reservation '싱크 섬과 세 좌석의 점유'는 "섬은 같은 공용부의 X = [-3.65, -2.60], Z = [-8.70, -6.45] m에 놓는다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/common.md#common-kitchen-wall-reservation '왼쪽 벽 주방의 기구와 작업 점유'는 "이 주방은 위 kitchen-dining-family/ground-storey 내부의 기능 구역이며 별도 room이나 칸막이가 없다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/common.md#common-room-plan '공용부의 외곽과 열린 앞면'는 "kitchen-dining-family는 ground-storey의 방 하나다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/entry.md#entry-coat-storage '위 계단 아래의 닫힌 외투장'는 "현관에서 연결된 서비스 접근을 따라 닿는 현관 가까운 외투 수납인 외투장을 위 flight 아래의 높은 끝에 둔다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/entry.md#entry-plan '포치에서 거실과 계단으로'는 "front-entry는 ground-storey의 실내 분배 공간이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/entry.md#entry-use-routes '현관문 뒤의 매트와 분배 바닥'는 "같은 front-entry/ground-storey의 목재 현관문과 얕은 매트를 소비한다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/garage-interior.md#garage-storage-use '후벽 선반과 공구 작업대'는 "같은 garage/ground-storey의 후벽에 수납을 모아 중앙 바닥과 서쪽 머드룸 대기를 비운다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/garage-interior.md#garage-use-routes '문을 닫은 차고의 내부 접근'는 "머드룸의 차고 쪽 하부 대기에서 같은 garage 내부의 선반, 작업대, 측면 창, 닫힌 전면문 안쪽으로 이동한다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/laundry.md#laundry-equipment-use '나란한 두 기기와 신발 벤치의 사용'는 "같은 laundry-mudroom/ground-storey 안에서 오른쪽 기기 벽과 왼쪽 신발 벤치를 배정한다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/laundry.md#laundry-plan '서비스 통로와 차고 사이'는 "laundry-mudroom은 ground-storey의 실제 방이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/laundry.md#laundry-through-route '기기를 열어도 남기는 차고 횡단'는 "이 경로는 두 출입문과 양쪽 대기를 잇는 같은 방 안의 바닥 띠다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/living.md#living-plan '거실 경계와 직접 출입'는 "living-room은 ground-storey에 속하며 마감 안쪽 X = [-5.50, -1.95], Z = [-6.05, -0.25] m다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/living.md#living-through-route '두 출입과 창·좌석으로 이어지는 바닥'는 "같은 living-room 내부에서 현관 쪽 문과 공용부 쪽 개구부를 잇는다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/pantry.md#pantry-plan '뒤쪽 식품 수납실'는 "pantry는 ground-storey, 서비스 접근의 뒤쪽에서 직접 들어가는 방이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/pantry.md#pantry-storage-use 'L형 선반과 식품의 점유'는 "같은 pantry/ground-storey의 선반 평면을 소비한다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/pantry.md#pantry-use-route '열린 문에서 선반까지의 사용 통로'는 "위 실문을 90° 열고 pantry 안에서 수납을 사용하는 상태를 예약한다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/powder.md#powder-plan '단일 출입과 기구 예약'는 "powder-room은 ground-storey, 서비스 띠의 앞쪽 독립실이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/primary.md#primary-plan '복도와 옷방에 직접 닿는 주침실'는 "primary-bedroom은 upper-storey의 가장 큰 침실이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/service.md#service-access-plan '오른쪽 통로와 계단 뒤 연결'는 "service-access는 ground-storey의 열린 L형 동선이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/tub-bath.md#tub-bath-plan '복도 끝에서 직접 들어가는 욕실'는 "tub-bathroom은 upper-storey의 오른쪽 독립 욕실이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/upper-hall.md#upper-hall-plan '하나의 복도에서 다섯 방으로'는 "upper-hall은 upper-storey의 복도 하나다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/upper-hall.md#upper-linen-storage '도착면 앞쪽 린넨장'는 "복도 도착면의 앞쪽에 닫힌 린넨장을 둔다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/wardrobe.md#primary-wardrobe-plan '사람이 들어가는 옷 수납실'는 "primary-wardrobe는 upper-storey의 실제 공간이다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/rooms/wardrobe.md#wardrobe-storage-use '후면 옷걸이와 접는 수납의 사용'는 "같은 primary-wardrobe/upper-storey의 후면 수납 예약을 수납 설정의 옷걸이/선반으로 사용한다"를 정한다. 이 방 H2는 평면·순치수·점유 예약을 정하고 materials는 그 방 마감을 spaces 03 interior-surface-handoff owner 면과 models 파티션으로 받으므로 이 평면·점유 결정에 빚진 것이 없다.
@evidenceExclude spaces/site/00-access.md#map-handoff-inputs '지도에서 받아야 할 경계와 지표 입력'는 "이 H2는 house-site가 maps로부터 받아야 할 입력과 거부할 불일치를 소유한다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/00-access.md#site-access-interface '외부 네트워크에 넘길 포장 끝'는 "house-site는 본채와 차고, 포치와 아래의 외부 접근 구역을 포함할 site다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/00-access.md#site-local-routes '포장과 계단의 내부 연결'는 "이 H2는 현관 포치와 외부 진입의 포치·현관 직접 접근과 대지와 식재의 후면 테라스·우측 목재 울타리를 house-site 안의 구간 순서로 잇는다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/01-paving-support.md#paving-contact-handoff '포장 사이와 지표에서 끝나는 지지'는 "각 완결 포장 owner는 자기 평면 외곽에서 끝나고 상대의 상면/아래면을 동일 좌표로 소비한다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/01-paving-support.md#raised-platform-support '높은 포치와 테라스의 닫힌 단면'는 "현관 포치와 정원 테라스는 자기 높은 평탄면과 외부 단을 유지한다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/fence.md#fence-gate-junction '오른쪽 앞 면의 관리문 접속'는 "위 오른쪽 앞 구간에서 side-yard-gate의 개구부 X 구간을 그대로 비운다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/fence.md#fence-ground-profile '지표를 받는 높이와 점유'는 "울타리 패널 상단은 관리문의 문짝 상단과 같은 world 높이로 예약한다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/side-walk.md#side-gate-interface '측면 울타리 문과 양쪽 대기'는 "위 보행면에서 gate 앞을 side-front-access, 뒤를 side-rear-access의 두 외부 구역으로 택하고 둘 다 house-site/ground-storey에 속한다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/side-walk.md#side-walk-plan '차도와 테라스 아래 대기를 잇는 보행면'는 "side-walk는 house-site/ground-storey의 연속 외부 보행면이다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/terrace.md#garden-lower-landing-plan '정원 지표에 닿을 아래 대기'는 "garden-lower-landing은 house-site/ground-storey의 외부 대기 구역이다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/terrace.md#garden-steps-plan '테라스에서 지표로 내려가는 단'는 "garden-steps는 house-site/ground-storey의 외부 연결 구역이며 위 테라스와 아래 대기를 잇는다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidenceExclude spaces/site/terrace.md#garden-terrace-plan '정원문 대기와 포장 테라스'는 "garden-terrace는 대지와 식재가 공용부에서 닿게 둔 작은 포장 테라스이며 house-site/ground-storey의 외부 공간이다"를 정한다. 이 대지 H2는 포장·울타리의 평면과 높이식을 정하고 materials는 그 owner 상면을 spaces 03 표와 paving-depth-reservation을 통해 받으므로 이 높이식에 빚진 것이 없다.
@evidence settings/00-production.md#working-language 작업 언어가 한국어이므로 재료 문서 네 개와 materials account를 한국어 본문으로 쓰고 hex·선형값만 언어 중립 수치로 둔다.
-->

모든 재료의 기준색은 sRGB 8비트 hex로 저작하고, 렌더러에 넘기는 base color는 그 hex를 IEC 61966-2-1 sRGB 전달 함수로 선형화한 값이다. 변환식은 채널 값 c(0–1)가 0.04045 이하이면 c / 12.92, 그보다 크면 ((c + 0.055) / 1.055)^2.4이며 각 재료 H2는 hex와 소수점 셋째 자리까지의 선형 RGB를 함께 적는다. 두 값이 어긋나면 hex가 저작 결정이고 선형값은 파생값이므로 source는 hex에서 선형값을 다시 계산해 문서 값과 대조한다. 생성한 색 텍스처 채널에도 같은 sRGB→선형 변환을 적용해 기준색 fallback과 색 공간이 달라지지 않게 한다. 이 hex는 [레퍼런스 권위](../settings/20-verification.md#reference-authority)에 따라 원본 사진의 픽셀을 샘플링한 값이 아니라 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 색 관계(따뜻한 백색 siding, 짙은 charcoal, 흰 trim, 붉은갈색 벽돌, 꿀빛/중간갈색 목재, 회베이지 직물)를 이 branch가 수치로 정한 선택이다. 출력은 [고정 노출과 white balance](../settings/20-verification.md#lighting-state) 아래 sRGB로 표시하며 재료 값이 view별 노출 보정을 흡수하지 않는다. source owner는 `src/materials/frame.ts`이고, 리뷰는 각 재료의 hex→선형 재계산 일치와 중성 조명 견본 판에서 흰 계열(siding·trim·천장)이 서로 구별되는지를 관찰한다.

## 표면 결·광학 응답과 텍스처 결속 {#material-texture-response}
<!--
@evidence principles/core/common.md#declared-basis 사용자가 같은 날 비트맵 보류를 철회한 지시를 근거로 삼고 매끈한 표면과 반복 결이 필요한 표면을 구별한다.
@evidence principles/core/common.md#scope-preservation course·줄눈·판 두께는 models/instances에 남기고 색·거칠기·법선 결의 생성과 면 결속만 materials가 받으며 발광은 systems에 남긴다.
@evidence principles/core/common.md#substantive-completion 미터 모듈·투영 축·원점·회전·이음·실패 fallback과 validateTextureScale의 실제 모집단을 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation fidelity의 부재 읽힘 위에 각 표면의 물리 scale을 가진 결정론적 텍스처와 매끈한 광학 예외를 더한다.
@evidence principles/design/materials.md#material-construction-appearance course·줄눈·shingle 형상과 색·거칠기·법선 결, 유리의 투과를 서로 다른 책임으로 나눈다.
@evidence principles/design/materials.md#material-binding-interface 표면 id와 UV의 미터 단위 축·원점·이음, host 경계 및 validateTextureScale 결속을 정한다.
@evidence principles/design/materials.md#material-verification-address 1 m·2 m 근접과 리뷰 거리에서 실제 결·광학 응답·타일 모듈을 반증하고 빠진 map은 fallback으로만 기록한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work settings fidelity와 visual-grammar의 불규칙 색 패치 금지를 적힌 그대로 소비했고 부모 결함은 없었다.
@evidence contracts/texture-readability.md#material-texture-readability 반복 표면의 실제 결·물리 scale·UV·이음과 매끈한 표면의 광학 응답, 실패 fallback을 이 H2가 공통으로 정한다.
@evidence obligations/core/common.md#proportionate-development 물리 scale과 실제 읽힘이 필요한 표면만 결정론적 맵으로 만들고 매끈한 유리·거울은 광학 응답으로 처리한다.
@evidence settings/20-verification.md#fidelity 표현 수준이 요구한 실제 마감 읽힘을 생성식·UV 결속·광학 응답으로 구현할 규칙을 정한다.
-->

사용자가 같은 날 비트맵 보류를 철회했으므로 [표현 수준](../settings/20-verification.md#fidelity)의 실제 재료 읽힘을 텍스처와 광학 응답까지 구현한다. siding course·벽돌 줄눈·shingle 겹침처럼 두께와 접합을 설명하는 부재는 models/instances가 만들고, 재료는 그 완결 표면에 결정론적 색·거칠기·법선 결을 결속한다. 유리·거울·유약은 무늬를 억지로 칠하지 않고 투과·반사·곡면 하이라이트로 읽힌다. 발광은 systems 조명에 남긴다. 제공 레퍼런스를 표면에 붙이지 않으며 맵 픽셀은 검토 가능한 TypeScript 생성식과 명명된 물리 파라미터에서 나온다. 각 H2는 결합 파티션, 반복 모듈의 미터 치수, U/V 축·원점·회전, 부재·코너·void에서의 이음, 기준색 fallback을 정한다. 세계 벽면은 벽 길이 U·높이 V, 바닥은 X/Z, 지붕은 처마 평행 U·경사 위쪽 V를 기본으로 하고 모델 부재는 선언된 국소 축을 쓴다. 실제 binding의 `coordinateSource`와 UV를 `validateTextureScale`에 넣어 검사하며 빈 모집단의 성공은 거부한다. 맵이 없거나 로드에 실패하면 각 H2의 기준색·roughness가 진단 fallback이지만 그것을 최종 시각 합격으로 세지 않는다. source owner는 `src/materials/frame.ts`이고 실제 맵·결속·GPU 판정은 아직 unverified다.

## 거칠기·금속성 관례 {#material-response-conventions}
<!--
@evidence principles/core/common.md#declared-basis roughness 대역이 오후 key·하늘 fill 아래 광택 위계를 위한 저작 선택이며 측정 BRDF가 아니라고 밝힌다.
@evidence principles/core/common.md#scope-preservation 광택·금속성 대역만 정하고 발광과 조명 세기는 systems가 소유한다고 남긴다.
@evidence principles/core/common.md#substantive-completion 네 roughness 대역(0.02–0.05, 0.25–0.40, 0.45–0.65, 0.80–0.95)과 metallic 1.0 대상(스테인리스 가전·수전·거울 은막)을 모두 열거했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation lighting-state는 재질 반응을 materials에 넘겼고 이 H2가 그 반응을 대역 수치로 구체화한다.
@evidence principles/design/materials.md#material-construction-appearance 창틀·차고문·난간살은 구성상 금속이어도 외관이 도막이므로 metallic 0.0이라는 구성–외관 관계를 명시한다.
@evidence principles/design/materials.md#material-binding-interface transmission은 투명 유리만 0보다 크다는 조건으로 host가 받을 응답 종류를 한정한다.
@evidence principles/design/materials.md#material-verification-address 같은 조명의 견본 구 배열에서 대역 순서대로 하이라이트 폭이 좁아지는지를 반증 견본으로 둔다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work lighting-state의 오후 key·하늘 fill·고정 노출을 적힌 그대로 소비했고 부모 결함은 없었다.
@evidence contracts/texture-readability.md#material-texture-readability 거칠기 맵을 쓰더라도 이 H2의 재료별 0–1 대역과 광택 순서를 유지한다.
@evidence obligations/design/materials.md#material-response roughness 네 대역과 metallic·transmission 규칙으로 모든 재료의 응답 범위를 정했다.
@evidence settings/20-verification.md#lighting-state 거칠기·금속성 관례가 '빛과 기준 상태'(settings/20-verification.md#lighting-state)를 링크로 소비해 규칙 값과 결합 면의 근거로 삼았다.
@evidence settings/20-verification.md#renderer-boundary 실제 3D viewer의 재질 입력으로 선형 base color·roughness·metallic·transmission 상수를 넘기고 발광은 재료에 두지 않아 조명 기구가 발광판으로 공간을 지우지 않게 한다.
-->

기준 roughness는 0–1 값으로 다음 대역을 쓴다. 거칠기 맵의 국소 변조도 해당 재료의 대역을 벗어나거나 광택 순서를 뒤집지 않는다. 광택 유리·거울 0.02–0.05, 반광 도장·에나멜·도기 0.25–0.40, 무광 도장 벽·목재 오일 마감 0.45–0.65, 벽돌·콘크리트·shingle·직물 0.80–0.95. metallic은 도장하지 않은 노출 금속(스테인리스 가전, 수전, 거울 은막)만 1.0이고 도장된 금속 부재(창틀·차고문·검은 분체 도장 난간살과 손잡이)는 표면이 도막이므로 0.0으로 둔다. transmission은 투명 유리만 0보다 크다. 이 대역은 [빛과 기준 상태](../settings/20-verification.md#lighting-state)의 오후 key와 하늘 fill 아래에서 재료 사이의 광택 위계를 만들기 위한 저작 선택이며 측정한 BRDF가 아니다. 각 재료 H2의 값은 이 대역 안에 들어야 하고 벗어나면 그 H2가 이유를 적는다. source owner는 `src/materials/frame.ts`이며, 리뷰는 같은 조명의 견본 구 배열에서 대역 순서대로 하이라이트 폭이 좁아지는지를 관찰한다.

## 면 결합 규칙 {#material-binding-rule}
<!--
@evidence principles/core/common.md#declared-basis 결합 대상이 spaces 03의 exterior-surface-handoff와 interior-surface-handoff owner 표라고 링크로 밝힌다.
@evidence principles/core/common.md#scope-preservation 재료는 면의 경계·두께·개수를 바꾸지 않고 host owner 면에만 결합한다고 정한다.
@evidence principles/core/common.md#substantive-completion 한 면 한 재료, host 부재 경계와 일치, 삼각형 단위 분할 금지, 단면 기본과 유리·얇은 커튼 양면 규칙을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation surface-allocation은 동일 surface binding만 요구했고 이 H2는 경계 일치와 법선 방향 조건을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 결합 경계는 구성상 부재 경계(trim 돌출·문턱·걸레받이·기단 윗선)와 같고 외관 값이 새 경계를 만들지 않는다.
@evidence principles/design/materials.md#material-binding-interface 바깥면 법선은 host owner가 정한 방향이고 재료는 그 surface vocabulary에 붙기만 한다고 정한다.
@evidence principles/design/materials.md#material-verification-address 컴파일 산출물에서 재료 없는 면·두 재료를 받은 면의 수 0과 경계선 일치를 검사 모드 view로 반증한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work spaces 03의 exterior/interior surface handoff 표를 적힌 그대로 소비했고 부모 결함은 없었다.
@evidence contracts/texture-readability.md#material-texture-readability texture 좌표와 재료가 같은 안정 part id에 결속되고 한 면의 끝에서 함께 끊긴다.
@evidence obligations/core/common.md#layer-boundary 재료는 host 면의 경계·두께·개수를 바꾸지 않고 spaces/models의 면에만 결합한다.
@evidence obligations/design/materials.md#material-surface-assignment 한 면 한 재료, 부재 경계와의 일치, 단면/양면 방향을 모든 결합의 공통 조건으로 정했다.
@evidence spaces/03-surface-owners.md#exterior-surface-handoff 면 결합 규칙이 '입면·지붕·층의 소유'(spaces/03-surface-owners.md#exterior-surface-handoff)를 링크로 소비해 규칙 값과 결합 면의 근거로 삼았다.
@evidence spaces/03-surface-owners.md#interior-surface-handoff 면 결합 규칙이 '방 내부의 완결 면 소유'(spaces/03-surface-owners.md#interior-surface-handoff)를 링크로 소비해 규칙 값과 결합 면의 근거로 삼았다.
@evidence settings/20-verification.md#surface-allocation materials가 동일 surface binding으로 마감을 구현하라는 인계를 한 면 한 재료·host 부재 경계 일치 규칙으로 받는다.
@evidence settings/00-production.md#build-allocation 제작 배분이 표면 표현을 materials에 두었으므로 이 규칙은 표현만 결합하고 부재·원형은 models, 반복 개체는 instances에 남긴다.
-->

재료는 [완결 시각 표면의 소유 분해](../spaces/03-surface-owners.md#exterior-surface-handoff)와 [방 내부의 완결 면 소유](../spaces/03-surface-owners.md#interior-surface-handoff)가 정한 owner의 면에 결합하고, 면의 경계·두께·개수는 바꾸지 않는다. 한 면에는 정확히 한 재료가 붙고 두 재료가 만나는 선은 host owner가 이미 가진 부재 경계(trim 돌출, 문턱, 걸레받이, 기단 윗선)와 일치해야 한다. 같은 면을 삼각형 단위로 나눠 다른 재료를 칠하는 방식으로 경계를 새로 만들지 않는다. 맵 좌표도 같은 part id에 결속하고 U/V의 축·원점·회전·반복 모듈을 그 part에 기록하며 이음은 실제 host 부재 끝에서만 바뀐다. 바깥면 법선은 host owner가 정한 바깥 방향이며 재료는 단면(single-sided) 기본값을 쓰고 유리·얇은 커튼만 양면이다. source owner는 `src/materials/bindings.ts`이고, 리뷰는 컴파일된 산출물에서 재료 없는 면·두 재료를 받은 면의 수가 0인지와 경계선이 host 부재 끝선과 일치하는지를 검사 모드 view로 관찰한다.

## 재료 리뷰 견본 {#material-review-set}
<!--
@evidence principles/core/common.md#declared-basis 견본 조건이 frame-condition의 1536×1024 canvas·중성 배경과 lighting-state에서 온다고 밝힌다.
@evidence principles/core/common.md#scope-preservation 재료 판정 견본만 정하고 관찰 위치·결과는 컴파일 산출물과 현재 GPU 프레임에서 읽는다고 남긴다.
@evidence principles/core/common.md#substantive-completion 중성 조명 판, 기준 상태 판, 약 20 m·2 m·threshold·1 m 거리 견본, 상태 견본 네 가지와 실패 시 unverified 처리를 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation frame-condition은 view 기본값만 정했고 이 H2는 0.5 m 구·평판 배열과 6500 K 상당 방향광을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 근접 거리 견본은 구성(geometry 결)을, 조명 판은 외관(색·광택)을 따로 반증한다.
@evidence principles/design/materials.md#material-binding-interface 실제 host 위 거리 견본에서 재료 경계와 host 부재 끝선의 일치를 본다.
@evidence principles/design/materials.md#material-verification-address 명도 순서(흰 trim > 천장 > 실내 벽 > siding)와 roughness 대역별 하이라이트 폭 순서를 한 화면에서 반증하는 판을 정한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work frame-condition과 lighting-state를 적힌 그대로 소비했고 부모 결함은 없었다.
@evidence contracts/texture-readability.md#material-texture-readability 근접·리뷰 거리 견본과 실제 host에서 텍스처 scale·이음·광학 읽힘을 반증한다.
@evidence obligations/design/materials.md#material-review-set 중성 조명 판·기준 상태 판·거리 견본·상태 견본을 정해 타일링·경계·면 오류를 극적 shot 전에 반증한다.
@evidence settings/20-verification.md#frame-condition 재료 리뷰 견본이 '리뷰 프레임 조건'(settings/20-verification.md#frame-condition)를 링크로 소비해 규칙 값과 결합 면의 근거로 삼았다.
@evidence settings/20-verification.md#lighting-state 재료 리뷰 견본이 '빛과 기준 상태'(settings/20-verification.md#lighting-state)를 링크로 소비해 규칙 값과 결합 면의 근거로 삼았다.
@evidence settings/20-verification.md#lifecycle-boundary 제작 순서의 '재료 읽힘과 정리' 단계를 이 견본 네 가지로 판정하고 앞 단계의 공간·부재 결과를 되돌리지 않는다.
-->

재료 판정은 극적 shot 전에 고정된 견본으로 한다. 첫째 견본은 중성 조명 판이다. [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 1536×1024 canvas와 중성 배경 위에 모든 재료 H2를 0.5 m 구와 0.5 m 평판으로 한 줄씩 놓고, 색온도 6500 K 상당의 방향광 하나와 균일한 환경광 아래 고정 노출로 찍는다. 이 판은 hex 명도 순서(흰 trim > 천장 > 실내 벽 > siding, charcoal 창틀 < 차고문)와 roughness 대역별 하이라이트 폭 순서를 한 화면에서 반증한다. 둘째 견본은 기준 상태 판이다. 같은 배열을 [빛과 기준 상태](../settings/20-verification.md#lighting-state)의 오후 key·하늘 fill과 켜진 따뜻한 실내등 아래 다시 찍어 따뜻한 조명에서 흰 계열이 서로 합쳐지거나 올리브·청회색 침구가 구별을 잃는지 본다. 셋째는 실제 host 위 거리 견본이다. 외부는 01 기본 view(사람 눈높이 1.6 m, 약 20 m)와 벽 앞 2 m 근접 view, 실내는 각 방 threshold view(바닥 위 1.6 m, 수직 FOV 60°)와 가구 앞 1 m 근접 view에서 재료 경계가 host 부재 끝선과 맞는지, 재료 없는 면이나 두 재료를 받은 면이 있는지, 실제 부재와 결속된 텍스처의 물리 scale·이음, 매끈한 표면의 광학 응답이 리뷰 거리에서 읽히는지 관찰한다. 넷째는 상태 견본이다. 이 production의 재료에는 시간 변화나 젖음·마모 상태가 없으므로 기준 상태 하나만 검사하고, 문 열림 상태에서 문짝 모서리가 같은 재료를 유지하는지만 더 본다. source owner는 `src/materials/review.ts`이며 관찰 위치와 결과는 컴파일된 산출물과 현재 GPU 프레임에서 읽고, 판이 없거나 실패하면 해당 재료 판정은 unverified로 남긴다.
