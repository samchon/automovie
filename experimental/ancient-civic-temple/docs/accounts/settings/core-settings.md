# 설정 population의 소유와 일관성

## 독립 사실의 주소 {#canonical-addresses}

<!--
@evidence obligations/core/settings.md#addressable-canon 방 기능과 물체 형상을 30-interiors/35-objects로 나누고 대지·먼 지형, 운영 접근·접근성·관찰 프레임, 실행 권한·커밋 절차를 각각 별도 H2로 읽었다. 표는 그 소유를 연결하며 별도 사실을 표 속에 숨기지 않는다.
-->

<!--
@evidenceReview obligations/core/settings.md#addressable-canon sanctuary/altar의 접근과 크기, use-profile/ground-access의 포락과 단차, site/distant-terrain의 국소·먼 범위를 각각 읽었다. 독립 변경 가능한 결정은 별도 H2에 있고 세 분류 표는 그 주소를 연결하므로 표가 유일 소유가 아니다.
-->

제실의 공간 역할은 [sanctuary](../../settings/30-interiors.md#sanctuary), 제단의 물체 비례는 [altar](../../settings/35-objects.md#altar)다. 두 소유는 접근 여백과 물체 크기를 서로 참조하고 같은 치수를 복사하지 않는다. 업무방에서 쓰는 책상과 스툴은 하나의 [작업 집기 관계](../../settings/35-objects.md#workstation)를 가지며 관리실의 작성과 기록실의 열람 역할은 각 방이 따로 소유한다. 건물의 [사용 포락](../../settings/10-building.md#use-profile)과 [바닥 단차](../../settings/10-building.md#ground-access), [국소 대지](../../settings/40-environment.md#site)와 [먼 지형](../../settings/40-environment.md#distant-terrain)은 서로 다른 결정 조건이다. 00-delivery의 소유 지도·작동 주체 표·제작 대상 표는 이 주소들을 분류하며 새 물체 형상이나 방 규칙의 유일한 거처가 아니다. 50-production은 reference 권위·표현 수준·CJS·GPU·실행·판정·계측·Git 절차의 독립 변경을 각각 주소로 노출한다.

## 건물 전체의 시각 규칙 {#visual-system}

<!--
@evidence obligations/core/settings.md#production-visual-grammar 외피의 낮은 날개/높은 제실 박공과 공통 팔레트를 실내 용도·물체 크기·낮 조명에 대조했다. 분수/신상 예외는 방 소유에서 해결하고 배경은 신전과 하늘을 분리하는 보조 역할로 제한된다.
-->

<!--
@evidenceReview obligations/core/settings.md#production-visual-grammar 낮은 날개/높은 박공을 실내 천장과, 밝은 돌/어두운 목재를 제단·가구와 대조했다. 붉은 띠의 업무방 예외와 잔형 분수·인체 신상 비채택은 특정 소유에 한정돼 건물 전체의 팔레트나 낮 상태를 무효화하지 않는다.
-->

10-building의 단층·한 중정·직사각 관계 위에 20-envelope가 낮은 기와 날개와 높은 후면 박공, 두꺼운 입구·석주·목재 보를 얹는 시각 규칙을 정한다. 같은 파일의 황토 회벽·밝은 돌·어두운 목재는 35-objects의 제단·책상·도기에서 유지된다. 적갈색 띠는 중정/제실에 있고 업무방에는 밝은 회벽을 둔다는 예외가 분명하다. 30-interiors의 낮은 원형 분수는 image 04의 잔형으로 바뀌지 않고 인체 신상은 무문양 감실·용기로 대체된다. 주광은 40-environment의 맑고 건조한 낮으로 공통이며 등잔은 30-interiors에서 꺼져 있다. 배경의 낮은 건물·수관·능선은 이 건물의 박공·포치·출입구를 가리지 않는다. 생성 그림이나 파생 rendition은 선택하지 않았으므로 별도 prompt·generator가 이 규칙을 다시 결정하지 않는다.

## 암묵값으로 남기지 않은 사실 {#defaults-boundary}

<!--
@evidence obligations/core/settings.md#minimal-departure 고대라는 명칭으로 비워 두기 쉬운 주광·문 열림·수위·등잔·문서 내용·사용 포락을 실제 소유에서 확정했다. 연대·신격·실물 배관·인물은 암묵 복원 대상이 아니라 명시적 제외다.
-->

<!--
@evidenceReview obligations/core/settings.md#minimal-departure 문 열림·유리 부재·고정 수위·꺼진 등잔·문서 본문 부재는 각각 명시 소유가 있다. 연대·신격·실물 수리망은 익숙한 고대 기본값으로 복원할 빈칸이 아니라 제외이므로 후속 구현이 임의 보충할 수 없다.
-->

이 신전은 알려진 유적의 기본값에 의존하지 않는다. [시민 정체성](../../settings/10-building.md#civic-identity)은 특정 연대·신격을 제외하고, [개구부](../../settings/20-envelope.md#openings)는 열린 기본 상태와 유리 없는 작은 채광구를 정한다. [설비](../../settings/30-interiors.md#services)는 고정 수위·노즐 표시·꺼진 등잔·음향 부재를 정해 실제 수리망을 추정할 필요가 없게 한다. [문서](../../settings/35-objects.md#scrolls)는 읽히는 본문과 가짜 역사 문구를 두지 않으며, [이용 조건](../../settings/10-building.md#use-profile)은 인간 평균치 대신 저작 포락과 제외 사용을 밝힌다. 관찰에 결과를 주지 않는 실제 사회제도나 건물 밖 생활사는 새 설정으로 확장하지 않는다. 이 제외를 이후 편의에 따라 되돌려 필요한 설비·인물을 무단 도입할 수 없다.

## 설정 사이의 양립 조건 {#coherence}

<!--
@evidence obligations/core/settings.md#internal-coherence 좌표/면적/단차/사용 포락과 물체 범위를 비교하고 국소 대지와 먼 배경, 방 역할과 설비 상태, CJS 전달과 GPU 판정의 서로 다른 책임을 아래에 대조했다. 수치 양립은 허용 범위의 검사이며 아직 없는 평면·렌더의 통과 주장이 아니다.
-->

<!--
@evidenceReview obligations/core/settings.md#internal-coherence 1.5m 대 1.2m, 0.9m 대 0.8m의 여유 계산과 큰 책상 최초 반입 제외를 대조했다. 제단 높이 기준은 석단 상면이고 서비스 경로는 정문 석단의 예외를 받지 않는다. CJS 전달/GPU 관찰도 다른 책임으로 남아 산술 양립을 실제 충돌·렌더 통과로 바꾸지 않는다.
-->

약 430㎡는 410~450㎡ 안에 있고 그 분모에는 중정과 서비스 마당이 포함되며 도로는 빠진다. +Z 정면 기준으로 우측 방은 정면에서 관리실→기록실→보관실이고 후면 우측에 서비스 마당이 온다. 이 좌표와 방 순서를 실내 파일도 따른다. 주랑 순폭 1.5m는 보행 폭 0.6m 두 개의 합 1.2m보다 크고, 문 순폭 0.9m는 0.8m 운반 포락보다 크다. 이는 선택 입력의 산술 여지일 뿐 문짝·회전·실제 배치 비충돌 증거가 아니다. 큰 가구 최초 반입은 사용 보증 밖이므로 폭 1.3m 책상과 작은 봉헌물의 0.9m 문 기준을 같은 반입 주장으로 혼동하지 않는다.

제단 높이는 석단 상면 기준이고 주랑 Y=0과 같다고 두지 않는다. 주랑 바닥은 연속 높이, 중정/제단 석단은 같은 층의 국소 단차이므로 복층 금지와 양립한다. 서비스 길은 문턱 허용값 이내 연결이 요구되며 정문의 낮은 계단 허용을 그 경로의 면제로 사용하지 않는다. 25m 이내 국소 대지와 40~100m 먼 능선은 용도와 거리 범위가 나뉘고 사이에 별도 보행 구역을 납품한다고 하지 않는다. 제실의 상부 채광과 주광, 꺼진 등잔, 물이 흐르지 않는 기록실, 수반 내부에서 끝나는 표시 설비가 같은 건조한 개관 상태다.

소프트웨어 전달은 CJS producer가 실제 형상을 제공하고 클라이언트는 이를 그리는 관계다. CommonJS 유지와 browser 렌더의 공존은 그 경계에서 요구되며 현재 runtime 성공은 주장하지 않는다. 스키마·lint 통과와 GPU 판정은 별개다. stage는 독립 판정에 따라 움직이고 후속 design/source는 부모 review 전에 열지 않는다. 이 account는 settings 허용 조건들의 비교를 닫을 뿐 지붕 접합·실제 층 귀속·물리 통행·RENDERER·시각 동등성을 닫지 않는다.
