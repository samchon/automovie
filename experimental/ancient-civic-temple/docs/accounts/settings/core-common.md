# 설정 population의 공통 의무

## 파일 역할과 납품의 관계 {#file-roles}

<!--
@evidence obligations/core/common.md#purpose-fit 00-delivery의 관찰/운영 조건, 10-building의 연결/사용 입력, 20-envelope의 부재 관계, 30-interiors의 방별 용도, 35-objects의 독립 물체, 40-environment의 외부 가림/빛, 50-production의 실행/판정 경계를 함께 읽어 각 파일이 없어질 때 미정이 되는 후속 결정을 아래에 비교했다.
-->

<!--
@evidenceReview obligations/core/common.md#purpose-fit 일곱 파일을 실제로 대조했다. 실내 역할만 남기면 제단·용기 비례가 비고, 물체만 남기면 작성·열람의 배치가 비며, 제작 조건을 빼면 소프트웨어 프레임과 현재 source의 구별이 사라진다는 서로 다른 누락을 account가 설명한다.
-->

이 settings는 약 430㎡ 한 채와 전체 실내를 실제 3D로 관찰하는 library의 부모다. [납품](../../settings/00-delivery.md)이 없으면 같은 방을 어떤 위치·렌즈·운영 조작으로 판단할지 달라진다. [건물](../../settings/10-building.md)이 없으면 방 직접 출입과 운반 포락을 공간 저작자가 새로 정해야 한다. [외피](../../settings/20-envelope.md)는 박공·처마·깊은 개구부·실내 천장이 상자나 판으로 축소되는 것을 막는다. [실내](../../settings/30-interiors.md)는 같은 외피 안에서도 작성·열람·봉헌·보관이 구별될 집기 역할과 기본 상태를 정한다. [물체](../../settings/35-objects.md)는 실내 파일의 물체 이름만으로는 미정인 제단·탁자·용기의 비례와 입체 관계를 채운다. [환경](../../settings/40-environment.md)은 주변 건물·나무·언덕이 신전을 가리지 않을 범위와 모든 프레임의 낮 상태를 정한다. [제작 조건](../../settings/50-production.md)이 없으면 실제 source 대신 UI에 재작성한 건물이나 소프트웨어 렌더를 납품 증거로 쓸 여지가 생긴다. 이 일곱 역할은 한 건물의 관찰에 필요하며 영화·인물·도시 전체를 위한 파일은 두지 않는다.

## 설정과 설계·구현의 분담 {#layer-routing}

<!--
@evidence obligations/core/common.md#layer-boundary 전체 일곱 파일은 크기 허용값·형태 정체성·권한·상태를 정하고 방 좌표·prototype mesh·재료 수치·배치 수량·렌더 실행은 후속 분기에 남긴다. 아래 대조는 그 분담을 파일 역할별로 확인한다.
-->

<!--
@evidenceReview obligations/core/common.md#layer-boundary 치수 허용값을 실제 벽 좌표와, 색 관계를 roughness 수치와, CJS 요구를 동작 로그와 대조했다. 어느 settings 파일도 실행 코드나 배치 수량을 소유하지 않으며 wiki 후보도 canon으로 편입하지 않았다.
-->

00-delivery의 build-scope는 후속 분기 배정이지 구현 수량표가 아니다. 10-building의 410~450㎡와 통과 폭은 설계 입력이며 방별 좌표나 벽 압출을 소유하지 않는다. 20-envelope의 처마 높이·경사 허용 범위는 실제 지붕 단면·배수·접합을 대신하지 않고, 색 관계는 materials의 수치 roughness나 texture scale을 정하지 않는다. 30-interiors는 물체의 방별 기능·접근·상태를, 35-objects는 그 물체가 무엇으로 읽혀야 하는지와 크기 범위를 정하며 실제 모델/반복 placement를 만들지 않는다. 40-environment의 거리·빛 방향은 maps/systems가 소비할 범위다. 50-production의 CJS producer와 GPU 요구는 실행 경계이며 코드나 성공 로그가 아니다. .wiki의 평면·지붕 후보는 이 canon에 편입하지 않았고 spaces/source는 열지 않았다.

