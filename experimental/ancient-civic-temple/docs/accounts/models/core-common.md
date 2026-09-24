# 모델 설계 population의 공통 의무

## 파일 역할과 모델 납품 {#file-roles}

<!--
@evidence obligations/core/common.md#purpose-fit 여덟 파일을 build-scope가 models에 배정한 prototype 목록(기둥·문짝·문틀·기와·수반·제단·가구·용기·식생·이웃 외피)에 대조했다. scale이 없으면 각 모델이 축척·상한·관절·검토 판을 따로 고르고, columns·entablature가 없으면 주랑과 포치의 하중 연쇄와 지붕 하부가 비며, openings가 없으면 벽 void가 틀과 문짝 없이 뚫린 구멍으로 남고, cladding이 없으면 지붕이 줄무늬 판으로 읽히며, fixtures·wares가 없으면 방 용도가 공간명으로만 남고, landscape가 없으면 대지 배치 구역이 채울 개체 없이 비는 서로 다른 결손을 아래 본문에 적었다.
-->

이 population은 한 단층 시민 신전과 그 대지가 소비할 독립 부재의 blocking prototype을 설계한다. [scale](../../models/scale.md)은 공유 축척 기준과 표현 상한, 관절 인터페이스, 중립 검토 판이라는 모든 모델의 공통 기준을 소유한다. 이 파일이 없으면 각 모델이 보행 포락 대신 제각각의 크기 기준과 fidelity 주장을 쓰고 문짝의 hinge 이름과 검토 시점이 모델마다 달라진다.

[columns](../../models/columns.md)는 주랑과 포치의 원형 석주를, [entablature](../../models/entablature.md)는 그 위의 보·포치 박공 트림·서까래·제실 트러스·낮은 천장 보를 소유한다. 둘이 나뉘어 있어 기둥 높이와 보 윗면, 서까래 깊이, 지붕 하부가 한 산술 연쇄로 읽히고, 하나만 남으면 지붕이 기둥에서 뜨거나 주랑 천장이 slab 아랫면만 보인다. [openings](../../models/openings.md)는 판정된 여덟 문과 여덟 채광구의 void를 채우는 문틀·문짝·창틀을 소유하며 관절을 가진 유일한 모델이 여기 있다.

[cladding](../../models/cladding.md)은 합성 지붕 조각 위의 기와와 용마루 반복 단위를, [fixtures](../../models/fixtures.md)는 분수·제단·감실·등잔대·탁자·선반·책상·스툴·궤처럼 방의 용도를 읽히게 하는 설비와 가구를, [wares](../../models/wares.md)는 그 위와 안에 놓이는 항아리·그릇·바구니·두루마리를 소유한다. fixtures와 wares를 합치면 가구와 그 위 용기의 치수 관계가 한 파일 안의 비교로 숨고, 나누어 두면 칸 선반과 두루마리처럼 서로를 받는 두 결정이 각자 주소를 갖는다. [landscape](../../models/landscape.md)는 대지 배치 구역에 놓일 수목·풀·이웃 외피를 소유해 spaces 대지가 남긴 구역을 실제 개체 prototype으로 채울 수 있게 한다.

## 모델과 다른 제작 분기의 경계 {#layer-routing}

<!--
@evidence obligations/core/common.md#layer-boundary 36개 H2는 prototype 형상·part와 표면 ID·점유 상자·배치 기준점·hinge 인터페이스만 정하고, 배치 수와 간격은 instances, 색·거칠기·결은 materials, 물의 흐름과 빛은 systems, 벽·코핑·기단·지면은 spaces에 남긴다고 각 H2와 아래 본문이 구분한다.
-->

모든 모델 H2는 자기 prototype의 형상, part와 표면 ID, 가려진 접촉면과 빈 공간, 점유 상자와 배치 기준점만 결정한다. 반복 부재의 배치 수·간격·잘림은 instances가 판정된 공간과 합성 지붕에서 유도하며, 모델 H2는 "주랑 0.50m 중심 간격"처럼 기본 제안을 적을 때도 그 결정권이 instances에 있다고 밝힌다. 재료의 색·거칠기·결과 무늬는 materials의 결정이고 모델은 materials가 서로 다른 마감을 줄 수 있는 표면을 나누는 데서 멈춘다.

분수의 흐름·빛 반사와 등잔의 상태 변화는 systems·motions의 후속 결정이며 모델은 정지 형상만 낸다. 외벽 기단과 코핑, 문턱 바닥, 대지 지면과 먼 능선은 spaces가 이미 소유한 실체라 모델 population에 다시 들이지 않는다. 문틀이 문턱 바닥을, 이웃 외피가 포장 구획을, 창틀이 벽 void 위치를 새로 만들지 않는 것이 각 H2에서 이 경계를 지키는 방식이다.

## 작업 언어와 식별 표기 {#working-language}

<!--
@evidence obligations/core/common.md#production-language 모델 결정과 실패 조건은 한국어 기술 서술체로 읽히고, plinth·tegula·hinge.<판 ID> 같은 part·표면·인터페이스 식별자와 anchor, API 성격의 용어만 원문을 유지한다. plumb cut처럼 처음 쓰는 기술 용어에는 한국어 풀이가 붙어 있다.
-->

settings의 [작업 언어](../../settings/00-delivery.md#working-language)에 따라 모델 문서는 현대 표준 한국어로 쓴다. 치수·높이·실패 조건은 한국어 문장 안에서 m 단위 숫자로 적는다. part와 표면 이름(`plinth`, `shaft`, `tegula`, `imbrex`, `lining`, `surround`), 관절 인터페이스(`hinge.<판 ID>`), 상태 이름(`closed`, `open`), 문 ID(`door-entry` 등)와 anchor는 source와 같은 식별자라 원문을 유지한다.

분기 이름(materials, instances, systems)과 prototype, negative space, blocking geometry처럼 계약에서 온 용어는 문맥상 뜻이 드러나게 쓰고, 서까래 끝의 "연직으로 잘린 면(plumb cut)"처럼 처음 쓰는 전문 용어는 한국어 풀이를 앞세운다. 고대어 명칭이나 비문은 쓰지 않는다.

## 규모와 전개 분량의 비교 {#proportion}

<!--
@evidence obligations/core/common.md#proportionate-development 아래 여덟 파일·36 H2의 생성 표와 H2별 분포를 build-scope의 prototype 목록에 대조했다. 원주·기와·양개 문짝·분수·이웃집·넓은 수관에는 많은 결정을, 스툴과 작은 용기에는 짧은 형상 결정을 배정했다. 재생성 전 기준은 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`의 실제 blob을 같은 계수식으로 다시 재어 17 H2·14,799자로 검증했다.
-->

현재 모델 population의 파일·H2·본문 분량은 아래 self-check 생성 표로 고정한다. 본문 문자는 HTML 주석과 공백을 빼고 제목은 포함한 유니코드 코드 포인트 수다. 표에 없는 파일, 중복 파일, 낡은 행은 self-check 실패로 처리한다.

| 모델 파일 | H2 | 주석·공백 제외 본문 문자 수 |
| --- | ---: | ---: |
| fixtures.md | 10 | 5465 |
| entablature.md | 5 | 3654 |
| openings.md | 4 | 3016 |
| wares.md | 6 | 2436 |
| landscape.md | 4 | 2889 |
| scale.md | 3 | 1764 |
| columns.md | 2 | 1732 |
| cladding.md | 2 | 1657 |
| 합계 | 36 | 22613 |

재생성 전 원본은 작업 트리에 없지만 Git `111dba96^:experimental/ancient-civic-temple/docs/models/temple-fit-out.md`에 남아 있다. 현재 계정의 `modelDocumentBodyLength`와 같은 방식으로 해당 blob의 HTML 주석·공백을 빼고 제목을 포함해 다시 세면 한 파일·17 H2·14,799자다. 그 H2 목록에는 `Column prototype`, `Door prototype`, `Roof tile prototype`이 각각 한 번씩 있어 당시 기둥·문짝·기와를 한 절로 묶은 기록도 확인된다. 현재 판은 문틀·양개·외개·창틀, 주랑·포치 원주, 평기와·용마루를 따로 두어 서로 다른 소비자와 변경 경로를 가진 결정이 각자 주소를 가진다.

H2별 분량 상위 일곱은 주랑 원주, 평기와, 이웃 회벽집, 양개 문짝, 분수, 공통 축척, 넓은 수관 나무 순이다. 하위 넷은 짧은 순서로 스툴, 작은 탁상 용기, 얕은 봉헌 그릇, 운반 항아리다. 수목·이웃집의 위치와 잎 규칙을 확정하며 분량 순위도 옛 판에서 달라졌다. [build-scope](../../settings/00-delivery.md#build-scope)가 models에 배정한 기둥·문짝·문틀·기와·수반·제단·가구·용기·식생·이웃 외피 prototype은 모두 한 H2 이상을 가진다. 설계와 source 사이의 분량은 비교하지 않으며 모든 H2가 modelSources에서 실현되는지는 그 분기가 열린 뒤 따로 센다.