## 한국어와 기술 표기의 접근 {#working-language}

<!--
@evidence obligations/core/common.md#production-language 일곱 파일의 결정을 현대 한국어 기술 서술로 읽었고 00-delivery의 working-language가 stage·threshold·fit-out·compiled topology를 풀이한다. 영어 식별자는 명령/API/소유 분기 주소로 쓰이며 별도 고대어 서사나 무설명 번역판은 없다.
-->

<!--
@evidenceReview obligations/core/common.md#production-language 방의 용도는 관리실·기록실·보관실이라는 한국어로 읽히고 영어는 API·경로·고정 값에 남는다. m/rad/s와 이동 포락의 풀이도 확인했으며 미래 viewer의 한국어 약속을 현재 UI 제공으로 서술하지 않았다.
-->

[언어 소유](../../settings/00-delivery.md#working-language)는 문서와 뷰어 설명을 한국어로 정한다. settings에서 영문은 library·source 같은 제작 용어, README·파일 경로·API·Git 명령, stage 값과 같은 고정 표식에 쓰였다. 도·m·rad·s의 차이는 좌표 소유가 설명하고 사람의 이동 포락과 카메라 비충돌 영역은 서로 다른 입력으로 서술했다. 한국어 공간명은 관리실·기록실·봉헌물 보관실로 구분되며 영어 파일명이 방의 용도를 대신하지 않는다. viewer의 한국어 조작 설명과 최초 용어 풀이는 앞으로 구현할 요구이며 이미 제공된 UI라는 결론을 내리지 않는다.

## 건물 규모에 대한 서술 배분 {#population-scale}

<!--
@evidence obligations/core/common.md#proportionate-development 설정의 53 H2를 일곱 파일 전체에서 비교했다. 외피 8·실내 8·독립 물체 9개로 건물/실내를 분해하고 작은 배경은 5개로 제한했다. 승인된 draft와 현재의 본문 차이는 낡은 단계 문장 제거와 사용자 Git 절차 정정이며 건물 범위를 압축하지 않았다.
-->

<!--
@evidenceReview obligations/core/common.md#proportionate-development 53 H2의 분포를 실제 일곱 파일과 비교했다. 외피·방 기능·독립 물체가 각각 8·8·9개로 분해되고 배경은 5개에 제한된다. 카메라 충돌처럼 결과가 큰 입력은 더 상세하며 범위가 같은 draft의 방과 관찰 약속이 줄지 않았다.
-->

현재 H2 분포는 납품 10, 건물 5, 외피 8, 실내 8, 물체 9, 환경 5, 제작 조건 8이다. 단층 신전의 방 관계는 건물의 고정 그래프가 소유하고, 문·지붕·포치·주랑·바닥·천장은 외피에서 개별 결정으로 읽는다. 제실·봉헌실·업무방·마당은 실내에서 다른 사용과 집기 밀도를 받으며 작은 집기는 물체에서 형상·크기·상태까지 받는다. 단순 탁자보다 실패 가능성이 큰 검토 프레임에는 카메라 위치·충돌·보조 관찰 조건을 더 자세히 썼고, 국소 배경은 먼 지형·이웃의 실내를 추가 납품하지 않게 제한했다. 설정에는 부모 authored layer가 없고 영화의 길이/대사/장면 계층도 없으므로 서사 길이 증가 비교는 적용 대상이 아니다. 승인된 draft의 모든 방·물체·관찰 의무와 H2 정체성을 유지했다. 개별 치수 해법과 완결 표면 경로는 이후 설계의 업무이며 이 문서 길이나 H2 수로 구현 품질을 판정하지 않는다.
